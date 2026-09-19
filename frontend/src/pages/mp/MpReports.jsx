import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { TbDownload, TbChartBar, TbFilter } from 'react-icons/tb';
import { api } from '../../api/mockMpApi';

const mockMonthlyData = [
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

const mockCategoryData = [
  { name: 'Infrastructure', completed: 12, ongoing: 5 },
  { name: 'Education', completed: 8, ongoing: 14 },
  { name: 'Health', completed: 15, ongoing: 4 },
  { name: 'Water', completed: 6, ongoing: 8 },
  { name: 'Transport', completed: 4, ongoing: 2 },
];

const MpReports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#123b63]">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Detailed insights into fund utilization and project progress.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
            <TbFilter size={18} />
            <span>Filter By Year</span>
          </button>
          <button className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
            <TbDownload size={18} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Monthly Utilization Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <TbChartBar size={20} />
            </div>
            <h2 className="text-lg font-bold text-[#123b63]">Cumulative Fund Utilization (Lakhs)</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMonthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="sanctioned" name="Sanctioned" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="utilized" name="Utilized" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <TbChartBar size={20} />
            </div>
            <h2 className="text-lg font-bold text-[#123b63]">Projects by Category</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCategoryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Bar dataKey="ongoing" name="Ongoing" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="completed" name="Completed" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MpReports;
