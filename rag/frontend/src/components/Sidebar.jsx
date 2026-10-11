import React, { useState } from 'react';
import { 
  Plus, MessageSquare, Trash2, Edit2, Check, X, Search, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({
  conversations,
  activeConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleEditClick = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || 'New Conversation');
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const filteredConversations = conversations.filter(c => 
    (c.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <MessageSquare size={20} />
          </div>
          <div className="sidebar-logo-text">
            <h1>MPLADS RAG</h1>
            <div className="sidebar-tagline">Self-Rag Assistant</div>
          </div>
        </div>

        <button className="new-chat-btn" onClick={onNewConversation}>
          <div className="new-chat-btn-left">
            <Plus size={16} />
            <span>New Conversation</span>
          </div>
          <span className="new-chat-btn-shortcut">⌘K</span>
        </button>
      </div>

      <div className="sidebar-search">
        <input 
          type="text" 
          placeholder="Search chats..." 
          className="sidebar-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sidebar-conversations">
        {filteredConversations.length === 0 ? (
          <div className="sidebar-empty">
            <MessageCircle size={32} opacity={0.3} />
            <p>No conversations found.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredConversations.map((conv) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                key={conv.id}
                className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                onClick={() => {
                  if (editingId !== conv.id) {
                    onSelectConversation(conv.id);
                  }
                }}
              >
                <div className="conversation-item-icon">
                  <MessageSquare size={16} />
                </div>

                {editingId === conv.id ? (
                  <div className="rename-input-wrapper">
                    <input
                      type="text"
                      className="rename-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(e);
                        if (e.key === 'Escape') handleCancelEdit(e);
                      }}
                      autoFocus
                    />
                    <div className="rename-actions">
                      <button className="rename-action-btn cancel" onClick={handleCancelEdit}>
                        <X size={12} />
                      </button>
                      <button className="rename-action-btn confirm" onClick={handleSaveEdit}>
                        <Check size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="conversation-item-text">
                      <div className="conversation-item-title">
                        {conv.title || 'New Conversation'}
                      </div>
                    </div>
                    <div className="conversation-item-actions">
                      <button
                        className="conversation-action-btn"
                        onClick={(e) => handleEditClick(e, conv)}
                        title="Rename"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="conversation-action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          Powered by official MPLADS documents
        </div>
      </div>
    </div>
  );
}
