import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell 
} from 'recharts';

/**
 * DaProjectsAnalytics Component
 * Isolated Recharts charts for the DA Projects Analytics view.
 * Dynamically loaded to prevent recharts from blocking initial FCP / LCP of the default Grid view.
 */
const DaProjectsAnalytics = ({ riskByMp, utilizationByMp, projectsByMp }) => {
  return (
    <section aria-labelledby="analytics-heading" className="space-y-6 flex-1">
      <h2 id="analytics-heading" className="sr-only">District MPs Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Score by MP */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-[#123b63] mb-1">Average Risk Score by MP</h3>
          <p className="text-[13px] text-slate-500 mb-6">Compare risk levels across MPs</p>
          <div className="h-[280px]" role="region" aria-label="Average risk score by MP bar chart">
            <ResponsiveContainer width="100%" height={280} debounce={50} initialDimension={{ width: 560, height: 280 }}>
              <BarChart data={riskByMp} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name, props) => [`${value}`, `Risk Score — ${props.payload.fullName}`]}
                />
                <Bar dataKey="avgRisk" name="Avg Risk" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false}>
                  {riskByMp.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fund Utilization by MP */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-[#123b63] mb-1">Fund Utilization % by MP</h3>
          <p className="text-[13px] text-slate-500 mb-6">Sanctioned funds utilization rate</p>
          <div className="h-[280px]" role="region" aria-label="Fund utilization percentage by MP bar chart">
            <ResponsiveContainer width="100%" height={280} debounce={50} initialDimension={{ width: 560, height: 280 }}>
              <BarChart data={utilizationByMp} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} unit="%" />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name, props) => [`${value}%`, `Utilization — ${props.payload.fullName}`]}
                />
                <Bar dataKey="utilization" name="Utilization %" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projects Count by MP */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-[#123b63] mb-1">Project Distribution by MP</h3>
          <p className="text-[13px] text-slate-500 mb-6">Active vs total projects and flagged project count</p>
          <div className="h-[280px]" role="region" aria-label="Project distribution active versus total by MP bar chart">
            <ResponsiveContainer width="100%" height={280} debounce={50} initialDimension={{ width: 560, height: 280 }}>
              <BarChart data={projectsByMp} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value, name, props) => [value, `${name} — ${props.payload.fullName}`]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                <Bar dataKey="total" name="Total Projects" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                <Bar dataKey="active" name="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                <Bar dataKey="highCritical" name="High/Critical Risk" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DaProjectsAnalytics;
