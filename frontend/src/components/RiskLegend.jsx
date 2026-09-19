import React from 'react';

const RiskLegend = () => {
  const legendItems = [
    { label: '0–19 — Very Low', color: '#22C55E' },
    { label: '20–39 — Low', color: '#86EFAC' },
    { label: '40–59 — Moderate', color: '#FACC15' },
    { label: '60–79 — High', color: '#F97316' },
    { label: '80–100 — Critical', color: '#EF4444' },
    { label: 'No Data', color: '#9CA3AF' }
  ];

  return (
    <div className="absolute bottom-15 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md z-[1000] border border-slate-200 min-w-32">
      <h4 className="text-[10px] font-bold mb-2 text-slate-900 uppercase tracking-wider">Risk Level</h4>
      <div className="flex flex-col gap-1.5">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] shrink-0" 
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-xs text-slate-700 font-medium leading-none">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskLegend;
