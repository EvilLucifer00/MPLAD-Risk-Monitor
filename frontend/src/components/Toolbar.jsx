import React, { useState } from 'react';
import { TbSearch, TbFilter, TbMenu2, TbX } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';

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
    <div className="flex-none flex flex-col md:flex-row flex-wrap md:justify-between md:items-center px-4 md:px-8 py-4 min-h-15 bg-white border-b border-slate-200 z-1000 shadow-sm gap-4 md:gap-6">
      <div className="flex justify-between items-center w-full md:w-auto">
        <div className="flex items-center gap-2">
        <img
          src="/emblem.png"
          alt="MPLADS Risk Monitor"
          className="w-11 h-11 object-contain"
        />

        <h2 className="text-xl md:text-2xl font-bold text-slate-800">
          MPLADS Risk Monitor
        </h2>
        </div>
        <button 
          className="md:hidden p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <TbX size={24} /> : <TbMenu2 size={24} />}
        </button>
      </div>

      <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex flex-col md:flex-row flex-wrap w-full md:flex-1 md:justify-end gap-4 md:items-center`}>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg transition-all px-5 py-2.5 duration-200 focus-within:ring-[3px] focus-within:ring-blue-500/10 w-full md:w-auto">
          <TbSearch size={18} className="text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search constituency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none bg-transparent outline-none font-sans text-base text-slate-900 w-full md:w-50"
          />
        </div>

        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-5 py-2.5 transition-all duration-200 focus-within:ring-[3px] focus-within:ring-blue-500/10 w-full md:w-auto">
          <TbFilter size={18} className="text-slate-500 mr-2 shrink-0" />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
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
               hover:bg-blue-700 transition-colors duration-200"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;

