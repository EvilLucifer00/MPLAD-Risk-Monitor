import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { daApi } from '../../api/mockDaApi';
import { useDaStore } from '../../store/useDaStore';
import { mockMPs, mockImplementingAgencies, mockDaProjects } from '../../data/mockDaData';
import { RiskBadge } from '../mp/MpProjects';
import usePageSeo from '../../hooks/usePageSeo';
import { 
  TbSearch, TbChevronRight, TbClipboardCheck, TbToggleLeft, TbToggleRight,
  TbCheck, TbLock, TbAlertTriangle, TbLoader2
} from 'react-icons/tb';

const DaProjectReview = () => {
  usePageSeo(
    'Project Review Queue | DA Portal',
    'Prioritized district review queue for sanctioning MPLADS proposals, sorted by AI risk score.'
  );

  const [queue, setQueue] = useState(() => 
    mockDaProjects
      .filter(p => p.reviewStatus === 'Pending Review' || p.reviewStatus === 'Awaiting Verification')
      .sort((a, b) => b.riskScore - a.riskScore)
  );
  const [loading, setLoading] = useState(false);
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
    let isMounted = true;
    const mpParam = searchParams.get('mp');
    if (mpParam) setReviewMpFilter(mpParam);

    daApi.getReviewQueue().then(data => {
      if (isMounted && data?.length) {
        setQueue(data);
      }
    }).catch(() => {
      // Fallback to initial state
    });

    return () => { isMounted = false; };
  }, [searchParams, setReviewMpFilter]);

  const filteredQueue = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return queue.filter(p => {
      const matchesSearch = !search || p.title.toLowerCase().includes(search) || (p.mpName && p.mpName.toLowerCase().includes(search));
      const matchesMp = reviewMpFilter === 'All' || p.mpId === reviewMpFilter;
      const matchesRisk = reviewRiskFilter === 'All' || p.riskLevel === reviewRiskFilter;
      const matchesCat = reviewCategoryFilter === 'All' || p.category === reviewCategoryFilter;
      return matchesSearch && matchesMp && matchesRisk && matchesCat;
    });
  }, [queue, searchTerm, reviewMpFilter, reviewRiskFilter, reviewCategoryFilter]);

  const categories = useMemo(() => [...new Set(queue.map(p => p.category))], [queue]);

  const handleQuickApprove = async (projectId) => {
    if (!quickApproveIA) return;
    setQuickApproving(projectId);
    try {
      await daApi.quickApprove(projectId, { implementingAgencyId: quickApproveIA });
      setQueue(prev => prev.filter(p => p.id !== projectId));
      setShowIASelect(null);
      setQuickApproveIA('');
    } catch {
      // Handled gracefully
    }
    setQuickApproving(null);
  };

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Project Review Queue</h1>
          <p className="text-sm text-slate-500 mt-1 leading-normal">
            {filteredQueue.length} projects awaiting your review — sorted by risk score (highest first).
          </p>
        </div>
        {/* Quick Review Toggle */}
        <button
          type="button"
          onClick={() => setReviewQuickMode(!reviewQuickMode)}
          aria-pressed={reviewQuickMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-[transform,background-color,border-color,color] duration-150 ease-out border shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
            reviewQuickMode 
              ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {reviewQuickMode ? <TbToggleRight size={22} aria-hidden="true" /> : <TbToggleLeft size={22} aria-hidden="true" />}
          <span>Quick Review</span>
        </button>
      </header>

      {/* Filters Section */}
      <section aria-labelledby="review-filters-heading">
        <h2 id="review-filters-heading" className="sr-only">Review Queue Filters</h2>
        <form 
          role="search" 
          onSubmit={(e) => e.preventDefault()}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center"
        >
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input 
              id="review-search-input"
              type="search"
              placeholder="Search projects, MPs..."
              aria-label="Search review projects or MPs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            <select 
              id="review-mp-filter"
              value={reviewMpFilter}
              onChange={(e) => setReviewMpFilter(e.target.value)}
              aria-label="Filter by Member of Parliament"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150 flex-1 md:flex-none"
            >
              <option value="All">All MPs</option>
              {mockMPs.map(mp => <option key={mp.id} value={mp.id}>{mp.name}</option>)}
            </select>
            <select 
              id="review-risk-filter"
              value={reviewRiskFilter}
              onChange={(e) => setReviewRiskFilter(e.target.value)}
              aria-label="Filter by risk level"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150 flex-1 md:flex-none"
            >
              <option value="All">All Risk Levels</option>
              {['Low', 'Moderate', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              id="review-category-filter"
              value={reviewCategoryFilter}
              onChange={(e) => setReviewCategoryFilter(e.target.value)}
              aria-label="Filter by project category"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150 flex-1 md:flex-none"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </form>
      </section>

      {/* Quick Review Mode Notice */}
      {reviewQuickMode && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 flex items-start gap-3" role="status">
          <TbAlertTriangle size={20} className="text-cyan-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-cyan-800">Quick Review Mode Active</p>
            <p className="text-[13px] text-cyan-700 mt-0.5">
              Inline approve available for <strong>Low risk</strong> projects only. Medium, High, and Critical risk projects require full detail review.
            </p>
          </div>
        </div>
      )}

      {/* Queue List Section */}
      <section 
        aria-labelledby="queue-list-heading"
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1"
      >
        <h2 id="queue-list-heading" className="sr-only">Proposals Awaiting Review</h2>
        <div className="overflow-x-auto h-full">
          {filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbClipboardCheck size={48} className="text-slate-300 mb-4" aria-hidden="true" />
              <p className="font-semibold">Review queue is empty!</p>
              <p className="text-sm mt-1">No projects match your current filters.</p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-slate-100">
              {filteredQueue.map(project => {
                const isLowRisk = project.riskLevel === 'Low';
                const canQuickApprove = reviewQuickMode && isLowRisk;

                return (
                  <li key={project.id}>
                    <article 
                      className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors ${
                        project.riskLevel === 'Critical' ? 'border-l-4 border-l-red-400' :
                        project.riskLevel === 'High' ? 'border-l-4 border-l-orange-400' :
                        project.riskLevel === 'Moderate' ? 'border-l-4 border-l-amber-400' :
                        'border-l-4 border-l-emerald-400'
                      }`}
                    >
                      {/* Risk Score Circle */}
                      <div className={`shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-bold text-sm ${
                        project.riskScore >= 80 ? 'bg-red-500' :
                        project.riskScore >= 60 ? 'bg-orange-500' :
                        project.riskScore >= 40 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`} aria-label={`Risk score: ${project.riskScore}`}>
                        <span>{project.riskScore}</span>
                      </div>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="font-bold text-[#123b63] text-sm truncate">{project.title}</h3>
                          <RiskBadge level={project.riskLevel} score={project.riskScore} showScore={false} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] text-slate-500">
                          <span className="font-medium">{project.mpName}</span>
                          <span aria-hidden="true">•</span>
                          <span>{project.category}</span>
                          <span aria-hidden="true">•</span>
                          <span className="font-medium">₹{(project.estimatedCost / 100000).toFixed(1)}L</span>
                          <span aria-hidden="true">•</span>
                          <span className="font-mono">{project.id}</span>
                        </div>

                        {/* Quick Approve IA Selector (for low-risk) */}
                        {showIASelect === project.id && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <select
                              value={quickApproveIA}
                              onChange={(e) => setQuickApproveIA(e.target.value)}
                              aria-label="Select Implementing Agency for approval"
                              className="bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            >
                              <option value="">Select IA...</option>
                              {mockImplementingAgencies.map(ia => (
                                <option key={ia.id} value={ia.id}>{ia.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleQuickApprove(project.id)}
                              disabled={!quickApproveIA || quickApproving === project.id}
                              className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-[transform,background-color] duration-150 ease-out flex items-center gap-1 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                            >
                              {quickApproving === project.id ? <TbLoader2 size={14} className="animate-spin" aria-hidden="true" /> : <TbCheck size={14} aria-hidden="true" />}
                              <span>Confirm</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowIASelect(null); setQuickApproveIA(''); }}
                              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 active:scale-95 text-xs font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 active:scale-95 transition-[transform,background-color] duration-150 ease-out flex items-center gap-1 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                          >
                            <TbCheck size={14} aria-hidden="true" /> <span>Quick Approve</span>
                          </button>
                        )}
                        {reviewQuickMode && !isLowRisk && (
                          <span className="px-2 py-1 text-[10.5px] font-bold text-slate-600 bg-slate-100 rounded-md flex items-center gap-1" title="Full review required for Medium+ risk">
                            <TbLock size={12} aria-hidden="true" /> Full Review
                          </span>
                        )}
                        <Link
                          to={`/da/review/${project.id}`}
                          aria-label={`Open full review for ${project.title}`}
                          className="p-2 text-slate-400 hover:text-[#123b63] hover:bg-slate-100 rounded-lg active:scale-90 transition-[transform,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                          title="Open full review"
                        >
                          <TbChevronRight size={20} aria-hidden="true" />
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
