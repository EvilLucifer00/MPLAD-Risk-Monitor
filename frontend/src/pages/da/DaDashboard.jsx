import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { useDaStats, useDaRecommendations, useDaDistrictMps, useDaProjects } from '../../api/queries';
import { daApi } from '../../api/daApi';
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

import DaDashboardChart from './components/DaDashboardChart';



const DaDashboard = () => {
  usePageSeo(
    'District Dashboard | DA Portal',
    'Real-time surveillance & risk monitor for all MPLADS works across district constituencies.'
  );

  const { data: statsData, isLoading: statsLoading } = useDaStats();
  const { data: recsData, isLoading: recsLoading } = useDaRecommendations();
  const { data: mpsData, isLoading: mpsLoading } = useDaDistrictMps();
  const { data: projectsData, isLoading: projectsLoading } = useDaProjects();

  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (statsData) {
      try {
        sessionStorage.setItem('mplads_da_dashboard_stats', JSON.stringify(statsData));
      } catch {
        // Session storage quota fallback
      }
    }
  }, [statsData]);

  const stats = statsData;
  const recommendations = Array.isArray(recsData) ? recsData : [];
  const mps = Array.isArray(mpsData) ? mpsData : [];
  const projects = Array.isArray(projectsData) ? projectsData : [];
  const displayStats = stats;

  const isPageLoading =
    statsLoading ||
    recsLoading ||
    mpsLoading ||
    projectsLoading ||
    !statsData ||
    !projectsData ||
    !mpsData ||
    !recsData;

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

  // Recent administrative activity actions (derived with priority from stats or projects)
  const recentActions = useMemo(() => {
    if (Array.isArray(statsData?.recentActions) && statsData.recentActions.length > 0) {
      return statsData.recentActions;
    }
    const projs = Array.isArray(projectsData) ? projectsData : [];
    return projs
      .flatMap(p => (Array.isArray(p.actionHistory) ? p.actionHistory : []).map(a => ({
        ...a,
        projectId: p.id,
        projectTitle: p.title || 'Untitled Project',
        timestamp: a.timestamp || new Date().toISOString(),
        action: a.action || 'Updated',
        actor: a.actor || 'System',
      })))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  }, [statsData?.recentActions, projectsData]);

  if (isPageLoading) {
    return <PortalPageLoader message="Loading District Dashboard..." />;
  }

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
          className={`shrink-0 self-start sm:self-auto px-4 py-2 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#123b63] ${
            reportSuccess 
              ? 'bg-emerald-700 text-white' 
              : 'bg-[#123b63] hover:bg-[#0c2a47] text-white'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {reportGenerating ? (
            <><TbLoader2 size={16} className="animate-spin" aria-hidden="true" /> <span>Compiling Data...</span></>
          ) : reportSuccess ? (
            <><TbCheck size={16} aria-hidden="true" /> <span>Report Ready</span></>
          ) : (
            <><TbDownload size={16} aria-hidden="true" /> <span>Generate Report</span></>
          )}
        </button>
      </header>

      {/* Pending Actions Widget */}
      <section aria-labelledby="pending-actions-heading" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <h2 id="pending-actions-heading" className="sr-only">Pending Actions & Verifications</h2>
        <Link to="/da/review" className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded">
          <div className="bg-white border border-slate-300 border-l-4 border-l-amber-600 rounded p-4 sm:p-5 hover:bg-slate-50 transition-colors h-full flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded">
                <TbClipboardCheck size={24} strokeWidth={2} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{displayStats.pendingReview || 0}</div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-0.5">Projects Awaiting Sanction</div>
                <div className="text-xs text-amber-800 mt-0.5">{displayStats.waitingOver5Days || 0} proposals awaiting scrutiny &gt; 5 days</div>
              </div>
            </div>
            <TbArrowRight size={18} className="text-slate-400 group-hover:text-[#123b63] group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
        <Link to="/da/documents" className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded">
          <div className="bg-white border border-slate-300 border-l-4 border-l-[#123b63] rounded p-4 sm:p-5 hover:bg-slate-50 transition-colors h-full flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-blue-50 text-[#123b63] border border-blue-200 rounded">
                <TbFileAlert size={24} strokeWidth={2} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{displayStats.awaitingVerification || 0}</div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-0.5">Documents Pending Verification</div>
                <div className="text-xs text-slate-600 mt-0.5">From {displayStats.awaitingVerification || 0} project records</div>
              </div>
            </div>
            <TbArrowRight size={18} className="text-slate-400 group-hover:text-[#123b63] group-hover:translate-x-1 transition-all" />
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
          <DaDashboardChart stats={displayStats} projects={projects} mps={mps} />
        </section>

        {/* AI Recommendations */}
        <section aria-labelledby="ai-recommendations-heading" className="bg-white rounded border border-slate-200 p-4 sm:p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
            <h2 id="ai-recommendations-heading" className="text-base sm:text-lg font-bold text-[#123b63]">District Risk Advisories</h2>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-300">ML Surveillance</span>
          </div>
          {recommendations.length === 0 ? (
            <p className="text-slate-500 text-xs sm:text-sm py-6 text-center">No risk alerts detected across district projects.</p>
          ) : (
            <ul role="list" className="space-y-3 overflow-auto flex-1">
              {(showAllRecommendations ? recommendations : recommendations.slice(0, 3)).map(rec => {
                let borderClass = "border-slate-200 bg-slate-50";
                let badgeClass = "bg-slate-200 text-slate-700";
                let titleClass = "text-slate-800";
                let Icon = TbInfoCircle;

                if (rec.severity === 'Critical') {
                  borderClass = "border-l-4 border-l-red-600 border-slate-200 bg-red-50/20";
                  badgeClass = "bg-red-100 text-red-800";
                  titleClass = "text-red-900 font-bold";
                  Icon = TbAlertTriangle;
                } else if (rec.severity === 'High') {
                  borderClass = "border-l-4 border-l-amber-600 border-slate-200 bg-amber-50/20";
                  badgeClass = "bg-amber-100 text-amber-900";
                  titleClass = "text-amber-900 font-bold";
                  Icon = TbClock;
                }

                return (
                  <li key={rec.id}>
                    <article className={`flex gap-3 p-3.5 rounded border ${borderClass} transition-colors`}>
                      <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded ${badgeClass}`} aria-hidden="true">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`text-xs sm:text-sm ${titleClass} truncate`}>{rec.type}</h3>
                          {rec.projectRef && (
                            <span className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-300 px-1.5 py-0.2 rounded shrink-0">
                              Ref: {rec.projectRef}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">{rec.message}</p>
                        {rec.action && (
                          <div className="mt-2.5">
                            <Link 
                              to={rec.action.link || '/da/review'}
                              aria-label={`View details for ${rec.type}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#123b63] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                            >
                              <span>Take Action</span> <TbArrowRight size={14} aria-hidden="true" />
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
              className="w-full text-center text-xs font-semibold text-[#123b63] py-2 mt-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
            >
              {showAllRecommendations ? "Show Less" : "Show More Advisories"}
            </button>
          )}
        </section>
      </div>

      {/* Recent Activity */}
      <section aria-labelledby="recent-activity-heading" className="bg-white rounded border border-slate-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 id="recent-activity-heading" className="text-sm sm:text-base font-bold text-[#123b63]">Recent District Action Log</h2>
          <Link to="/da/review" className="text-xs font-semibold text-[#123b63] hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded px-2 py-1">
            <span>Review Queue</span> <TbArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
            <caption className="sr-only">Recent District Actions and Activity</caption>
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Action / Stage</th>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Project Title</th>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Recorded By</th>
                <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentActions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 text-xs">
                    No recent administrative activity recorded in this district.
                  </td>
                </tr>
              ) : (
                recentActions.map((action, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                        action.action.includes('Sanction') || action.action.includes('Approved') ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        action.action.includes('Reject') ? 'bg-red-50 text-red-800 border-red-300' :
                        action.action.includes('Suspend') ? 'bg-slate-50 text-slate-800 border-slate-300' :
                        action.action.includes('Escalat') ? 'bg-amber-50 text-amber-900 border-amber-300' :
                        action.action.includes('Risk') ? 'bg-orange-50 text-orange-900 border-orange-300' :
                        'bg-blue-50 text-blue-800 border-blue-300'
                      }`}>
                        {action.action}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 font-medium text-[#123b63] max-w-[200px] truncate">{action.projectTitle}</td>
                    <td className="px-4 sm:px-6 py-3 text-slate-600">{action.actor}</td>
                    <td className="px-4 sm:px-6 py-3 text-slate-500 tabular-nums">
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
