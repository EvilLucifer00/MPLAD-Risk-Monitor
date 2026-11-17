import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useMpStats, useMpRecommendations, useMpProjects } from '../../api/queries';
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

import MpDashboardChart from './components/MpDashboardChart';



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
  const { data: statsData, isLoading: statsLoading } = useMpStats();
  const { data: recsData } = useMpRecommendations();
  const { data: projectsData, isLoading: projectsLoading } = useMpProjects();

  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  const stats = statsData || null;
  const recommendations = Array.isArray(recsData) ? recsData : [];
  const projects = Array.isArray(projectsData) ? projectsData : [];
  const displayStats = stats || initialZeroMpStats;

  const loading = (statsLoading && !statsData) || (projectsLoading && !projectsData);

  usePageSeo(
    'Dashboard Overview | MP Portal',
    'Real-time overview of Member of Parliament (MP) MPLADS development portfolio, expenditure tracking, and AI risk radar.'
  );

  if (loading || !stats) {
    return <PortalPageLoader message="Loading MP Dashboard..." />;
  }

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
          className="shrink-0 self-start sm:self-auto bg-[#123b63] hover:bg-[#0c2a47] text-white px-4 py-2 rounded text-xs sm:text-sm font-semibold transition-colors duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#123b63]"
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
          <MpDashboardChart stats={displayStats} projects={projects} />
        </section>

        {/* AI Recommendations Section */}
        <section aria-labelledby="ai-recommendations-heading" className="bg-white rounded border border-slate-200 p-4 sm:p-5 flex flex-col min-w-0 w-full">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
            <h2 id="ai-recommendations-heading" className="text-base sm:text-lg font-bold text-[#123b63]">
              AI Advisory & Alerts
            </h2>
            <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-300">
              System Advisory
            </span>
          </div>
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-slate-500 text-xs sm:text-sm py-4">
                No advisories recorded for this constituency at this time.
              </p>
            ) : (
              <ul role="list" className="space-y-3">
                {(showAllRecommendations
                  ? recommendations
                  : recommendations.slice(0, 3)
                ).map((rec) => {
                  let borderClass = "border-slate-200 bg-slate-50";
                  let badgeClass = "bg-slate-200 text-slate-700";
                  let titleClass = "text-slate-800";
                  let Icon = TbAlertTriangle;

                  if (rec.type === "Vendor Alert") {
                    borderClass = "border-l-4 border-l-red-600 border-slate-200 bg-red-50/20";
                    badgeClass = "bg-red-100 text-red-800";
                    titleClass = "text-red-900 font-bold";
                    Icon = TbAlertTriangle;
                  } else if (rec.type === "Utilization Warning") {
                    borderClass = "border-l-4 border-l-amber-600 border-slate-200 bg-amber-50/20";
                    badgeClass = "bg-amber-100 text-amber-900";
                    titleClass = "text-amber-900 font-bold";
                    Icon = TbClock;
                  } else if (rec.type === "Duplicate Check") {
                    borderClass = "border-l-4 border-l-[#123b63] border-slate-200 bg-blue-50/20";
                    badgeClass = "bg-blue-100 text-[#123b63]";
                    titleClass = "text-[#123b63] font-bold";
                    Icon = TbInfoCircle;
                  }

                  return (
                    <li key={rec.id}>
                      <article
                        className={`flex gap-3 p-3.5 rounded border ${borderClass} min-w-0`}
                        aria-labelledby={`rec-title-${rec.id}`}
                      >
                        <div
                          className={`shrink-0 flex items-center justify-center w-8 h-8 rounded ${badgeClass}`}
                          aria-hidden="true"
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 id={`rec-title-${rec.id}`} className={`text-xs sm:text-sm ${titleClass} truncate`}>
                            {rec.type}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                            {rec.message}
                          </p>
                          <div className="mt-2.5">
                            {rec.relatedProjectIds?.length > 0 ? (
                              <Link
                                to={`/mp/projects/${rec.relatedProjectIds[0]}`}
                                aria-label={`View details for recommendation on ${rec.type}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#123b63] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                              >
                                View Project Details <TbArrowRight size={14} aria-hidden="true" />
                              </Link>
                            ) : (
                              <Link
                                to="/mp/reports"
                                aria-label={`View details for recommendation on ${rec.type}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#123b63] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                              >
                                View Report Details <TbArrowRight size={14} aria-hidden="true" />
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
                className="w-full text-center text-xs font-semibold text-[#123b63] py-2 mt-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                {showAllRecommendations ? "Show Less" : "Show More Advisories"}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Recent Projects Section */}
      <section aria-labelledby="recent-projects-heading" className="bg-white rounded border border-slate-200 overflow-hidden w-full min-w-0">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 id="recent-projects-heading" className="text-sm sm:text-base font-bold text-[#123b63]">Recent Projects</h2>
          <Link
            to="/mp/projects"
            className="text-xs font-semibold text-[#123b63] hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            View All <TbArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto w-full max-w-full overscroll-x-contain touch-pan-x">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap min-w-[620px]">
            <caption className="sr-only">Recent Parliamentarian Projects</caption>
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Project Name</th>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Amount</th>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Risk Level</th>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Last Updated</th>
                <th scope="col" className="px-4 sm:px-6 py-3 w-10 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 text-xs">
                    No projects found for this parliamentarian portfolio.
                  </td>
                </tr>
              ) : (
                projects.slice(0, 4).map((project) => {
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 font-medium text-[#123b63] max-w-[200px] truncate" title={project.title}>
                        {project.title}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-slate-800 font-medium tabular-nums">
                        ₹{" "}
                        {(
                          (project.sanctionedAmount > 0
                            ? project.sanctionedAmount
                            : project.estimatedCost) / 10000000
                        ).toFixed(2)}{" "}
                        Cr
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                            project.status === "In Progress"
                              ? "bg-sky-50 text-sky-800 border-sky-300"
                              : project.status === "Sanctioned"
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : project.status === "Completed"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-slate-50 text-slate-800 border-slate-300"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                            project.riskLevel === "Low"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : project.riskLevel === "Moderate"
                                ? "bg-amber-50 text-amber-900 border-amber-300"
                                : "bg-red-50 text-red-800 border-red-300"
                          }`}
                        >
                          {project.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-slate-600 tabular-nums">
                        {new Date(
                          project.lastUpdated || project.startDate || new Date(),
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right">
                        <Link
                          to={`/mp/projects/${project.id}`}
                          aria-label={`View details for ${project.title}`}
                          className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-[#123b63] hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                        >
                          <TbDotsVertical size={18} aria-hidden="true" />
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
