import React, { useState, useEffect } from 'react';
import { daApi } from '../../api/mockDaApi';
import { TbSearch, TbBuildingBank, TbClock, TbAlertTriangle, TbBriefcase } from 'react-icons/tb';

const DaIADirectory = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    daApi.getImplementingAgencies().then(data => {
      setAgencies(data);
      setLoading(false);
    });
  }, []);

  const filtered = agencies.filter(ia =>
    ia.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-[#123b63]">Implementing Agency Directory</h1>
        <p className="text-sm text-slate-500 mt-1">Track record and performance of IAs in Lucknow District.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by agency name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* IA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-500">
            <TbBuildingBank size={48} className="text-slate-300 mb-4" />
            <p className="font-semibold">No agencies found</p>
          </div>
        ) : (
          filtered.map(ia => (
            <div key={ia.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <TbBuildingBank size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#123b63] text-sm truncate">{ia.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    ia.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {ia.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <TbBriefcase size={14} />
                  </div>
                  <div className="text-xl font-bold text-[#123b63]">{ia.projectsHandled}</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Projects</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <TbBriefcase size={14} />
                  </div>
                  <div className="text-xl font-bold text-[#123b63]">{ia.activeProjects}</div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Now</div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-slate-600">
                    <TbClock size={16} className="text-slate-400" />
                    Avg Completion
                  </span>
                  <span className={`text-sm font-bold ${ia.avgCompletionMonths > 9 ? 'text-orange-600' : 'text-[#123b63]'}`}>
                    {ia.avgCompletionMonths} months
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-slate-600">
                    <TbAlertTriangle size={16} className="text-slate-400" />
                    Avg Risk Score
                  </span>
                  <span className={`text-sm font-bold ${
                    ia.avgRiskScore >= 60 ? 'text-red-600' :
                    ia.avgRiskScore >= 40 ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>
                    {ia.avgRiskScore}/100
                  </span>
                </div>
                {/* Risk bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      ia.avgRiskScore >= 60 ? 'bg-red-500' :
                      ia.avgRiskScore >= 40 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${ia.avgRiskScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DaIADirectory;
