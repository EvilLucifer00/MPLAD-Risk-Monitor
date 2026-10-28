import React, { useEffect, useState, Suspense, lazy } from 'react';
import { api } from '../../api/mockMpApi';
import Reveal from '../../animations/Reveal';
import AnimatedCounter from '../../components/shared/AnimatedCounter';
import { 
  TbBriefcase, 
  TbCurrencyRupee, 
  TbAlertTriangle, 
  TbFileTime,
  TbArrowRight,
  TbClock,
  TbInfoCircle,
  TbDotsVertical
} from 'react-icons/tb';
import { Link } from 'react-router-dom';
import { usePageSeo } from '../../hooks/usePageSeo';

// Lazy-loaded to remove recharts (~5MB in dev) from the critical request chain
const MpDashboardChart = lazy(() => import('./components/MpDashboardChart'));

const ChartSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[380px] animate-pulse">
    <div className="h-5 w-36 bg-slate-200 rounded mb-2"></div>
    <div className="h-4 w-52 bg-slate-100 rounded mb-6"></div>
    <div className="flex-1 flex items-center justify-center">
      <div className="w-40 h-40 rounded-full border-8 border-slate-100 border-t-cyan-500/40 animate-spin"></div>
    </div>
  </div>
);

const initialZeroMpStats = {
  activeProjects: 0,
  totalEntitlement: 50000000,
  totalUtilized: 0,
  pendingApprovals: 0,
  totalProjects: 0,
  riskCounts: {
    Low: 0,
    Moderate: 0,
    High: 0,
    Critical: 0,
  },
  statusBreakdown: {
    on_track: 0,
    high_risk: 0,
    completed: 0,
  },
  recentProjects: [],
};

// Synchronously compute initial metrics so LCP header & metrics paint with 0ms delay
const getInitialMpStats = () => {
  try {
    const cached = sessionStorage.getItem('mplads_mp_dashboard_stats');
    if (cached) return JSON.parse(cached);
  } catch {
    // Session storage fallback
  }
  return initialZeroMpStats;
};

