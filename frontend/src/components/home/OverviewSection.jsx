import React from 'react';
import Reveal from '../../animations/Reveal';
import AnimatedCounter from '../shared/AnimatedCounter';
import { IconMapPin, IconRupee, IconAlertTriangle, IconConstruct } from '../shared/HomeIcons';

const OverviewSection = () => {
  return (
    <section className="min-h-0 bg-slate-50 px-4 sm:px-6 lg:px-12 py-7 sm:py-9 lg:py-10">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <div className="flex items-center gap-1.5 mb-1.5 sm:mb-2">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#123b63]">
                National Statistics
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0a2540] tracking-tight mb-2 sm:mb-3">
              Overview
            </h2>
            <div className="w-12 sm:w-20 h-1 sm:h-1.25 bg-cyan-600 rounded-full" />
          </div>
        </Reveal>

        <Reveal staggerChildren={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            <AnimatedCounter
              end={543}
              index="01"
              accent="navy"
              tag="Lok Sabha"
              title="Constituencies"
              icon={IconMapPin}
              iconColor="text-[#0a2540]"
              iconBg="bg-[#f0f7ff]"
              sub="Across all states and union territories"
            />
            <AnimatedCounter
              prefix="₹ "
              end={12500}
              suffix=" Cr"
              index="02"
              accent="emerald"
              tag="FY 2025-26"
              title="Invested This Year"
              icon={IconRupee}
              iconColor="text-teal-700"
              iconBg="bg-teal-50"
              sub="In constituency development"
            />
            <AnimatedCounter
              end={18450}
              suffix="+"
              index="03"
              accent="amber"
              tag="Works"
              title="Total Projects"
              icon={IconConstruct}
              iconColor="text-[#0a2540]"
              iconBg="bg-[#f0f7ff]"
              sub="Across sectors and regions"
            />
            <AnimatedCounter
              end={142}
              index="04"
              accent="rose"
              tag="AI Alerts"
              title="Critical Cases"
              icon={IconAlertTriangle}
              iconColor="text-red-700"
              iconBg="bg-red-50"
              sub="Requiring closer monitoring"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default OverviewSection;
