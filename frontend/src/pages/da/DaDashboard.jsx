import React, { useEffect, useState, Suspense, lazy } from 'react';
import { daApi } from '../../api/mockDaApi';
import Reveal from '../../animations/Reveal';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import usePageSeo from '../../hooks/usePageSeo';
import { 
  TbUsers, 
  TbCurrencyRupee, 
  TbAlertTriangle, 
  TbClipboardCheck,
  TbArrowRight,
  TbClock,
  TbInfoCircle,
  TbFileAlert,
  TbDownload,
  TbLoader2,
  TbCheck,
  TbShieldCheck
} from 'react-icons/tb';
import { Link } from 'react-router-dom';

// Lazy-loaded to remove recharts (~5MB in dev) from the critical request chain
const DaDashboardChart = lazy(() => import('./components/DaDashboardChart'));

const ChartSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[380px] animate-pulse">
    <div className="h-5 w-36 bg-slate-200 rounded mb-2"></div>
    <div className="h-4 w-52 bg-slate-100 rounded mb-6"></div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-40 h-40 rounded-full border-8 border-slate-100 border-t-cyan-500/40 animate-spin"></div>
    </div>
  </div>
);

const initialZeroDaStats = {
  district: '',
  totalMPs: 0,
  totalProjects: 0,
  totalEntitlement: 250000000,
  totalSanctioned: 0,
  totalUtilized: 0,
  pendingReview: 0,
  awaitingVerification: 0,
  waitingOver5Days: 0,
  activeProjects: 0,
  riskCounts: {
    Low: 0,
    Moderate: 0,
    High: 0,
    Critical: 0,
  },
};

// Synchronously compute initial metrics so LCP header & metrics paint with 0ms delay
const getInitialDaStats = () => {
  try {
    const cached = sessionStorage.getItem('mplads_da_dashboard_stats');
    if (cached) return JSON.parse(cached);
  } catch {
    // Session storage fallback
  }
  return initialZeroDaStats;
};

