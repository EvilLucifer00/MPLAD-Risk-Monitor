import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/mockMpApi';
import { StatusBadge, RiskBadge } from './MpProjects';
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
  TbTrash
} from 'react-icons/tb';

const MpProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRisk, setExpandedRisk] = useState(null);

  useEffect(() => {
    api.getProjectById(id)
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => {
        navigate('/mp/projects'); // Fallback if not found
      });
  }, [id, navigate]);

  if (loading || !project) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stages = ["Recommended", "Pending Sanction", "Sanctioned", "In Progress", "Completed"];
  let currentStageIndex = stages.indexOf(project.status);
  if (project.status === 'Rejected') currentStageIndex = -1;
  // If "Recommended" isn't explicitly in status but it's pending, we assume recommended is done
  if (project.status === 'Pending Sanction') currentStageIndex = 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/mp/projects" className="p-2 hover:bg-slate-200 bg-slate-100 text-slate-600 rounded-full transition-colors">
          <TbArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#123b63]">{project.title}</h1>
            <StatusBadge status={project.status} />
            {project.status !== 'Pending Sanction' && project.status !== 'Rejected' && (
              <RiskBadge level={project.riskLevel} score={project.riskScore} />
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{project.id} • {project.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Details Card */}
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
                  <p className="text-sm text-slate-800 font-medium">{project.implementingAgency}</p>
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
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'} - {project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Tracker */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-[#123b63] mb-6">Status Tracker</h2>
            {project.status === 'Rejected' ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
                <TbAlertTriangle size={24} className="shrink-0" />
                <div>
                  <p className="font-bold">Project Rejected</p>
                  <p className="text-sm mt-1">This project was rejected by the authorities. Please check notifications for the exact reason.</p>
                </div>
              </div>
            ) : (
              <div className="relative flex justify-between">
                {/* Connecting Line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-10"></div>
                <div 
                  className="absolute top-4 left-4 h-0.5 bg-cyan-500 -z-10 transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}
                ></div>
                
                {stages.map((stage, index) => {
                  const isCompleted = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  
                  return (
                    <div key={stage} className="flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        isCompleted 
                          ? 'bg-cyan-500 border-cyan-500 text-white' 
                          : 'bg-white border-slate-300 text-slate-300'
                      }`}>
                        {isCompleted ? <TbCheck size={16} strokeWidth={3} /> : <span className="w-2 h-2 rounded-full bg-slate-300"></span>}
                      </div>
                      <p className={`text-[10px] sm:text-xs font-semibold text-center w-16 sm:w-24 ${
                        isCurrent ? 'text-cyan-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {stage}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Financials & ML & Docs */}
        <div className="space-y-6">
          
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
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${project.sanctionedAmount > 0 ? (project.amountSpent / project.sanctionedAmount) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-sm font-bold text-slate-800">₹{(project.amountSpent / 100000).toFixed(2)} Lakhs</p>
              </div>
            </div>
          </div>

          {/* AI Risk Breakdown */}
          {project.status !== 'Pending Sanction' && project.status !== 'Rejected' && (
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
                      <button 
                        onClick={() => setExpandedRisk(isExpanded ? null : i)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-black/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                          <span className="font-semibold text-sm text-slate-800">{factor.detector}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${isHigh ? 'text-red-600' : 'text-emerald-600'}`}>
                            {factor.score}/100
                          </span>
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
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button className="p-1.5 text-slate-400 hover:text-[#123b63] transition-colors" title="Download">
                        <TbDownload size={18} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                        <TbTrash size={18} />
                      </button>
                    </div>
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

export default MpProjectDetail;
