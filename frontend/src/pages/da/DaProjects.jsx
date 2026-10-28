import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { daApi } from '../../api/mockDaApi';
import { mockMPs } from '../../data/mockDaData';
import { useDaStore } from '../../store/useDaStore';
import { RiskBadge } from '../mp/MpProjects';
import usePageSeo from '../../hooks/usePageSeo';
import { TbSearch, TbChartBar, TbLayoutGrid, TbAlertTriangle, TbArrowRight, TbUser } from 'react-icons/tb';

// Lazy-loaded to eliminate Recharts (~300KB) from the critical path of the default Grid view
const DaProjectsAnalytics = lazy(() => import('./components/DaProjectsAnalytics'));

const AnalyticsSkeleton = () => (
  <div className="space-y-6 flex-1 animate-pulse" role="status" aria-label="Loading analytics charts">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-[380px] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-[380px] flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  </div>
);

const DaProjects = () => {
  usePageSeo(
    'District Projects | DA Portal',
    'Directory and risk oversight of Members of Parliament and projects across constituencies in Lucknow District.'
  );

  const [mps, setMps] = useState(() => {
    try {
      const cached = sessionStorage.getItem('mplads_da_mps_cache');
      if (cached) return JSON.parse(cached);
    } catch {
      // Session storage fallback
    }
    return mockMPs;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { projectsView, setProjectsView } = useDaStore();

  useEffect(() => {
    let isMounted = true;
    daApi.getDistrictMPs().then(data => {
      if (isMounted && data?.length) {
        setMps(data);
        try {
          sessionStorage.setItem('mplads_da_mps_cache', JSON.stringify(data));
        } catch {}
      }
    }).catch(() => {
      // Fallback to initial mock data
    });
    return () => { isMounted = false; };
  }, []);

  const filteredMPs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return mps.filter(mp =>
      mp.name.toLowerCase().includes(term) ||
      mp.constituency.toLowerCase().includes(term)
    );
  }, [mps, searchTerm]);

  // Memoize analytics calculations to prevent re-calculations during search keystrokes
  const riskByMp = useMemo(() => mps.map(mp => ({
    name: mp.name.split(' ').pop(),
    fullName: mp.name,
    avgRisk: mp.avgRiskScore,
    fill: mp.avgRiskScore >= 60 ? '#ef4444' : mp.avgRiskScore >= 40 ? '#f59e0b' : '#10b981',
  })), [mps]);

  const utilizationByMp = useMemo(() => mps.map(mp => ({
    name: mp.name.split(' ').pop(),
    fullName: mp.name,
    utilization: mp.totalSanctioned > 0 ? Math.round((mp.totalUtilized / mp.totalSanctioned) * 100) : 0,
    utilizationAmt: mp.totalUtilized,
    sanctioned: mp.totalSanctioned,
  })), [mps]);

  const projectsByMp = useMemo(() => mps.map(mp => ({
    name: mp.name.split(' ').pop(),
    fullName: mp.name,
    active: mp.activeProjects,
    total: mp.totalProjects,
    highCritical: mp.highCriticalCount,
  })), [mps]);

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">District Projects</h1>
          <p className="text-sm text-slate-500 mt-1 leading-normal">All MPs and their projects across Lucknow District.</p>
        </div>
        <div className="flex items-center gap-2" role="toolbar" aria-label="Projects view mode">
          <button
            type="button"
            onClick={() => setProjectsView('grid')}
            aria-label="Switch to MP Grid View"
            aria-pressed={projectsView === 'grid'}
            className={`p-2.5 rounded-lg active:scale-90 transition-[transform,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${projectsView === 'grid' ? 'bg-cyan-50 text-cyan-700 shadow-xs' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            title="MP Grid View"
          >
            <TbLayoutGrid size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setProjectsView('analytics')}
            aria-label="Switch to Analytics View"
            aria-pressed={projectsView === 'analytics'}
            className={`p-2.5 rounded-lg active:scale-90 transition-[transform,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${projectsView === 'analytics' ? 'bg-cyan-50 text-cyan-700 shadow-xs' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            title="Analytics View"
          >
            <TbChartBar size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Search Section */}
      <section aria-labelledby="mp-search-heading">
        <h2 id="mp-search-heading" className="sr-only">Search Members of Parliament</h2>
        <form 
          role="search" 
          onSubmit={(e) => e.preventDefault()}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="relative">
            <TbSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input 
              id="mp-search-input"
              type="search" 
              placeholder="Search by MP name or constituency..."
              aria-label="Search by MP name or constituency"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400"
            />
          </div>
        </form>
      </section>

      {projectsView === 'grid' ? (
        /* ── MP Grid View ── */
        <section aria-labelledby="mp-grid-heading" className="flex-1">
          <h2 id="mp-grid-heading" className="sr-only">Members of Parliament Directory</h2>
          {filteredMPs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <TbUser size={48} className="text-slate-300 mb-4" aria-hidden="true" />
              <p className="font-semibold text-slate-700">No MPs found</p>
              <p className="text-sm text-slate-400 mt-0.5">Try a different search term.</p>
            </div>
          ) : (
            <ul role="list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMPs.map(mp => (
                <li key={mp.id}>
                  <Link 
                    to={`/da/projects/mp/${mp.id}`}
                    aria-label={`View projects and statistics for ${mp.name}, ${mp.constituency}`}
                    className="block bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 active:scale-[0.99] transition-[transform,box-shadow,border-color] duration-150 ease-out group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                  >
                    <article>
                      {/* MP Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f0f7ff] flex items-center justify-center text-[#123b63] font-bold text-sm border border-[#d0e4f7]" aria-hidden="true">
                            {mp.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#123b63] text-sm tracking-tight">{mp.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{mp.constituency}</p>
                          </div>
                        </div>
                        <TbArrowRight size={18} className="text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-transform duration-150 ease-out" aria-hidden="true" />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                          <div className="text-xl font-extrabold text-[#123b63] tracking-tight">{mp.activeProjects}</div>
                          <div className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Active Projects</div>
                        </div>
                        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                          <div className="text-xl font-extrabold text-[#123b63] tracking-tight">₹{(mp.totalUtilized / 10000000).toFixed(1)}Cr</div>
                          <div className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">Utilized</div>
                        </div>
                      </div>

                      {/* Bottom Bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-medium">Avg Risk:</span>
                          <RiskBadge 
                            level={mp.avgRiskScore >= 80 ? 'Critical' : mp.avgRiskScore >= 60 ? 'High' : mp.avgRiskScore >= 40 ? 'Moderate' : 'Low'} 
                            score={mp.avgRiskScore} 
                          />
                        </div>
                        {mp.highCriticalCount > 0 && (
                          <span className="flex items-center gap-1 font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                            <TbAlertTriangle size={13} aria-hidden="true" /> {mp.highCriticalCount} High+
                          </span>
                        )}
                      </div>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        /* ── Analytics View ── */
        <Suspense fallback={<AnalyticsSkeleton />}>
          <DaProjectsAnalytics 
            riskByMp={riskByMp} 
            utilizationByMp={utilizationByMp} 
            projectsByMp={projectsByMp} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default DaProjects;
