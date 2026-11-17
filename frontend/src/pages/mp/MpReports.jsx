import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useMemo, Suspense, lazy } from 'react';
import { useMpProjects } from '../../api/queries';
import { TbDownload, TbFilter } from 'react-icons/tb';
import { useMpReports } from '../../api/queries';
import usePageSeo from '../../hooks/usePageSeo';

// Lazy-loaded to eliminate Recharts from the critical route bundle of MP Reports
const MpReportsCharts = lazy(() => import('./components/MpReportsCharts'));

const ChartSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 animate-pulse" role="status" aria-label="Loading analytics charts">
    <div className="bg-white rounded border border-slate-200 p-6 h-[380px] flex flex-col justify-center items-center">
      <div className="w-8 h-8 border-3 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div className="bg-white rounded border border-slate-200 p-6 h-[380px] flex flex-col justify-center items-center">
      <div className="w-8 h-8 border-3 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);



const MpReports = () => {
  usePageSeo(
    'Reports & Analytics | MP Portal',
    'Detailed insights into MPLADS fund utilization, category-wise expenditure, and monthly trends for Member of Parliament.'
  );

  const { data: summaryData, isLoading: summaryLoading } = useMpReports();
  const { data: projectsData, isLoading: projectsLoading } = useMpProjects();
  const projects = Array.isArray(projectsData) ? projectsData : [];

  // Derive category breakdown directly from backend projects without hardcoded fallbacks
  const categoryData = useMemo(() => {
    if (summaryData?.byCategory && summaryData.byCategory.length > 0) {
      return summaryData.byCategory;
    }
    const catMap = {};
    projects.forEach(p => {
      const cat = p.category || 'General';
      if (!catMap[cat]) catMap[cat] = { name: cat, completed: 0, ongoing: 0 };
      if (['Completed', 'COMPLETED'].includes(p.status)) {
        catMap[cat].completed += 1;
      } else if (['In Progress', 'Sanctioned', 'IN_PROGRESS', 'APPROVED'].includes(p.status)) {
        catMap[cat].ongoing += 1;
      }
    });
    return Object.values(catMap);
  }, [summaryData, projects]);

  // Derive monthly utilization directly from backend or clean zero timeline
  const monthlyData = useMemo(() => {
    if (summaryData?.cumulativeUtilization && summaryData.cumulativeUtilization.length > 0) {
      return summaryData.cumulativeUtilization;
    }
    const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return monthNames.map(name => ({ name, utilized: 0, sanctioned: 0 }));
  }, [summaryData]);

  const loading = (summaryLoading && !summaryData) && (projectsLoading && !projectsData);

  if (loading) {
    return <PortalPageLoader message="Loading Reports & Analytics..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-full flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Detailed statistical insights into constituency fund utilization and project progress.</p>
        </div>
        <div className="flex gap-2.5">
          <button 
            type="button"
            aria-label="Filter reports by financial year"
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            <TbFilter size={16} aria-hidden="true" />
            <span>Filter By Year</span>
          </button>
          <button 
            type="button"
            aria-label="Export reports summary as PDF document"
            className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-3.5 py-2 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            <TbDownload size={16} aria-hidden="true" />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      <Suspense fallback={<ChartSkeleton />}>
        <MpReportsCharts monthlyData={monthlyData} categoryData={categoryData} />
      </Suspense>
    </div>
  );
};

export default MpReports;
