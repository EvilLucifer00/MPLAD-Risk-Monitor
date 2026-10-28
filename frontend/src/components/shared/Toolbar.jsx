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
    <header className="sticky top-0 z-[1100] flex-none flex flex-col md:flex-row flex-wrap md:justify-between md:items-center px-4 md:px-8 py-3.5 min-h-15 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm gap-3 md:gap-6 transition-all duration-200">
      <div className="flex justify-between items-center w-full md:w-auto">
        <div className="flex items-center gap-3">
          <EmblemImage
            width="40"
            height="44"
            className="w-10 h-11 object-contain shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl font-bold tracking-tight text-[#123b63] leading-tight block">
                MPLADS Risk Monitor
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-800 rounded border border-amber-200">
                GOI
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 tracking-tight leading-none mt-0.5">
              Ministry of Statistics & Programme Implementation
            </p>
          </div>
        </div>
        <button 
          className="md:hidden p-2 -mr-1 text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200 rounded-xl transition-all active:scale-95 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] shadow-xs"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <IconClose size={24} /> : <IconMenu size={24} />}
        </button>
      </div>

      <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex flex-col md:flex-row flex-wrap w-full md:flex-1 md:justify-end gap-3 md:gap-4 md:items-center max-h-[calc(100vh-5rem)] overflow-y-auto`}>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg transition-all px-5 py-2.5 duration-200 focus-within:ring-[3px] focus-within:ring-blue-500/10 w-full md:w-auto">
          <IconSearch size={18} className="text-slate-500 mr-2 shrink-0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search constituency..."
            aria-label="Search constituency by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none bg-transparent outline-none font-sans text-base text-slate-900 w-full md:w-50"
          />
        </div>

        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-5 py-2.5 transition-all duration-200 focus-within:ring-[3px] focus-within:ring-blue-500/10 w-full md:w-auto">
          <IconFilter size={18} className="text-slate-500 mr-2 shrink-0" aria-hidden="true" />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            aria-label="Filter by state"
            className="border-none bg-transparent outline-none font-sans text-base text-slate-900 cursor-pointer w-full md:w-auto"
          >
            <option value="">All States</option>
            {statesList.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-5 py-2.5 transition-all duration-200 focus-within:ring-[3px] focus-within:ring-blue-500/10 w-full md:w-auto">
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            aria-label="Filter by risk level"
            className="border-none bg-transparent outline-none font-sans text-base text-slate-900 cursor-pointer w-full md:w-auto"
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
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium
               hover:bg-blue-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
          >
            Login
          </button>
        </div>
      </div>
    </header>
  );
};

export default Toolbar;

