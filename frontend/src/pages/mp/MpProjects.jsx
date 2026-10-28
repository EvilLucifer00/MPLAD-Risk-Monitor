import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../api/mockMpApi';
import { mockProjects } from '../../data/mockMpData';
import { useMpStore } from '../../store/useMpStore';
import { usePageSeo } from '../../hooks/usePageSeo';
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

const getInitialProjects = () => {
  try {
    const cached = sessionStorage.getItem('mplads_mp_projects_cache');
    if (cached) return JSON.parse(cached);
  } catch {
    // Session storage fallback
  }
  return mockProjects;
};

const MpProjects = () => {
  const location = useLocation();
  const [projects, setProjects] = useState(getInitialProjects);
  
  // Filters initialized without cascading effect renders
  const [searchTerm, setSearchTerm] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('search') || '';
    } catch {
      return '';
    }
  });
  const { projectsStatusFilter: statusFilter, setProjectsStatusFilter: setStatusFilter } = useMpStore();
  const { projectsRiskFilter: riskFilter, setProjectsRiskFilter: setRiskFilter } = useMpStore();

  usePageSeo(
    'My Projects | MP Portal',
    'Browse, filter, and track recommended MPLADS development works, implementing agencies, budgets, and risk scores.'
  );

  useEffect(() => {
    let isMounted = true;
    api.getProjects().then(data => {
      if (isMounted && data?.length) {
        setProjects(data);
        try {
          sessionStorage.setItem('mplads_mp_projects_cache', JSON.stringify(data));
        } catch {}
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase();
    return projects.filter(p => {
      const matchesSearch = 
        (p.title || '').toLowerCase().includes(searchLower) || 
        (p.vendor || '').toLowerCase().includes(searchLower) ||
        (p.implementingAgency || '').toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesRisk = riskFilter === 'All' || p.riskLevel === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [projects, searchTerm, statusFilter, riskFilter]);

  const statuses = ['All', 'Pending Sanction', 'Sanctioned', 'In Progress', 'Completed', 'Rejected'];
  const riskLevels = ['All', 'Low', 'Moderate', 'High', 'Critical'];

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">My Projects</h1>
          <p className="text-sm text-slate-500 mt-1 leading-normal">Manage and track all recommended works.</p>
        </div>
        <Link 
          to="/mp/submit" 
          className="bg-[#123b63] hover:bg-[#0c2a47] active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-[transform,background-color] duration-150 ease-out shadow-xs"
        >
          Submit Proposal
        </Link>
      </header>

      {/* Filters Bar Section */}
      <section aria-labelledby="projects-filters-heading">
        <h2 id="projects-filters-heading" className="sr-only">Project Search and Filter Options</h2>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input 
              type="search" 
              placeholder="Search by title, vendor, agency..."
              aria-label="Search projects by title, vendor, or agency"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <TbFilter className="text-slate-400 shrink-0" size={18} aria-hidden="true" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter projects by status"
                className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-[border-color,box-shadow] duration-150"
              >
                {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
              </select>
            </div>
            
            <select 
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter projects by risk level"
              className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-[border-color,box-shadow] duration-150"
            >
              {riskLevels.map(r => <option key={r} value={r}>{r === 'All' ? 'All Risk Levels' : r}</option>)}
            </select>
          </div>
        </form>
      </section>

      {/* Projects Table Section */}
      <section aria-labelledby="projects-portfolio-heading" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <h2 id="projects-portfolio-heading" className="sr-only">Recommended Projects Portfolio</h2>
        <div className="overflow-x-auto h-full">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbBriefcase size={48} className="text-slate-300 mb-4" />
              <p className="font-semibold text-slate-700">No projects found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Projects Portfolio List</caption>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th scope="col" className="px-5 py-3.5">Project Details</th>
                  <th scope="col" className="px-5 py-3.5 hidden sm:table-cell">IA & Vendor</th>
                  <th scope="col" className="px-5 py-3.5 hidden md:table-cell">Amount</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Risk Level</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#123b63] text-sm tracking-tight line-clamp-1">{project.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{project.id} • {project.category}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-sm font-medium text-slate-700">{project.implementingAgency}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{project.vendor}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-sm font-bold text-[#123b63]">₹{(project.estimatedCost / 100000).toFixed(2)} L</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-5 py-4">
                      {project.status === 'Pending Sanction' || project.status === 'Rejected' ? (
                        <span className="text-xs text-slate-400 font-medium">N/A</span>
                      ) : (
                        <RiskBadge level={project.riskLevel} score={project.riskScore} />
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link 
                        to={`/mp/projects/${project.id}`}
                        aria-label={`View details for ${project.title}`}
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-[#123b63] hover:bg-slate-100 rounded-lg active:scale-90 transition-[transform,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                      >
                        <TbChevronRight size={20} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default MpProjects;
