import React, { useState, useEffect } from 'react';
import { daApi } from '../../api/mockDaApi';
import { mockImplementingAgencies } from '../../data/mockDaData';
import { TbSearch, TbBuildingBank, TbClock, TbAlertTriangle, TbBriefcase } from 'react-icons/tb';
import { usePageSeo } from '../../hooks/usePageSeo';

const DaIADirectory = () => {
  usePageSeo(
    'Implementing Agencies Directory | DA Portal',
    'Directory, capacity tracking, and risk performance monitoring of all empanelled Implementing Agencies in Lucknow District.'
  );

  const [agencies, setAgencies] = useState(() => mockImplementingAgencies);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    daApi.getImplementingAgencies().then(data => {
      if (data && data.length) {
        setAgencies(data);
      }
      setLoading(false);
    });
  }, []);

  const filtered = agencies.filter(ia =>
    ia.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-full flex flex-col">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Implementing Agency Directory</h1>
        <p className="text-sm text-slate-500 mt-1">Track record and performance of IAs in Lucknow District.</p>
      </header>

      <section aria-labelledby="ia-search-heading" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 id="ia-search-heading" className="sr-only">Search Implementing Agencies</h2>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
          <input 
            type="text" 
            id="ia-search-input"
            placeholder="Search by agency name..."
            aria-label="Search implementing agencies by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-[border-color,box-shadow] duration-150"
          />
        </form>
      </section>

      {/* IA Cards */}
      <section aria-labelledby="ia-list-heading" className="flex-1">
        <h2 id="ia-list-heading" className="sr-only">Empanelled Agencies List</h2>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500" role="status">
            <TbBuildingBank size={48} className="text-slate-300 mb-4" aria-hidden="true" />
            <p className="font-semibold">No agencies found</p>
          </div>
        ) : (
          <ul role="list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(ia => (
              <li key={ia.id}>
                <article className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-[box-shadow,transform] duration-200 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                        <TbBuildingBank size={24} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[#123b63] text-sm truncate">{ia.name}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          ia.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {ia.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                          <TbBriefcase size={14} aria-hidden="true" />
                        </div>
                        <div className="text-2xl font-extrabold tracking-tight text-[#123b63]">{ia.projectsHandled}</div>
                        <div className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">Total Projects</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                          <TbBriefcase size={14} aria-hidden="true" />
                        </div>
                        <div className="text-2xl font-extrabold tracking-tight text-[#123b63]">{ia.activeProjects}</div>
                        <div className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">Active Now</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <TbClock size={16} className="text-slate-400" aria-hidden="true" />
                        Avg Completion
                      </span>
                      <span className={`text-sm font-bold ${ia.avgCompletionMonths > 9 ? 'text-orange-800' : 'text-[#123b63]'}`}>
                        {ia.avgCompletionMonths} months
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        <TbAlertTriangle size={16} className="text-slate-400" aria-hidden="true" />
                        Avg Risk Score
                      </span>
                      <span className={`text-sm font-bold ${
                        ia.avgRiskScore >= 60 ? 'text-red-700' :
                        ia.avgRiskScore >= 40 ? 'text-amber-800' :
                        'text-emerald-800'
                      }`}>
                        {ia.avgRiskScore}/100
                      </span>
                    </div>
                    {/* Risk bar */}
                    <div 
                      role="meter" 
                      aria-label={`Average risk score for ${ia.name}`} 
                      aria-valuenow={ia.avgRiskScore} 
                      aria-valuemin={0} 
                      aria-valuemax={100}
                      className="w-full bg-slate-100 rounded-full h-1.5"
                    >
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          ia.avgRiskScore >= 60 ? 'bg-red-500' :
                          ia.avgRiskScore >= 40 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${ia.avgRiskScore}%` }}
                      ></div>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default DaIADirectory;
