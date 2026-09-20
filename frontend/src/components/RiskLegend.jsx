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
    <div className="absolute bottom-10 lg:bottom-16 right-2 lg:right-4 bg-white/95 backdrop-blur-sm p-2 lg:p-3 rounded-lg shadow-md z-[1000] border border-slate-200 min-w-[110px] lg:min-w-32">
      <h4 className="text-[9px] lg:text-[10px] font-bold mb-1.5 lg:mb-2 text-slate-900 uppercase tracking-wider">Risk Level</h4>
      <div className="flex flex-col gap-1 lg:gap-1.5">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5 lg:gap-2">
            <span 
              className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] shrink-0" 
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-[10px] lg:text-xs text-slate-700 font-medium leading-none">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskLegend;
