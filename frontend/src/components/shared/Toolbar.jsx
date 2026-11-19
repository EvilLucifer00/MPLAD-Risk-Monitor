import React, { useState } from 'react';
import { IconSearch, IconFilter, IconMenu, IconClose, IconUser } from './HomeIcons';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import EmblemImage from './EmblemImage';

const Toolbar = ({
  searchTerm,
  setSearchTerm,
  filterState,
  setFilterState,
  filterRisk,
  setFilterRisk,
  statesList
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasFilters = Boolean(setSearchTerm || setFilterState || setFilterRisk);

  return (
    <header className="sticky top-0 z-[1100] flex-none px-4 sm:px-6 lg:px-8 py-2.5 min-h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 lg:gap-4">
        
        {/* Brand Bar (Always visible) */}
        <div className="flex items-center justify-between w-full lg:w-auto shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded-lg group shrink-0"
            aria-label="MPLADS Risk Monitor Home"
          >
            <EmblemImage
              width="36"
              height="40"
              className="w-8.5 h-10 object-contain shrink-0 group-hover:scale-105 transition-transform"
              priority={true}
            />
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-[#123b63] leading-tight block">
                  MPLADS Risk Monitor
                </span>
                <span className="inline-flex items-center w-fit px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-[#123b63] rounded border border-slate-200">
                  SIH PROTOTYPE
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 tracking-tight leading-none mt-0.5 hidden xl:block">
                Independent Analytics Prototype • SIH 2026
              </p>
            </div>
          </Link>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="lg:hidden p-2 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <IconClose size={20} /> : <IconMenu size={20} />}
          </button>
        </div>

        {/* Desktop Controls (Single horizontal row, strictly aligned, no wrapping) */}
        <div className="hidden lg:flex items-center justify-end gap-3 xl:gap-3.5 shrink-0">
          
          {/* 1. Navigation Links (Shifted towards the toolbar) */}
          <nav className="flex items-center gap-0.5 xl:gap-1 shrink-0" aria-label="Main Navigation">
            <Link
              to="/about"
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                location.pathname === '/about'
                  ? 'text-[#123b63] bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-[#123b63] hover:bg-slate-100'
              }`}
            >
              About
            </Link>
            <Link
              to="/data-sources"
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                location.pathname === '/data-sources'
                  ? 'text-[#123b63] bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-[#123b63] hover:bg-slate-100'
              }`}
            >
              Data Sources
            </Link>
            <Link
              to="/methodology"
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                location.pathname === '/methodology'
                  ? 'text-[#123b63] bg-slate-100 font-bold'
                  : 'text-slate-600 hover:text-[#123b63] hover:bg-slate-100'
              }`}
            >
              Methodology
            </Link>
          </nav>

          {/* 2. Line Divider to the right of the links, between the links and the toolbar */}
          {hasFilters && (
            <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" aria-hidden="true" />
          )}

          {/* 3. The Toolbars (Search & Filter controls) */}
          {hasFilters && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Search Constituency Input */}
              {setSearchTerm && (
                <div className="relative flex items-center bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 h-9 focus-within:border-[#123b63] focus-within:ring-2 focus-within:ring-[#123b63]/10 focus-within:bg-white transition-all w-36 xl:w-44 shrink-0">
                  <IconSearch size={15} className="text-slate-400 mr-2 shrink-0 pointer-events-none" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search constituency..."
                    aria-label="Search constituency by name"
                    value={searchTerm || ''}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none bg-transparent outline-none font-sans text-xs text-slate-900 placeholder:text-slate-400 w-full"
                  />
                </div>
              )}

              {/* State Select */}
              {setFilterState && statesList && (
                <div className="relative flex items-center bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 h-9 focus-within:border-[#123b63] focus-within:ring-2 focus-within:ring-[#123b63]/10 focus-within:bg-white transition-all w-28 xl:w-32 shrink-0">
                  <IconFilter size={14} className="text-slate-400 mr-1.5 shrink-0 pointer-events-none" aria-hidden="true" />
                  <select
                    value={filterState || ''}
                    onChange={(e) => setFilterState(e.target.value)}
                    aria-label="Filter by state"
                    className="border-none bg-transparent outline-none font-sans text-xs text-slate-800 cursor-pointer w-full truncate pr-1"
                  >
                    <option value="">All States</option>
                    {statesList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Risk Select */}
              {setFilterRisk && (
                <div className="relative flex items-center bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 h-9 focus-within:border-[#123b63] focus-within:ring-2 focus-within:ring-[#123b63]/10 focus-within:bg-white transition-all w-28 xl:w-32 shrink-0">
                  <select
                    value={filterRisk || ''}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    aria-label="Filter by risk level"
                    className="border-none bg-transparent outline-none font-sans text-xs text-slate-800 cursor-pointer w-full truncate pr-1"
                  >
                    <option value="">All Risk Levels</option>
                    <option value="CRITICAL">Critical (80-100)</option>
                    <option value="HIGH">High (60-79)</option>
                    <option value="MODERATE">Moderate (40-59)</option>
                    <option value="LOW">Low (20-39)</option>
                    <option value="VERY LOW">Very Low (0-19)</option>
                    <option value="No Data">No Data</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 4. Portal Login Action Button */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="h-9 px-3.5 bg-[#123b63] hover:bg-[#0c2a47] active:scale-[0.98] text-white rounded-lg font-semibold text-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#123b63] shrink-0 shadow-2xs cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <IconUser size={16} className="shrink-0 text-white" />
            <span>Portal Login</span>
          </button>
        </div>

        {/* Mobile Dropdown Drawer (< lg) */}
        {isExpanded && (
          <div className="lg:hidden w-full pt-3 pb-2 border-t border-slate-200 mt-2 flex flex-col gap-3">
            {/* Toolbars on Mobile */}
            {hasFilters && (
              <div className="flex flex-col gap-2.5">
                {setSearchTerm && (
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 h-10 w-full focus-within:border-[#123b63] focus-within:bg-white">
                    <IconSearch size={16} className="text-slate-400 mr-2 shrink-0 pointer-events-none" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Search constituency..."
                      aria-label="Search constituency by name"
                      value={searchTerm || ''}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border-none bg-transparent outline-none font-sans text-sm text-slate-900 w-full"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {setFilterState && statesList && (
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 h-10 w-full">
                      <IconFilter size={15} className="text-slate-400 mr-1.5 shrink-0 pointer-events-none" aria-hidden="true" />
                      <select
                        value={filterState || ''}
                        onChange={(e) => setFilterState(e.target.value)}
                        aria-label="Filter by state"
                        className="border-none bg-transparent outline-none font-sans text-xs text-slate-800 cursor-pointer w-full"
                      >
                        <option value="">All States</option>
                        {statesList.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {setFilterRisk && (
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 h-10 w-full">
                      <select
                        value={filterRisk || ''}
                        onChange={(e) => setFilterRisk(e.target.value)}
                        aria-label="Filter by risk level"
                        className="border-none bg-transparent outline-none font-sans text-xs text-slate-800 cursor-pointer w-full"
                      >
                        <option value="">All Risk Levels</option>
                        <option value="CRITICAL">Critical (80-100)</option>
                        <option value="HIGH">High (60-79)</option>
                        <option value="MODERATE">Moderate (40-59)</option>
                        <option value="LOW">Low (20-39)</option>
                        <option value="VERY LOW">Very Low (0-19)</option>
                        <option value="No Data">No Data</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Links on Mobile */}
            <nav className="flex flex-col gap-1 py-1 border-t border-slate-100" aria-label="Mobile Navigation">
              <Link
                to="/about"
                onClick={() => setIsExpanded(false)}
                className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/about'
                    ? 'text-[#123b63] bg-slate-100 font-bold'
                    : 'text-slate-700 hover:text-[#123b63] hover:bg-slate-100'
                }`}
              >
                About the Project
              </Link>
              <Link
                to="/data-sources"
                onClick={() => setIsExpanded(false)}
                className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/data-sources'
                    ? 'text-[#123b63] bg-slate-100 font-bold'
                    : 'text-slate-700 hover:text-[#123b63] hover:bg-slate-100'
                }`}
              >
                Data Sources & Integrity
              </Link>
              <Link
                to="/methodology"
                onClick={() => setIsExpanded(false)}
                className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === '/methodology'
                    ? 'text-[#123b63] bg-slate-100 font-bold'
                    : 'text-slate-700 hover:text-[#123b63] hover:bg-slate-100'
                }`}
              >
                Risk Scoring Methodology
              </Link>
            </nav>

            {/* Mobile Login Button */}
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                navigate('/login');
              }}
              className="w-full h-10 bg-[#123b63] hover:bg-[#0c2a47] active:scale-[0.99] text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <IconUser size={18} className="shrink-0 text-white" />
              <span>Portal Login</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Toolbar;
