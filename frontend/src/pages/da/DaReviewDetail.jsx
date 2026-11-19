import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { daApi } from '../../api/daApi';
import { useDaProjectDetail, useDaAgencies, useDaReviewActionMutation } from '../../api/queries';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBadge, RiskBadge } from '../mp/MpProjects';
import usePageSeo from '../../hooks/usePageSeo';
import useDialogA11y from '../../hooks/useDialogA11y';
import { 
  TbArrowLeft, TbMapPin, TbBuilding, TbUser, TbCalendar, TbFileDescription, 
  TbDownload, TbAlertTriangle, TbChevronDown, TbChevronUp, TbCheck, TbX,
  TbHandStop, TbArrowUpRight, TbFileAlert, TbLoader2, TbClock, TbHistory
} from 'react-icons/tb';

// ── Modals ──

const SanctionModal = ({ open, onClose, onConfirm, loading }) => {
  const modalRef = useDialogA11y(open, onClose);
  const { data: agenciesData } = useDaAgencies();
  const agencies = Array.isArray(agenciesData) ? agenciesData : [];
  const [iaId, setIaId] = useState('');
  const [notes, setNotes] = useState('');
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sanction-modal-title"
    >
      <div ref={modalRef} className="bg-white rounded border border-slate-300 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200">
          <h3 id="sanction-modal-title" className="text-base font-bold text-emerald-800 flex items-center gap-2">
            <TbCheck size={20} aria-hidden="true" /> Sanction Project Proposal
          </h3>
          <p className="text-xs text-slate-500 mt-1">Record official sanction and designate an authorized Implementing Agency.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="ia-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Designated Implementing Agency *</label>
            <select 
              id="ia-select"
              value={iaId} 
              onChange={e => setIaId(e.target.value)}
              aria-label="Select an Implementing Agency"
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
            >
              <option value="">Select an Implementing Agency...</option>
              {agencies.map(ia => (
                <option key={ia.id} value={ia.id}>{ia.name} (Risk Rating: {ia.avgRiskScore})</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sanction-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Sanction Remarks (optional)</label>
            <textarea 
              id="sanction-notes"
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={3} 
              placeholder="Record any administrative conditions or remarks..."
              aria-label="Sanction notes"
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] resize-none" 
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm({ implementingAgencyId: iaId, notes })} 
            disabled={!iaId || loading}
            className="px-4 py-1.5 bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded hover:bg-emerald-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-700"
          >
            {loading ? <TbLoader2 size={16} className="animate-spin" aria-hidden="true" /> : <TbCheck size={16} aria-hidden="true" />} Confirm Sanction & Assign IA
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectModal = ({ open, onClose, onConfirm, loading }) => {
  const modalRef = useDialogA11y(open, onClose);
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
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
    >
      <div ref={modalRef} className="bg-white rounded border border-slate-300 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 bg-red-50/40">
          <h3 id="reject-modal-title" className="text-base font-bold tracking-tight text-red-900 flex items-center gap-2">
            <TbX size={20} aria-hidden="true" /> Return / Reject Proposal
          </h3>
          <p className="text-xs text-red-800 mt-1">This will record proposal rejection and notify the Member of Parliament.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">Preset Justifications</p>
            <div className="flex flex-wrap gap-1.5">
              {presetOptions.map(p => (
                <button 
                  key={p} 
                  onClick={() => togglePreset(p)}
                  aria-pressed={presets.includes(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    presets.includes(p) ? 'bg-red-100 text-red-800 border-red-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="reject-reason" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Administrative Reason *</label>
            <textarea 
              id="reject-reason"
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              rows={3} 
              placeholder="Provide a specific administrative explanation for rejection..."
              aria-label="Reason for rejection"
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] resize-none" 
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm({ reason, presetReasons: presets })} 
            disabled={!reason.trim() || loading}
            className="px-4 py-1.5 bg-red-700 text-white text-xs sm:text-sm font-semibold rounded hover:bg-red-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-700"
          >
            {loading ? <TbLoader2 size={16} className="animate-spin" aria-hidden="true" /> : <TbX size={16} aria-hidden="true" />} Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestDocsModal = ({ open, onClose, onConfirm, loading }) => {
  const modalRef = useDialogA11y(open, onClose);
  const [documents, setDocuments] = useState('');
  const [message, setMessage] = useState('');
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-docs-modal-title"
    >
      <div ref={modalRef} className="bg-white rounded border border-slate-300 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 bg-blue-50/40">
          <h3 id="request-docs-modal-title" className="text-base font-bold text-[#123b63] flex items-center gap-2">
            <TbFileAlert size={20} aria-hidden="true" /> Requisition of Supporting Documentation
          </h3>
          <p className="text-xs text-slate-600 mt-1">The proposal will enter "Awaiting Verification" status pending receipt of requested documents.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label htmlFor="req-docs-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Documentation Required *</label>
            <textarea 
              id="req-docs-input"
              value={documents} 
              onChange={e => setDocuments(e.target.value)} 
              rows={3}
              placeholder="e.g., Detailed Technical Sanction, Land Possession Certificate, Revised Estimate..."
              aria-label="Documents or verification needed"
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] resize-none" 
            />
          </div>
          <div>
            <label htmlFor="req-msg-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Official Remarks to MP Office (optional)</label>
            <textarea 
              id="req-msg-input"
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              rows={2}
              placeholder="Provide any administrative reference or statutory deadline..."
              aria-label="Message to MP"
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] resize-none" 
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm({ documents, message })} 
            disabled={!documents.trim() || loading}
            className="px-4 py-1.5 bg-[#123b63] text-white text-xs sm:text-sm font-semibold rounded hover:bg-[#0c2a47] disabled:opacity-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#123b63]"
          >
            {loading ? <TbLoader2 size={16} className="animate-spin" aria-hidden="true" /> : <TbFileAlert size={16} aria-hidden="true" />} Dispatch Request
          </button>
        </div>
      </div>
    </div>
  );
};

const SuspendModal = ({ open, onClose, onConfirm, loading }) => {
  const modalRef = useDialogA11y(open, onClose);
  const [justification, setJustification] = useState('');
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-modal-title"
    >
      <div ref={modalRef} className="bg-white rounded border border-red-300 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-red-200 bg-red-50/60">
          <h3 id="suspend-modal-title" className="text-base font-bold tracking-tight text-red-900 flex items-center gap-2">
            <TbHandStop size={20} aria-hidden="true" /> Suspend Ongoing Project Work
          </h3>
          <div className="mt-2.5 p-3 bg-red-100/80 rounded border border-red-200">
            <p className="text-xs font-bold text-red-900 flex items-center gap-1.5">
              <TbAlertTriangle size={16} aria-hidden="true" /> Statutory Enforcement Action
            </p>
            <p className="text-xs text-red-800 mt-1">
              All field works, vendor disbursements, and sanctions are halted immediately pending administrative inquiry.
            </p>
          </div>
        </div>
        <div className="p-5">
          <label htmlFor="suspend-justification" className="block text-xs font-semibold uppercase tracking-wider text-red-900 mb-1.5">Official Injunction Justification *</label>
          <textarea 
            id="suspend-justification"
            value={justification} 
            onChange={e => setJustification(e.target.value)} 
            rows={3}
            placeholder="Provide a detailed audit finding or statutory violation justifying suspension..."
            aria-label="Justification for suspending project"
            className="w-full bg-white border border-red-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" 
          />
        </div>
        <div className="p-4 border-t border-red-200 bg-slate-50 flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm({ justification })} 
            disabled={!justification.trim() || loading}
            className="px-4 py-1.5 bg-red-700 text-white text-xs sm:text-sm font-semibold rounded hover:bg-red-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-700"
          >
            {loading ? <TbLoader2 size={16} className="animate-spin" aria-hidden="true" /> : <TbHandStop size={16} aria-hidden="true" />} Confirm Suspension
          </button>
        </div>
      </div>
    </div>
  );
};

const EscalateModal = ({ open, onClose, onConfirm, loading }) => {
  const modalRef = useDialogA11y(open, onClose);
  const [notes, setNotes] = useState('');
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="escalate-modal-title"
    >
      <div ref={modalRef} className="bg-white rounded border border-slate-300 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 bg-amber-50/50">
          <h3 id="escalate-modal-title" className="text-base font-bold tracking-tight text-amber-900 flex items-center gap-2">
            <TbArrowUpRight size={20} aria-hidden="true" /> Escalate to State Nodal Authority / MoSPI
          </h3>
          <p className="text-xs text-amber-800 mt-1">This proposal will be referred to higher administrative jurisdiction for specialized review.</p>
        </div>
        <div className="p-5">
          <label htmlFor="escalate-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Escalation Reference Notes *</label>
          <textarea 
            id="escalate-notes"
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            rows={3}
            placeholder="Explain why this matter requires state or central nodal intervention..."
            aria-label="Escalation notes"
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] resize-none" 
          />
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button 
            onClick={onClose} 
            className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm({ notes })} 
            disabled={!notes.trim() || loading}
            className="px-4 py-1.5 bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded hover:bg-amber-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-700"
          >
            {loading ? <TbLoader2 size={16} className="animate-spin" aria-hidden="true" /> : <TbArrowUpRight size={16} aria-hidden="true" />} Dispatch Escalation
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──

