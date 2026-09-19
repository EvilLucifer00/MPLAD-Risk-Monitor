import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { daApi } from '../../api/mockDaApi';
import { mockMPs } from '../../data/mockDaData';
import { RiskBadge, StatusBadge } from '../mp/MpProjects';
import { TbArrowLeft, TbSearch, TbFilter, TbChevronRight, TbBriefcase, TbCurrencyRupee } from 'react-icons/tb';

const DaMPDetail = () => {
  const { mpId } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const mp = mockMPs.find(m => m.id === mpId);

  useEffect(() => {
    daApi.getMPProjects(mpId).then(data => {
      setProjects(data);
      setLoading(false);
    });
  }, [mpId]);

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

  // Computed stats
  const totalSanctioned = projects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0);
  const totalUtilized = projects.reduce((acc, p) => acc + (p.amountSpent || 0), 0);
  const activeCount = projects.filter(p => ['In Progress', 'Sanctioned'].includes(p.status)).length;

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/da/projects" className="p-2 hover:bg-slate-200 bg-slate-100 text-slate-600 rounded-full transition-colors mt-1">
          <TbArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#123b63]">{mp?.name || 'Unknown MP'}</h1>
              <p className="text-sm text-slate-500 mt-1">{mp?.constituency || ''} • {projects.length} Projects</p>
            </div>
            <Link 
              to={`/da/review?mp=${mpId}`}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 self-start"
            >
              Review Queue <TbChevronRight size={16} />
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-lg font-bold text-[#123b63]">{activeCount}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-lg font-bold text-teal-600">₹{(totalSanctioned / 10000000).toFixed(2)}Cr</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sanctioned</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-lg font-bold text-emerald-600">₹{(totalUtilized / 10000000).toFixed(2)}Cr</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Utilized</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="text-lg font-bold text-orange-600">
                {projects.length > 0 ? Math.round(projects.reduce((a, p) => a + p.riskScore, 0) / projects.length) : 0}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Avg Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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

      {/* Projects Table (read-only) */}
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
                  <th className="p-4 font-semibold">Review</th>
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
                      <RiskBadge level={project.riskLevel} score={project.riskScore} />
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        project.reviewStatus === 'Pending Review' ? 'bg-orange-100 text-orange-700' :
                        project.reviewStatus === 'Sanctioned' ? 'bg-emerald-100 text-emerald-700' :
                        project.reviewStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                        project.reviewStatus === 'Suspended' ? 'bg-slate-200 text-slate-700' :
                        project.reviewStatus === 'Escalated' ? 'bg-amber-100 text-amber-700' :
                        project.reviewStatus === 'Awaiting Verification' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {project.reviewStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        to={`/da/review/${project.id}`}
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

export default DaMPDetail;
