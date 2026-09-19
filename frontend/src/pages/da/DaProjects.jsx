import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { daApi } from '../../api/mockDaApi';
import { useDaStore } from '../../store/useDaStore';
import { RiskBadge } from '../mp/MpProjects';
import { TbSearch, TbChartBar, TbLayoutGrid, TbAlertTriangle, TbArrowRight, TbBriefcase, TbCurrencyRupee, TbUser } from 'react-icons/tb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const DaProjects = () => {
  const [mps, setMps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { projectsView, setProjectsView } = useDaStore();

  useEffect(() => {
    daApi.getDistrictMPs().then(data => {
      setMps(data);
      setLoading(false);
    });
  }, []);

  const filteredMPs = mps.filter(mp =>
    mp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mp.constituency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Analytics data
  const riskByMp = mps.map(mp => ({
    name: mp.name.split(' ').pop(),
    fullName: mp.name,
    avgRisk: mp.avgRiskScore,
    fill: mp.avgRiskScore >= 60 ? '#ef4444' : mp.avgRiskScore >= 40 ? '#f59e0b' : '#10b981',
  }));

  const utilizationByMp = mps.map(mp => ({
    name: mp.name.split(' ').pop(),
    fullName: mp.name,
    utilization: mp.totalSanctioned > 0 ? Math.round((mp.totalUtilized / mp.totalSanctioned) * 100) : 0,
    utilizationAmt: mp.totalUtilized,
    sanctioned: mp.totalSanctioned,
  }));

  const projectsByMp = mps.map(mp => ({
    name: mp.name.split(' ').pop(),
    fullName: mp.name,
    active: mp.activeProjects,
    total: mp.totalProjects,
    highCritical: mp.highCriticalCount,
  }));

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#123b63]">District Projects</h1>
          <p className="text-sm text-slate-500 mt-1">All MPs and their projects across Lucknow District.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProjectsView('grid')}
            className={`p-2.5 rounded-lg transition-colors ${projectsView === 'grid' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
            title="MP Grid View"
          >
            <TbLayoutGrid size={20} />
          </button>
          <button
            onClick={() => setProjectsView('analytics')}
            className={`p-2.5 rounded-lg transition-colors ${projectsView === 'analytics' ? 'bg-cyan-50 text-cyan-700' : 'text-slate-400 hover:bg-slate-100'}`}
            title="Analytics View"
          >
            <TbChartBar size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by MP name or constituency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {projectsView === 'grid' ? (
        /* ── MP Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
          {filteredMPs.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-500">
              <TbUser size={48} className="text-slate-300 mb-4" />
              <p className="font-semibold">No MPs found</p>
            </div>
          ) : (
            filteredMPs.map(mp => (
              <Link 
                key={mp.id} 
                to={`/da/projects/mp/${mp.id}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
              >
                {/* MP Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0f7ff] flex items-center justify-center text-[#123b63] font-bold text-sm border border-[#d0e4f7]">
                      {mp.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#123b63] text-sm">{mp.name}</h3>
                      <p className="text-[11px] text-slate-500">{mp.constituency}</p>
                    </div>
                  </div>
                  <TbArrowRight size={18} className="text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xl font-bold text-[#123b63]">{mp.activeProjects}</div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Projects</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xl font-bold text-[#123b63]">₹{(mp.totalUtilized / 10000000).toFixed(1)}Cr</div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Utilized</div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Avg Risk:</span>
                    <RiskBadge 
                      level={mp.avgRiskScore >= 80 ? 'Critical' : mp.avgRiskScore >= 60 ? 'High' : mp.avgRiskScore >= 40 ? 'Moderate' : 'Low'} 
                      score={mp.avgRiskScore} 
                    />
                  </div>
                  {mp.highCriticalCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      <TbAlertTriangle size={13} /> {mp.highCriticalCount} High+
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        /* ── Analytics View ── */
        <div className="space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Score by MP */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-[#123b63] mb-1">Average Risk Score by MP</h2>
              <p className="text-[13px] text-slate-500 mb-6">Compare risk levels across MPs</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskByMp} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value, name, props) => [`${value}`, `Risk Score — ${props.payload.fullName}`]}
                    />
                    <Bar dataKey="avgRisk" name="Avg Risk" radius={[6, 6, 0, 0]} maxBarSize={48}>
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
              <h2 className="text-lg font-bold text-[#123b63] mb-1">Fund Utilization % by MP</h2>
              <p className="text-[13px] text-slate-500 mb-6">Sanctioned funds utilization rate</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationByMp} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} unit="%" />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value, name, props) => [`${value}%`, `Utilization — ${props.payload.fullName}`]}
                    />
                    <Bar dataKey="utilization" name="Utilization %" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Projects Count by MP */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-[#123b63] mb-1">Project Distribution by MP</h2>
              <p className="text-[13px] text-slate-500 mb-6">Active vs total projects and flagged project count</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsByMp} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value, name, props) => [value, `${name} — ${props.payload.fullName}`]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                    <Bar dataKey="total" name="Total Projects" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="active" name="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="highCritical" name="High/Critical Risk" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaProjects;
