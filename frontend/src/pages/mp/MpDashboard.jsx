import React, { useEffect, useState } from 'react';
import { api } from '../../api/mockMpApi';
import { useMpStore } from '../../store/useMpStore';
import AnimatedCounter from '../../components/AnimatedCounter';
import { 
  TbBriefcase, 
  TbCurrencyRupee, 
  TbAlertTriangle, 
  TbFileTime,
  TbArrowRight,
  TbClock,
  TbInfoCircle,
  TbChevronDown,
  TbDotsVertical
} from 'react-icons/tb';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';

const COLORS = {
  Low: '#10b981', // emerald-500
  Moderate: '#f59e0b', // amber-500
  High: '#f97316', // orange-500
  Critical: '#ef4444' // red-500
};

const MpDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { dashboardChartView: chartView, setDashboardChartView: setChartView } = useMpStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [dashboardStats, recs, allProjects] = await Promise.all([
          api.getDashboardStats(),
          api.getRecommendations(),
          api.getProjects()
        ]);
        setStats(dashboardStats);
        setRecommendations(recs);
        setProjects(allProjects);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  let chartData = [];
  let centerLabel = '';
  let centerSubLabel = 'Total Projects';
  let isCurrency = false;
  let chartTitle = '';
  let chartDesc = '';

  const isRepair = (p) => p.title.toLowerCase().includes('renovat') || p.title.toLowerCase().includes('upgrad') || p.title.toLowerCase().includes('repair');

  if (chartView === 'Status') {
    chartTitle = 'Project Status';
    chartDesc = 'Distribution of your MPLADS projects by current status';
    chartData = [
      { name: 'On Track', value: projects.filter(p => ["In Progress", "Sanctioned"].includes(p.status) && p.riskLevel === "Low").length, color: '#10b981' },
      { name: 'Moderate Risk', value: projects.filter(p => ["In Progress", "Sanctioned"].includes(p.status) && p.riskLevel === "Moderate").length, color: '#f59e0b' },
      { name: 'High Risk', value: projects.filter(p => ["In Progress", "Sanctioned"].includes(p.status) && ["High", "Critical"].includes(p.riskLevel)).length, color: '#ef4444' },
      { name: 'Completed', value: projects.filter(p => p.status === "Completed").length, color: '#94a3b8' },
    ].filter(d => d.value > 0);
    centerLabel = chartData.reduce((acc, curr) => acc + curr.value, 0).toString();
  } else if (chartView === 'Risk') {
    chartTitle = 'Project Risk';
    chartDesc = 'Distribution of your MPLADS projects by risk level';
    chartData = [
      { name: 'Low Risk', value: stats.riskCounts.Low, color: '#10b981' },
      { name: 'Moderate Risk', value: stats.riskCounts.Moderate, color: '#f59e0b' },
      { name: 'High Risk', value: stats.riskCounts.High, color: '#f97316' },
      { name: 'Critical Risk', value: stats.riskCounts.Critical, color: '#ef4444' },
    ].filter(d => d.value > 0);
    centerLabel = chartData.reduce((acc, curr) => acc + curr.value, 0).toString();
  } else if (chartView === 'Sector') {
    chartTitle = 'Sector Distribution';
    chartDesc = 'Distribution of projects across key sectors';
    const sectors = {
      'Education': { color: '#3b82f6', match: ['Education'] },
      'Healthcare': { color: '#ec4899', match: ['Health'] },
      'Roads & Infra': { color: '#6366f1', match: ['Public Transport', 'Roads'] },
      'Water & Sanitation': { color: '#0ea5e9', match: ['Water Supply', 'Sanitation'] },
      'Community': { color: '#8b5cf6', match: ['Community Infrastructure', 'Renewable Energy'] },
    };
    chartData = Object.keys(sectors).map(sector => ({
      name: sector,
      value: projects.filter(p => sectors[sector].match.includes(p.category)).length,
      color: sectors[sector].color
    })).filter(d => d.value > 0);
    centerLabel = chartData.reduce((acc, curr) => acc + curr.value, 0).toString();
  } else if (chartView === 'Funds') {
    chartTitle = 'Fund Utilization';
    chartDesc = 'Allocated versus utilized MPLADS funds';
    isCurrency = true;
    chartData = [
      { name: 'Utilized', value: stats.totalUtilized, color: '#10b981' },
      { name: 'Remaining', value: stats.totalEntitlement - stats.totalUtilized, color: '#cbd5e1' }
    ].filter(d => d.value > 0);
    centerLabel = `₹${(stats.totalEntitlement / 10000000).toFixed(1)}Cr`;
    centerSubLabel = 'Allocated';
  } else if (chartView === 'Type') {
    chartTitle = 'Project Type';
    chartDesc = 'Breakdown of projects by their type and nature';
    chartData = [
      { name: 'New Projects', value: projects.filter(p => !isRepair(p) && ['Pending Sanction', 'Sanctioned'].includes(p.status)).length, color: '#3b82f6' },
      { name: 'Ongoing Projects', value: projects.filter(p => !isRepair(p) && p.status === 'In Progress').length, color: '#f59e0b' },
      { name: 'Completed Projects', value: projects.filter(p => !isRepair(p) && p.status === 'Completed').length, color: '#10b981' },
      { name: 'Repair/Renovation', value: projects.filter(p => isRepair(p)).length, color: '#8b5cf6' },
    ].filter(d => d.value > 0);
    centerLabel = chartData.reduce((acc, curr) => acc + curr.value, 0).toString();
  }

  const totalChartValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#123b63]">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back. Here is the summary of your MPLADS projects.</p>
        </div>
        <Link 
          to="/mp/submit" 
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <span>New Project</span>
          <TbArrowRight />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCounter 
          end={stats.activeProjects} 
          title="Active Projects" 
          icon={TbBriefcase}
          iconColor="text-[#123b63]"
          iconBg="bg-[#f0f7ff]"
          sub="Sanctioned & In Progress"
        />
        <AnimatedCounter 
          prefix="₹ "
          end={stats.totalUtilized / 10000000} // convert to cr
          decimals={2}
          suffix=" Cr"
          title="Funds Utilized" 
          icon={TbCurrencyRupee}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
          sub={`Out of ₹${stats.totalEntitlement / 10000000} Cr entitlement`}
        />
        <AnimatedCounter 
          end={stats.riskCounts.High + stats.riskCounts.Critical} 
          title="High Risk Projects" 
          icon={TbAlertTriangle}
          iconColor="text-red-500"
          iconBg="bg-red-50"
          sub="Requires immediate attention"
        />
        <AnimatedCounter 
          end={stats.pendingApprovals} 
          title="Pending Approvals" 
          icon={TbFileTime}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          sub="Awaiting district sanction"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#123b63]">{chartTitle}</h2>
              <p className="text-[13px] text-slate-500 mt-1">{chartDesc}</p>
            </div>
            <div className="relative group z-30">
              <button className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-50 shadow-sm transition-colors">
                By {chartView === 'Funds' ? 'Fund Utilization' : chartView === 'Sector' ? 'Sector' : chartView === 'Type' ? 'Project Type' : `Project ${chartView}`} <TbChevronDown size={14} />
              </button>
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden translate-y-1 group-hover:translate-y-0">
                {['Status', 'Risk', 'Sector', 'Funds', 'Type'].map((view, i) => (
                  <button 
                    key={view}
                    onClick={() => setChartView(view)} 
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${i !== 0 ? 'border-t border-slate-50' : ''} ${chartView === view ? 'text-cyan-700 bg-cyan-50' : 'text-slate-600 hover:bg-slate-50 hover:text-[#123b63]'}`}
                  >
                    By {view === 'Funds' ? 'Fund Utilization' : view === 'Sector' ? 'Sector Distribution' : view === 'Type' ? 'Project Type' : `Project ${view}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-8 flex-1 w-full mt-2">
            <div className="relative w-48 h-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`font-bold text-[#123b63] ${isCurrency ? 'text-xl' : 'text-3xl'}`}>{centerLabel}</span>
                <span className="text-[12px] font-medium text-slate-500">{centerSubLabel}</span>
              </div>
            </div>
            
            <div className="w-full flex flex-col divide-y divide-slate-100">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="font-semibold text-[#123b63]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-[#123b63]">
                      {isCurrency ? `₹${(item.value / 10000000).toFixed(2)}Cr` : item.value}
                    </span>
                    <span className="font-semibold text-slate-500 w-10 text-right">
                      {totalChartValue > 0 ? Math.round((item.value / totalChartValue) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#123b63]">AI Recommendations</h2>
            <span className="text-xs font-semibold bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full">Powered by ML</span>
          </div>
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <p className="text-slate-500 text-sm">No recommendations at this time.</p>
            ) : (
              recommendations.map(rec => {
                let bgClass = "bg-slate-50/50";
                let iconWrapperClass = "bg-slate-100 text-slate-500";
                let titleClass = "text-slate-800";
                let Icon = TbAlertTriangle;

                if (rec.type === 'Vendor Alert') {
                  bgClass = "bg-red-50/40 border-red-50";
                  iconWrapperClass = "bg-red-100/80 text-red-600";
                  titleClass = "text-red-600 font-bold";
                  Icon = TbAlertTriangle;
                } else if (rec.type === 'Utilization Warning') {
                  bgClass = "bg-amber-50/40 border-amber-50";
                  iconWrapperClass = "bg-amber-100/80 text-amber-600";
                  titleClass = "text-amber-600 font-bold";
                  Icon = TbClock;
                } else if (rec.type === 'Duplicate Check') {
                  bgClass = "bg-sky-50/40 border-sky-50";
                  iconWrapperClass = "bg-sky-100/80 text-sky-600";
                  titleClass = "text-[#123b63] font-bold";
                  Icon = TbInfoCircle;
                }

                return (
                  <div key={rec.id} className={`flex gap-4 p-5 rounded-2xl border ${bgClass} transition-colors`}>
                    <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${iconWrapperClass}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className={`text-[15px] ${titleClass}`}>{rec.type}</h3>
                      <p className="text-[13px] text-slate-600 mt-1 leading-relaxed pr-2">{rec.message}</p>
                      <div className="mt-3">
                        {rec.relatedProjectIds?.length > 0 ? (
                          <Link 
                            to={`/mp/projects/${rec.relatedProjectIds[0]}`}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 bg-white border border-cyan-100 px-3 py-1.5 rounded-lg hover:bg-cyan-50 transition-colors shadow-sm"
                          >
                            View Details <TbArrowRight size={14} />
                          </Link>
                        ) : (
                          <Link 
                            to="/mp/reports"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 bg-white border border-cyan-100 px-3 py-1.5 rounded-lg hover:bg-cyan-50 transition-colors shadow-sm"
                          >
                            View Details <TbArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-[#123b63]">Recent Projects</h2>
          <Link to="/mp/projects" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1">
            View All <TbArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Project Name</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Risk</th>
                <th className="px-6 py-4 font-semibold">Last Updated</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {projects.slice(0, 4).map((project, idx) => {
                return (
                  <tr key={project.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#123b63]">{project.title}</td>
                    <td className="px-6 py-4 text-slate-600">₹ {((project.sanctionedAmount > 0 ? project.sanctionedAmount : project.estimatedCost) / 10000000).toFixed(1)} Cr</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                        project.status === 'In Progress' ? 'bg-sky-50 text-sky-600' :
                        project.status === 'Sanctioned' ? 'bg-amber-50 text-amber-600' :
                        project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                        project.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-600' :
                        project.riskLevel === 'Moderate' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {project.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(project.lastUpdated || project.startDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-slate-400 hover:text-[#123b63] cursor-pointer">
                      <TbDotsVertical size={20} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MpDashboard;
