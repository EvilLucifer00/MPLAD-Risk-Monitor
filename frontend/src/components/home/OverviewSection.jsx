import React from 'react';
import AnimatedCounter from '../shared/AnimatedCounter';
import { IconMapPin, IconRupee, IconAlertTriangle, IconConstruct } from '../shared/HomeIcons';

const OverviewSection = () => {
  return (
    <section className="bg-slate-50 px-4 sm:px-6 lg:px-12 py-8 border-b border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 border-b border-slate-200 pb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#123b63]">
            Key Performance Indicators
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            National Scheme Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Aggregated developmental metrics across 543 Parliamentary Constituencies under MoSPI guidelines.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          <AnimatedCounter
            end={543}
            index="01"
            accent="navy"
            tag="Lok Sabha"
            title="Constituencies"
            icon={IconMapPin}
            sub="Across all States and Union Territories"
          />
          <AnimatedCounter
            prefix="₹ "
            end={12500}
            suffix=" Cr"
            index="02"
            accent="emerald"
            tag="FY 2025-26"
            title="Allocated Capital"
            icon={IconRupee}
            sub="Statutory constituency allocation"
          />
          <AnimatedCounter
            end={18450}
            suffix="+"
            index="03"
            accent="cyan"
            tag="Works"
            title="Monitored Projects"
            icon={IconConstruct}
            sub="Sanctioned public infrastructure"
          />
          <AnimatedCounter
            end={142}
            index="04"
            accent="rose"
            tag="AI Flags"
            title="Audit Scrutiny Cases"
            icon={IconAlertTriangle}
            sub="Proposals flagged for technical review"
          />
        </div>
      </div>
    </section>
  );
};

export default OverviewSection;
