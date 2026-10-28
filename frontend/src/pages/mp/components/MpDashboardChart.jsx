import React, { useState, useRef, useEffect } from 'react';
import { useMpStore } from '../../../store/useMpStore';
import { TbChevronDown } from 'react-icons/tb';
import { PieChart, Pie, Cell } from 'recharts';

export const MpDashboardChart = ({ stats, projects = [] }) => {
  const { dashboardChartView: chartView, setDashboardChartView: setChartView } = useMpStore();
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
  let centerSubLabel = 'Total Projects';
  let isCurrency = false;
  let chartTitle = '';
  let chartDesc = '';

  const isRepair = (p) => p.title?.toLowerCase().includes('renovat') || p.title?.toLowerCase().includes('upgrad') || p.title?.toLowerCase().includes('repair');

  if (chartView === 'Status') {
    chartTitle = 'Project Status';
    chartDesc = 'Distribution of your MPLADS projects by current status';
    const onTrackCount = stats?.statusBreakdown?.on_track ?? projects.filter(p => ["In Progress", "Sanctioned"].includes(p.status) && p.riskLevel === "Low").length;
    const highRiskCount = stats?.statusBreakdown?.high_risk ?? projects.filter(p => ["In Progress", "Sanctioned"].includes(p.status) && ["High", "Critical"].includes(p.riskLevel)).length;
    const completedCount = stats?.statusBreakdown?.completed ?? projects.filter(p => p.status === "Completed").length;
    const moderateCount = projects.filter(p => ["In Progress", "Sanctioned"].includes(p.status) && p.riskLevel === "Moderate").length;

    chartData = [
      { name: 'On Track', value: onTrackCount, color: '#10b981' },
      { name: 'Moderate Risk', value: moderateCount, color: '#f59e0b' },
      { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
      { name: 'Completed', value: completedCount, color: '#94a3b8' },
    ];
    centerLabel = (stats?.totalProjects ?? projects.length).toString();
  } else if (chartView === 'Risk') {
    chartTitle = 'Project Risk';
    chartDesc = 'Distribution of your MPLADS projects by risk level';
    const riskCounts = stats?.riskCounts || {
      Low: projects.filter(p => p.riskLevel === "Low").length,
      Moderate: projects.filter(p => p.riskLevel === "Moderate").length,
      High: projects.filter(p => p.riskLevel === "High").length,
      Critical: projects.filter(p => p.riskLevel === "Critical").length,
    };
    chartData = [
      { name: 'Low Risk', value: riskCounts.Low || 0, color: '#10b981' },
      { name: 'Moderate Risk', value: riskCounts.Moderate || 0, color: '#f59e0b' },
      { name: 'High Risk', value: riskCounts.High || 0, color: '#f97316' },
      { name: 'Critical Risk', value: riskCounts.Critical || 0, color: '#ef4444' },
    ];
    centerLabel = (stats?.totalProjects ?? projects.length).toString();
  } else if (chartView === 'Sector') {
    chartTitle = 'Sector Distribution';
    chartDesc = 'Distribution of projects across key sectors';
    const sectors = {
      'Education': { color: '#3b82f6', match: ['Education'] },
      'Healthcare': { color: '#ec4899', match: ['Health', 'Healthcare'] },
      'Roads & Infra': { color: '#6366f1', match: ['Public Transport', 'Roads', 'Infrastructure'] },
      'Water & Sanitation': { color: '#0ea5e9', match: ['Water Supply', 'Sanitation'] },
      'Community': { color: '#8b5cf6', match: ['Community Infrastructure', 'Renewable Energy'] },
    };
    chartData = Object.keys(sectors).map(sector => ({
      name: sector,
      value: projects.filter(p => sectors[sector].match.some(m => (p.category || '').toLowerCase().includes(m.toLowerCase()))).length,
      color: sectors[sector].color
    }));
    centerLabel = (stats?.totalProjects ?? projects.length).toString();
  } else if (chartView === 'Funds') {
    chartTitle = 'Fund Utilization';
    chartDesc = 'Allocated versus utilized MPLADS funds';
    isCurrency = true;
    const totalEntitlement = stats?.totalEntitlement || 50000000;
    const totalUtilized = stats?.totalUtilized || 0;
    chartData = [
      { name: 'Utilized', value: Math.max(0, totalUtilized), color: '#10b981' },
      { name: 'Remaining', value: Math.max(0, totalEntitlement - totalUtilized), color: '#cbd5e1' }
    ];
    centerLabel = `₹${(totalEntitlement / 10000000).toFixed(1)}Cr`;
    centerSubLabel = 'Allocated';
  } else if (chartView === 'Type') {
    chartTitle = 'Project Type';
    chartDesc = 'Breakdown of projects by their type and nature';
    chartData = [
      { name: 'New Projects', value: projects.filter(p => !isRepair(p) && ['Pending Sanction', 'Sanctioned', 'PENDING_REVIEW', 'PENDING'].includes(p.status)).length, color: '#3b82f6' },
      { name: 'Ongoing Projects', value: projects.filter(p => !isRepair(p) && ['In Progress', 'IN_PROGRESS'].includes(p.status)).length, color: '#f59e0b' },
      { name: 'Completed Projects', value: projects.filter(p => !isRepair(p) && ['Completed', 'COMPLETED'].includes(p.status)).length, color: '#10b981' },
      { name: 'Repair/Renovation', value: projects.filter(p => isRepair(p)).length, color: '#8b5cf6' },
    ];
    centerLabel = (stats?.totalProjects ?? projects.length).toString();
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
            By{" "}
            {chartView === "Funds"
              ? "Fund Utilization"
              : chartView === "Sector"
                ? "Sector Distribution"
                : chartView === "Type"
                  ? "Project Type"
                  : `Project ${chartView}`}
            <TbChevronDown
              size={14}
              className={`transition-transform duration-150 ${isChartDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
          {/* Dropdown Menu */}
          <div
            className={`absolute right-0 top-full mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] origin-top-right transition-[opacity,transform,visibility] duration-150 ease-out overflow-hidden z-40 ${
              isChartDropdownOpen
                ? "opacity-100 visible scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 invisible group-hover:opacity-100 group-hover:visible scale-95 group-hover:scale-100 translate-y-1 group-hover:translate-y-0"
            }`}
          >
            {["Status", "Risk", "Sector", "Funds", "Type"].map(
              (view, i) => (
                <button
                  key={view}
                  onClick={() => {
                    setChartView(view);
                    setIsChartDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${i !== 0 ? "border-t border-slate-50" : ""} ${chartView === view ? "text-cyan-700 bg-cyan-50 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-[#123b63]"}`}
                >
                  By{" "}
                  {view === "Funds"
                    ? "Fund Utilization"
                    : view === "Sector"
                      ? "Sector Distribution"
                      : view === "Type"
                        ? "Project Type"
                        : `Project ${view}`}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

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
            <span
              className={`font-bold text-[#123b63] ${isCurrency ? "text-xl" : "text-3xl"}`}
            >
              {centerLabel}
            </span>
            <span className="text-[12px] font-medium text-slate-500">
              {centerSubLabel}
            </span>
          </div>
        </div>

        <div className="w-full flex flex-col divide-y divide-slate-100 min-w-0">
          {chartData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-3 text-xs sm:text-sm gap-2 min-w-0"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="font-semibold text-[#123b63] truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                <span className="font-bold text-[#123b63]">
                  {isCurrency
                    ? `₹${(item.value / 10000000).toFixed(2)}Cr`
                    : item.value}
                </span>
                <span className="font-semibold text-slate-500 w-8 sm:w-10 text-right">
                  {totalChartValue > 0
                    ? Math.round((item.value / totalChartValue) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MpDashboardChart;