const DaReviewDetail = () => {
  const reviewMutation = useDaReviewActionMutation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projectData, isLoading, isError } = useDaProjectDetail(id);
  const [projectOverride, setProjectOverride] = useState(null);
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [showSanction, setShowSanction] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showRequestDocs, setShowRequestDocs] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);

  const project = projectOverride || projectData;
  const loading = isLoading && !project;

  usePageSeo(
    `${project ? project.title : 'Project Review'} | DA Portal`,
    `Sanction review, risk breakdown, and audit log for MPLADS project ${project?.id || id}.`
  );

  // Keep user on page and show graceful error UI if project fails to load

  const handleAction = async (actionName, params, closeModal, msg) => {
    setActionLoading(true);
    try {
      await reviewMutation.mutateAsync({
        id,
        action: actionName,
        details: params,
      });
      closeModal();
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      // Handled gracefully with rollback
    }
    setActionLoading(false);
  };

  if ((isLoading || !project) && !isError) {
    return <PortalPageLoader message="Loading Review Details..." />;
  }

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl shadow-sm border border-slate-200 my-8">
        <TbAlertTriangle size={48} className="text-amber-500 mb-4" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-800">Unable to load project review</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          The requested project could not be found or you may not have permission to view it.
        </p>
        <Link
          to="/da/review"
          className="mt-5 px-4 py-2 bg-[#123b63] text-white text-sm font-semibold rounded-xl hover:bg-[#0e2f50] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
        >
          Return to Review Queue
        </Link>
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
    <article className="space-y-6 max-w-6xl mx-auto">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-[slideIn_0.3s_ease-out]" role="status">
          <TbCheck size={20} aria-hidden="true" /> {successMsg}
        </div>
      )}

      {/* Modals */}
      <SanctionModal open={showSanction} onClose={() => setShowSanction(false)} loading={actionLoading}
        onConfirm={(params) => handleAction('Sanction', params, () => setShowSanction(false), 'Project sanctioned successfully!')} />
      <RejectModal open={showReject} onClose={() => setShowReject(false)} loading={actionLoading}
        onConfirm={(params) => handleAction('Reject', params, () => setShowReject(false), 'Project rejected. MP notified.')} />
      <RequestDocsModal open={showRequestDocs} onClose={() => setShowRequestDocs(false)} loading={actionLoading}
        onConfirm={(params) => handleAction('Request Documents', params, () => setShowRequestDocs(false), 'Document request sent to MP.')} />
      <SuspendModal open={showSuspend} onClose={() => setShowSuspend(false)} loading={actionLoading}
        onConfirm={(params) => handleAction('Suspend', params, () => setShowSuspend(false), 'Project suspended. Investigation initiated.')} />
      <EscalateModal open={showEscalate} onClose={() => setShowEscalate(false)} loading={actionLoading}
        onConfirm={(params) => handleAction('Escalate', params, () => setShowEscalate(false), 'Project escalated to State Nodal Authority.')} />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <li>
            <Link to="/da" className="hover:text-[#123b63] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded px-1">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">/</li>
          <li>
            <Link to="/da/review" className="hover:text-[#123b63] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded px-1">
              Review Queue
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">/</li>
          <li aria-current="page" className="text-[#123b63] font-bold truncate max-w-[200px]">
            {project.title}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="flex items-center gap-4">
        <Link 
          to="/da/review" 
          aria-label="Back to project review queue"
          className="p-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
        >
          <TbArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">{project.title}</h1>
            <StatusBadge status={project.status} />
            <RiskBadge level={project.riskLevel} score={project.riskScore} />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{project.id} • {project.category} • MP: {project.mpName} ({project.constituency})</p>
        </div>
      </header>

      {/* Review Status Banner */}
      {project.reviewStatus === 'Pending Review' && (
        <div className="bg-amber-50 border border-amber-300 rounded p-3.5 flex items-center gap-2.5" role="status">
          <TbClock size={20} className="text-amber-800 shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-semibold text-amber-900">This proposal is currently in the District Review Queue awaiting statutory sanction.</p>
        </div>
      )}
      {project.reviewStatus === 'Awaiting Verification' && (
        <div className="bg-blue-50 border border-blue-300 rounded p-3.5 flex items-center gap-2.5" role="status">
          <TbFileAlert size={20} className="text-[#123b63] shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-semibold text-slate-900">Additional verification or documents have been requisitioned from the MP office.</p>
        </div>
      )}
      {project.reviewStatus === 'Suspended' && (
        <div className="bg-red-50 border border-red-300 rounded p-3.5 flex items-center gap-2.5" role="alert">
          <TbHandStop size={20} className="text-red-700 shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-bold text-red-900">Project Execution Suspended: Official inquiry and field audit in progress.</p>
        </div>
      )}
      {project.reviewStatus === 'Escalated' && (
        <div className="bg-amber-50 border border-amber-300 rounded p-3.5 flex items-center gap-2.5" role="status">
          <TbArrowUpRight size={20} className="text-amber-800 shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-semibold text-amber-900">Referred to State Nodal Authority / Central Ministry for statutory determination.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <section aria-labelledby="project-info-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <h2 id="project-info-heading" className="text-base sm:text-lg font-bold text-[#123b63] mb-3 pb-2 border-b border-slate-200">Project Proposal Details</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">{project.description}</p>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="flex items-start gap-2.5">
                <TbMapPin className="text-slate-500 mt-0.5 shrink-0" size={16} aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">District / Location</dt>
                  <dd className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">{project.district}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <TbBuilding className="text-slate-500 mt-0.5 shrink-0" size={16} aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Implementing Agency</dt>
                  <dd className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">{project.implementingAgency || 'Pending Assignment'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <TbUser className="text-slate-500 mt-0.5 shrink-0" size={16} aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Contracted Vendor</dt>
                  <dd className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">{project.vendor}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <TbCalendar className="text-slate-500 mt-0.5 shrink-0" size={16} aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Estimated Timeline</dt>
                  <dd className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString("en-GB") : 'TBD'} — {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString("en-GB") : 'TBD'}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Status Tracker */}
          <section aria-labelledby="status-tracker-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <h2 id="status-tracker-heading" className="text-base sm:text-lg font-bold text-[#123b63] mb-5 pb-2 border-b border-slate-200">Statutory Progression Tracker</h2>
            {project.reviewStatus === 'Rejected' ? (
              <div className="p-3.5 bg-red-50 text-red-900 border border-red-200 rounded flex items-start gap-2.5" role="alert">
                <TbAlertTriangle size={20} className="shrink-0 text-red-700 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Proposal Rejected</p>
                  <p className="text-xs mt-0.5">Formal grounds for rejection are documented in the audit log below.</p>
                </div>
              </div>
            ) : (
              <div className="relative flex justify-between pt-2 pb-1" role="region" aria-label="Project stage progression">
                <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200 -z-10"></div>
                <div className="absolute top-5 left-6 h-0.5 bg-[#123b63] -z-10 transition-all duration-300"
                  style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}></div>
                {stages.map((stage, index) => {
                  const isCompleted = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  return (
                    <div key={stage} className="flex flex-col items-center gap-1.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-semibold ${
                        isCompleted ? 'bg-[#123b63] border-[#123b63] text-white' : 'bg-white border-slate-300 text-slate-400'
                      }`} aria-hidden="true">
                        {isCompleted ? <TbCheck size={14} strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>}
                      </div>
                      <p className={`text-[11px] text-center w-16 sm:w-20 ${
                        isCurrent ? 'text-[#123b63] font-bold' : isCompleted ? 'text-slate-800 font-medium' : 'text-slate-400'
                      }`}>{stage}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Action History / Audit Log */}
          <section aria-labelledby="audit-log-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
              <TbHistory size={18} className="text-[#123b63]" aria-hidden="true" />
              <h2 id="audit-log-heading" className="text-base sm:text-lg font-bold text-[#123b63]">Official Action History & Audit Log</h2>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200" aria-hidden="true"></div>
              <ol role="list" className="space-y-0">
                {[...project.actionHistory].reverse().map((action, idx) => {
                  const isDA = action.actor.includes('DA');
                  const isAI = action.actor.includes('AI');
                  let dotColor = 'bg-[#123b63]';
                  let bgColor = '';
                  if (action.action.includes('Sanction') || action.action.includes('Approved')) { dotColor = 'bg-emerald-600'; }
                  else if (action.action.includes('Reject')) { dotColor = 'bg-red-600'; bgColor = 'bg-red-50/20'; }
                  else if (action.action.includes('Suspend')) { dotColor = 'bg-red-700'; bgColor = 'bg-red-50/20'; }
                  else if (action.action.includes('Escalat')) { dotColor = 'bg-amber-600'; bgColor = 'bg-amber-50/20'; }
                  else if (action.action.includes('Risk')) { dotColor = 'bg-orange-600'; bgColor = 'bg-orange-50/20'; }
                  else if (action.action.includes('Request')) { dotColor = 'bg-blue-600'; bgColor = 'bg-blue-50/20'; }
                  else if (action.action.includes('Submitted')) { dotColor = 'bg-slate-400'; }

                  return (
                    <li key={idx} className={`relative pl-10 py-3 ${bgColor} rounded`}>
                      <div className={`absolute left-3 top-4 w-2.5 h-2.5 rounded-full border border-white ${dotColor} z-10`} aria-hidden="true"></div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-xs sm:text-sm text-[#123b63]">{action.action}</span>
                        <time dateTime={action.timestamp} className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                          {new Date(action.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 mb-0.5">
                        Officer / System: {action.actor}
                        {isDA && <span className="ml-1.5 px-1 py-0.2 bg-slate-200 text-slate-800 rounded text-[10px] font-semibold">DA</span>}
                        {isAI && <span className="ml-1.5 px-1 py-0.2 bg-blue-100 text-[#123b63] rounded text-[10px] font-semibold">AI System</span>}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">{action.reason}</p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* DA Action Panel */}
          <section aria-labelledby="da-actions-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <h2 id="da-actions-heading" className="text-base sm:text-lg font-bold tracking-tight text-[#123b63] mb-4 pb-2 border-b border-slate-200">Administrative Actions</h2>
            <div className="space-y-2.5">
              {isActionable && (
                <>
                  <button 
                    type="button"
                    onClick={() => setShowSanction(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-colors text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    <TbCheck size={18} aria-hidden="true" /> <span>Sanction & Assign IA</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowReject(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                  >
                    <TbX size={18} aria-hidden="true" /> <span>Reject Proposal</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowRequestDocs(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#123b63] border border-slate-300 rounded hover:bg-slate-50 transition-colors text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                  >
                    <TbFileAlert size={18} aria-hidden="true" /> <span>Requisition Documents</span>
                  </button>
                </>
              )}
              {canSuspend && (
                <button 
                  type="button"
                  onClick={() => setShowSuspend(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
                >
                  <TbHandStop size={18} aria-hidden="true" /> <span>Suspend Project Execution</span>
                </button>
              )}
              {canEscalate && (
                <button 
                  type="button"
                  onClick={() => setShowEscalate(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-amber-900 border border-amber-300 rounded hover:bg-amber-50 transition-colors text-xs sm:text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                >
                  <TbArrowUpRight size={18} aria-hidden="true" /> <span>Escalate to SNA / Ministry</span>
                </button>
              )}
              {!isActionable && !canSuspend && !canEscalate && (
                <p className="text-xs text-slate-500 text-center py-3">No pending actions available for this record state.</p>
              )}
            </div>
            {/* Current Review Status */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Review Status</p>
              <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-semibold border ${
                project.reviewStatus === 'Pending Review' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                project.reviewStatus === 'Sanctioned' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
                project.reviewStatus === 'Rejected' ? 'bg-red-50 text-red-900 border-red-300' :
                project.reviewStatus === 'Suspended' ? 'bg-slate-100 text-slate-900 border-slate-300' :
                project.reviewStatus === 'Escalated' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                project.reviewStatus === 'Awaiting Verification' ? 'bg-blue-50 text-blue-900 border-blue-300' :
                'bg-slate-50 text-slate-700 border-slate-300'
              }`}>{project.reviewStatus}</span>
            </div>
          </section>

          {/* Financial Overview */}
          <section aria-labelledby="financials-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <h2 id="financials-heading" className="text-base sm:text-lg font-bold tracking-tight text-[#123b63] mb-4 pb-2 border-b border-slate-200">Financial Summary</h2>
            <dl className="space-y-3.5">
              <div>
                <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Estimated Proposal Cost</dt>
                <dd className="text-xl font-bold tracking-tight text-[#123b63] tabular-nums">₹{(project.estimatedCost / 100000).toFixed(2)} Lakhs</dd>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">Sanctioned Amount</dt>
                <dd className="text-base font-bold tracking-tight text-blue-800 tabular-nums">₹{(project.sanctionedAmount / 100000).toFixed(2)} Lakhs</dd>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-end mb-1">
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Funds Disbursed / Utilized</dt>
                  <dd className="text-xs font-bold text-emerald-800">
                    {project.sanctionedAmount > 0 ? Math.round((project.amountSpent / project.sanctionedAmount) * 100) : 0}%
                  </dd>
                </div>
                <div className="w-full bg-slate-100 rounded-sm h-2 mb-1 border border-slate-200" role="progressbar" aria-valuenow={project.sanctionedAmount > 0 ? Math.round((project.amountSpent / project.sanctionedAmount) * 100) : 0} aria-valuemin={0} aria-valuemax={100}>
                  <div className="bg-emerald-600 h-1.5 rounded-xs transition-all"
                    style={{ width: `${project.sanctionedAmount > 0 ? (project.amountSpent / project.sanctionedAmount) * 100 : 0}%` }}></div>
                </div>
                <dd className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">₹{(project.amountSpent / 100000).toFixed(2)} Lakhs</dd>
              </div>
            </dl>
          </section>

          {/* AI Risk Breakdown */}
          {project.riskFactors && project.riskFactors.length > 0 && (
            <section aria-labelledby="risk-breakdown-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <h2 id="risk-breakdown-heading" className="text-base sm:text-lg font-bold text-[#123b63]">Risk Factor Breakdown</h2>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">AI Verified</span>
              </div>
              <ul role="list" className="space-y-2">
                {project.riskFactors.map((factor, i) => {
                  const isHigh = factor.score >= 60;
                  const isExpanded = expandedRisk === i;
                  return (
                    <li key={i} className={`border rounded overflow-hidden ${isHigh ? 'border-red-200 bg-red-50/20' : 'border-slate-200 bg-white'}`}>
                      <button 
                        type="button"
                        onClick={() => setExpandedRisk(isExpanded ? null : i)}
                        aria-expanded={isExpanded}
                        aria-controls={`da-risk-details-${i}`}
                        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-red-600' : 'bg-emerald-600'}`} aria-hidden="true"></span>
                          <span className="font-semibold text-xs text-slate-800">{factor.detector}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold tabular-nums ${isHigh ? 'text-red-700' : 'text-emerald-800'}`}>{factor.score}/100</span>
                          {isExpanded ? <TbChevronUp size={14} className="text-slate-500" aria-hidden="true" /> : <TbChevronDown size={14} className="text-slate-500" aria-hidden="true" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div id={`da-risk-details-${i}`} className="p-2.5 pt-0 text-xs text-slate-600 bg-white border-t border-slate-100">
                          {factor.explanation}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Documents */}
          <section aria-labelledby="documents-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <h2 id="documents-heading" className="text-base sm:text-lg font-bold text-[#123b63] mb-4 pb-2 border-b border-slate-200">Supporting Documents</h2>
            {project.documents.length === 0 ? (
              <p className="text-xs text-slate-500">No documents uploaded for this record.</p>
            ) : (
              <ul role="list" className="space-y-2">
                {project.documents.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between p-2.5 rounded border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="p-1.5 bg-blue-50 text-[#123b63] border border-blue-200 rounded">
                        <TbFileDescription size={16} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-500">{doc.size} • Uploaded by {doc.uploader}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="p-1 text-slate-500 hover:text-[#123b63] hover:bg-slate-200 transition-colors shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]" 
                      title="Download"
                      aria-label={`Download document ${doc.name}`}
                    >
                      <TbDownload size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </article>
  );
};

export default DaReviewDetail;
