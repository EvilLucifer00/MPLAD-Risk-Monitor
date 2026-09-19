import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { daApi } from '../../api/mockDaApi';
import { mockImplementingAgencies } from '../../data/mockDaData';
import { StatusBadge, RiskBadge } from '../mp/MpProjects';
import { 
  TbArrowLeft, TbMapPin, TbBuilding, TbUser, TbCalendar, TbFileDescription, 
  TbDownload, TbAlertTriangle, TbChevronDown, TbChevronUp, TbCheck, TbX,
  TbHandStop, TbArrowUpRight, TbFileAlert, TbLoader2, TbClock, TbHistory
} from 'react-icons/tb';

// ── Modals ──

const SanctionModal = ({ open, onClose, onConfirm, loading }) => {
  const [iaId, setIaId] = useState('');
  const [notes, setNotes] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2"><TbCheck size={22} /> Sanction Project</h3>
          <p className="text-sm text-slate-500 mt-1">Approve this project and assign an Implementing Agency.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Implementing Agency *</label>
            <select value={iaId} onChange={e => setIaId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400">
              <option value="">Select an Implementing Agency...</option>
              {mockImplementingAgencies.map(ia => (
                <option key={ia.id} value={ia.id}>{ia.name} (Avg Risk: {ia.avgRiskScore})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add sanction notes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => onConfirm({ implementingAgencyId: iaId, notes })} disabled={!iaId || loading}
            className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? <TbLoader2 size={16} className="animate-spin" /> : <TbCheck size={16} />} Sanction & Assign IA
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectModal = ({ open, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  const [presets, setPresets] = useState([]);
  const presetOptions = [
    "Cost exceeds justified estimate",
    "Duplicate work suspected",
    "Incomplete documentation",
    "Does not meet MPLADS guidelines",
    "Vendor track record concerns"
  ];
  const togglePreset = (p) => setPresets(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-orange-100 bg-orange-50/30">
          <h3 className="text-lg font-bold text-orange-700 flex items-center gap-2"><TbX size={22} /> Reject Project</h3>
          <p className="text-sm text-orange-600 mt-1">This will reject the project and notify the MP.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Preset Reasons (optional)</label>
            <div className="flex flex-wrap gap-2">
              {presetOptions.map(p => (
                <button key={p} onClick={() => togglePreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    presets.includes(p) ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason *</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Provide a detailed reason for rejection..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => onConfirm({ reason, presetReasons: presets })} disabled={!reason.trim() || loading}
            className="px-5 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? <TbLoader2 size={16} className="animate-spin" /> : <TbX size={16} />} Reject Project
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestDocsModal = ({ open, onClose, onConfirm, loading }) => {
  const [documents, setDocuments] = useState('');
  const [message, setMessage] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-blue-100 bg-blue-50/30">
          <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2"><TbFileAlert size={22} /> Request Additional Documents</h3>
          <p className="text-sm text-blue-600 mt-1">The MP will be notified and the project status will change to "Awaiting Verification".</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Documents / Verification Needed *</label>
            <textarea value={documents} onChange={e => setDocuments(e.target.value)} rows={3}
              placeholder="e.g., Water quality test report, Site distance verification, Revised cost estimate..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message to MP (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
              placeholder="Any additional instructions or context..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => onConfirm({ documents, message })} disabled={!documents.trim() || loading}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? <TbLoader2 size={16} className="animate-spin" /> : <TbFileAlert size={16} />} Send Request
          </button>
        </div>
      </div>
    </div>
  );
};

const SuspendModal = ({ open, onClose, onConfirm, loading }) => {
  const [justification, setJustification] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border-2 border-red-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-red-200 bg-red-50">
          <h3 className="text-lg font-bold text-red-700 flex items-center gap-2"><TbHandStop size={22} /> Stop / Suspend Project</h3>
          <div className="mt-3 p-3 bg-red-100 rounded-xl border border-red-200">
            <p className="text-sm font-bold text-red-800 flex items-center gap-2">
              <TbAlertTriangle size={18} /> ⚠️ This will halt an active project
            </p>
            <p className="text-[13px] text-red-700 mt-1">
              All work will be stopped immediately. The project status will change to "Suspended — Under Investigation". 
              This action is logged and audited. A mandatory justification is required.
            </p>
          </div>
        </div>
        <div className="p-6">
          <label className="block text-sm font-semibold text-red-700 mb-1.5">Justification *</label>
          <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={4}
            placeholder="Provide a detailed justification for suspending this project. This will be part of the permanent audit record..."
            className="w-full bg-red-50/50 border border-red-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" />
        </div>
        <div className="p-6 border-t border-red-200 bg-red-50/30 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => onConfirm({ justification })} disabled={!justification.trim() || loading}
            className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? <TbLoader2 size={16} className="animate-spin" /> : <TbHandStop size={16} />} Suspend Project
          </button>
        </div>
      </div>
    </div>
  );
};

const EscalateModal = ({ open, onClose, onConfirm, loading }) => {
  const [notes, setNotes] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-amber-100 bg-amber-50/30">
          <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2"><TbArrowUpRight size={22} /> Escalate to State / Ministry</h3>
          <p className="text-sm text-amber-600 mt-1">This project will be flagged for State Nodal Authority / Ministry visibility.</p>
        </div>
        <div className="p-6">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Escalation Notes *</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Explain why this project needs state/ministry-level attention..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none" />
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => onConfirm({ notes })} disabled={!notes.trim() || loading}
            className="px-5 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? <TbLoader2 size={16} className="animate-spin" /> : <TbArrowUpRight size={16} />} Escalate
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──

const DaReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [showSanction, setShowSanction] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showRequestDocs, setShowRequestDocs] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);

  useEffect(() => {
    daApi.getProjectById(id)
      .then(data => { setProject(data); setLoading(false); })
      .catch(() => navigate('/da/review'));
  }, [id, navigate]);

  const handleAction = async (actionFn, params, closeModal, msg) => {
    setActionLoading(true);
    try {
      const updated = await actionFn(id, params);
      setProject(updated);
      closeModal();
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) { console.error(e); }
    setActionLoading(false);
  };

  if (loading || !project) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stages = ["Recommended", "Pending Review", "Sanctioned", "In Progress", "Completed"];
  let currentStageIndex = -1;
  if (project.reviewStatus === 'Pending Review') currentStageIndex = 1;
  else if (project.reviewStatus === 'Sanctioned' && project.status === 'Sanctioned') currentStageIndex = 2;
  else if (project.status === 'In Progress') currentStageIndex = 3;
  else if (project.status === 'Completed') currentStageIndex = 4;

  const isActionable = ['Pending Review', 'Awaiting Verification'].includes(project.reviewStatus);
  const isInProgress = project.status === 'In Progress';
  const canSuspend = isInProgress && project.reviewStatus !== 'Suspended';
  const canEscalate = !['Escalated', 'Rejected'].includes(project.reviewStatus);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[slideIn_0.3s_ease-out]">
          <TbCheck size={20} /> {successMsg}
        </div>
      )}

      {/* Modals */}
      <SanctionModal open={showSanction} onClose={() => setShowSanction(false)} loading={actionLoading}
        onConfirm={(params) => handleAction(daApi.sanctionProject, params, () => setShowSanction(false), 'Project sanctioned successfully!')} />
      <RejectModal open={showReject} onClose={() => setShowReject(false)} loading={actionLoading}
        onConfirm={(params) => handleAction(daApi.rejectProject, params, () => setShowReject(false), 'Project rejected. MP notified.')} />
      <RequestDocsModal open={showRequestDocs} onClose={() => setShowRequestDocs(false)} loading={actionLoading}
        onConfirm={(params) => handleAction(daApi.requestDocuments, params, () => setShowRequestDocs(false), 'Document request sent to MP.')} />
      <SuspendModal open={showSuspend} onClose={() => setShowSuspend(false)} loading={actionLoading}
        onConfirm={(params) => handleAction(daApi.suspendProject, params, () => setShowSuspend(false), 'Project suspended. Investigation initiated.')} />
      <EscalateModal open={showEscalate} onClose={() => setShowEscalate(false)} loading={actionLoading}
        onConfirm={(params) => handleAction(daApi.escalateProject, params, () => setShowEscalate(false), 'Project escalated to State Nodal Authority.')} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/da/review" className="p-2 hover:bg-slate-200 bg-slate-100 text-slate-600 rounded-full transition-colors">
          <TbArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[#123b63]">{project.title}</h1>
            <StatusBadge status={project.status} />
            <RiskBadge level={project.riskLevel} score={project.riskScore} />
          </div>
          <p className="text-sm text-slate-500 mt-1">{project.id} • {project.category} • MP: {project.mpName} ({project.constituency})</p>
        </div>
      </div>

      {/* Review Status Banner */}
      {project.reviewStatus === 'Pending Review' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <TbClock size={22} className="text-orange-500 shrink-0" />
          <p className="text-sm font-semibold text-orange-700">This project is pending your review. Take action below.</p>
        </div>
      )}
      {project.reviewStatus === 'Awaiting Verification' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <TbFileAlert size={22} className="text-blue-500 shrink-0" />
          <p className="text-sm font-semibold text-blue-700">Additional documents requested. Awaiting MP verification response.</p>
        </div>
      )}
      {project.reviewStatus === 'Suspended' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <TbHandStop size={22} className="text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">This project is SUSPENDED — Under Investigation. All work halted.</p>
        </div>
      )}
      {project.reviewStatus === 'Escalated' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <TbArrowUpRight size={22} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">Escalated to State Nodal Authority / Ministry for review.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-[#123b63] mb-4">Project Information</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{project.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-start gap-3">
                <TbMapPin className="text-slate-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Location</p>
                  <p className="text-sm text-slate-800 font-medium">{project.district}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TbBuilding className="text-slate-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Implementing Agency</p>
                  <p className="text-sm text-slate-800 font-medium">{project.implementingAgency || 'Pending Assignment'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TbUser className="text-slate-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Vendor</p>
                  <p className="text-sm text-slate-800 font-medium">{project.vendor}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TbCalendar className="text-slate-400 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Timeline</p>
                  <p className="text-sm text-slate-800 font-medium">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} — {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Tracker */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-[#123b63] mb-6">Status Tracker</h2>
            {project.reviewStatus === 'Rejected' ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
                <TbAlertTriangle size={24} className="shrink-0" />
                <div>
                  <p className="font-bold">Project Rejected</p>
                  <p className="text-sm mt-1">See action history below for the rejection reason.</p>
                </div>
              </div>
            ) : (
              <div className="relative flex justify-between">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-10"></div>
                <div className="absolute top-4 left-4 h-0.5 bg-cyan-500 -z-10 transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}></div>
                {stages.map((stage, index) => {
                  const isCompleted = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  return (
                    <div key={stage} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        isCompleted ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white border-slate-300 text-slate-300'
                      }`}>
                        {isCompleted ? <TbCheck size={16} strokeWidth={3} /> : <span className="w-2 h-2 rounded-full bg-slate-300"></span>}
                      </div>
                      <p className={`text-[10px] sm:text-xs font-semibold text-center w-16 sm:w-24 ${
                        isCurrent ? 'text-cyan-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                      }`}>{stage}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action History / Audit Log */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
              <TbHistory size={22} className="text-[#123b63]" />
              <h2 className="text-lg font-bold text-[#123b63]">Action History & Audit Log</h2>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200"></div>
              <div className="space-y-0">
                {[...project.actionHistory].reverse().map((action, idx) => {
                  const isDA = action.actor.includes('DA');
                  const isAI = action.actor.includes('AI');
                  let dotColor = 'bg-blue-500';
                  let bgColor = '';
                  if (action.action.includes('Sanction') || action.action.includes('Approved')) { dotColor = 'bg-emerald-500'; }
                  else if (action.action.includes('Reject')) { dotColor = 'bg-red-500'; bgColor = 'bg-red-50/30'; }
                  else if (action.action.includes('Suspend')) { dotColor = 'bg-red-600'; bgColor = 'bg-red-50/30'; }
                  else if (action.action.includes('Escalat')) { dotColor = 'bg-amber-500'; bgColor = 'bg-amber-50/30'; }
                  else if (action.action.includes('Risk')) { dotColor = 'bg-orange-500'; bgColor = 'bg-orange-50/30'; }
                  else if (action.action.includes('Request')) { dotColor = 'bg-blue-500'; bgColor = 'bg-blue-50/30'; }
                  else if (action.action.includes('Submitted')) { dotColor = 'bg-slate-400'; }

                  return (
                    <div key={idx} className={`relative pl-12 py-4 ${bgColor} rounded-lg`}>
                      <div className={`absolute left-3.5 top-5 w-3.5 h-3.5 rounded-full border-2 border-white ${dotColor} z-10`}></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-sm text-[#123b63]">{action.action}</span>
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                          {new Date(action.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[12px] font-semibold text-slate-500 mb-1">
                        By: {action.actor}
                        {isDA && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">DA</span>}
                        {isAI && <span className="ml-1.5 px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[10px] font-bold">AI</span>}
                      </p>
                      <p className="text-[13px] text-slate-600 leading-relaxed">{action.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* DA Action Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-[#123b63] mb-4">DA Actions</h2>
            <div className="space-y-3">
              {isActionable && (
                <>
                  <button onClick={() => setShowSanction(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors text-sm font-bold">
                    <TbCheck size={20} /> Sanction / Approve
                  </button>
                  <button onClick={() => setShowReject(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors text-sm font-bold">
                    <TbX size={20} /> Reject
                  </button>
                  <button onClick={() => setShowRequestDocs(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors text-sm font-bold">
                    <TbFileAlert size={20} /> Request Additional Documents
                  </button>
                </>
              )}
              {canSuspend && (
                <button onClick={() => setShowSuspend(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-sm font-bold">
                  <TbHandStop size={20} /> Stop / Suspend Project
                </button>
              )}
              {canEscalate && (
                <button onClick={() => setShowEscalate(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors text-sm font-bold">
                  <TbArrowUpRight size={20} /> Escalate
                </button>
              )}
              {!isActionable && !canSuspend && !canEscalate && (
                <p className="text-sm text-slate-500 text-center py-4">No actions available for this project's current status.</p>
              )}
            </div>
            {/* Current Review Status */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Review Status</p>
              <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold ${
                project.reviewStatus === 'Pending Review' ? 'bg-orange-100 text-orange-700' :
                project.reviewStatus === 'Sanctioned' ? 'bg-emerald-100 text-emerald-700' :
                project.reviewStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                project.reviewStatus === 'Suspended' ? 'bg-slate-200 text-slate-700' :
                project.reviewStatus === 'Escalated' ? 'bg-amber-100 text-amber-700' :
                project.reviewStatus === 'Awaiting Verification' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>{project.reviewStatus}</span>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-[#123b63] mb-4">Financials</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Estimated Cost</p>
                <p className="text-xl font-bold text-slate-800">₹{(project.estimatedCost / 100000).toFixed(2)} Lakhs</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Sanctioned</p>
                <p className="text-lg font-bold text-blue-600">₹{(project.sanctionedAmount / 100000).toFixed(2)} Lakhs</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Utilized</p>
                  <p className="text-xs font-bold text-emerald-600">
                    {project.sanctionedAmount > 0 ? Math.round((project.amountSpent / project.sanctionedAmount) * 100) : 0}%
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${project.sanctionedAmount > 0 ? (project.amountSpent / project.sanctionedAmount) * 100 : 0}%` }}></div>
                </div>
                <p className="text-sm font-bold text-slate-800">₹{(project.amountSpent / 100000).toFixed(2)} Lakhs</p>
              </div>
            </div>
          </div>

          {/* AI Risk Breakdown */}
          {project.riskFactors && project.riskFactors.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#123b63]">Risk Breakdown</h2>
                <span className="text-[10px] font-bold bg-[#123b63] text-white px-2 py-1 rounded">AI Analyzed</span>
              </div>
              <div className="space-y-2">
                {project.riskFactors.map((factor, i) => {
                  const isHigh = factor.score >= 60;
                  const isExpanded = expandedRisk === i;
                  return (
                    <div key={i} className={`border rounded-lg overflow-hidden transition-colors ${isHigh ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                      <button onClick={() => setExpandedRisk(isExpanded ? null : i)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-black/5 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                          <span className="font-semibold text-sm text-slate-800">{factor.detector}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${isHigh ? 'text-red-600' : 'text-emerald-600'}`}>{factor.score}/100</span>
                          {isExpanded ? <TbChevronUp size={16} className="text-slate-400" /> : <TbChevronDown size={16} className="text-slate-400" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-3 pt-0 text-sm text-slate-600 bg-white/50 border-t border-black/5">
                          {factor.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-[#123b63] mb-4">Documents</h2>
            {project.documents.length === 0 ? (
              <p className="text-sm text-slate-500">No documents uploaded.</p>
            ) : (
              <div className="space-y-3">
                {project.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded">
                        <TbFileDescription size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-500">{doc.size} • Uploaded by {doc.uploader}</p>
                      </div>
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-[#123b63] transition-colors shrink-0" title="Download">
                      <TbDownload size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaReviewDetail;
