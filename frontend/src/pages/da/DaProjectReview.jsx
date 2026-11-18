import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { daApi } from '../../api/daApi';
import { useDaReviewQueue, useDaDistrictMps, useDaAgencies, useDaReviewActionMutation, queryKeys } from '../../api/queries';
import { useQueryClient } from '@tanstack/react-query';
import { useDaStore } from '../../store/useDaStore';
import { RiskBadge } from '../mp/MpProjects';
import usePageSeo from '../../hooks/usePageSeo';
import { 
  TbSearch, TbChevronRight, TbClipboardCheck, TbToggleLeft, TbToggleRight,
  TbCheck, TbLock, TbAlertTriangle, TbLoader2
} from 'react-icons/tb';

const DaProjectReview = () => {
  const navigate = useNavigate();
  usePageSeo(
    'Project Review Queue | DA Portal',
    'Prioritized district review queue for sanctioning MPLADS proposals, sorted by AI risk score.'
  );

  const queryClient = useQueryClient();
  const { data: queueData, isLoading } = useDaReviewQueue();
  const { data: districtMpsData } = useDaDistrictMps();
  const districtMps = Array.isArray(districtMpsData) ? districtMpsData : [];
  const { data: agenciesData } = useDaAgencies();
  const agencies = Array.isArray(agenciesData) ? agenciesData : [];
  const queue = Array.isArray(queueData) ? queueData : [];
  const loading = isLoading && !queueData;

  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    reviewQuickMode, setReviewQuickMode,
    reviewMpFilter, setReviewMpFilter,
    reviewRiskFilter, setReviewRiskFilter,
    reviewCategoryFilter, setReviewCategoryFilter,
  } = useDaStore();

  // Quick approve states
  const [quickApproving, setQuickApproving] = useState(null);
  const [quickApproveIA, setQuickApproveIA] = useState('');
  const [showIASelect, setShowIASelect] = useState(null);

  useEffect(() => {
    const mpParam = searchParams.get('mp');
    if (mpParam) setReviewMpFilter(mpParam);
  }, [searchParams, setReviewMpFilter]);

  const filteredQueue = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return queue.filter(p => {
      const matchesSearch = !search || p.title.toLowerCase().includes(search) || (p.mpName && p.mpName.toLowerCase().includes(search));
      const matchesMp = reviewMpFilter === 'All' || String(p.mpId) === String(reviewMpFilter);
      const matchesRisk = reviewRiskFilter === 'All' || p.riskLevel === reviewRiskFilter;
      const matchesCat = reviewCategoryFilter === 'All' || p.category === reviewCategoryFilter;
      return matchesSearch && matchesMp && matchesRisk && matchesCat;
    });
  }, [queue, searchTerm, reviewMpFilter, reviewRiskFilter, reviewCategoryFilter]);

  const categories = useMemo(() => [...new Set(queue.map(p => p.category))], [queue]);

  const reviewMutation = useDaReviewActionMutation();

  const handleQuickApprove = async (projectId) => {
    if (!quickApproveIA) return;
    setQuickApproving(projectId);
    try {
      await reviewMutation.mutateAsync({
        id: projectId,
        action: 'Sanction',
        details: { implementingAgencyId: quickApproveIA },
      });
      setShowIASelect(null);
      setQuickApproveIA('');
    } catch {
      // Handled gracefully
    }
    setQuickApproving(null);
  };

  if (loading) {
    return <PortalPageLoader message="Loading Review Queue..." />;
  }

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">Project Review Queue</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-normal">
            {filteredQueue.length} development proposals awaiting administrative review and sanction — ordered by AI risk rating.
          </p>
        </div>
        {/* Quick Review Toggle */}
        <button
          type="button"
          onClick={() => setReviewQuickMode(!reviewQuickMode)}
          aria-pressed={reviewQuickMode}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
            reviewQuickMode 
              ? 'bg-[#123b63] text-white border-[#123b63]' 
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {reviewQuickMode ? <TbToggleRight size={20} aria-hidden="true" /> : <TbToggleLeft size={20} aria-hidden="true" />}
          <span>Fast-Track Mode</span>
        </button>
      </header>

      {/* Filters Section */}
      <section aria-labelledby="review-filters-heading">
        <h2 id="review-filters-heading" className="sr-only">Review Queue Filters</h2>
        <form 
          role="search" 
          onSubmit={(e) => e.preventDefault()}
          className="bg-white p-3.5 rounded border border-slate-200 flex flex-col md:flex-row gap-3 items-center"
        >
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
            <input 
              id="review-search-input"
              type="search"
              placeholder="Search projects, MPs, keywords..."
              aria-label="Search review projects or MPs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2.5 w-full md:w-auto flex-wrap">
            <select 
              id="review-mp-filter"
              value={reviewMpFilter}
              onChange={(e) => setReviewMpFilter(e.target.value)}
              aria-label="Filter by Member of Parliament"
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] flex-1 md:flex-none"
            >
              <option value="All">All MPs</option>
              {districtMps.map(mp => <option key={mp.id} value={mp.id}>{mp.name}</option>)}
            </select>
            <select 
              id="review-risk-filter"
              value={reviewRiskFilter}
              onChange={(e) => setReviewRiskFilter(e.target.value)}
              aria-label="Filter by risk level"
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] flex-1 md:flex-none"
            >
              <option value="All">All Risk Levels</option>
              {['Low', 'Moderate', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              id="review-category-filter"
              value={reviewCategoryFilter}
              onChange={(e) => setReviewCategoryFilter(e.target.value)}
              aria-label="Filter by project category"
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] flex-1 md:flex-none"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </form>
      </section>

      {/* Quick Review Mode Notice */}
      {reviewQuickMode && (
        <div className="bg-amber-50 border border-amber-300 rounded p-3 flex items-start gap-2.5" role="status">
          <TbAlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-xs sm:text-sm font-semibold text-amber-900">Fast-Track Sanction Active</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Direct administrative sanction is enabled for verified <strong>Low Risk</strong> projects. High and Critical risk proposals require detailed technical audit.
            </p>
          </div>
        </div>
      )}

      {/* Queue List Section */}
      <section 
        aria-labelledby="queue-list-heading"
        className="bg-white rounded border border-slate-200 overflow-hidden flex-1"
      >
        <h2 id="queue-list-heading" className="sr-only">Proposals Awaiting Review</h2>
        <div className="overflow-x-auto h-full">
          {filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbClipboardCheck size={40} className="text-slate-300 mb-3" aria-hidden="true" />
              <p className="font-semibold text-sm">Review queue is empty</p>
              <p className="text-xs text-slate-400 mt-1">No pending proposals match the current filter selection.</p>
              {(reviewMpFilter !== 'All' || reviewRiskFilter !== 'All' || reviewCategoryFilter !== 'All' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setReviewMpFilter('All');
                    setReviewRiskFilter('All');
                    setReviewCategoryFilter('All');
                  }}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#123b63] bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <ul role="list" className="divide-y divide-slate-100">
              {filteredQueue.map(project => {
                const isLowRisk = project.riskLevel === 'Low';
                const canQuickApprove = reviewQuickMode && isLowRisk;

                return (
                  <li key={project.id}>
                    <article 
                      className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
                        project.riskLevel === 'Critical' ? 'border-l-4 border-l-red-600 bg-red-50/10' :
                        project.riskLevel === 'High' ? 'border-l-4 border-l-orange-500 bg-orange-50/10' :
                        project.riskLevel === 'Moderate' ? 'border-l-4 border-l-amber-500 bg-amber-50/10' :
                        'border-l-4 border-l-emerald-600 bg-white'
                      }`}
                    >
                      {/* Risk Score Circle */}
                      <div className={`shrink-0 w-10 h-10 rounded flex flex-col items-center justify-center text-white font-bold text-xs ${
                        project.riskScore >= 80 ? 'bg-red-600' :
                        project.riskScore >= 60 ? 'bg-orange-600' :
                        project.riskScore >= 40 ? 'bg-amber-600' :
                        'bg-emerald-600'
                      }`} aria-label={`Risk score: ${project.riskScore}`}>
                        <span>{project.riskScore}</span>
                      </div>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="font-bold text-[#123b63] text-xs sm:text-sm truncate">
                            <Link 
                              to={`/da/review/${project.id}`}
                              className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded"
                            >
                              {project.title}
                            </Link>
                          </h3>
                          <RiskBadge level={project.riskLevel} score={project.riskScore} showScore={false} />
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{project.mpName}</span>
                          <span aria-hidden="true">•</span>
                          <span>{project.category}</span>
                          <span aria-hidden="true">•</span>
                          <span className="font-semibold text-slate-800 tabular-nums">₹{(project.estimatedCost / 100000).toFixed(2)} Lakhs</span>
                          <span aria-hidden="true">•</span>
                          <span className="font-mono text-[11px] text-slate-400">{project.id}</span>
                        </div>

                        {/* Quick Approve IA Selector (for low-risk) */}
                        {showIASelect === project.id && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <select
                              value={quickApproveIA}
                              onChange={(e) => setQuickApproveIA(e.target.value)}
                              aria-label="Select Implementing Agency for approval"
                              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
                            >
                              <option value="">Select IA...</option>
                              {agencies.map(ia => (
                                <option key={ia.id} value={ia.id}>{ia.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(project.id)}
                              disabled={!quickApproveIA || quickApproving === project.id}
                              className="px-3 py-1 bg-emerald-700 text-white text-xs font-semibold rounded hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                            >
                              {quickApproving === project.id ? <TbLoader2 size={12} className="animate-spin" aria-hidden="true" /> : <TbCheck size={12} aria-hidden="true" />}
                              <span>Sanction</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowIASelect(null); setQuickApproveIA(''); }}
                              className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium rounded hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {canQuickApprove && showIASelect !== project.id && (
                          <button
                            type="button"
                            onClick={() => setShowIASelect(project.id)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                          >
                            <TbCheck size={14} aria-hidden="true" /> <span>Quick Sanction</span>
                          </button>
                        )}
                        {reviewQuickMode && !isLowRisk && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded flex items-center gap-1" title="Full review required for Medium+ risk">
                            <TbLock size={12} aria-hidden="true" /> Detailed Audit
                          </span>
                        )}
                        <Link
                          to={`/da/review/${project.id}`}
                          aria-label={`Open full review for ${project.title}`}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#123b63] text-white hover:bg-[#0c2a47] rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                          title="Open full review"
                        >
                          <span>Review</span>
                          <TbChevronRight size={14} aria-hidden="true" />
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default DaProjectReview;
