import React from 'react';

const HowItWorksSection = () => {
  const steps = [
    {
      n: 1,
      phase: "Phase 1: Recommendation",
      title: "Proposal Formulation",
      desc: "Member of Parliament identifies constituency priorities and submits digital project recommendations with cost estimates and technical DPR documents.",
    },
    {
      n: 2,
      phase: "Phase 2: Administrative Sanction",
      title: "Technical Scrutiny & Approval",
      desc: "District Authority evaluates proposal feasibility, verifies statutory eligibility against MoSPI negative lists, and awards Administrative Sanction to an Implementing Agency.",
    },
    {
      n: 3,
      phase: "Phase 3: Execution & Audit",
      title: "Milestone Disbursements",
      desc: "Implementing Agency tenders and executes works. Funds are disbursed in tranches conditional on physical site inspection and certified Utilization Certificates (UCs).",
    },
  ];

  return (
    <section className="bg-white px-4 sm:px-6 lg:px-12 py-8 border-b border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 border-b border-slate-200 pb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#123b63]">
            Workflow Pipeline
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            How the MPLADS Lifecycle Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Standard three-phase administrative procedure from parliamentary recommendation to completion audit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map(({ n, phase, title, desc }) => (
            <div
              key={n}
              className="bg-slate-50/60 border border-slate-200 border-t-2 border-t-[#123b63] rounded p-4 text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-6 h-6 rounded bg-[#123b63] text-white text-xs font-bold flex items-center justify-center">
                    {n}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    {phase}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
