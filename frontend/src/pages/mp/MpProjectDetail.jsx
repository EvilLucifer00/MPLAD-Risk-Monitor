import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMpProjectDetail } from '../../api/queries';
import { StatusBadge, RiskBadge } from './MpProjects';
import { usePageSeo } from '../../hooks/usePageSeo';
import { 
  TbArrowLeft, 
  TbMapPin, 
  TbBuilding, 
  TbUser, 
  TbCalendar, 
  TbFileDescription, 
  TbDownload, 
  TbAlertTriangle,
  TbChevronDown,
  TbChevronUp,
  TbCheck,
  TbTrash,
  TbChevronRight
} from 'react-icons/tb';

const MpProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError } = useMpProjectDetail(id);
  const [expandedRisk, setExpandedRisk] = useState(null);

  usePageSeo(
    project ? `${project.title} | MP Projects` : 'Project Details | MP Portal',
    project 
      ? `${project.title} (${project.id}) - ${project.category} in ${project.district}. Status: ${project.status}, Estimated Cost: ₹${(project.estimatedCost / 100000).toFixed(2)} Lakhs.`
      : 'View project details, sanction stage, expenditure, and risk factor breakdown.'
  );

  useEffect(() => {
    if (isError) {
      navigate('/mp/projects');
    }
  }, [isError, navigate]);

  const loading = isLoading && !project;

  if (loading || !project) {
    return <PortalPageLoader message="Loading Project Details..." />;
  }

  const stages = ["Recommended", "Pending Sanction", "Sanctioned", "In Progress", "Completed"];
  let currentStageIndex = stages.indexOf(project.status);
  if (project.status === 'Rejected') currentStageIndex = -1;
  // If "Recommended" isn't explicitly in status but it's pending, we assume recommended is done
  if (project.status === 'Pending Sanction') currentStageIndex = 1;

  return (
    <article aria-labelledby="project-title-heading" className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/mp" className="hover:text-[#123b63] transition-colors">MP Portal</Link>
        <TbChevronRight size={12} className="text-slate-400" aria-hidden="true" />
        <Link to="/mp/projects" className="hover:text-[#123b63] transition-colors">Projects</Link>
        <TbChevronRight size={12} className="text-slate-400" aria-hidden="true" />
        <span className="font-semibold text-slate-700 truncate max-w-[200px]" aria-current="page">{project.title}</span>
      </nav>

      {/* Header */}
      <header className="flex items-center gap-4">
        <Link 
          to="/mp/projects" 
          aria-label="Back to projects list"
          className="p-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
        >
          <TbArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 id="project-title-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">{project.title}</h1>
            <StatusBadge status={project.status} />
            {project.status !== 'Pending Sanction' && project.status !== 'Rejected' && (
              <RiskBadge level={project.riskLevel} score={project.riskScore} />
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{project.id} • {project.category}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Details Card */}
          <section aria-labelledby="project-info-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <h2 id="project-info-heading" className="text-base sm:text-lg font-bold text-[#123b63] mb-3 pb-2 border-b border-slate-200">Project Information</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">{project.description}</p>
            
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="flex items-start gap-2.5">
                <TbMapPin className="text-slate-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Constituency / District</dt>
                  <dd className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">{project.district}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <TbBuilding className="text-slate-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Implementing Agency</dt>
                  <dd className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">{project.implementingAgency}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <TbUser className="text-slate-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Contracted Vendor</dt>
                  <dd className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">{project.vendor}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <TbCalendar className="text-slate-500 mt-0.5 shrink-0" size={16} />
                <div>
                  <dt className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Project Timeline</dt>
                  <dd className="text-xs sm:text-sm text-slate-800 font-medium mt-0.5">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString("en-GB") : 'TBD'} — {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString("en-GB") : 'TBD'}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Status Tracker */}
          <section aria-labelledby="status-tracker-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <h2 id="status-tracker-heading" className="text-base sm:text-lg font-bold text-[#123b63] mb-5 pb-2 border-b border-slate-200">Workflow & Sanction Progress</h2>
            {project.status === 'Rejected' ? (
              <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded flex items-start gap-3">
                <TbAlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Proposal Rejected</p>
                  <p className="text-xs mt-1">This proposal was returned or rejected by the District Authority. Please refer to notifications or district remarks for required rectifications.</p>
                </div>
              </div>
            ) : (
              <div className="relative flex justify-between pt-2 pb-1">
                {/* Connecting Line */}
                <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200 -z-10"></div>
                <div 
                  className="absolute top-5 left-6 h-0.5 bg-[#123b63] -z-10 transition-all duration-300"
                  style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}
                ></div>
                
                {stages.map((stage, index) => {
                  const isCompleted = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  
                  return (
                    <div key={stage} className="flex flex-col items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-semibold ${
                        isCompleted 
                          ? 'bg-[#123b63] border-[#123b63] text-white' 
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {isCompleted ? <TbCheck size={14} strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>}
                      </div>
                      <p className={`text-[11px] text-center w-16 sm:w-20 ${
                        isCurrent ? 'text-[#123b63] font-bold' : isCompleted ? 'text-slate-800 font-medium' : 'text-slate-400'
                      }`}>
                        {stage}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Financials & ML & Docs */}
        <div className="space-y-6">
          
          {/* Financial Overview */}
          <section aria-labelledby="financials-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
            <h2 id="financials-heading" className="text-base sm:text-lg font-bold tracking-tight text-[#123b63] mb-4 pb-2 border-b border-slate-200">Financial Summary</h2>
            <dl className="space-y-4">
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
                <div className="w-full bg-slate-100 rounded-sm h-2 mb-1.5 border border-slate-200">
                  <div 
                    className="bg-emerald-600 h-1.5 rounded-xs" 
                    style={{ width: `${project.sanctionedAmount > 0 ? (project.amountSpent / project.sanctionedAmount) * 100 : 0}%` }}
                  ></div>
                </div>
                <dd className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">₹{(project.amountSpent / 100000).toFixed(2)} Lakhs</dd>
              </div>
            </dl>
          </section>

          {/* AI Risk Breakdown */}
          {project.status !== 'Pending Sanction' && project.status !== 'Rejected' && (
            <section aria-labelledby="risk-breakdown-heading" className="bg-white p-5 sm:p-6 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <h2 id="risk-breakdown-heading" className="text-base sm:text-lg font-bold text-[#123b63]">Risk Factor Analysis</h2>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded">AI Verified</span>
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
                        aria-controls={`risk-factor-details-${i}`}
                        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-red-600' : 'bg-emerald-600'}`} aria-hidden="true"></span>
                          <span className="font-semibold text-xs text-slate-800">{factor.detector}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold tabular-nums ${isHigh ? 'text-red-700' : 'text-emerald-800'}`}>
                            {factor.score}/100
                          </span>
                          {isExpanded ? <TbChevronUp size={14} className="text-slate-500" aria-hidden="true" /> : <TbChevronDown size={14} className="text-slate-500" aria-hidden="true" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div id={`risk-factor-details-${i}`} className="p-2.5 pt-0 text-xs text-slate-600 bg-white border-t border-slate-100">
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
            <h2 id="documents-heading" className="text-base sm:text-lg font-bold text-[#123b63] mb-4 pb-2 border-b border-slate-200">Project Documents</h2>
            {project.documents.length === 0 ? (
              <p className="text-xs text-slate-500">No documents uploaded for this record.</p>
            ) : (
              <ul role="list" className="space-y-2.5">
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
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button 
                        type="button"
                        className="p-1 text-slate-500 hover:text-[#123b63] hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded" 
                        title="Download"
                        aria-label={`Download document ${doc.name}`}
                      >
                        <TbDownload size={16} aria-hidden="true" />
                      </button>
                      <button 
                        type="button"
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded" 
                        title="Delete"
                        aria-label={`Delete document ${doc.name}`}
                      >
                        <TbTrash size={16} aria-hidden="true" />
                      </button>
                    </div>
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

export default MpProjectDetail;
