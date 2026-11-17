import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState } from 'react';
import { useDaAgencies } from '../../api/queries';
import { useAuthStore } from '../../store/useAuthStore';
import { TbSearch, TbBuildingBank, TbClock, TbAlertTriangle, TbBriefcase } from 'react-icons/tb';
import { usePageSeo } from '../../hooks/usePageSeo';

const DaIADirectory = () => {
  const user = useAuthStore((s) => s.user);
  usePageSeo(
    'Implementing Agencies Directory | DA Portal',
    'Directory, capacity tracking, and risk performance monitoring of all empanelled Implementing Agencies.'
  );

  const { data: agenciesData, isLoading } = useDaAgencies();
  const agencies = Array.isArray(agenciesData) ? agenciesData : [];
  const loading = isLoading && !agenciesData;
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = agencies.filter(ia =>
    ia.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <PortalPageLoader message="Loading Implementing Agencies..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-full flex flex-col">
      <header className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Implementing Agency Directory</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">Official directory, capacity tracking, and risk performance monitoring of empanelled agencies across {user?.dist ? `${user.dist} District` : "the district"}.</p>
      </header>

      <section aria-labelledby="ia-search-heading" className="bg-white p-4 rounded border border-slate-300">
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
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#123b63] focus:border-[#123b63] transition-colors"
          />
        </form>
      </section>

      {/* IA Cards */}
      <section aria-labelledby="ia-list-heading" className="flex-1">
        <h2 id="ia-list-heading" className="sr-only">Empanelled Agencies List</h2>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white rounded border border-slate-300" role="status">
            <TbBuildingBank size={48} className="text-slate-300 mb-4" aria-hidden="true" />
            <p className="font-semibold text-slate-700">No implementing agencies found</p>
            <p className="text-xs text-slate-500 mt-1">Try refining your search terms.</p>
          </div>
        ) : (
          <ul role="list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(ia => (
              <li key={ia.id}>
                <article className="bg-white rounded border border-slate-300 border-t-2 border-t-[#123b63] p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-slate-100 text-[#123b63] rounded border border-slate-200">
                        <TbBuildingBank size={22} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-[#123b63] text-sm truncate">{ia.name}</h3>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border mt-0.5 ${
                          ia.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}>
                          {ia.status || 'Active'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                          <TbBriefcase size={14} aria-hidden="true" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-[#123b63] tabular-nums">{ia.projectsHandled ?? 0}</div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Total Projects</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                          <TbBriefcase size={14} aria-hidden="true" />
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-[#123b63] tabular-nums">{ia.activeProjects ?? 0}</div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Active Now</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <TbClock size={15} className="text-slate-400" aria-hidden="true" />
                        Avg Completion
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${ia.avgCompletionMonths > 9 ? 'text-amber-800' : 'text-[#123b63]'}`}>
                        {ia.avgCompletionMonths ?? 6} months
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <TbAlertTriangle size={15} className="text-slate-400" aria-hidden="true" />
                        Avg Risk Score
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${
                        (ia.avgRiskScore ?? 0) >= 60 ? 'text-red-700' :
                        (ia.avgRiskScore ?? 0) >= 40 ? 'text-amber-800' :
                        'text-emerald-800'
                      }`}>
                        {ia.avgRiskScore ?? 25}/100
                      </span>
                    </div>
                    {/* Risk bar */}
                    <div 
                      role="meter" 
                      aria-label={`Average risk score for ${ia.name}`} 
                      aria-valuenow={ia.avgRiskScore ?? 25} 
                      aria-valuemin={0} 
                      aria-valuemax={100}
                      className="w-full bg-slate-200 rounded-full h-1.5"
                    >
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          (ia.avgRiskScore ?? 0) >= 60 ? 'bg-red-600' :
                          (ia.avgRiskScore ?? 0) >= 40 ? 'bg-amber-600' :
                          'bg-emerald-600'
                        }`}
                        style={{ width: `${ia.avgRiskScore ?? 25}%` }}
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
