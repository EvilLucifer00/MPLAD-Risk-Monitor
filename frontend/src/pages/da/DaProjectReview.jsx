import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { daApi } from '../../api/mockDaApi';
import { useDaStore } from '../../store/useDaStore';
import { mockMPs, mockImplementingAgencies } from '../../data/mockDaData';
import { RiskBadge } from '../mp/MpProjects';
import { 
  TbSearch, TbFilter, TbChevronRight, TbClipboardCheck, TbToggleLeft, TbToggleRight,
  TbCheck, TbX, TbLock, TbAlertTriangle, TbLoader2
} from 'react-icons/tb';

const DaProjectReview = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
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
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    const data = await daApi.getReviewQueue();
    setQueue(data);
    setLoading(false);
  };

  const filteredQueue = queue.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = !search || p.title.toLowerCase().includes(search) || p.mpName.toLowerCase().includes(search);
    const matchesMp = reviewMpFilter === 'All' || p.mpId === reviewMpFilter;
    const matchesRisk = reviewRiskFilter === 'All' || p.riskLevel === reviewRiskFilter;
    const matchesCat = reviewCategoryFilter === 'All' || p.category === reviewCategoryFilter;
    return matchesSearch && matchesMp && matchesRisk && matchesCat;
  });

  const categories = [...new Set(queue.map(p => p.category))];

  const handleQuickApprove = async (projectId) => {
    if (!quickApproveIA) return;
    setQuickApproving(projectId);
    try {
      await daApi.quickApprove(projectId, { implementingAgencyId: quickApproveIA });
      setQueue(prev => prev.filter(p => p.id !== projectId));
      setShowIASelect(null);
      setQuickApproveIA('');
    } catch (e) {
      console.error(e);
    }
    setQuickApproving(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#123b63]">Project Review Queue</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredQueue.length} projects awaiting your review — sorted by risk score (highest first).
          </p>
        </div>
        {/* Quick Review Toggle */}
        <button
          onClick={() => setReviewQuickMode(!reviewQuickMode)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
            reviewQuickMode 
              ? 'bg-cyan-50 text-cyan-700 border-cyan-200' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {reviewQuickMode ? <TbToggleRight size={22} /> : <TbToggleLeft size={22} />}
          Quick Review
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search projects, MPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <select 
            value={reviewMpFilter}
            onChange={(e) => setReviewMpFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none flex-1 md:flex-none"
          >
            <option value="All">All MPs</option>
            {mockMPs.map(mp => <option key={mp.id} value={mp.id}>{mp.name}</option>)}
          </select>
          <select 
            value={reviewRiskFilter}
            onChange={(e) => setReviewRiskFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none flex-1 md:flex-none"
          >
            <option value="All">All Risk Levels</option>
            {['Low', 'Moderate', 'High', 'Critical'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select 
            value={reviewCategoryFilter}
            onChange={(e) => setReviewCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none flex-1 md:flex-none"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Quick Review Mode Notice */}
      {reviewQuickMode && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 flex items-start gap-3">
          <TbAlertTriangle size={20} className="text-cyan-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-cyan-800">Quick Review Mode Active</p>
            <p className="text-[13px] text-cyan-700 mt-0.5">
              Inline approve available for <strong>Low risk</strong> projects only. Medium, High, and Critical risk projects require full detail review.
            </p>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="overflow-x-auto h-full">
          {filteredQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbClipboardCheck size={48} className="text-slate-300 mb-4" />
              <p className="font-semibold">Review queue is empty!</p>
              <p className="text-sm mt-1">No projects match your current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQueue.map(project => {
                const isLowRisk = project.riskLevel === 'Low';
                const canQuickApprove = reviewQuickMode && isLowRisk;

                return (
                  <div 
                    key={project.id}
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
                    }`}>
                      {project.riskScore}
                    </div>

                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="font-bold text-[#123b63] text-sm truncate">{project.title}</h3>
                        <RiskBadge level={project.riskLevel} score={project.riskScore} showScore={false} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12px] text-slate-500">
                        <span className="font-medium">{project.mpName}</span>
                        <span>•</span>
                        <span>{project.category}</span>
                        <span>•</span>
                        <span className="font-medium">₹{(project.estimatedCost / 100000).toFixed(1)}L</span>
                        <span>•</span>
                        <span>{project.id}</span>
                      </div>

                      {/* Quick Approve IA Selector (for low-risk) */}
                      {showIASelect === project.id && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <select
                            value={quickApproveIA}
                            onChange={(e) => setQuickApproveIA(e.target.value)}
                            className="bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          >
                            <option value="">Select IA...</option>
                            {mockImplementingAgencies.map(ia => (
                              <option key={ia.id} value={ia.id}>{ia.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleQuickApprove(project.id)}
                            disabled={!quickApproveIA || quickApproving === project.id}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                          >
                            {quickApproving === project.id ? <TbLoader2 size={14} className="animate-spin" /> : <TbCheck size={14} />}
                            Confirm
                          </button>
                          <button
                            onClick={() => { setShowIASelect(null); setQuickApproveIA(''); }}
                            className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-sm"
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
                          onClick={() => setShowIASelect(project.id)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                        >
                          <TbCheck size={14} /> Quick Approve
                        </button>
                      )}
                      {reviewQuickMode && !isLowRisk && (
                        <span className="px-2 py-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-md flex items-center gap-1" title="Full review required for Medium+ risk">
                          <TbLock size={12} /> Full Review
                        </span>
                      )}
                      <Link
                        to={`/da/review/${project.id}`}
                        className="p-2.5 text-slate-400 hover:text-[#123b63] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Open full review"
                      >
                        <TbChevronRight size={20} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DaProjectReview;
