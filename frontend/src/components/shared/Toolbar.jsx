import React, { useState } from 'react';
import { IconSearch, IconFilter, IconMenu, IconClose } from './HomeIcons';
import { useNavigate } from 'react-router-dom';
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="sticky top-0 z-[1100] flex-none px-4 sm:px-6 lg:px-12 py-2.5 min-h-14 bg-white border-b border-slate-300 shadow-none">
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row flex-wrap md:justify-between md:items-center gap-3 md:gap-6">
        <div className="flex justify-between items-center w-full md:w-auto">
        <div className="flex items-center gap-3">
          <EmblemImage
            width="36"
            height="40"
            className="w-9 h-10 object-contain shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-bold tracking-tight text-[#123b63] leading-tight block">
                MPLADS Risk Monitor
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-[#123b63] rounded border border-slate-300">
                GOI
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 tracking-tight leading-none mt-0.5">
              Ministry of Statistics & Programme Implementation
            </p>
          </div>
        </div>
        <button 
          className="md:hidden p-1.5 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <IconClose size={22} /> : <IconMenu size={22} />}
        </button>
      </div>

      <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex flex-col md:flex-row flex-wrap w-full md:flex-1 md:justify-end gap-2.5 md:gap-3 md:items-center max-h-[calc(100vh-5rem)] overflow-y-auto`}>
        <div className="flex items-center bg-white border border-slate-300 rounded px-3 py-1.5 focus-within:border-[#123b63] focus-within:ring-1 focus-within:ring-[#123b63] w-full md:w-auto">
          <IconSearch size={16} className="text-slate-500 mr-2 shrink-0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search constituency..."
            aria-label="Search constituency by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none bg-transparent outline-none font-sans text-sm text-slate-900 w-full md:w-44"
          />
        </div>

        <div className="flex items-center bg-white border border-slate-300 rounded px-2.5 py-1.5 focus-within:border-[#123b63] focus-within:ring-1 focus-within:ring-[#123b63] w-full md:w-auto">
          <IconFilter size={16} className="text-slate-500 mr-1.5 shrink-0" aria-hidden="true" />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            aria-label="Filter by state"
            className="border-none bg-transparent outline-none font-sans text-sm text-slate-800 cursor-pointer w-full md:w-auto"
          >
            <option value="">All States</option>
            {statesList.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-white border border-slate-300 rounded px-2.5 py-1.5 focus-within:border-[#123b63] focus-within:ring-1 focus-within:ring-[#123b63] w-full md:w-auto">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            aria-label="Filter by risk level"
            className="border-none bg-transparent outline-none font-sans text-sm text-slate-800 cursor-pointer w-full md:w-auto"
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
        <div>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-1.5 bg-[#123b63] text-white rounded font-medium text-sm hover:bg-[#0c2a47] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#123b63] w-full md:w-auto cursor-pointer"
          >
            Portal Login
          </button>
        </div>
      </div>
    </div>
  </header>
  );
};

export default Toolbar;
