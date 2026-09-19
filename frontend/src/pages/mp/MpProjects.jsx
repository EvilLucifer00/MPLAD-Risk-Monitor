import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../api/mockMpApi';
import { useMpStore } from '../../store/useMpStore';
import { TbSearch, TbFilter, TbChevronRight, TbBriefcase } from 'react-icons/tb';

// Reusable Risk Badge Component
export const RiskBadge = ({ level, score, showScore = true }) => {
  const colors = {
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Moderate: 'bg-amber-100 text-amber-800 border-amber-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Critical: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${colors[level] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
      {level}
      {showScore && <span className="opacity-75 font-normal ml-0.5">({score})</span>}
    </span>
  );
};

// Reusable Status Badge Component
export const StatusBadge = ({ status }) => {
  const colors = {
    'Pending Sanction': 'bg-slate-100 text-slate-700',
    'Sanctioned': 'bg-blue-100 text-blue-700',
    'In Progress': 'bg-indigo-100 text-indigo-700',
    'Completed': 'bg-emerald-100 text-emerald-700',
    'Rejected': 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
};

const MpProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const { projectsStatusFilter: statusFilter, setProjectsStatusFilter: setStatusFilter } = useMpStore();
  const { projectsRiskFilter: riskFilter, setProjectsRiskFilter: setRiskFilter } = useMpStore();

  useEffect(() => {
    const qSearch = new URLSearchParams(location.search).get('search');
    if (qSearch !== null) {
      setSearchTerm(qSearch);
    }
  }, [location.search]);

  useEffect(() => {
    api.getProjects().then(data => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  const filteredProjects = projects.filter(p => {
    const searchLower = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (p.title || '').toLowerCase().includes(searchLower) || 
      (p.vendor || '').toLowerCase().includes(searchLower) ||
      (p.implementingAgency || '').toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesRisk = riskFilter === 'All' || p.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const statuses = ['All', 'Pending Sanction', 'Sanctioned', 'In Progress', 'Completed', 'Rejected'];
  const riskLevels = ['All', 'Low', 'Moderate', 'High', 'Critical'];

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
          <h1 className="text-2xl font-bold text-[#123b63]">My Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all recommended works.</p>
        </div>
        <Link 
          to="/mp/submit" 
          className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          Submit Proposal
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by title, vendor, agency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <TbFilter className="text-slate-400 shrink-0" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
          </div>
          
          <select 
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            {riskLevels.map(r => <option key={r} value={r}>{r === 'All' ? 'All Risk Levels' : r}</option>)}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="overflow-x-auto h-full">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbBriefcase size={48} className="text-slate-300 mb-4" />
              <p className="font-semibold">No projects found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Project Details</th>
                  <th className="p-4 font-semibold hidden sm:table-cell">IA & Vendor</th>
                  <th className="p-4 font-semibold hidden md:table-cell">Amount</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Risk Level</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-[#123b63] text-sm line-clamp-1">{project.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{project.id} • {project.category}</p>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-700">{project.implementingAgency}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{project.vendor}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm font-medium text-slate-700">₹{(project.estimatedCost / 100000).toFixed(2)} L</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="p-4">
                      {project.status === 'Pending Sanction' || project.status === 'Rejected' ? (
                        <span className="text-xs text-slate-400">N/A</span>
                      ) : (
                        <RiskBadge level={project.riskLevel} score={project.riskScore} />
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        to={`/mp/projects/${project.id}`}
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-[#123b63] hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <TbChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MpProjects;
