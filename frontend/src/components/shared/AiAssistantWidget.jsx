import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  IconChatbot,
  IconClose,
  IconSend,
  IconRobot,
  IconUser,
  IconMaximize,
  IconMinimize,
  IconSparkles,
  IconRefresh,
} from './HomeIcons';
import { sendChatMessage } from '../../api/ragApi';
import MarkdownMessage from './MarkdownMessage';

// Sensible default and boundary dimensions
const DEFAULT_WIDTH = 460; // Optimal golden ratio for desktop assistant dialog
const DEFAULT_HEIGHT = 600; // Comfortable height for reading without overflowing
const MIN_WIDTH = 340;
const MIN_HEIGHT = 380;

// Curated starter inquiries aligned with official MoSPI MPLADS knowledge base
const STARTER_PROMPTS = [
  { label: '🏛️ Permissible Works', prompt: 'What works are permissible and prohibited under MPLADS guidelines?' },
  { label: '💰 Fund Release Cycle', prompt: 'How does the installment release and expenditure certification process work?' },
  { label: '⚠️ High Risk Factors', prompt: 'What specific indicators trigger a High or Critical risk score for a constituency?' },
  { label: '📋 MP Recommendations', prompt: 'What is the procedure and timeline for MPs recommending works to District Authorities?' },
];

// Dynamic maximum dimensions clamped to viewport boundary
const getMaxDimensions = () => {
  if (typeof window === 'undefined') return { maxW: 960, maxH: 640 };
  const maxH = Math.max(MIN_HEIGHT, Math.min(740, window.innerHeight - 100));
  const maxW = Math.max(MIN_WIDTH, Math.min(1080, window.innerWidth - 48));
  return { maxW, maxH };
};

const AiAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'How can I help you today? Ask me anything about MPLADS guidelines, project tracking, or fund utilization.',
      displayedText: 'How can I help you today? Ask me anything about MPLADS guidelines, project tracking, or fund utilization.',
      isTyping: false,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Resizing state
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const prevDimensionsRef = useRef({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });

  // Refs for drag resizing
  const isResizingRef = useRef(false);
  const resizeTypeRef = useRef(null); // 'both' | 'width' | 'height'
  const resizeStartRef = useRef({ x: 0, y: 0, w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT });

  // Refs for scroll and input
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);
  const textareaRef = useRef(null);

  // Mobile detection (< 768px)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  // Update bounds & mobile state on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      const { maxW, maxH } = getMaxDimensions();

      if (isMaximized) {
        setDimensions({ width: maxW, height: maxH });
      } else {
        setDimensions((prev) => ({
          width: Math.min(prev.width, maxW),
          height: Math.min(prev.height, maxH),
        }));
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isMaximized]);

  // Handle ESC key to close widget
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Prevent main page scrolling when the AI chatbot is open
  useEffect(() => {
    if (!isOpen) return;

    // Save previous overflow and padding styles
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyPaddingRight = document.body.style.paddingRight;

    // Prevent horizontal layout shift on desktop when scrollbar disappears
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Prevent touch gestures on non-scrollable parts (header, input, outer background) from scrolling the page
    const handleTouchMove = (e) => {
      if (messageContainerRef.current && messageContainerRef.current.contains(e.target)) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.paddingRight = prevBodyPaddingRight;
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen]);

  // Stop mouse wheel scrolling on widget boundaries from bubbling to document body
  const handlePanelWheel = (e) => {
    if (!messageContainerRef.current) return;
    if (!messageContainerRef.current.contains(e.target)) {
      e.stopPropagation();
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      e.stopPropagation();
    }
  };

  // Track if user manually scrolled up
  const handleContainerScroll = () => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    isUserScrolledUpRef.current = !isNearBottom;
  };

  // Scroll to bottom helper
  const scrollToBottom = useCallback((force = false) => {
    if ((force || !isUserScrolledUpRef.current) && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Auto-scroll when new messages arrive or opened
  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
    }
  }, [messages.length, isOpen, scrollToBottom]);

  // Progressive Typing Reveal Animation (Calibrated to ~500 words per minute)
  useEffect(() => {
    const typingMsg = messages.find((m) => m.isTyping && m.role === 'assistant');
    if (!typingMsg) return;

    const { id, fullText, displayedText = '' } = typingMsg;
    if (!fullText) return;

    if (displayedText.length >= fullText.length) {
      // Completed animation
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, isTyping: false, displayedText: fullText } : m
        )
      );
      return;
    }

    // Step 1 character at a time for smooth brisk streaming feel
    const nextText = fullText.slice(0, displayedText.length + 1);
    const lastChar = nextText[nextText.length - 1];

    // Tuned punctuation and typing delays for exact ~500 words/min pace
    let delay = 0.1;
    if (['.', '!', '?'].includes(lastChar)) {
      delay = 0.5; // natural sentence end pause
    } else if (lastChar === '\n') {
      delay = 0.5; // paragraph pause
    } else if ([',', ';', ':'].includes(lastChar)) {
      delay = 0.2; // clause comma pause
    } else if (lastChar === ' ') {
      delay = 0.2; // inter-word pause
    } else {
      delay = 0.2 + Math.random() * 0.3; // brisk letter cadence (15-17ms)
    }

    const timer = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, displayedText: nextText } : m))
      );

      // Keep bottom visible while user is following
      if (!isUserScrolledUpRef.current && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [messages]);

  // Click on message to fast-forward/skip typing
  const handleFastForward = (msgId) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.isTyping
          ? { ...m, isTyping: false, displayedText: m.fullText || m.text }
          : m
      )
    );
  };

  // Resize Pointer Handlers
  const handlePointerDown = (type) => (e) => {
    e.preventDefault();
    if (isMaximized) return;

    isResizingRef.current = true;
    setIsResizing(true);
    resizeTypeRef.current = type;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: dimensions.width,
      h: dimensions.height,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor =
      type === 'both' ? 'nwse-resize' : type === 'width' ? 'ew-resize' : 'ns-resize';

    const onPointerMove = (moveEvent) => {
      if (!isResizingRef.current) return;

      const dx = resizeStartRef.current.x - moveEvent.clientX; // Dragging left increases width
      const dy = resizeStartRef.current.y - moveEvent.clientY; // Dragging up increases height

      const { maxW, maxH } = getMaxDimensions();

      setDimensions(() => {
        let newW = resizeStartRef.current.w;
        let newH = resizeStartRef.current.h;

        if (resizeTypeRef.current === 'both' || resizeTypeRef.current === 'width') {
          newW = Math.min(maxW, Math.max(MIN_WIDTH, resizeStartRef.current.w + dx));
        }
        if (resizeTypeRef.current === 'both' || resizeTypeRef.current === 'height') {
          newH = Math.min(maxH, Math.max(MIN_HEIGHT, resizeStartRef.current.h + dy));
        }

        return { width: newW, height: newH };
      });
    };

    const onPointerUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Maximize / Restore Toggle (clamped to page boundary)
  const toggleMaximize = () => {
    if (!isMaximized) {
      prevDimensionsRef.current = { ...dimensions };
      const { maxW, maxH } = getMaxDimensions();
      setDimensions({ width: maxW, height: maxH });
      setIsMaximized(true);
    } else {
      setDimensions(prevDimensionsRef.current);
      setIsMaximized(false);
    }
  };

  // Reset conversation back to welcome state
  const handleResetConversation = () => {
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        text: 'How can I help you today? Ask me anything about MPLADS guidelines, project tracking, or fund utilization.',
        displayedText: 'How can I help you today? Ask me anything about MPLADS guidelines, project tracking, or fund utilization.',
        isTyping: false,
      },
    ]);
    setConversationId(null);
    setInputValue('');
  };

  // Handle message send (accepts optional override text for prompt chips)
  const handleSend = async (overrideText = null) => {
    const rawText = overrideText !== null ? overrideText : inputValue;
    if (!rawText.trim() || isLoading) return;

    // Fast-forward any currently animating message before starting next
    setMessages((prev) =>
      prev.map((m) =>
        m.isTyping ? { ...m, isTyping: false, displayedText: m.fullText || m.text } : m
      )
    );

    const userText = rawText.trim();
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        text: userText,
        displayedText: userText,
      },
    ]);
    setInputValue('');
    setIsLoading(true);
    isUserScrolledUpRef.current = false; // Reset so user follows new response

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const assistantMsgId = `ai-${Date.now()}`;

      // Call RAG backend
      const reply = await sendChatMessage(userText, conversationId);

      setIsLoading(false);
      if (reply?.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: 'assistant',
            fullText: reply.message,
            displayedText: '',
            isTyping: true, // triggers calibrated typing animation
            citations: reply.citations || [],
          },
        ]);
      }

      if (reply?.conversation_id) {
        setConversationId(reply.conversation_id);
      }
    } catch {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Something went wrong while connecting to the assistant. Please try again.',
          displayedText: 'Something went wrong while connecting to the assistant. Please try again.',
          isTyping: false,
        },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // Auto-adjust height up to max
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  };

  return (
    <div className={isMobile && isOpen ? "fixed inset-0 z-[9999]" : "fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999]"}>
      {/* Resizable / Fullscreen Chat Panel */}
      <div
        role="dialog"
        aria-modal={isMobile ? "true" : "false"}
        aria-label="MPLADS AI Assistant"
        onWheel={handlePanelWheel}
        style={
          isMobile
            ? undefined
            : {
                width: isOpen ? `${dimensions.width}px` : undefined,
                height: isOpen ? `${dimensions.height}px` : undefined,
              }
        }
        className={`flex flex-col bg-white overflow-hidden select-text pointer-events-auto overscroll-contain ${
          isMobile
            ? 'fixed inset-0 w-full h-[100dvh] rounded-none z-[9999] border-0'
            : 'absolute bottom-0 right-0 rounded-2xl shadow-[0_12px_48px_rgba(18,59,99,0.22)] border border-slate-200/90 origin-bottom-right'
        } ${isResizing ? 'transition-none' : 'transition-[transform,opacity] duration-200 ease-out'} ${
          isOpen
            ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
            : 'scale-95 opacity-0 translate-y-3 pointer-events-none'
        } motion-reduce:transition-opacity motion-reduce:scale-100 motion-reduce:translate-y-0`}
      >
        {/* Resize Handles (Top, Left, and Top-Left Corner) - ONLY ON DESKTOP */}
        {isOpen && !isMobile && !isMaximized && (
          <>
            {/* Top-Left Corner Resize Handle */}
            <div
              onPointerDown={handlePointerDown('both')}
              className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-30 group"
              title="Drag to resize window"
            >
              <div className="w-2 h-2 border-t-2 border-l-2 border-slate-400 group-hover:border-cyan-400 transition-colors m-1" />
            </div>

            {/* Top Edge Resize Handle */}
            <div
              onPointerDown={handlePointerDown('height')}
              className="absolute top-0 left-4 right-20 h-2 cursor-ns-resize z-20 hover:bg-cyan-500/30 transition-colors"
              title="Drag up/down to resize height"
            />

            {/* Left Edge Resize Handle */}
            <div
              onPointerDown={handlePointerDown('width')}
              className="absolute left-0 top-4 bottom-2 w-2 cursor-ew-resize z-20 hover:bg-cyan-500/30 transition-colors"
              title="Drag left/right to resize width"
            />
          </>
        )}

        {/* National Tricolor Top Ribbon Accent */}
        <div className="h-[2.5px] w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 opacity-95 flex-shrink-0" />

        {/* Header - Sleek Navy Gradient with Official Branding & Window Controls */}
        <div className="bg-gradient-to-r from-[#0a233d] via-[#123b63] to-[#0c2a47] text-white px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between flex-shrink-0 select-none border-b border-white/10 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative p-2 bg-gradient-to-br from-cyan-500/25 to-white/10 border border-cyan-400/30 rounded-xl flex-shrink-0 shadow-xs">
              <IconRobot size={18} className="text-cyan-300" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0a233d]" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[13.5px] tracking-tight leading-tight text-white truncate">MPLADS Assistant</h3>
                <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">MoSPI AI</span>
              </div>
              <p className="text-[10.5px] text-slate-300 flex items-center gap-1.5 leading-tight mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Guidelines Reference • Online</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* New Chat / Reset Button */}
            <button
              type="button"
              onClick={handleResetConversation}
              className="p-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center hover:bg-white/10 active:scale-90 rounded-lg transition-[transform,background-color] duration-150 ease-out text-slate-300 hover:text-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Start new conversation"
              title="Start New Chat"
            >
              <IconRefresh size={18} />
            </button>

            {/* Maximize / Restore Toggle - ONLY ON DESKTOP */}
            {!isMobile && (
              <button
                type="button"
                onClick={toggleMaximize}
                className="p-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center hover:bg-white/10 active:scale-90 rounded-lg transition-[transform,background-color] duration-150 ease-out text-slate-300 hover:text-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                aria-label={isMaximized ? 'Restore window size' : 'Maximize window'}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center hover:bg-white/10 active:scale-90 rounded-lg transition-[transform,background-color] duration-150 ease-out text-slate-300 hover:text-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Close assistant"
              title="Close"
            >
              <IconClose size={isMobile ? 22 : 18} />
            </button>
          </div>
        </div>

        {/* Message Area - Full width scroll canvas */}
        <div
          ref={messageContainerRef}
          onScroll={handleContainerScroll}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 space-y-4 min-h-0 w-full bg-gradient-to-b from-slate-50 via-slate-50/60 to-slate-100/70 overscroll-contain touch-pan-y"
        >
          <div className="w-full space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id || msg.text}
                onClick={() => msg.isTyping && handleFastForward(msg.id)}
                className={`flex gap-2.5 sm:gap-3 w-full ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start items-start'
                }`}
              >
                {/* Avatar for Assistant */}
                {msg.role !== 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-xs mt-0.5 shadow-xs bg-gradient-to-br from-[#123b63] to-[#0c2a47] text-cyan-300 border border-[#1b4b7c]/40">
                    <IconRobot size={15} />
                  </div>
                )}

                {/* Message Bubble */}
                {msg.role === 'user' ? (
                  /* User Bubble - Sleek Deep Navy gradient pill on the right */
                  <div className="p-3 px-4 rounded-2xl rounded-tr-xs text-[13.5px] leading-relaxed shadow-xs break-words bg-gradient-to-br from-[#123b63] via-[#10375c] to-[#0a233d] text-white max-w-[85%] border border-[#1b4b7c]/40">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  /* Assistant Content - Crisp white card with verified header, taking full width */
                  <div
                    className={`flex-1 w-full min-w-0 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(18,59,99,0.04)] text-[13.5px] leading-relaxed text-slate-800 ${
                      msg.isTyping ? 'cursor-pointer hover:border-cyan-300 transition-colors' : ''
                    }`}
                    title={msg.isTyping ? 'Click to show full response immediately' : undefined}
                  >
                    {/* Official source badge */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500 select-none">
                      <span className="flex items-center gap-1.5 text-[#123b63]">
                        <IconSparkles size={12} className="text-cyan-600" />
                        <span>MoSPI Reference</span>
                      </span>
                      {msg.isTyping && (
                        <span className="text-[10.5px] text-cyan-700 font-normal hover:underline">
                          Click to skip
                        </span>
                      )}
                    </div>

                    <div className="relative w-full min-w-0">
                      <MarkdownMessage
                        content={
                          msg.isTyping
                            ? (msg.displayedText || '')
                            : (msg.displayedText || msg.fullText || msg.text)
                        }
                        citations={msg.isTyping ? [] : msg.citations}
                      />
                      {msg.isTyping && (
                        <span className="inline-block w-1.5 h-3.5 bg-cyan-600 rounded-full ml-1 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                )}

                {/* Avatar for User */}
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mt-0.5 shadow-xs bg-gradient-to-br from-cyan-600 to-sky-700 text-white ring-1 ring-cyan-400/30">
                    <IconUser size={14} />
                  </div>
                )}
              </div>
            ))}

            {/* Quick Starter Prompts (Shown on initial conversation) */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2 pl-9 sm:pl-10 space-y-2 w-full">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <IconSparkles size={12} className="text-amber-500" />
                  <span>Suggested inquiries</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full">
                  {STARTER_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.prompt)}
                      className="text-left text-xs bg-white hover:bg-cyan-50/50 border border-slate-200/90 hover:border-cyan-400/80 text-slate-700 hover:text-[#123b63] p-2.5 rounded-xl shadow-2xs transition-all duration-150 flex items-center justify-between group active:scale-[0.98] w-full"
                    >
                      <span className="font-medium truncate">{item.label}</span>
                      <span className="text-slate-400 group-hover:text-cyan-600 text-xs ml-1.5 flex-shrink-0 transition-transform group-hover:translate-x-0.5">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 sm:gap-3 w-full items-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-xs mt-0.5 shadow-xs bg-gradient-to-br from-[#123b63] to-[#0c2a47] text-cyan-300 border border-[#1b4b7c]/40">
                  <IconRobot size={15} />
                </div>
                <div className="p-3.5 px-4 rounded-2xl rounded-tl-xs text-xs leading-relaxed shadow-xs bg-white border border-slate-200/90 text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[11px] text-slate-400 ml-1.5">Searching guidelines...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        {/* Input Area - Full width container */}
        <div className="p-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-slate-200/90 flex-shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] w-full">
          <div className="w-full">
            <div className="flex items-end gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 px-3 focus-within:ring-2 focus-within:ring-cyan-500/25 focus-within:border-cyan-600 focus-within:bg-white transition-all duration-150 shadow-2xs w-full">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask about MPLADS guidelines, fund releases, risk rules..."
                aria-label="Ask AI Assistant a question"
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-xs sm:text-sm p-1.5 max-h-[110px] min-h-[32px] outline-none disabled:opacity-60 leading-relaxed text-slate-800 placeholder:text-slate-400 w-full"
                rows={1}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-gradient-to-r from-[#123b63] to-cyan-700 hover:from-[#0d2a47] hover:to-cyan-800 text-white rounded-lg disabled:opacity-35 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 ease-out flex-shrink-0 mb-0.5 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                aria-label="Send message"
                title="Send message"
              >
                <IconSend size={16} />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-1.5 select-none truncate w-full">
              Answers grounded in official MoSPI MPLADS Guidelines • AI can make mistakes
            </p>
          </div>
        </div>
      </div>

      {/* Floating Launcher Button - Automatically hides when chatbot is open to prevent overlapping */}
      {!isOpen && (
        <div className="relative pointer-events-auto">
          {/* Subtle pulse wave */}
          <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-25 motion-reduce:hidden pointer-events-none" />
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_4px_20px_rgba(18,59,99,0.35)] bg-gradient-to-br from-[#123b63] to-[#0c2a47] hover:from-[#0d2e4e] hover:to-[#081e33] text-white transition-all duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cyan-500 group"
            aria-label="Open MPLADS AI Assistant"
            aria-expanded="false"
          >
            <IconChatbot size={26} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform duration-150" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white"></span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AiAssistantWidget;