const DaDashboard = () => {
  usePageSeo(
    'District Dashboard | DA Portal',
    'Real-time surveillance & risk monitor for all MPLADS works across constituencies in Lucknow District.'
  );

  const [stats, setStats] = useState(getInitialDaStats);
  const [recommendations, setRecommendations] = useState([]);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [mps, setMps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    // Decouple heavy Recharts mounting by one frame so initial layout & animations settle cleanly without forced reflow
    const raf = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [dashboardStats, recs, allMPs, allProjects] = await Promise.all([
          daApi.getDashboardStats(),
          daApi.getRecommendations(),
          daApi.getDistrictMPs(),
          daApi.getProjects()
        ]);
        if (isMounted) {
          if (dashboardStats) {
            setStats(dashboardStats);
            try {
              sessionStorage.setItem('mplads_da_dashboard_stats', JSON.stringify(dashboardStats));
            } catch {
              // Ignore session storage error
            }
          }
          setRecommendations(Array.isArray(recs) ? recs : []);
          setMps(Array.isArray(allMPs) ? allMPs : []);
          setProjects(Array.isArray(allProjects) ? allProjects : []);
        }
      } catch {
        // Handled gracefully without console error
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerateReport = async () => {
    setReportGenerating(true);
    try {
      await daApi.generateReport();
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 4000);
    } catch {
      // Handled gracefully
    }
    setReportGenerating(false);
  };

  const displayStats = stats || initialZeroDaStats;

  // Recent actions from projects
  const recentActions = (projects || [])
    .flatMap(p => (p.actionHistory || []).map(a => ({ ...a, projectId: p.id, projectTitle: p.title })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 sm:gap-6 pb-0.5">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              District Authority
            </span>
            <span className="text-xs text-slate-300" aria-hidden="true">•</span>
            <span className="text-xs font-medium text-slate-500">
              {displayStats.district ? `${displayStats.district} District` : 'District Authority'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">District Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Real-time surveillance & risk monitor for all MPLADS works across constituencies.
          </p>
        </div>
        <button 
          type="button"
          onClick={handleGenerateReport}
          disabled={reportGenerating}
          aria-label="Generate district monthly summary report"
          className={`shrink-0 self-start sm:self-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-[transform,background-color] duration-150 ease-out active:scale-95 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
            reportSuccess 
              ? 'bg-emerald-600 text-white' 
              : 'bg-[#123b63] hover:bg-[#0c2a47] text-white'
          } disabled:opacity-60 disabled:cursor-not-allowed shadow-xs`}
        >
          {reportGenerating ? (
            <><TbLoader2 size={18} className="animate-spin" aria-hidden="true" /> <span>Generating...</span></>
          ) : reportSuccess ? (
            <><TbCheck size={18} aria-hidden="true" /> <span>Report Ready</span></>
          ) : (
            <><TbDownload size={18} aria-hidden="true" /> <span>Generate Report</span></>
          )}
        </button>
      </header>

      {/* Pending Actions Widget */}
      <section aria-labelledby="pending-actions-heading" className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <h2 id="pending-actions-heading" className="sr-only">Pending Actions & Verifications</h2>
        <Link to="/da/review" className="group">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-3 sm:p-5 hover:shadow-md active:scale-[0.99] transition-[transform,box-shadow] duration-150 ease-out h-full">
            {/* Mobile View */}
            <div className="flex sm:hidden flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <TbClipboardCheck size={20} strokeWidth={2} />
                </div>
                <TbArrowRight size={16} className="text-orange-400 group-hover:translate-x-0.5 transition-transform duration-150 ease-out" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-orange-700 leading-none">{displayStats.pendingReview || 0}</div>
                <div className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mt-1.5 leading-snug">
                  Projects Awaiting Review
                </div>
                <div className="text-[10px] text-orange-600/90 mt-0.5 truncate">
                  {displayStats.waitingOver5Days || 0} waiting &gt; 5 days
                </div>
              </div>
            </div>

            {/* Desktop / Tablet View */}
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                  <TbClipboardCheck size={28} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-orange-700">{displayStats.pendingReview || 0}</div>
                  <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider mt-0.5">Projects Awaiting Review</div>
                  <div className="text-[11px] text-orange-600/90 mt-0.5">{displayStats.waitingOver5Days || 0} waiting &gt; 5 days</div>
                </div>
              </div>
              <TbArrowRight size={20} className="text-orange-400 group-hover:translate-x-1 transition-transform duration-150 ease-out" />
            </div>
          </div>
        </Link>
        <Link to="/da/documents" className="group">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3 sm:p-5 hover:shadow-md active:scale-[0.99] transition-[transform,box-shadow] duration-150 ease-out h-full">
            {/* Mobile View */}
            <div className="flex sm:hidden flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <TbFileAlert size={20} strokeWidth={2} />
                </div>
                <TbArrowRight size={16} className="text-blue-400 group-hover:translate-x-0.5 transition-transform duration-150 ease-out" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-blue-700 leading-none">{displayStats.awaitingVerification || 0}</div>
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mt-1.5 leading-snug">
                  Documents Pending Verification
                </div>
                <div className="text-[10px] text-blue-600/90 mt-0.5 truncate">
                  From {displayStats.awaitingVerification || 0} projects
                </div>
              </div>
            </div>

            {/* Desktop / Tablet View */}
            <div className="hidden sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <TbFileAlert size={28} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-blue-700">{displayStats.awaitingVerification || 0}</div>
                  <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mt-0.5">Documents Pending Verification</div>
                  <div className="text-[11px] text-blue-600/90 mt-0.5">From {displayStats.awaitingVerification || 0} projects</div>
                </div>
              </div>
              <TbArrowRight size={20} className="text-blue-400 group-hover:translate-x-1 transition-transform duration-150 ease-out" />
            </div>
          </div>
        </Link>
      </section>

      {/* Summary Cards */}
      <section aria-labelledby="district-metrics-heading">
        <h2 id="district-metrics-heading" className="sr-only">Key District Metrics</h2>
        <Reveal staggerChildren={0.08}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            <AnimatedCounter 
              end={displayStats.totalMPs || 0} 
              index="01"
              accent="navy"
              tag="District"
              title="MPs Monitored" 
              icon={TbUsers}
              iconColor="text-[#0a2540]"
              iconBg="bg-blue-50"
              sub={`Across ${displayStats.district || 'District'}`}
            />
            <AnimatedCounter 
              prefix="₹ "
              end={(displayStats.totalUtilized || 0) / 10000000}
              decimals={2}
              suffix=" Cr"
              index="02"
              accent="emerald"
              tag="FY 2025-26"
              title="Funds Utilized" 
              icon={TbCurrencyRupee}
              iconColor="text-teal-700"
              iconBg="bg-teal-50"
              sub={`Out of ₹${(displayStats.totalEntitlement || 250000000) / 10000000} Cr entitlement`}
            />
            <AnimatedCounter 
              end={(displayStats.riskCounts?.High || 0) + (displayStats.riskCounts?.Critical || 0)} 
              index="03"
              accent="rose"
              tag="AI Radar"
              title="High Risk Projects" 
              icon={TbAlertTriangle}
              iconColor="text-red-700"
              iconBg="bg-red-50"
              sub="Across all MPs — requires attention"
            />
            <AnimatedCounter 
              end={displayStats.activeProjects || 0} 
              index="04"
              accent="cyan"
              tag="Sanctioned"
              title="Active Projects" 
              icon={TbShieldCheck}
              iconColor="text-cyan-800"
              iconBg="bg-cyan-50"
              sub="Sanctioned & In Progress"
            />
          </div>
        </Reveal>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <section aria-labelledby="district-analytics-heading" className="flex flex-col">
          <h2 id="district-analytics-heading" className="sr-only">District Project Analytics</h2>
          {chartsReady ? (
            <Suspense fallback={<ChartSkeleton />}>
              <DaDashboardChart stats={displayStats} projects={projects} mps={mps} />
            </Suspense>
          ) : (
            <ChartSkeleton />
          )}
        </section>

        {/* AI Recommendations */}
        <section aria-labelledby="ai-recommendations-heading" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 id="ai-recommendations-heading" className="text-lg font-bold text-[#123b63]">AI Recommendations</h2>
            <span className="text-xs font-semibold bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full">Powered by ML</span>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-slate-500 text-sm py-6 text-center">No recommendations at this time.</p>
          ) : (
            <ul role="list" className="space-y-4 overflow-auto flex-1">
              {(showAllRecommendations ? recommendations : recommendations.slice(0, 3)).map(rec => {
                let bgClass = "bg-slate-50/50";
                let iconWrapperClass = "bg-slate-100 text-slate-500";
                let titleClass = "text-slate-800";
                let Icon = TbInfoCircle;

                if (rec.severity === 'Critical') {
                  bgClass = "bg-red-50/40 border-red-100";
                  iconWrapperClass = "bg-red-100/80 text-red-700";
                  titleClass = "text-red-700 font-bold";
                  Icon = TbAlertTriangle;
                } else if (rec.severity === 'High') {
                  bgClass = "bg-amber-50/40 border-amber-100";
                  iconWrapperClass = "bg-amber-100/80 text-amber-800";
                  titleClass = "text-amber-800 font-bold";
                  Icon = TbClock;
                }

                return (
                  <li key={rec.id}>
                    <article className={`flex gap-4 p-5 rounded-2xl border ${bgClass} transition-colors`}>
                      <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${iconWrapperClass}`} aria-hidden="true">
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`text-[15px] ${titleClass}`}>{rec.type}</h3>
                          {rec.projectRef && (
                            <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                              {rec.projectRef}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-slate-600 mt-1 leading-relaxed line-clamp-3">{rec.message}</p>
                        {rec.action && (
                          <div className="mt-3">
                            <Link 
                              to={rec.action.link || '/da/review'}
                              aria-label={`View details for ${rec.type}`}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 bg-white border border-cyan-100 px-3 py-1.5 rounded-lg hover:bg-cyan-50 active:scale-95 transition-[transform,background-color] duration-150 ease-out shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                            >
                              <span>View Details</span> <TbArrowRight size={14} aria-hidden="true" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
          {recommendations.length > 3 && (
            <button 
              type="button"
              onClick={() => setShowAllRecommendations(!showAllRecommendations)}
              aria-expanded={showAllRecommendations}
              className="w-full text-center text-[13px] font-bold text-cyan-700 py-3 mt-2 rounded-xl hover:bg-cyan-50 active:scale-95 transition-[transform,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
            >
              {showAllRecommendations ? "Show Less" : "Show More"}
            </button>
          )}
        </section>
      </div>

      {/* Recent Activity */}
      <section aria-labelledby="recent-activity-heading" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 id="recent-activity-heading" className="text-lg font-bold text-[#123b63]">Recent Activity</h2>
          <Link to="/da/review" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded-lg px-2 py-1">
            <span>View Review Queue</span> <TbArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <caption className="sr-only">Recent District Actions and Activity</caption>
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Action</th>
                <th scope="col" className="px-6 py-4 font-semibold">Project</th>
                <th scope="col" className="px-6 py-4 font-semibold">By</th>
                <th scope="col" className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentActions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-sm">
                    No recent activity or review history in this district.
                  </td>
                </tr>
              ) : (
                recentActions.map((action, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                        action.action.includes('Sanction') || action.action.includes('Approved') ? 'bg-emerald-50 text-emerald-800' :
                        action.action.includes('Reject') ? 'bg-red-50 text-red-800' :
                        action.action.includes('Suspend') ? 'bg-slate-100 text-slate-800' :
                        action.action.includes('Escalat') ? 'bg-amber-50 text-amber-900' :
                        action.action.includes('Risk') ? 'bg-orange-50 text-orange-900' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {action.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#123b63] max-w-[200px] truncate">{action.projectTitle}</td>
                    <td className="px-6 py-4 text-slate-600">{action.actor}</td>
                    <td className="px-6 py-4 text-slate-500">
                      <time dateTime={action.timestamp}>
                        {new Date(action.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </time>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DaDashboard;
