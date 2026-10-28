import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RiskLegend = ({ onHoverLevel, hoveredRiskLevel }) => {
  const legendItems = [
    { label: '0–19 — Very Low', shortLabel: '0–19 Low', color: '#22C55E', value: 'VERY LOW' },
    { label: '20–39 — Low', shortLabel: '20–39 Low', color: '#86EFAC', value: 'LOW' },
    { label: '40–59 — Moderate', shortLabel: '40–59 Mod', color: '#FACC15', value: 'MODERATE' },
    { label: '60–79 — High', shortLabel: '60–79 High', color: '#F97316', value: 'HIGH' },
    { label: '80–100 — Critical', shortLabel: '80–100 Crit', color: '#EF4444', value: 'CRITICAL' },
    { label: 'No Data', shortLabel: 'No Data', color: '#9CA3AF', value: 'No Data' }
  ];

  // Default open on desktop (>= 1024px), collapsed on mobile (< 1024px)
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Track mobile screen (< 640px) for downward opening and mobile-native touch adaptations
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)');
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Click outside to collapse on mobile (keeps map navigation clear)
  const containerRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (window.innerWidth < 640 && containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen]);

  // Strict explicit click/tap handler - Hovering NEVER triggers filtering
  const handleToggle = (value) => {
    if (!onHoverLevel) return;
    const nextValue = hoveredRiskLevel === value ? null : value;
    onHoverLevel(nextValue);
  };

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    if (onHoverLevel) onHoverLevel(null);
  };

  const activeItem = legendItems.find((item) => item.value === hoveredRiskLevel);

  return (
    <div
      ref={containerRef}
      className="absolute top-2.5 right-2.5 sm:top-auto sm:bottom-12 lg:bottom-16 sm:right-4 lg:right-6 z-[1000] pointer-events-auto origin-top-right sm:origin-bottom-right"
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          // Collapsed State: Shows active filter pill if locked, or prominent legend pill
          activeItem ? (
            // Active Filter Pill - Keeps filter permanently applied on map while giving full visibility
            <motion.div
              key="pill-active"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5 sm:gap-2 p-1 pl-2 sm:p-1.5 sm:pl-3.5 lg:p-2 lg:pl-4 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg hover:shadow-xl border border-cyan-400/90 text-slate-800 text-xs sm:text-[13px] font-bold min-h-[34px] sm:min-h-[44px] lg:min-h-[46px] origin-top-right sm:origin-bottom-right"
            >
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2.5 hover:text-cyan-900 active:scale-95 transition-all touch-manipulation select-none"
                title="Click to view legend"
              >
                <span
                  className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full shrink-0 shadow-xs ring-1 sm:ring-2 ring-white"
                  style={{ backgroundColor: activeItem.color }}
                  aria-hidden="true"
                />
                <span className="font-bold text-slate-900">{activeItem.shortLabel}</span>
                <span className="text-[9px] sm:text-[10px] text-cyan-800 bg-cyan-100 sm:px-2 sm:py-0.5 px-1 py-0.2 rounded-full font-semibold border border-cyan-200">
                  Filtered
                </span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 active:scale-90 transition-colors ml-0.5"
                title="Clear filter"
                aria-label="Clear filter"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          ) : (
            // Idle Collapsed Button (No filter active)
            <motion.button
              key="pill-idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Open risk level legend and filters"
              aria-expanded={false}
              className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-4 sm:py-2.5 lg:px-4.5 lg:py-3 min-h-[34px] sm:min-h-[44px] lg:min-h-[46px] bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg hover:shadow-xl border border-slate-200/90 hover:border-cyan-400/60 text-slate-800 text-[11px] sm:text-xs lg:text-[13px] font-bold hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 origin-top-right sm:origin-bottom-right"
            >
              <div className="flex -space-x-1 sm:-space-x-1.5 items-center" aria-hidden="true">
                <span className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-[#22C55E] ring-1 sm:ring-2 ring-white shadow-xs" />
                <span className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-[#FACC15] ring-1 sm:ring-2 ring-white shadow-xs" />
                <span className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 rounded-full bg-[#EF4444] ring-1 sm:ring-2 ring-white shadow-xs" />
              </div>
              <span className="tracking-wide">
                <span className="hidden sm:inline">Risk </span>Legend
              </span>
              {/* Downward chevron on mobile (opens downward); upward chevron on desktop (opens upward) */}
              <svg className="sm:hidden w-3 h-3 text-slate-400 group-hover:text-cyan-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <svg className="hidden sm:inline-block w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </motion.button>
          )
        ) : (
          // Expanded Card - Opens DOWNWARDS on mobile (< 640px), UPWARDS on desktop (>= 640px)
          <motion.div
            key="legend-card"
            initial={{ opacity: 0, scale: 0.95, y: isMobile ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: isMobile ? -8 : 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200/90 w-40 sm:w-44 flex flex-col gap-1 pointer-events-auto origin-top-right sm:origin-bottom-right"
            role="region"
            aria-label="Risk level map legend and filters"
          >
            {/* Header: Title, Clear button & Close/Collapse button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                  Risk Level
                </span>
                {hoveredRiskLevel && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[10px] font-semibold text-cyan-700 hover:text-cyan-900 underline px-1 py-0.5 rounded hover:bg-cyan-50"
                    aria-label="Clear risk level filter"
                  >
                    Reset
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-colors touch-manipulation"
                aria-label="Minimize risk legend"
                title="Minimize legend"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* List of Risk Level Interactive Buttons */}
            <div 
              className="flex flex-col gap-0.5 sm:gap-1" 
              role="group" 
              aria-label="Filter constituencies by risk level"
            >
              {legendItems.map((item) => {
                const isSelected = hoveredRiskLevel === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleToggle(item.value)}
                    aria-pressed={isSelected}
                    aria-label={`Highlight ${item.label}`}
                    className={`w-full flex items-center justify-between px-2 py-1 min-h-[26px] rounded-lg text-left transition-all touch-manipulation select-none border ${
                      isSelected
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-bold shadow-2xs'
                        : 'bg-white/40 border-slate-200/50 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300 active:bg-slate-200/80 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-xs border border-black/10"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <span className="text-[11px] sm:text-[12px] font-medium truncate">
                        {item.shortLabel}
                      </span>
                    </div>
                    {isSelected && (
                      <span 
                        className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-cyan-600 text-white text-[8px] font-bold shrink-0 ml-1"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[8.5px] text-slate-400 text-center pt-0.5 border-t border-slate-100">
              Click to filter map
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiskLegend;
