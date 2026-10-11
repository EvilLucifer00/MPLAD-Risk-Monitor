import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Sparkles, X, Check, ArrowLeft, RefreshCw, Copy } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import { ChatMessage, StatusIndicator, WelcomeScreen } from './components/ChatComponents';
import api from './services/api';
import './index.css';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [citationDrawerOpen, setCitationDrawerOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversations, currentStep]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations/');
      const convList = res.data.conversations || res.data || [];
      setConversations(convList);
      if (convList.length > 0 && !activeConversationId) {
        setActiveConversationId(convList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const createNewConversation = () => {
    setActiveConversationId(null);
    setInput('');
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const deleteConversation = async (id) => {
    try {
      await api.delete(`/conversations/${id}`);
      if (activeConversationId === id) setActiveConversationId(null);
      fetchConversations();
      showToast('Conversation deleted');
    } catch (err) {
      console.error(err);
    }
  };

  const renameConversation = async (id, title) => {
    try {
      await api.patch(`/conversations/${id}`, { title });
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    const messageContent = overrideText !== null ? overrideText : input;
    if (!messageContent.trim() || isLoading) return;

    let convId = activeConversationId;
    if (!convId) {
      try {
        const res = await api.post('/conversations/', { title: messageContent.substring(0, 30) + '...' });
        convId = res.data.id;
        const newConv = { ...res.data, messages: [] };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(convId);
      } catch (err) {
        return;
      }
    }

    const userMsg = { id: uuidv4(), role: 'user', content: messageContent };
    const tempAssistantMsg = { id: uuidv4(), role: 'assistant', content: '' };

    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        return { ...c, messages: [...(c.messages || []), userMsg, tempAssistantMsg] };
      }
      return c;
    }));

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);
    setCurrentStep('analyzing_query');

    try {
      // Setup SSE for streaming response
      const response = await fetch(`${api.defaults.baseURL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          conversation_id: convId,
          query: userMsg.content,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let msgCitations = [];
      let retQuality = null;
      let grndQuality = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'step') {
                setCurrentStep(data.step);
              } else if (data.type === 'token') {
                assistantContent += data.token;
                setConversations(prev => prev.map(c => {
                  if (c.id === convId) {
                    const newMsgs = [...(c.messages || [])];
                    if (newMsgs.length > 0) {
                      newMsgs[newMsgs.length - 1] = {
                        ...newMsgs[newMsgs.length - 1],
                        content: assistantContent
                      };
                    }
                    return { ...c, messages: newMsgs };
                  }
                  return c;
                }));
              } else if (data.type === 'metadata') {
                msgCitations = data.citations || [];
                retQuality = data.retrieval_quality;
                grndQuality = data.grounding_quality;
                
                setConversations(prev => prev.map(c => {
                  if (c.id === convId) {
                    const newMsgs = [...(c.messages || [])];
                    if (newMsgs.length > 0) {
                      newMsgs[newMsgs.length - 1] = {
                        ...newMsgs[newMsgs.length - 1],
                        citations: msgCitations,
                        retrieval_quality: retQuality,
                        grounding_quality: grndQuality
                      };
                    }
                    return { ...c, messages: newMsgs };
                  }
                  return c;
                }));
              }
            } catch (err) {}
          }
        }
      }
    } catch (error) {
      console.error(error);
      showToast('Error generating response');
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Global Cmd+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      createNewConversation();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeConversationId, input, isLoading]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  const handleSuggestionClick = (text) => {
    handleSend(null, text);
  };

  const handleCitationClick = (citation) => {
    setActiveCitation(citation);
    setCitationDrawerOpen(true);
  };

  const handleFeedback = async (msgId, value) => {
    // Implement API call for feedback if available
    showToast('Feedback submitted');
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard');
  };

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewConversation={createNewConversation}
          onSelectConversation={(id) => {
            setActiveConversationId(id);
            if (window.innerWidth <= 768) setSidebarOpen(false);
          }}
          onDeleteConversation={deleteConversation}
          onRenameConversation={renameConversation}
        />
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="top-bar-title">
              {activeConversation ? activeConversation.title : 'New Chat'}
            </div>
          </div>
          <div className="top-bar-model-chip">
            <Sparkles size={14} />
            Self-RAG
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area" ref={chatContainerRef}>
          {messages.length === 0 ? (
            <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage 
                  key={msg.id || i} 
                  msg={msg} 
                  onFeedback={handleFeedback}
                  onCitationClick={handleCitationClick}
                  onCopy={() => handleCopyMessage(msg.content)}
                />
              ))}
              {isLoading && currentStep && (
                <StatusIndicator step={currentStep} />
              )}
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-wrapper">
            <div className="input-container">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                placeholder="Ask about MPLADS guidelines, procedures, eligibility..."
                disabled={isLoading}
                rows={1}
              />
              <button 
                className="send-btn" 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="input-meta">
              <span className="input-hint">Enter to send · Shift+Enter for new line</span>
            </div>
            <div className="input-powered">
              Answers are generated from MPLADS documents. Please verify important details.
            </div>
          </div>
        </div>
      </div>

      {/* Citation Drawer */}
      {citationDrawerOpen && (
        <>
          <div className="citation-drawer-overlay" onClick={() => setCitationDrawerOpen(false)} />
          <div className="citation-drawer">
            <div className="citation-drawer-header">
              <h3 className="citation-drawer-title">Source Document</h3>
              <button className="citation-drawer-close" onClick={() => setCitationDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {activeCitation && (
              <div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '15px' }}>
                  {activeCitation.document_name} {activeCitation.page_number ? `(Page ${activeCitation.page_number})` : ''}
                </h4>
                <div className="citation-content-box">
                  {activeCitation.snippet || "No exact snippet available. This document was referenced for context."}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <Check size={16} color="var(--green)" />
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
