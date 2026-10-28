import { useAuthStore } from '../store/useAuthStore';

const PROD_API_URL = 'https://mplads-backend-axxw.onrender.com';
const DEV_API_URL = 'http://localhost:8000';

const isProductionOrPreview =
  import.meta.env.PROD ||
  import.meta.env.MODE === 'production' ||
  import.meta.env.MODE === 'preview' ||
  (typeof window !== 'undefined' && window.location.port === '4173');

// Use VITE_RAG_API_URL if configured, otherwise fallback to standard VITE_API_URL or production/dev URL
const BASE_URL = (
  import.meta.env.VITE_RAG_API_URL ||
  import.meta.env.VITE_API_URL ||
  (isProductionOrPreview ? PROD_API_URL : DEV_API_URL)
).replace(/\/+$/, '');

/**
 * Sends a query to the MPLADS RAG Assistant backend.
 * Supports both streaming (Server-Sent Events) and non-streaming fallback.
 *
 * @param {string} message - The user's query
 * @param {string|null} conversationId - The active conversation ID for context
 * @param {Function} [onChunk] - Optional streaming chunk callback
 * @returns {Promise<{ message: string, conversation_id?: string, message_id?: string, citations?: Array }>}
 */
export async function sendChatMessage(message, conversationId = null, onChunk = null) {
  const authState = useAuthStore.getState();
  const token = authState?.token;
  const user = authState?.user;

  const payload = {
    message: message.trim(),
    conversation_id: conversationId || null,
    user_id: user?.id ? String(user.id) : null,
  };

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Attempt streaming if onChunk callback provided
  if (typeof onChunk === 'function') {
    try {
      const streamRes = await fetch(`${BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (streamRes.ok && streamRes.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullAnswer = '';
        let returnedConvId = conversationId;
        let citations = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const rawData = line.slice(6).trim();
              if (rawData === '[DONE]') {
                break;
              }
              try {
                const event = JSON.parse(rawData);
                if (event.type === 'answer') {
                  fullAnswer = event.content || fullAnswer;
                  returnedConvId = event.conversation_id || returnedConvId;
                  citations = event.citations || citations;
                  onChunk(fullAnswer);
                } else if (event.type === 'token') {
                  fullAnswer += event.token;
                  onChunk(fullAnswer);
                } else if (event.type === 'error') {
                  throw new Error(event.message || 'Streaming error');
                }
              } catch (e) {
                // Ignore parse errors for comments or partial chunks
              }
            }
          }
        }

        if (fullAnswer) {
          return {
            message: fullAnswer,
            conversation_id: returnedConvId,
            citations,
          };
        }
      }
    } catch {
      // Streaming unavailable, proceed to non-streaming endpoint
    }
  }

  // 2. Non-streaming call: try /api/chat, fallback to /chat if 404
  let res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 404) {
    res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg =
      errorData.detail ||
      errorData.message ||
      `Server error: ${res.status}`;
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return {
    message: data.message || data.answer || data.response || 'No response received.',
    conversation_id: data.conversation_id || null,
    message_id: data.message_id || null,
    citations: data.citations || [],
  };
}
