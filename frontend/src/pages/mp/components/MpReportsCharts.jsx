import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { TbChartBar } from 'react-icons/tb';

/**
 * MpReportsCharts Component
 * Isolated Recharts charts for the MP Reports page.
 * Loaded asynchronously to allow the reports header and options to paint with 0ms delay.
 */
const MpReportsCharts = ({ monthlyData, categoryData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
      {/* Monthly Utilization Chart */}
      <section 
        aria-labelledby="monthly-utilization-heading"
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg" aria-hidden="true">
            <TbChartBar size={20} />
          </div>
          <h2 id="monthly-utilization-heading" className="text-lg font-bold tracking-tight text-[#123b63]">
            Cumulative Fund Utilization (Lakhs)
          </h2>
        </div>
        <div 
          className="flex-1 min-h-[300px] h-[300px]"
          role="region"
          aria-label="Cumulative fund utilization trend line chart by month"
        >
          <ResponsiveContainer width="100%" height={300} debounce={50} initialDimension={{ width: 560, height: 300 }}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="sanctioned" name="Sanctioned" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="utilized" name="Utilized" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Category Breakdown Chart */}
      <section 
        aria-labelledby="category-breakdown-heading"
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg" aria-hidden="true">
            <TbChartBar size={20} />
          </div>
          <h2 id="category-breakdown-heading" className="text-lg font-bold tracking-tight text-[#123b63]">
            Projects by Category
          </h2>
        </div>
        <div 
          className="flex-1 min-h-[300px] h-[300px]"
          role="region"
          aria-label="Projects distribution by category and completion status bar chart"
        >
          <ResponsiveContainer width="100%" height={300} debounce={50} initialDimension={{ width: 560, height: 300 }}>
            <BarChart data={categoryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
              <RechartsTooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              <Bar dataKey="ongoing" name="Ongoing" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              <Bar dataKey="completed" name="Completed" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default MpReportsCharts;
