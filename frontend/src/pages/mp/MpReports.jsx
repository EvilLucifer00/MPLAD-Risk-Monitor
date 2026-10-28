import React, { useState, useEffect, Suspense, lazy } from 'react';
import { TbDownload, TbChartBar, TbFilter } from 'react-icons/tb';
import { reportsApi } from '../../api/mpladsApi';
import usePageSeo from '../../hooks/usePageSeo';

// Lazy-loaded to eliminate Recharts from the critical route bundle of MP Reports
const MpReportsCharts = lazy(() => import('./components/MpReportsCharts'));

const ChartSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 animate-pulse" role="status" aria-label="Loading analytics charts">
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-[380px] flex flex-col justify-center items-center">
      <div className="w-10 h-10 border-4 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-[380px] flex flex-col justify-center items-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

const defaultMonthlyData = [
  { name: 'Apr', utilized: 12, sanctioned: 15 },
  { name: 'May', utilized: 19, sanctioned: 25 },
  { name: 'Jun', utilized: 30, sanctioned: 35 },
  { name: 'Jul', utilized: 45, sanctioned: 50 },
  { name: 'Aug', utilized: 58, sanctioned: 65 },
  { name: 'Sep', utilized: 72, sanctioned: 80 },
  { name: 'Oct', utilized: 85, sanctioned: 95 },
  { name: 'Nov', utilized: 91, sanctioned: 110 },
  { name: 'Dec', utilized: 105, sanctioned: 120 },
  { name: 'Jan', utilized: 120, sanctioned: 140 },
  { name: 'Feb', utilized: 145, sanctioned: 160 },
  { name: 'Mar', utilized: 170, sanctioned: 180 },
];

const defaultCategoryData = [
  { name: 'Infrastructure', completed: 12, ongoing: 5 },
  { name: 'Education', completed: 8, ongoing: 14 },
  { name: 'Health', completed: 15, ongoing: 4 },
  { name: 'Water', completed: 6, ongoing: 8 },
  { name: 'Transport', completed: 4, ongoing: 2 },
];

const MpReports = () => {
  usePageSeo(
    'Reports & Analytics | MP Portal',
    'Detailed insights into MPLADS fund utilization, category-wise expenditure, and monthly trends for Member of Parliament.'
  );

  const [categoryData, setCategoryData] = useState(defaultCategoryData);
  const [monthlyData, setMonthlyData] = useState(defaultMonthlyData);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    // Decouple heavy Recharts mounting by one frame so initial layout settles cleanly without forced reflow
    const raf = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    reportsApi.getSummary()
      .then(res => {
        if (res.byCategory && res.byCategory.length > 0) {
          setCategoryData(res.byCategory);
        }
        if (res.cumulativeUtilization && res.cumulativeUtilization.length > 0) {
          setMonthlyData(res.cumulativeUtilization);
        }
      })
      .catch(() => {
        // Fallback to default data
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-full flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed insights into fund utilization and project progress.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            aria-label="Filter reports by financial year"
            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 px-4 py-2 rounded-xl text-sm font-semibold transition-[transform,background-color] duration-150 flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            <TbFilter size={18} aria-hidden="true" />
            <span>Filter By Year</span>
          </button>
          <button 
            type="button"
            aria-label="Export reports summary as PDF document"
            className="bg-[#123b63] hover:bg-[#0c2a47] active:scale-95 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-[transform,background-color] duration-150 flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            <TbDownload size={18} aria-hidden="true" />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      {chartsReady ? (
        <Suspense fallback={<ChartSkeleton />}>
          <MpReportsCharts monthlyData={monthlyData} categoryData={categoryData} />
        </Suspense>
      ) : (
        <ChartSkeleton />
      )}
    </div>
  );
};

export default MpReports;
