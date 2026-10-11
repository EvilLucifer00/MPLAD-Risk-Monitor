import axios from 'axios';

/**
 * API service — all backend communication in one place.
 *
 * NOTE: Document upload/delete has been removed.
 * Documents are managed by the admin via CLI (scripts/ingest.py).
 */

const API_BASE = '/api';

/**
 * Send a chat message (non-streaming).
 */
export async function sendMessage(message, conversationId = null, userId = null) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      user_id: userId,
    }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

/**
 * Send a chat message with SSE streaming.
 * Calls onEvent for each parsed SSE event.
 */
export async function sendMessageStream(message, conversationId = null, userId = null, onEvent) {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      user_id: userId,
    }),
  });

  if (!res.ok) throw new Error(`Stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          onEvent({ type: 'done' });
          return;
        }
        try {
          const parsed = JSON.parse(data);
          onEvent(parsed);
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

/**
 * List all conversations.
 */
export async function listConversations(userId = null) {
  const params = userId ? `?user_id=${userId}` : '';
  const res = await fetch(`${API_BASE}/conversations${params}`);
  if (!res.ok) throw new Error(`Failed to list conversations: ${res.status}`);
  return res.json();
}

/**
 * Get a conversation with messages.
 */
export async function getConversation(conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`);
  if (!res.ok) throw new Error(`Failed to get conversation: ${res.status}`);
  return res.json();
}

/**
 * Rename a conversation.
 */
export async function renameConversation(conversationId, title) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to rename conversation: ${res.status}`);
  return res.json();
}

/**
 * Delete a conversation.
 */
export async function deleteConversation(conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
  return res.json();
}

/**
 * Submit feedback on a message.
 */
export async function submitFeedback(messageId, rating, comment = null) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message_id: messageId,
      rating,
      comment,
    }),
  });
  if (!res.ok) throw new Error(`Feedback failed: ${res.status}`);
  return res.json();
}

/**
 * Get user profile (long-term memory).
 */
export async function getUserProfile(userId) {
  const res = await fetch(`${API_BASE}/conversations/user/${userId}/profile`);
  if (!res.ok) throw new Error(`Failed to get profile: ${res.status}`);
  return res.json();
}

/**
 * Health check.
 */
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

const api = axios.create({
  baseURL: API_BASE,
});

export default api;
