import React from 'react';
import { motion } from 'framer-motion';
import { getRiskColor } from '../../data/riskData';
import { IconMapPin, IconChartBar, IconAlertCircle, IconClock } from '../shared/HomeIcons';

const ConstituencyPanel = ({ data, onClose }) => {
  if (!data) return null;

  const riskColor = getRiskColor(data.risk_score);
  const pcName = data.constituency || data.pc_name || 'Unknown Constituency';
  const stName = data.state || data.st_name || 'Unknown State';
  const riskLevel = getRiskLevel(data.risk_score);
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute inset-0 md:inset-auto md:top-10 md:right-0 md:bottom-auto md:w-84 lg:w-88 md:h-auto md:max-h-[calc(100%-1.5rem)] w-full h-full bg-white shadow-md z-[2000] flex flex-col rounded-none md:rounded-bl border-l border-b border-slate-300 overflow-hidden"
    >
      {/* Universal Close Button */}
      <button 
        type="button"
        className="absolute top-2.5 right-2.5 z-30 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer w-7 h-7 flex items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] border border-slate-300" 
        onClick={onClose}
        aria-label="Close constituency details panel"
      >
        <span aria-hidden="true" className="text-base leading-none font-bold select-none">×</span>
      </button>

      {/* =========================================================================
          MOBILE VIEW: Clean Header + Balanced 2-Column Section filling the map
         ========================================================================= */}
      <div className="md:hidden flex flex-col h-full p-3.5 select-none overflow-hidden">
        {/* Top Header Row with Name, State and room for close button */}
        <div className="pr-9 pb-2 border-b border-slate-200 shrink-0">
          <h2 className="text-sm font-bold text-slate-900 leading-tight truncate" title={pcName}>
            {pcName}
          </h2>
          <div className="flex items-center gap-1 text-slate-600 font-normal text-[11px] truncate mt-0.5">
            <IconMapPin size={12} className="shrink-0 text-slate-500" />
            <span className="truncate">{stName}</span>
          </div>
        </div>

        {/* 2-Column Body */}
        <div className="grid grid-cols-2 gap-3 pt-2.5 flex-1 min-h-0 overflow-y-auto">
          {/* Column 1: Overall Risk & Project Details */}
          <div className="flex flex-col justify-between pr-2 border-r border-slate-200 min-w-0">
            {/* Overall Risk Score Card */}
            <div 
              className="p-2 rounded border text-center" 
              style={{ backgroundColor: `${riskColor}10`, borderColor: `${riskColor}40` }}
            >
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600 block">
                Overall Risk Score
              </span>
              <div className="text-xl font-bold leading-tight my-0.5 tabular-nums" style={{ color: riskColor }}>
                {data.risk_score !== undefined && data.risk_score !== null ? `${data.risk_score}/100` : 'N/A'}
              </div>
              <span 
                className="inline-block px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border" 
                style={{ color: riskColor, borderColor: `${riskColor}50`, backgroundColor: 'white' }}
              >
                {riskLevel}
              </span>
            </div>

            {/* Project Metrics */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[#123b63] shrink-0">
                    <IconChartBar size={12} />
                  </span>
                  <span className="text-[10px] font-semibold text-slate-700 truncate">Projects</span>
                </div>
                <span className="text-xs font-bold text-slate-900 tabular-nums shrink-0">{data.projects ?? '--'}</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center flex flex-col items-center">
                  <div className="flex items-center gap-1 text-amber-700">
                    <IconAlertCircle size={11} className="shrink-0" />
                    <span className="text-[9px] font-semibold text-slate-600 leading-tight">Anomalies</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 tabular-nums">{data.anomalies ?? '--'}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-center flex flex-col items-center">
                  <div className="flex items-center gap-1 text-rose-700">
                    <IconClock size={11} className="shrink-0" />
                    <span className="text-[9px] font-semibold text-slate-600 leading-tight">Delayed</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 tabular-nums">{data.delayed_projects ?? '--'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Risk Factors */}
          <div className="flex flex-col justify-between pl-1 min-w-0">
            <div className="border-b border-slate-200 pb-1 mb-1 shrink-0">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Risk Factors
              </h3>
            </div>
            
            <div className="flex flex-col justify-between flex-1 py-0.5 gap-1.5">
              <CompactRiskFactorBar label="Financial" score={data.financial_risk} />
              <CompactRiskFactorBar label="Execution" score={data.execution_risk} />
              <CompactRiskFactorBar label="Vendor" score={data.vendor_risk} />
              <CompactRiskFactorBar label="Geographic" score={data.geographic_risk} />
              <CompactRiskFactorBar label="Timeline" score={data.timeline_risk} />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP VIEW: Clean, Flat Sidebar
         ========================================================================= */}
      <div className="hidden md:flex flex-col select-none">
        {/* Header with riskColor accent border */}
        <div className="px-4 py-3.5 border-b-2 pr-10 shrink-0 bg-slate-50" style={{ borderBottomColor: riskColor }}>
          <h2 className="text-base font-bold text-slate-900 leading-tight truncate" title={pcName}>
            {pcName}
          </h2>
          <div className="flex items-center gap-1.5 text-slate-600 font-normal text-xs mt-0.5 truncate">
            <IconMapPin size={13} className="shrink-0 text-slate-500" />
            <span className="truncate">{stName}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3.5 overflow-y-auto">
          {/* Overall Risk Score Card */}
          <div 
            className="p-3.5 rounded border text-center" 
            style={{ backgroundColor: `${riskColor}08`, borderColor: `${riskColor}35` }}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-600 mb-0.5">
              Overall Risk Score
            </div>
            <div className="text-2xl font-bold leading-none my-1 tabular-nums" style={{ color: riskColor }}>
              {data.risk_score !== undefined && data.risk_score !== null ? `${data.risk_score}/100` : 'N/A'}
            </div>
            <div className="mt-1.5">
              <span 
                className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border" 
                style={{ color: riskColor, borderColor: `${riskColor}50`, backgroundColor: 'white' }}
              >
                {riskLevel}
              </span>
            </div>
          </div>

          {/* Project Stats (3 cols) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-slate-200 rounded py-2 px-1 text-center flex flex-col items-center">
              <div className="text-[#123b63] bg-blue-50 p-1 rounded mb-1 flex items-center justify-center">
                <IconChartBar size={14} />
              </div>
              <span className="text-[10px] text-slate-600 font-semibold block leading-tight">Projects</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">{data.projects ?? '--'}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded py-2 px-1 text-center flex flex-col items-center">
              <div className="text-amber-700 bg-amber-50 p-1 rounded mb-1 flex items-center justify-center">
                <IconAlertCircle size={14} />
              </div>
              <span className="text-[10px] text-slate-600 font-semibold block leading-tight">Anomalies</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">{data.anomalies ?? '--'}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded py-2 px-1 text-center flex flex-col items-center">
              <div className="text-rose-700 bg-rose-50 p-1 rounded mb-1 flex items-center justify-center">
                <IconClock size={14} />
              </div>
              <span className="text-[10px] text-slate-600 font-semibold block leading-tight">Delayed</span>
              <span className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">{data.delayed_projects ?? '--'}</span>
            </div>
          </div>

          {/* Risk Factors Breakdown */}
          <div className="bg-white border border-slate-200 rounded p-3">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-200 mb-2.5">
              Risk Factors Breakdown
            </h3>
            <div className="flex flex-col gap-2.5">
              <RiskFactorBar label="Financial Risk" score={data.financial_risk} />
              <RiskFactorBar label="Execution Risk" score={data.execution_risk} />
              <RiskFactorBar label="Vendor Risk" score={data.vendor_risk} />
              <RiskFactorBar label="Geographic Risk" score={data.geographic_risk} />
              <RiskFactorBar label="Timeline Risk" score={data.timeline_risk} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Factor bar for desktop
const RiskFactorBar = ({ label, score }) => {
  if (score === undefined || score === null) return null;
  const color = getRiskColor(score);
  
  return (
    <div>
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-slate-900 tabular-nums">{score}/100</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
        <div 
          className="h-full rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// Factor bar for mobile 2-column view
const CompactRiskFactorBar = ({ label, score }) => {
  if (score === undefined || score === null) return null;
  const color = getRiskColor(score);
  
  return (
    <div>
      <div className="flex justify-between items-center text-[10px] leading-tight">
        <span className="font-normal text-slate-700 truncate">{label}</span>
        <span className="font-bold text-slate-900 tabular-nums shrink-0 ml-1">{score}/100</span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
        <div 
          className="h-full rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// Helper for risk levels in panel
const getRiskLevel = (score) => {
  if (score === null || score === undefined) return 'NO DATA';
  if (score < 20) return 'VERY LOW';
  if (score < 40) return 'LOW';
  if (score < 60) return 'MODERATE';
  if (score < 80) return 'HIGH';
  return 'CRITICAL';
};

export default ConstituencyPanel;
