import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { daApi } from '../../api/mockDaApi';
import { mockMPs, mockDaProjects } from '../../data/mockDaData';
import { RiskBadge, StatusBadge } from '../mp/MpProjects';
import usePageSeo from '../../hooks/usePageSeo';
import { TbArrowLeft, TbSearch, TbFilter, TbChevronRight, TbBriefcase } from 'react-icons/tb';
import { projectsApi } from '../../api/mpladsApi';

const DaMPDetail = () => {
  const { mpId } = useParams();
  const fallbackMp = mockMPs.find(m => m.id === mpId || String(m.id) === String(mpId));
  const [projects, setProjects] = useState(() => {
    return mockDaProjects.filter(p => p.mpId === mpId || String(p.mpId) === String(mpId));
  });
  const [mpInfo, setMpInfo] = useState(null);
  const [loading, setLoading] = useState(() => !mockDaProjects.some(p => p.mpId === mpId || String(p.mpId) === String(mpId)));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const mpDisplayName = mpInfo?.mp_name || fallbackMp?.name || 'Member of Parliament';
  const mpDisplayConstituency = mpInfo?.constituency || fallbackMp?.constituency || '';

  usePageSeo(
    `${mpDisplayName} | DA Portal`,
    `Projects and sanction review oversight for ${mpDisplayName}, ${mpDisplayConstituency} in Lucknow District.`
  );

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await projectsApi.getDistrictMpProjects(mpId);
        if (isMounted && res && res.projects) {
          setProjects(res.projects);
          if (res.mpDetails) setMpInfo(res.mpDetails);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback gracefully
      }

      try {
        const data = await daApi.getMPProjects(mpId);
        if (isMounted && data) {
          setProjects(data);
        }
      } catch {
        // Handled gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
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

  return (
    <div className="space-y-6 flex flex-col min-h-full">
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
            <Link to="/da/projects" className="hover:text-[#123b63] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded px-1">
              District Projects
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">/</li>
          <li aria-current="page" className="text-[#123b63] font-bold">
            {mpDisplayName}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="flex items-start gap-4">
        <Link 
          to="/da/projects" 
          aria-label="Back to district projects directory"
          className="p-2 hover:bg-slate-200 bg-slate-100 text-slate-600 rounded-full active:scale-90 transition-[transform,background-color] duration-150 ease-out mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
        >
          <TbArrowLeft size={20} aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">{mpDisplayName}</h1>
              <p className="text-sm text-slate-500 mt-1 leading-normal">{mpDisplayConstituency ? `${mpDisplayConstituency} • ` : ''}{projects.length} Projects</p>
            </div>
            <Link 
              to={`/da/review?mp=${mpId}`}
              className="bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-[transform,background-color] duration-150 ease-out flex items-center gap-2 self-start shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
            >
              <span>Review Queue</span> <TbChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {/* Quick Stats Section */}
          <section aria-labelledby="mp-quick-stats-heading" className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <h2 id="mp-quick-stats-heading" className="sr-only">Key MP Statistics</h2>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
              <div className="text-xl font-extrabold tracking-tight text-[#123b63]">{activeCount}</div>
              <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Active</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
              <div className="text-xl font-extrabold tracking-tight text-teal-600">₹{(totalSanctioned / 10000000).toFixed(2)}Cr</div>
              <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Sanctioned</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
              <div className="text-xl font-extrabold tracking-tight text-emerald-600">₹{(totalUtilized / 10000000).toFixed(2)}Cr</div>
              <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Utilized</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
              <div className="text-xl font-extrabold tracking-tight text-orange-600">
                {projects.length > 0 ? Math.round(projects.reduce((a, p) => a + p.riskScore, 0) / projects.length) : 0}
              </div>
              <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Avg Risk</div>
            </div>
          </section>
        </div>
      </header>

      {/* Filters Section */}
      <section aria-labelledby="project-filters-heading">
        <h2 id="project-filters-heading" className="sr-only">Project Filters</h2>
        <form 
          role="search" 
          onSubmit={(e) => e.preventDefault()}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center"
        >
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input 
              id="mp-project-search"
              type="search" 
              placeholder="Search by title, vendor, agency..."
              aria-label="Search projects by title, vendor, or agency"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <TbFilter className="text-slate-400 shrink-0" size={18} aria-hidden="true" />
              <select 
                id="mp-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter projects by status"
                className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150"
              >
                {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
              </select>
            </div>
            <select 
              id="mp-risk-filter"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter projects by risk level"
              className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150"
            >
              {riskLevels.map(r => <option key={r} value={r}>{r === 'All' ? 'All Risk Levels' : r}</option>)}
            </select>
          </div>
        </form>
      </section>

      {/* Projects Table Section */}
      <section 
        aria-labelledby="projects-portfolio-heading" 
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1"
      >
        <h2 id="projects-portfolio-heading" className="sr-only">Projects Portfolio</h2>
        <div className="overflow-x-auto h-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500" role="status" aria-live="polite">
              <div className="w-8 h-8 border-4 border-[#123b63] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">Loading MP projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbBriefcase size={48} className="text-slate-300 mb-4" aria-hidden="true" />
              <p className="font-semibold text-slate-700">No projects found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Projects Portfolio for Member of Parliament</caption>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th scope="col" className="px-5 py-3.5">Project Details</th>
                  <th scope="col" className="px-5 py-3.5 hidden sm:table-cell">IA & Vendor</th>
                  <th scope="col" className="px-5 py-3.5 hidden md:table-cell">Amount</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Risk Level</th>
                  <th scope="col" className="px-5 py-3.5">Review</th>
                  <th scope="col" className="px-5 py-3.5 text-right"><span className="sr-only">Actions</span></th>
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
                      <RiskBadge level={project.riskLevel} score={project.riskScore} />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
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
                    <td className="px-5 py-4 text-right">
                      <Link 
                        to={`/da/review/${project.id}`}
                        aria-label={`Review project ${project.title}`}
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

export default DaMPDetail;