const MpDashboard = () => {
  const [stats, setStats] = useState(getInitialMpStats);
  const [recommendations, setRecommendations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
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
        const [dashboardStats, recs, allProjects] = await Promise.all([
          api.getDashboardStats(),
          api.getRecommendations(),
          api.getProjects()
        ]);
        if (isMounted) {
          if (dashboardStats) {
            setStats(dashboardStats);
            try {
              sessionStorage.setItem('mplads_mp_dashboard_stats', JSON.stringify(dashboardStats));
            } catch {
              // Ignore session storage errors
            }
          }
          setRecommendations(Array.isArray(recs) ? recs : []);
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

  const displayStats = stats || initialZeroMpStats;

  usePageSeo(
    'Dashboard Overview | MP Portal',
    'Real-time overview of Member of Parliament (MP) MPLADS development portfolio, expenditure tracking, and AI risk radar.'
  );

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 sm:gap-6 pb-0.5 w-full min-w-0">
        <div className="max-w-xl min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Parliamentarian
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">
              Member of Parliament (Lok Sabha)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            MPLADS developmental portfolio, expenditure tracking & risk
            assessment.
          </p>
        </div>
        <Link
          to="/mp/submit"
          className="shrink-0 self-start sm:self-auto bg-[#123b63] hover:bg-[#0c2a47] active:scale-95 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-[transform,background-color] duration-150 ease-out flex items-center gap-2 shadow-xs"
        >
          <span>New Project</span>
          <TbArrowRight />
        </Link>
      </header>

      {/* Summary Metrics Section */}
      <section aria-labelledby="portfolio-summary-heading" className="w-full min-w-0">
        <h2 id="portfolio-summary-heading" className="sr-only">Portfolio Performance Metrics</h2>
        <Reveal staggerChildren={0.08}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6 w-full min-w-0">
            <AnimatedCounter
              end={displayStats.activeProjects || 0}
              index="01"
              accent="navy"
              tag="In Progress"
              title="Active Projects"
              icon={TbBriefcase}
              iconColor="text-[#0a2540]"
              iconBg="bg-blue-50"
              sub="Sanctioned & In Progress"
            />
            <AnimatedCounter
              prefix="₹ "
              end={(displayStats.totalUtilized || 0) / 10000000} // convert to cr
              decimals={2}
              suffix=" Cr"
              index="02"
              accent="emerald"
              tag="FY 2025-26"
              title="Funds Utilized"
              icon={TbCurrencyRupee}
              iconColor="text-teal-700"
              iconBg="bg-teal-50"
              sub={`Out of ₹${(displayStats.totalEntitlement || 50000000) / 10000000} Cr entitlement`}
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
              sub="Requires immediate attention"
            />
            <AnimatedCounter
              end={displayStats.pendingApprovals || 0}
              index="04"
              accent="amber"
              tag="Pipeline"
              title="Pending Approvals"
              icon={TbFileTime}
              iconColor="text-amber-800"
              iconBg="bg-amber-50"
              sub="Awaiting district sanction"
            />
          </div>
        </Reveal>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-w-0">
        {/* Project Status Section */}
        <section aria-labelledby="portfolio-analytics-heading" className="flex flex-col min-w-0 w-full">
          <h2 id="portfolio-analytics-heading" className="sr-only">Expenditure & Project Status Analytics</h2>
          {chartsReady ? (
            <Suspense fallback={<ChartSkeleton />}>
              <MpDashboardChart stats={displayStats} projects={projects} />
            </Suspense>
          ) : (
            <ChartSkeleton />
          )}
        </section>

        {/* AI Recommendations Section */}
        <section aria-labelledby="ai-recommendations-heading" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col min-w-0 w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 id="ai-recommendations-heading" className="text-lg font-bold text-[#123b63]">
              AI Recommendations
            </h2>
            <span className="text-xs font-semibold bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full">
              Powered by ML
            </span>
          </div>
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">
                No recommendations at this time.
              </p>
            ) : (
              <ul role="list" className="space-y-4">
                {(showAllRecommendations
                  ? recommendations
                  : recommendations.slice(0, 3)
                ).map((rec) => {
                  let bgClass = "bg-slate-50/50";
                  let iconWrapperClass = "bg-slate-100 text-slate-500";
                  let titleClass = "text-slate-800";
                  let Icon = TbAlertTriangle;

                  if (rec.type === "Vendor Alert") {
                    bgClass = "bg-red-50/40 border-red-100";
                    iconWrapperClass = "bg-red-100/80 text-red-700";
                    titleClass = "text-red-700 font-bold";
                    Icon = TbAlertTriangle;
                  } else if (rec.type === "Utilization Warning") {
                    bgClass = "bg-amber-50/40 border-amber-100";
                    iconWrapperClass = "bg-amber-100/80 text-amber-800";
                    titleClass = "text-amber-800 font-bold";
                    Icon = TbClock;
                  } else if (rec.type === "Duplicate Check") {
                    bgClass = "bg-sky-50/40 border-sky-100";
                    iconWrapperClass = "bg-sky-100/80 text-sky-800";
                    titleClass = "text-[#123b63] font-bold";
                    Icon = TbInfoCircle;
                  }

                  return (
                    <li key={rec.id}>
                      <article
                        className={`flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border ${bgClass} transition-colors min-w-0`}
                        aria-labelledby={`rec-title-${rec.id}`}
                      >
                        <div
                          className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${iconWrapperClass}`}
                          aria-hidden="true"
                        >
                          <Icon size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 id={`rec-title-${rec.id}`} className={`text-[15px] ${titleClass} truncate`}>
                            {rec.type}
                          </h3>
                          <p className="text-[13px] text-slate-600 mt-1 leading-relaxed line-clamp-3">
                            {rec.message}
                          </p>
                          <div className="mt-3">
                            {rec.relatedProjectIds?.length > 0 ? (
                              <Link
                                to={`/mp/projects/${rec.relatedProjectIds[0]}`}
                                aria-label={`View details for recommendation on ${rec.type}`}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 bg-white border border-cyan-100 px-3 py-1.5 rounded-lg hover:bg-cyan-50 active:scale-95 transition-[transform,background-color] duration-150 ease-out shadow-sm"
                              >
                                View Details <TbArrowRight size={14} aria-hidden="true" />
                              </Link>
                            ) : (
                              <Link
                                to="/mp/reports"
                                aria-label={`View details for recommendation on ${rec.type}`}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 bg-white border border-cyan-100 px-3 py-1.5 rounded-lg hover:bg-cyan-50 active:scale-95 transition-[transform,background-color] duration-150 ease-out shadow-sm"
                              >
                                View Details <TbArrowRight size={14} aria-hidden="true" />
                              </Link>
                            )}
                          </div>
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
                onClick={() =>
                  setShowAllRecommendations(!showAllRecommendations)
                }
                aria-expanded={showAllRecommendations}
                className="w-full text-center text-[13px] font-bold text-cyan-700 py-3 mt-2 rounded-xl hover:bg-cyan-50 active:scale-95 transition-[transform,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                {showAllRecommendations ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Recent Projects Section */}
      <section aria-labelledby="recent-projects-heading" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full min-w-0">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 id="recent-projects-heading" className="text-base sm:text-lg font-bold text-[#123b63]">Recent Projects</h2>
          <Link
            to="/mp/projects"
            className="text-xs sm:text-sm font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
          >
            View All <TbArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[620px]">
            <caption className="sr-only">Recent Parliamentarian Projects</caption>
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold">Project Name</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold">Amount</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold">Status</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold">Risk</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 sm:py-4 font-semibold">Last Updated</th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 sm:py-4 w-10 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 text-sm">
                    No projects found for this parliamentarian portfolio.
                  </td>
                </tr>
              ) : (
                projects.slice(0, 4).map((project) => {
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4 font-medium text-[#123b63] max-w-[200px] truncate" title={project.title}>
                        {project.title}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-slate-600">
                        ₹{" "}
                        {(
                          (project.sanctionedAmount > 0
                            ? project.sanctionedAmount
                            : project.estimatedCost) / 10000000
                        ).toFixed(1)}{" "}
                        Cr
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                            project.status === "In Progress"
                              ? "bg-sky-50 text-sky-800"
                              : project.status === "Sanctioned"
                                ? "bg-amber-50 text-amber-900"
                                : project.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                            project.riskLevel === "Low"
                              ? "bg-emerald-50 text-emerald-800"
                              : project.riskLevel === "Moderate"
                                ? "bg-amber-50 text-amber-900"
                                : "bg-red-50 text-red-800"
                          }`}
                        >
                          {project.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-slate-500">
                        {new Date(
                          project.lastUpdated || project.startDate || new Date(),
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right">
                        <Link
                          to={`/mp/projects/${project.id}`}
                          aria-label={`View details for ${project.title}`}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-[#123b63] hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                        >
                          <TbDotsVertical size={20} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MpDashboard;
