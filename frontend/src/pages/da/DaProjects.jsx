import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { useDaDistrictMps } from '../../api/queries';
import { useDaStore } from '../../store/useDaStore';
import { useAuthStore } from '../../store/useAuthStore';
import { RiskBadge } from '../mp/MpProjects';
import usePageSeo from '../../hooks/usePageSeo';
import { TbSearch, TbChartBar, TbLayoutGrid, TbAlertTriangle, TbArrowRight, TbUser } from 'react-icons/tb';

// Lazy-loaded to eliminate Recharts (~300KB) from the critical path of the default Grid view
const DaProjectsAnalytics = lazy(() => import('./components/DaProjectsAnalytics'));

const AnalyticsSkeleton = () => (
  <div className="space-y-6 flex-1 animate-pulse" role="status" aria-label="Loading analytics charts">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded border border-slate-200 p-6 h-[380px] flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-3 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="bg-white rounded border border-slate-200 p-6 h-[380px] flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-3 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  </div>
);

const DaProjects = () => {
  const user = useAuthStore((s) => s.user);
  usePageSeo(
    'District Projects | DA Portal',
    'Directory and risk oversight of Members of Parliament and projects across constituencies.'
  );

  const { data: mpsData, isLoading } = useDaDistrictMps();
  const mps = Array.isArray(mpsData) ? mpsData : [];
  const loading = isLoading && !mpsData;
  const [searchTerm, setSearchTerm] = useState('');
  const { projectsView, setProjectsView } = useDaStore();

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

  if (loading) {
    return <PortalPageLoader message="Loading District Projects..." />;
  }

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">District Parliamentarian Portfolios</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-normal">Parliamentarians and constituency development portfolios in {user?.dist ? `${user.dist} District` : "the district"}.</p>
        </div>
        <div className="flex items-center gap-1.5" role="toolbar" aria-label="Projects view mode">
          <button
            type="button"
            onClick={() => setProjectsView('grid')}
            aria-label="Switch to MP Grid View"
            aria-pressed={projectsView === 'grid'}
            className={`p-2 rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] transition-colors ${projectsView === 'grid' ? 'bg-[#123b63] text-white border-[#123b63]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            title="Directory Grid View"
          >
            <TbLayoutGrid size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setProjectsView('analytics')}
            aria-label="Switch to Analytics View"
            aria-pressed={projectsView === 'analytics'}
            className={`p-2 rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] transition-colors ${projectsView === 'analytics' ? 'bg-[#123b63] text-white border-[#123b63]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            title="Comparative Analytics View"
          >
            <TbChartBar size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Search Section */}
      <section aria-labelledby="mp-search-heading">
        <h2 id="mp-search-heading" className="sr-only">Search Members of Parliament</h2>
        <form 
          role="search" 
          onSubmit={(e) => e.preventDefault()}
          className="bg-white p-3 rounded border border-slate-200"
        >
          <div className="relative">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
            <input 
              id="mp-search-input"
              type="search" 
              placeholder="Search by MP name or constituency..."
              aria-label="Search by MP name or constituency"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] placeholder:text-slate-400"
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
              <TbUser size={40} className="text-slate-300 mb-3" aria-hidden="true" />
              <p className="font-semibold text-sm text-slate-700">No parliamentarians found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try searching with a different name or constituency.</p>
            </div>
          ) : (
            <ul role="list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredMPs.map(mp => (
                <li key={mp.id}>
                  <Link 
                    to={`/da/projects/mp/${mp.id}`}
                    aria-label={`View projects and statistics for ${mp.name}, ${mp.constituency}`}
                    className="block bg-white rounded border border-slate-300 p-4 hover:border-[#123b63] hover:bg-slate-50/50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                  >
                    <article>
                      {/* MP Header */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded bg-blue-50 flex items-center justify-center text-[#123b63] font-bold text-xs border border-blue-200" aria-hidden="true">
                            {mp.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#123b63] text-xs sm:text-sm tracking-tight">{mp.name}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">{mp.constituency}</p>
                          </div>
                        </div>
                        <TbArrowRight size={16} className="text-slate-400 group-hover:text-[#123b63] group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                        <div className="bg-slate-50 rounded p-2.5 border border-slate-200">
                          <div className="text-lg font-bold text-[#123b63] tracking-tight tabular-nums">{mp.activeProjects}</div>
                          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mt-0.5">Active Projects</div>
                        </div>
                        <div className="bg-slate-50 rounded p-2.5 border border-slate-200">
                          <div className="text-lg font-bold text-[#123b63] tracking-tight tabular-nums">₹{(mp.totalUtilized / 10000000).toFixed(2)} Cr</div>
                          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mt-0.5">Utilized</div>
                        </div>
                      </div>

                      {/* Bottom Bar */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-600 text-xs font-medium">Avg Risk:</span>
                          <RiskBadge 
                            level={mp.avgRiskScore >= 80 ? 'Critical' : mp.avgRiskScore >= 60 ? 'High' : mp.avgRiskScore >= 40 ? 'Moderate' : 'Low'} 
                            score={mp.avgRiskScore} 
                          />
                        </div>
                        {mp.highCriticalCount > 0 && (
                          <span className="flex items-center gap-1 font-semibold text-red-800 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[11px]">
                            <TbAlertTriangle size={12} aria-hidden="true" /> {mp.highCriticalCount} Flagged
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
