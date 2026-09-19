import React from 'react';
import { getRiskColor } from '../data/riskData';
import { TbMapPin, TbChartBar, TbAlertCircle, TbClock } from 'react-icons/tb';

const ConstituencyPanel = ({ data, onClose }) => {
  if (!data) return null;

  const riskColor = getRiskColor(data.risk_score);
  
  return (
    <div className="absolute top-0 right-0 bottom-0 w-full md:w-95 bg-white/95 backdrop-blur-md shadow-[-5px_0_25px_rgba(0,0,0,0.1)] z-2000 flex flex-col animate-[slideIn_0.3s_cubic-bezier(0.16,1,0.3,1)] md:border-l border-t md:border-t-0 border-slate-200">
      <button 
        className="absolute top-4 right-4 bg-transparent border-none text-2xl text-slate-500 cursor-pointer w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-slate-100 hover:text-slate-900" 
        onClick={onClose}
      >
        ×
      </button>
      
      <div className="pt-8 px-6 pb-6 border-b-4" style={{ borderBottomColor: riskColor }}>
        <h2 className="text-2xl font-bold mb-2 pr-8 leading-tight text-slate-900">{data.constituency || data.pc_name || 'Unknown Constituency'}</h2>
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <TbMapPin size={16} />
          <span>{data.state || data.st_name || 'Unknown State'}</span>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto flex-1">
        <div className="p-6 rounded-xl border border-slate-200 text-center mb-6" style={{ backgroundColor: `${riskColor}15`, borderColor: riskColor }}>
          <div className="text-sm uppercase tracking-wider font-semibold mb-2 text-slate-900">Overall Risk Score</div>
          <div className="text-5xl font-extrabold leading-none mb-2" style={{ color: riskColor }}>
            {data.risk_score !== undefined && data.risk_score !== null ? `${data.risk_score}/100` : 'N/A'}
          </div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider" style={{ color: riskColor, backgroundColor: `${riskColor}30` }}>
            {data.risk_score !== undefined && data.risk_score !== null ? getRiskLevel(data.risk_score) : 'NO DATA'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl py-4 px-2 text-center flex flex-col items-center shadow-sm">
            <div className="text-blue-500 mb-2 bg-blue-50 p-2 rounded-full flex"><TbChartBar size={20} /></div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-semibold mb-1 block">Projects</span>
              <span className="text-xl font-bold text-slate-900">{data.projects ?? '--'}</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-4 px-2 text-center flex flex-col items-center shadow-sm">
            <div className="text-yellow-500 mb-2 bg-yellow-50 p-2 rounded-full flex"><TbAlertCircle size={20} /></div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-semibold mb-1 block">Anomalies</span>
              <span className="text-xl font-bold text-slate-900">{data.anomalies ?? '--'}</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl py-4 px-2 text-center flex flex-col items-center shadow-sm">
            <div className="text-red-500 mb-2 bg-red-50 p-2 rounded-full flex"><TbClock size={20} /></div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-semibold mb-1 block">Delayed</span>
              <span className="text-xl font-bold text-slate-900">{data.delayed_projects ?? '--'}</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-base font-bold mb-4 text-slate-900 border-b border-slate-200 pb-2">Risk Factors</h3>
          
          <RiskFactorBar label="Financial Risk" score={data.financial_risk} />
          <RiskFactorBar label="Execution Risk" score={data.execution_risk} />
          <RiskFactorBar label="Vendor Risk" score={data.vendor_risk} />
          <RiskFactorBar label="Geographic Risk" score={data.geographic_risk} />
          <RiskFactorBar label="Timeline Risk" score={data.timeline_risk} />
          
        </div>
      </div>
    </div>
  );
};

const RiskFactorBar = ({ label, score }) => {
  if (score === undefined || score === null) return null;
  const color = getRiskColor(score);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-slate-900">{score}/100</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${score}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
};

// Helper for risk levels in panel
const getRiskLevel = (score) => {
  if (score < 20) return 'VERY LOW';
  if (score < 40) return 'LOW';
  if (score < 60) return 'MODERATE';
  if (score < 80) return 'HIGH';
  return 'CRITICAL';
};

export default ConstituencyPanel;
