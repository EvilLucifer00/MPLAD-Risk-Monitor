import React from 'react';
import { motion } from 'framer-motion';

const RiskLegend = ({ onHoverLevel }) => {
  const legendItems = [
    { label: '0–19 — Very Low', color: '#22C55E', value: 'VERY LOW' },
    { label: '20–39 — Low', color: '#86EFAC', value: 'LOW' },
    { label: '40–59 — Moderate', color: '#FACC15', value: 'MODERATE' },
    { label: '60–79 — High', color: '#F97316', value: 'HIGH' },
    { label: '80–100 — Critical', color: '#EF4444', value: 'CRITICAL' },
    { label: 'No Data', color: '#9CA3AF', value: 'No Data' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-6 right-1 lg:bottom-16 lg:right-4 bg-white/95 backdrop-blur-sm p-1.5 lg:p-3 rounded-md lg:rounded-lg shadow-md z-[1000] border border-slate-200 min-w-[80px] lg:min-w-32"
    >
      <h4 className="text-[7px] lg:text-[10px] font-bold mb-1 lg:mb-2 text-slate-900 uppercase tracking-wider">Risk Level</h4>
      <div className="flex flex-col gap-0.5 lg:gap-1.5">
        {legendItems.map((item, index) => (
          <div 
            key={index} 
            onMouseEnter={() => onHoverLevel && onHoverLevel(item.value)}
            onMouseLeave={() => onHoverLevel && onHoverLevel(null)}
            className="flex items-center gap-1 lg:gap-2 cursor-pointer group p-0.5 -ml-0.5 rounded transition-colors hover:bg-slate-100"
          >
            <span 
              className="w-2 h-2 lg:w-3 lg:h-3 rounded shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] shrink-0 transition-transform group-hover:scale-110" 
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-[8px] lg:text-xs text-slate-700 font-medium leading-none group-hover:text-slate-900 transition-colors">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RiskLegend;
