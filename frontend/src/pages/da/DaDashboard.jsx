import React, { useEffect, useState } from 'react';
import { daApi } from '../../api/mockDaApi';
import { useDaStore } from '../../store/useDaStore';
import AnimatedCounter from '../../components/AnimatedCounter';
import { 
  TbUsers, 
  TbCurrencyRupee, 
  TbAlertTriangle, 
  TbClipboardCheck,
  TbArrowRight,
  TbClock,
  TbInfoCircle,
  TbChevronDown,
  TbDotsVertical,
  TbFileAlert,
  TbDownload,
  TbLoader2,
  TbCheck,
  TbShieldCheck
} from 'react-icons/tb';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { Link } from 'react-router-dom';

const RISK_COLORS = {
  Low: '#10b981',
  Moderate: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444'
};

const DaDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [mps, setMps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const { dashboardChartView: chartView, setDashboardChartView: setChartView } = useDaStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [dashboardStats, recs, allMPs, allProjects] = await Promise.all([
          daApi.getDashboardStats(),
          daApi.getRecommendations(),
          daApi.getDistrictMPs(),
          daApi.getProjects()
        ]);
        setStats(dashboardStats);
        setRecommendations(recs);
        setMps(allMPs);
        setProjects(allProjects);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleGenerateReport = async () => {
    setReportGenerating(true);
    try {
      await daApi.generateReport();
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    }
    setReportGenerating(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Chart data
  let chartData = [];
  let centerLabel = '';
  let centerSubLabel = 'Total';
  let isCurrency = false;
  let chartTitle = '';
  let chartDesc = '';

  if (chartView === 'Risk') {
    chartTitle = 'Risk Distribution';
    chartDesc = 'District-wide project risk levels';
    chartData = [
      { name: 'Low Risk', value: stats.riskCounts.Low, color: '#10b981' },
      { name: 'Moderate', value: stats.riskCounts.Moderate, color: '#f59e0b' },
      { name: 'High Risk', value: stats.riskCounts.High, color: '#f97316' },
      { name: 'Critical', value: stats.riskCounts.Critical, color: '#ef4444' },
    ].filter(d => d.value > 0);
    centerLabel = stats.totalProjects.toString();
    centerSubLabel = 'Projects';
  } else if (chartView === 'Status') {
    chartTitle = 'Project Status';
    chartDesc = 'Current status across all MPs';
    const statusGroups = [
      { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, color: '#3b82f6' },
      { name: 'Sanctioned', value: projects.filter(p => p.status === 'Sanctioned').length, color: '#8b5cf6' },
      { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#10b981' },
      { name: 'Pending', value: projects.filter(p => p.status === 'Pending Sanction').length, color: '#f59e0b' },
      { name: 'Rejected', value: projects.filter(p => p.status === 'Rejected').length, color: '#ef4444' },
      { name: 'Suspended', value: projects.filter(p => p.status.includes('Suspended')).length, color: '#64748b' },
    ];
    chartData = statusGroups.filter(d => d.value > 0);
    centerLabel = stats.totalProjects.toString();
    centerSubLabel = 'Projects';
  } else if (chartView === 'Funds') {
    chartTitle = 'Fund Utilization';
    chartDesc = 'District-wide fund allocation vs utilization';
    isCurrency = true;
    chartData = [
      { name: 'Utilized', value: stats.totalUtilized, color: '#10b981' },
      { name: 'Sanctioned Remaining', value: stats.totalSanctioned - stats.totalUtilized, color: '#3b82f6' },
      { name: 'Unallocated', value: stats.totalEntitlement - stats.totalSanctioned, color: '#cbd5e1' }
    ].filter(d => d.value > 0);
    centerLabel = `₹${(stats.totalEntitlement / 10000000).toFixed(0)}Cr`;
    centerSubLabel = 'Total Entitlement';
  } else if (chartView === 'MP') {
    chartTitle = 'Risk by MP';
    chartDesc = 'Average risk score across MPs in the district';
    chartData = mps.map(mp => ({
      name: mp.name.split(' ').pop(),
      value: mp.avgRiskScore,
      color: mp.avgRiskScore >= 60 ? '#ef4444' : mp.avgRiskScore >= 40 ? '#f59e0b' : '#10b981',
    }));
    centerLabel = mps.length.toString();
    centerSubLabel = 'MPs';
  }

  const totalChartValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  // Recent actions from projects
  const recentActions = projects
    .flatMap(p => p.actionHistory.map(a => ({ ...a, projectId: p.id, projectTitle: p.title })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#123b63]">District Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Lucknow District — Overview of all MPLADS projects and MPs.</p>
        </div>
        <button 
          onClick={handleGenerateReport}
          disabled={reportGenerating}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            reportSuccess 
              ? 'bg-emerald-600 text-white' 
              : 'bg-[#123b63] hover:bg-[#0c2a47] text-white'
          } disabled:opacity-60`}
        >
          {reportGenerating ? (
            <><TbLoader2 size={18} className="animate-spin" /> Generating...</>
          ) : reportSuccess ? (
            <><TbCheck size={18} /> Report Ready</>
          ) : (
            <><TbDownload size={18} /> Generate Report</>
          )}
        </button>
      </div>

      {/* Pending Actions Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/da/review" className="group">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                  <TbClipboardCheck size={28} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-orange-700">{stats.pendingReview}</div>
                  <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mt-0.5">Projects Awaiting Review</div>
                  <div className="text-[11px] text-orange-500 mt-0.5">3 waiting &gt; 5 days</div>
                </div>
              </div>
              <TbArrowRight size={20} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
        <Link to="/da/documents" className="group">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <TbFileAlert size={28} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-blue-700">{stats.awaitingVerification}</div>
                  <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">Documents Pending Verification</div>
                  <div className="text-[11px] text-blue-500 mt-0.5">From {stats.awaitingVerification} projects</div>
                </div>
              </div>
              <TbArrowRight size={20} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedCounter 
          end={stats.totalMPs} 
          title="MPs Monitored" 
          icon={TbUsers}
          iconColor="text-[#123b63]"
          iconBg="bg-[#f0f7ff]"
          sub="Across Lucknow District"
        />
        <AnimatedCounter 
          prefix="₹ "
          end={stats.totalUtilized / 10000000}
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
          sub="Across all MPs — requires attention"
        />
        <AnimatedCounter 
          end={stats.activeProjects} 
          title="Active Projects" 
          icon={TbShieldCheck}
          iconColor="text-indigo-500"
          iconBg="bg-indigo-50"
          sub="Sanctioned & In Progress"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#123b63]">{chartTitle}</h2>
              <p className="text-[13px] text-slate-500 mt-1">{chartDesc}</p>
            </div>
            <div className="relative group z-30">
              <button className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-50 shadow-sm transition-colors">
                By {chartView} <TbChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden translate-y-1 group-hover:translate-y-0">
                {['Risk', 'Status', 'Funds', 'MP'].map((view, i) => (
                  <button 
                    key={view}
                    onClick={() => setChartView(view)} 
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${i !== 0 ? 'border-t border-slate-50' : ''} ${chartView === view ? 'text-cyan-700 bg-cyan-50' : 'text-slate-600 hover:bg-slate-50 hover:text-[#123b63]'}`}
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}`, 'Avg Risk Score']}
                  />
                  <Bar dataKey="value" name="Avg Risk Score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            // Donut chart for other views
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
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#123b63]">AI Recommendations</h2>
            <span className="text-xs font-semibold bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full">Powered by ML</span>
          </div>
          <div className="space-y-4 overflow-auto flex-1">
            {recommendations.map(rec => {
              let bgClass = "bg-slate-50/50";
              let iconWrapperClass = "bg-slate-100 text-slate-500";
              let titleClass = "text-slate-800";
              let Icon = TbInfoCircle;

              if (rec.severity === 'Critical') {
                bgClass = "bg-red-50/40 border-red-100";
                iconWrapperClass = "bg-red-100/80 text-red-600";
                titleClass = "text-red-600 font-bold";
                Icon = TbAlertTriangle;
              } else if (rec.severity === 'High') {
                bgClass = "bg-orange-50/40 border-orange-100";
                iconWrapperClass = "bg-orange-100/80 text-orange-600";
                titleClass = "text-orange-600 font-bold";
                Icon = TbAlertTriangle;
              } else if (rec.severity === 'Medium') {
                bgClass = "bg-amber-50/40 border-amber-50";
                iconWrapperClass = "bg-amber-100/80 text-amber-600";
                titleClass = "text-amber-600 font-bold";
                Icon = TbClock;
              } else {
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
                  <div className="min-w-0">
                    <h3 className={`text-[15px] ${titleClass}`}>{rec.type}</h3>
                    <p className="text-[13px] text-slate-600 mt-1 leading-relaxed pr-2">{rec.message}</p>
                    {rec.relatedProjectIds?.length > 0 && (
                      <div className="mt-3">
                        <Link 
                          to={`/da/review/${rec.relatedProjectIds[0]}`}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-700 bg-white border border-cyan-100 px-3 py-1.5 rounded-lg hover:bg-cyan-50 transition-colors shadow-sm"
                        >
                          View Details <TbArrowRight size={14} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-[#123b63]">Recent Activity</h2>
          <Link to="/da/review" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1">
            View Review Queue <TbArrowRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Project</th>
                <th className="px-6 py-4 font-semibold">By</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentActions.map((action, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                      action.action.includes('Sanction') || action.action.includes('Approved') ? 'bg-emerald-50 text-emerald-600' :
                      action.action.includes('Reject') ? 'bg-red-50 text-red-600' :
                      action.action.includes('Suspend') ? 'bg-slate-100 text-slate-700' :
                      action.action.includes('Escalat') ? 'bg-amber-50 text-amber-600' :
                      action.action.includes('Risk') ? 'bg-orange-50 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {action.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#123b63] max-w-[200px] truncate">{action.projectTitle}</td>
                  <td className="px-6 py-4 text-slate-600">{action.actor}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(action.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DaDashboard;
