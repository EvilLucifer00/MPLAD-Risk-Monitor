import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import OfflineLink from '../../components/shared/OfflineLink';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDaMpProjects, useDaDistrictMps } from '../../api/queries';
import { RiskBadge, StatusBadge } from '../mp/MpProjects';
import usePageSeo from '../../hooks/usePageSeo';
import { TbArrowLeft, TbSearch, TbFilter, TbChevronRight, TbBriefcase } from 'react-icons/tb';

const DaMPDetail = () => {
  const { mpId } = useParams();
  const { data: projectsData, isLoading } = useDaMpProjects(mpId);
  const { data: districtMps } = useDaDistrictMps();

  const matchedMp = useMemo(() => {
    if (!districtMps || !Array.isArray(districtMps)) return null;
    return districtMps.find(m => String(m.id) === String(mpId) || String(m.rawMpId) === String(mpId));
  }, [districtMps, mpId]);

  const projects = useMemo(() => {
    if (Array.isArray(projectsData)) return projectsData;
    if (projectsData?.projects && Array.isArray(projectsData.projects)) return projectsData.projects;
    return [];
  }, [projectsData]);

  const loading = isLoading && !projectsData;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const mpDisplayName = matchedMp?.name || projectsData?.mpDetails?.mp_name || 'Member of Parliament';
  const mpDisplayConstituency = matchedMp?.constituency || projectsData?.mpDetails?.constituency || '';

  usePageSeo(
    `${mpDisplayName} | DA Portal`,
    `Projects and sanction review oversight for ${mpDisplayName}, ${mpDisplayConstituency}.`
  );

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const searchLower = (searchTerm || '').toLowerCase();
      const matchesSearch = 
        (p.title || '').toLowerCase().includes(searchLower) || 
        (p.vendor || '').toLowerCase().includes(searchLower) ||
        (p.implementingAgency || '').toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesRisk = riskFilter === 'All' || p.riskLevel === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [projects, searchTerm, statusFilter, riskFilter]);

  const tableContainerRef = useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredProjects.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0;

  const statuses = ['All', 'Pending Sanction', 'Sanctioned', 'In Progress', 'Completed', 'Rejected'];
  const riskLevels = ['All', 'Low', 'Moderate', 'High', 'Critical'];

  // Computed stats
  const totalSanctioned = projectsData?.stats?.sanctioned_amount_cr != null 
    ? projectsData.stats.sanctioned_amount_cr * 10000000 
    : projects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0);
  const totalUtilized = projectsData?.stats?.utilized_amount_cr != null 
    ? projectsData.stats.utilized_amount_cr * 10000000 
    : projects.reduce((acc, p) => acc + (p.amountSpent || 0), 0);
  const activeCount = projectsData?.stats?.active_projects ?? 
    projects.filter(p => ['Sanctioned', 'In Progress', 'APPROVED', 'IN_PROGRESS'].includes(p.status)).length;

  if (loading) {
    return <PortalPageLoader message="Loading MP Details..." />;
  }

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
      <header className="flex items-start gap-4 pb-2 border-b border-slate-200">
        <Link 
          to="/da/projects" 
          aria-label="Back to district projects directory"
          className="p-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded transition-colors mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
        >
          <TbArrowLeft size={18} aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">{mpDisplayName}</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-normal">{mpDisplayConstituency ? `${mpDisplayConstituency} Constituency • ` : ''}{projects.length} Works Recorded</p>
            </div>
            <OfflineLink 
              to={`/da/review?mp=${mpId}`}
              className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-3.5 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
            >
              <span>Review Queue</span> <TbChevronRight size={14} aria-hidden="true" />
            </OfflineLink>
          </div>

          {/* Quick Stats Section */}
          <section aria-labelledby="mp-quick-stats-heading" className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <h2 id="mp-quick-stats-heading" className="sr-only">Key MP Statistics</h2>
            <div className="bg-white border border-slate-300 border-t-2 border-t-[#123b63] rounded p-3">
              <div className="text-xl font-bold tracking-tight text-[#123b63] tabular-nums">{activeCount}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Active Works</div>
            </div>
            <div className="bg-white border border-slate-300 border-t-2 border-t-blue-700 rounded p-3">
              <div className="text-xl font-bold tracking-tight text-blue-900 tabular-nums">₹{(totalSanctioned / 10000000).toFixed(2)} Cr</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Sanctioned Outlay</div>
            </div>
            <div className="bg-white border border-slate-300 border-t-2 border-t-emerald-700 rounded p-3">
              <div className="text-xl font-bold tracking-tight text-emerald-800 tabular-nums">₹{(totalUtilized / 10000000).toFixed(2)} Cr</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Utilized Outlay</div>
            </div>
            <div className="bg-white border border-slate-300 border-t-2 border-t-amber-600 rounded p-3">
              <div className="text-xl font-bold tracking-tight text-amber-900 tabular-nums">
                {projects.length > 0 ? Math.round(projects.reduce((a, p) => a + p.riskScore, 0) / projects.length) : 0}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Average Risk Rating</div>
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
          className="bg-white p-3 rounded border border-slate-200 flex flex-col md:flex-row gap-3 items-center"
        >
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
            <input 
              id="mp-project-search"
              type="search" 
              placeholder="Search by title, vendor, agency..."
              aria-label="Search projects by title, vendor, or agency"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <TbFilter className="text-slate-400 shrink-0" size={16} aria-hidden="true" />
              <select 
                id="mp-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter projects by status"
                className="w-full md:w-auto bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
              >
                {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
              </select>
            </div>
            <select 
              id="mp-risk-filter"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter projects by risk level"
              className="w-full md:w-auto bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
            >
              {riskLevels.map(r => <option key={r} value={r}>{r === 'All' ? 'All Risk Levels' : r}</option>)}
            </select>
          </div>
        </form>
      </section>

      {/* Projects Table Section */}
      <section 
        aria-labelledby="projects-portfolio-heading" 
        className="bg-white rounded border border-slate-200 overflow-hidden flex-1"
      >
        <h2 id="projects-portfolio-heading" className="sr-only">Projects Portfolio</h2>
        <div ref={tableContainerRef} className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] min-h-[300px]">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbBriefcase size={40} className="text-slate-300 mb-3" aria-hidden="true" />
              <p className="font-semibold text-sm text-slate-700">No project works found</p>
              <p className="text-xs text-slate-400 mt-1">
                {projects.length > 0 ? 'No projects match your current filter parameters.' : 'No proposals submitted for this parliamentarian portfolio.'}
              </p>
              {(statusFilter !== 'All' || riskFilter !== 'All' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setRiskFilter('All');
                  }}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#123b63] bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <caption className="sr-only">Projects Portfolio for Member of Parliament</caption>
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider font-semibold">
                  <th scope="col" className="px-4 sm:px-5 py-3">Project Details</th>
                  <th scope="col" className="px-4 sm:px-5 py-3 hidden sm:table-cell">IA & Vendor</th>
                  <th scope="col" className="px-4 sm:px-5 py-3 hidden md:table-cell">Estimated Outlay</th>
                  <th scope="col" className="px-4 sm:px-5 py-3">Work Status</th>
                  <th scope="col" className="px-4 sm:px-5 py-3">Risk Rating</th>
                  <th scope="col" className="px-4 sm:px-5 py-3">Review State</th>
                  <th scope="col" className="px-4 sm:px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paddingTop > 0 && (
                  <tr>
                    <td colSpan={7} style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}
                {virtualRows.map(virtualRow => {
                  const project = filteredProjects[virtualRow.index];
                  if (!project) return null;
                  return (
                    <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-5 py-3">
                        <p className="font-semibold text-[#123b63] text-xs sm:text-sm tracking-tight line-clamp-1">{project.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{project.id} • {project.category}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3 hidden sm:table-cell">
                        <p className="text-xs sm:text-sm font-medium text-slate-700">{project.implementingAgency}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{project.vendor}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3 hidden md:table-cell">
                        <p className="text-xs sm:text-sm font-bold text-[#123b63] tabular-nums">₹{(project.estimatedCost / 100000).toFixed(2)} Lakhs</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <RiskBadge level={project.riskLevel} score={project.riskScore} />
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                          project.reviewStatus === 'Pending Review' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                          project.reviewStatus === 'Sanctioned' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
                          project.reviewStatus === 'Rejected' ? 'bg-red-50 text-red-900 border-red-300' :
                          project.reviewStatus === 'Suspended' ? 'bg-slate-100 text-slate-900 border-slate-300' :
                          project.reviewStatus === 'Escalated' ? 'bg-amber-50 text-amber-900 border-amber-300' :
                          project.reviewStatus === 'Awaiting Verification' ? 'bg-blue-50 text-blue-900 border-blue-300' :
                          'bg-slate-50 text-slate-700 border-slate-300'
                        }`}>
                          {project.reviewStatus}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-right">
                        <OfflineLink 
                          to={`/da/review/${project.id}`}
                          aria-label={`Review project ${project.title}`}
                          className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-[#123b63] hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                        >
                          <TbChevronRight size={16} aria-hidden="true" />
                        </OfflineLink>
                      </td>
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td colSpan={7} style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default DaMPDetail;
