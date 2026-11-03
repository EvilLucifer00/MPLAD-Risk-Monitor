import React from 'react';
import Reveal from '../../animations/Reveal';
import { IconChevronRight } from '../shared/HomeIcons';

const HowItWorksSection = () => {
  return (
    <section className="bg-white px-4 sm:px-6 lg:px-10 py-8 sm:py-10 lg:py-12 border-b border-slate-100 overflow-hidden">
      <Reveal className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 items-start">
          {/* Left label */}
          <div className="w-full lg:w-56 shrink-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-800">
                Workflow
              </span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-800 mb-2 leading-tight">
              A More Transparent
              <br />
              and Accountable Tomorrow
            </p>
            <div className="w-8 h-1 bg-cyan-500 rounded-full mb-2.5 sm:mb-3" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123b63] leading-tight tracking-tight">
              How It Works
            </h2>
          </div>

          {/* Steps */}
          <div className="relative flex flex-1 flex-col sm:flex-row items-stretch sm:items-start gap-2.5 sm:gap-6 w-full min-w-0">
            {/* Mobile-only connecting timeline track line */}
            <div
              className="sm:hidden absolute left-[19px] top-4 bottom-8 w-[2px] bg-[#123b63]/25"
              aria-hidden="true"
            />

            {[
              {
                n: 1,
                title: "Explore",
                desc: "Browse the interactive map to view constituencies and risk levels.",
                nodeBg: "bg-[#123b63]",
                badge: "Phase 01",
                badgeStyle: "bg-blue-50 text-[#123b63] border-blue-200/60",
                dotStyle: "bg-[#123b63]",
                pill: "Interactive Map",
              },
              {
                n: 2,
                title: "Understand",
                desc: "Access key insights and development indicators.",
                nodeBg: "bg-[#123b63]",
                badge: "Phase 02",
                badgeStyle: "bg-blue-50 text-[#123b63] border-blue-200/60",
                dotStyle: "bg-[#123b63]",
                pill: "AI Risk Engine",
              },
              {
                n: 3,
                title: "Enable Change",
                desc: "Promote transparency and informed decision-making.",
                nodeBg: "bg-[#123b63]",
                badge: "Phase 03",
                badgeStyle: "bg-blue-50 text-[#123b63] border-blue-200/60",
                dotStyle: "bg-[#123b63]",
                pill: "Public Accountability",
              },
            ].map(({ n, title, desc, nodeBg, badge, badgeStyle, dotStyle, pill }, idx, arr) => (
              <React.Fragment key={n}>
                <div className="relative z-10 flex-1 flex items-start gap-3 sm:gap-3.5 bg-slate-50/75 sm:bg-transparent border border-slate-200/80 sm:border-0 rounded-xl sm:rounded-none p-2.5 sm:p-0 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.03)] sm:shadow-none hover:bg-white sm:hover:bg-transparent transition-all duration-200 active:scale-[0.98] sm:active:scale-100 touch-manipulation min-w-0">
                  {/* Step Number Node */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${nodeBg} text-white flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0 mt-0.5 shadow-sm ring-4 ring-white sm:ring-0`}
                  >
                    {n}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-slate-800 text-[13.5px] sm:text-base leading-snug tracking-tight">
                        {title}
                      </p>
                      <span
                        className={`sm:hidden text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md border ${badgeStyle}`}
                      >
                        {badge}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug sm:leading-relaxed font-medium">
                      {desc}
                    </p>

                    {/* Mobile Pill Tag */}
                    <div className="mt-2 sm:hidden flex items-center">
                      <span className="text-[9.5px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200/70 inline-flex items-center gap-1 shadow-2xs">
                        <span className={`w-1 h-1 rounded-full ${dotStyle} animate-pulse`} />
                        {pill}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Chevron connector */}
                {idx < arr.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="shrink-0 mt-2 hidden sm:flex items-center text-slate-300"
                  >
                    <IconChevronRight size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default HowItWorksSection;
