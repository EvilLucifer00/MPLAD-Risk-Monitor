import React, { useState, useRef, useEffect } from 'react';
import { useDaStore } from '../../../store/useDaStore';
import { TbChevronDown } from 'react-icons/tb';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';

export const DaDashboardChart = ({ stats, projects = [], mps = [] }) => {
  const { dashboardChartView: chartView, setDashboardChartView: setChartView } = useDaStore();
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);
  const chartDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(e.target)) {
        setIsChartDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  let chartData = [];
  let centerLabel = '';
  let centerSubLabel = 'Total';
  let isCurrency = false;
  let chartTitle = '';
  let chartDesc = '';

  if (chartView === 'Risk') {
    chartTitle = 'Risk Distribution';
    chartDesc = 'District-wide project risk levels';
    const riskCounts = stats?.riskCounts || {
      Low: projects.filter(p => p.riskLevel === 'Low').length,
      Moderate: projects.filter(p => p.riskLevel === 'Moderate').length,
      High: projects.filter(p => p.riskLevel === 'High').length,
      Critical: projects.filter(p => p.riskLevel === 'Critical').length,
    };
    chartData = [
      { name: 'Low Risk', value: riskCounts.Low || 0, color: '#10b981' },
      { name: 'Moderate', value: riskCounts.Moderate || 0, color: '#f59e0b' },
      { name: 'High Risk', value: riskCounts.High || 0, color: '#f97316' },
      { name: 'Critical', value: riskCounts.Critical || 0, color: '#ef4444' },
    ];
    centerLabel = (stats?.totalProjects ?? projects.length).toString();
    centerSubLabel = 'Projects';
  } else if (chartView === 'Status') {
    chartTitle = 'Project Status';
    chartDesc = 'Current status across all MPs';
    const statusGroups = [
      { name: 'In Progress', value: projects.filter(p => ['In Progress', 'IN_PROGRESS'].includes(p.status)).length, color: '#3b82f6' },
      { name: 'Sanctioned', value: projects.filter(p => ['Sanctioned', 'SANCTIONED', 'APPROVED'].includes(p.status)).length, color: '#8b5cf6' },
      { name: 'Completed', value: projects.filter(p => ['Completed', 'COMPLETED'].includes(p.status)).length, color: '#10b981' },
      { name: 'Pending', value: projects.filter(p => ['Pending Sanction', 'Pending Review', 'PENDING_REVIEW', 'PENDING'].includes(p.status)).length, color: '#f59e0b' },
      { name: 'Rejected', value: projects.filter(p => ['Rejected', 'REJECTED'].includes(p.status)).length, color: '#ef4444' },
      { name: 'Suspended', value: projects.filter(p => (p.status || '').toLowerCase().includes('suspended')).length, color: '#64748b' },
    ];
    chartData = statusGroups;
    centerLabel = (stats?.totalProjects ?? projects.length).toString();
    centerSubLabel = 'Projects';
  } else if (chartView === 'Funds') {
    chartTitle = 'Fund Utilization';
    chartDesc = 'District-wide fund allocation vs utilization';
    isCurrency = true;
    const totalEntitlement = stats?.totalEntitlement || 250000000;
    const totalSanctioned = stats?.totalSanctioned || 0;
    const totalUtilized = stats?.totalUtilized || 0;
    chartData = [
      { name: 'Utilized', value: Math.max(0, totalUtilized), color: '#10b981' },
      { name: 'Sanctioned Remaining', value: Math.max(0, totalSanctioned - totalUtilized), color: '#3b82f6' },
      { name: 'Unallocated', value: Math.max(0, totalEntitlement - totalSanctioned), color: '#cbd5e1' }
    ];
    centerLabel = `₹${(totalEntitlement / 10000000).toFixed(0)}Cr`;
    centerSubLabel = 'Total Entitlement';
  } else if (chartView === 'MP') {
    chartTitle = 'Risk by MP';
    chartDesc = 'Average risk score across MPs in the district';
    chartData = (mps || []).map(mp => {
      const riskScore = Number(mp.avgRiskScore ?? mp.avg_risk_score ?? 0);
      return {
        name: (mp.name || mp.mp_name || 'MP').split(' ').pop(),
        value: riskScore,
        color: riskScore >= 60 ? '#ef4444' : riskScore >= 40 ? '#f59e0b' : '#10b981',
      };
    });
    centerLabel = (mps || []).length.toString();
    centerSubLabel = 'MPs';
  }

  const totalChartValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const activeSlices = chartData.filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col w-full min-w-0">
      <div className="flex justify-between items-start mb-6 gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold text-[#123b63] truncate">{chartTitle}</h2>
          <p className="text-[12px] sm:text-[13px] text-slate-500 mt-0.5 line-clamp-1">{chartDesc}</p>
        </div>
        <div ref={chartDropdownRef} className="relative group z-30 shrink-0">
          <button 
            onClick={() => setIsChartDropdownOpen((prev) => !prev)}
            aria-haspopup="true"
            aria-expanded={isChartDropdownOpen}
            className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-50 active:scale-95 shadow-sm transition-[transform,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            By {chartView === 'MP' ? 'MP Risk' : chartView} 
            <TbChevronDown size={14} className={`transition-transform duration-150 ${isChartDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {/* Dropdown Menu */}
          <div className={`absolute right-0 top-full mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] origin-top-right transition-[opacity,transform,visibility] duration-150 ease-out overflow-hidden z-40 ${
            isChartDropdownOpen
              ? 'opacity-100 visible scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible scale-95 group-hover:scale-100 translate-y-1 group-hover:translate-y-0'
          }`}>
            {['Risk', 'Status', 'Funds', 'MP'].map((view, i) => (
              <button 
                key={view}
                onClick={() => {
                  setChartView(view);
                  setIsChartDropdownOpen(false);
                }} 
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${i !== 0 ? 'border-t border-slate-50' : ''} ${chartView === view ? 'text-cyan-700 bg-cyan-50 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-[#123b63]'}`}
              >
                By {view === 'MP' ? 'MP Risk' : view}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {chartView === 'MP' ? (
        // Bar chart for MP comparison
        <div className="flex-1 min-h-[300px]">
          {chartData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[260px] text-slate-400">
              <p className="text-sm font-medium">No MP data recorded for this district</p>
              <p className="text-xs text-slate-400 mt-1">Average risk scores will appear when MPs are assigned</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300} debounce={50} initialDimension={{ width: 560, height: 300 }}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}`, 'Avg Risk Score']}
                />
                <Bar dataKey="value" name="Avg Risk Score" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        // Donut chart for other views
        <div className="flex flex-col items-center gap-6 sm:gap-8 flex-1 w-full min-w-0 mt-2">
          <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
            <PieChart width={192} height={192}>
              {totalChartValue === 0 ? (
                <Pie
                  data={[{ name: 'Empty', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  dataKey="value"
                  stroke="#e2e8f0"
                  strokeWidth={1.5}
                  isAnimationActive={false}
                >
                  <Cell fill="#f8fafc" stroke="#e2e8f0" />
                </Pie>
              ) : (
                <Pie
                  data={activeSlices}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={activeSlices.length > 1 ? 2 : 0}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {activeSlices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              )}
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`font-bold text-[#123b63] ${isCurrency ? 'text-xl' : 'text-3xl'}`}>{centerLabel}</span>
              <span className="text-[12px] font-medium text-slate-500">{centerSubLabel}</span>
            </div>
          </div>
          
          <div className="w-full flex flex-col divide-y divide-slate-100 min-w-0">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 text-xs sm:text-sm gap-2 min-w-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="font-semibold text-[#123b63] truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                  <span className="font-bold text-[#123b63]">
                    {isCurrency ? `₹${(item.value / 10000000).toFixed(2)}Cr` : item.value}
                  </span>
                  <span className="font-semibold text-slate-500 w-8 sm:w-10 text-right">
                    {totalChartValue > 0 ? Math.round((item.value / totalChartValue) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DaDashboardChart;
