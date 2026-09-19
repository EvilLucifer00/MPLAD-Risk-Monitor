import React, { useState, useRef, useEffect } from 'react';
import { TbMessageChatbot, TbX, TbSend, TbRobot, TbUser } from 'react-icons/tb';

const AiAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle message send
  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = { role: 'user', text: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Mock API call to assistant
    // TODO: Wire up real API here
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'I am a placeholder response. Real AI integration is coming soon!' }
      ]);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Expanded Chat Panel */}
      <div 
        className={`absolute bottom-20 right-0 w-[350px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden origin-bottom-right transition-all duration-300 ease-out
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none'}
          motion-reduce:transition-opacity motion-reduce:scale-100 motion-reduce:translate-y-0
        `}
      >
        {/* Header */}
        <div className="bg-[#123b63] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <TbRobot size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">MPLADS Assistant</h3>
              <p className="text-[10px] text-slate-300">AI Support</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
            aria-label="Close assistant"
          >
            <TbX size={20} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-[#123b63] text-white'
              }`}>
                {msg.role === 'user' ? <TbUser size={16} /> : <TbRobot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-cyan-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-slate-200">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:ring-[3px] focus-within:ring-cyan-500/20 focus-within:border-cyan-600 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm p-2 max-h-[100px] outline-none"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-2.5 bg-[#123b63] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0c2a47] transition-colors"
              aria-label="Send message"
            >
              <TbSend size={18} />
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="relative">
        {/* Pulsing ring behind button (only when closed) */}
        {!isOpen && (
          <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-25 motion-reduce:hidden" />
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95 ${
            isOpen ? 'bg-slate-700 hover:bg-slate-800' : 'bg-[#123b63] hover:bg-[#0c2a47]'
          }`}
          aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <TbX size={26} className="text-white" />
          ) : (
            <TbMessageChatbot size={28} className="text-white drop-shadow-sm" />
          )}
        </button>
      </div>
    </div>
  );
};

export default AiAssistantWidget;
