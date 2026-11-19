import React from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '../../components/shared/Toolbar';
import Footer from '../../components/shared/Footer';
import usePageSeo from '../../hooks/usePageSeo';
import {
  TbShieldCheck,
  TbMathFunction,
  TbAlertTriangle,
  TbCircleCheck,
  TbListNumbers,
  TbBulb,
} from 'react-icons/tb';

const MethodologyPage = () => {
  usePageSeo(
    'Risk Methodology & Heuristic Scoring | MPLADS Risk Monitor',
    'Understand the 8-step anomaly detection pipeline, composite scoring weights, and heuristic risk algorithms powering the MPLADS Risk Monitor.'
  );

  const STEPS = [
    {
      num: '01',
      title: 'Data Ingestion & Sanitization',
      desc: 'Ingests constituency allotments, MP recommendation logs, and district administrative sanction timestamps, standardizing fiscal dates and rupee values across all 543 Lok Sabha seats.',
    },
    {
      num: '02',
      title: 'Financial Allocation Normalization',
      desc: 'Scales cumulative fund entitlements against the tenure timeline to prevent newly elected constituencies from appearing falsely under-utilized compared to multi-term constituencies.',
    },
    {
      num: '03',
      title: 'Utilization Rate Analysis',
      desc: 'Calculates the ratio of verified field expenditure to released installments, flagging persistent idle balances that fail to deliver community assets.',
    },
    {
      num: '04',
      title: 'Milestone Delay Detection',
      desc: 'Compares recommendation-to-sanction timelines against the statutory 75-day MoSPI guideline, identifying administrative logjams at the district level.',
    },
    {
      num: '05',
      title: 'Cost Deviation & Escalation Analysis',
      desc: 'Measures variance between preliminary estimated sanctions and final contractor disbursements to isolate unexpected fiscal creep.',
    },
    {
      num: '06',
      title: 'Temporal Clustering Detection',
      desc: 'Monitors the distribution of recommendations across parliamentary terms to detect rushed last-quarter contract allocations before electoral codes of conduct.',
    },
    {
      num: '07',
      title: 'Weighted Composite Heuristic Scoring',
      desc: 'Combines multi-dimensional indicators into a calibrated 0–100 risk index prioritizing critical bottlenecks for administrative attention.',
    },
    {
      num: '08',
      title: 'Categorization & Explainability',
      desc: 'Sorts constituencies into transparent Low, Medium, and High risk classifications with specific, itemized explanatory driver cards.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      <Toolbar />

      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs text-slate-500">
            <li>
              <Link to="/" className="hover:text-[#123b63] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-[#123b63]" aria-current="page">
              Risk Methodology
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[#123b63] text-xs font-bold uppercase tracking-wider mb-4 border border-slate-200">
              <TbMathFunction size={15} />
              <span>Algorithmic Transparency</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#123b63] tracking-tight leading-tight">
              Risk Scoring Methodology & Anomaly Heuristics
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              Full technical breakdown of the 8-step analytical pipeline, statistical indicator formulas,
              and composite risk scoring weights.
            </p>
          </div>
        </div>

        {/* Key Caveat Banner */}
        <div
          role="region"
          aria-label="Analytical Nature Notice"
          className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 mb-10 flex items-start gap-3.5 text-blue-950"
        >
          <TbShieldCheck size={24} className="text-blue-800 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="font-bold block mb-1">
              Important: Risk Scores are Prioritization Signals, Not Proof of Wrongdoing
            </strong>
            <p>
              Risk scores generated by this prototype are <strong>heuristic indicators designed to assist administrators</strong> in
              identifying processing bottlenecks, pending paperwork, or unspent balances. A High Risk designation indicates
              statutory delay or unfulfilled reporting milestones — it does <strong>not</strong> constitute an accusation,
              presumption, or proof of corruption or financial malpractice.
            </p>
          </div>
        </div>

        {/* The 8-Step Pipeline */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs mb-8">
          <h2 className="text-xl font-bold text-[#123b63] mb-6 flex items-center gap-2">
            <TbListNumbers className="text-cyan-700" size={24} />
            <span>The 8-Step Anomaly Detection Pipeline</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5 hover:border-slate-300 transition-colors"
              >
                <span className="text-lg font-black text-[#123b63]/40 font-mono shrink-0">
                  {s.num}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#123b63] mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Composite Risk Formula & Weight Breakdown */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs mb-8">
          <h2 className="text-xl font-bold text-[#123b63] mb-3 flex items-center gap-2">
            <TbMathFunction className="text-cyan-700" size={24} />
            <span>Composite Risk Score Weighting Formula</span>
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            The overall Constituency Risk Score (0 to 100) is calculated as a calibrated weighted sum
            of four primary governance dimensions:
          </p>

          {/* Mathematical Formula Display */}
          <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs sm:text-sm overflow-x-auto mb-6">
            <code>
              Risk Score = (0.35 × Utilisation_Lag) + (0.25 × Sanction_Delay) + (0.20 × Cost_Variance) + (0.20 × Execution_Lag)
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-2xl font-black text-[#123b63] block">35%</span>
              <strong className="text-xs font-bold text-slate-800 block mt-1">Utilisation Lag</strong>
              <p className="text-[11px] text-slate-600 mt-1">
                Penalizes unspent capital balances and low expenditure ratios relative to released tranches.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-2xl font-black text-[#123b63] block">25%</span>
              <strong className="text-xs font-bold text-slate-800 block mt-1">Sanction Delay</strong>
              <p className="text-[11px] text-slate-600 mt-1">
                Evaluates days elapsed past the statutory 75-day MoSPI deadline for district approvals.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-2xl font-black text-[#123b63] block">20%</span>
              <strong className="text-xs font-bold text-slate-800 block mt-1">Cost Variance</strong>
              <p className="text-[11px] text-slate-600 mt-1">
                Measures deviation between administrative sanctions and actual contractor payouts.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-2xl font-black text-[#123b63] block">20%</span>
              <strong className="text-xs font-bold text-slate-800 block mt-1">Execution Lag</strong>
              <p className="text-[11px] text-slate-600 mt-1">
                Flags projects ongoing past their scheduled physical completion date (typically 12 months).
              </p>
            </div>
          </div>
        </section>

        {/* Risk Tiers & Actions */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs mb-8">
          <h2 className="text-xl font-bold text-[#123b63] mb-4">
            Risk Tier Classifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                <TbCircleCheck size={18} />
                <span>Low Risk (&lt; 35)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Constituencies demonstrating timely administrative sanctions (&lt;45 days), high fund
                utilization (&gt;75%), and regular submission of Utilization Certificates.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                <TbAlertTriangle size={18} />
                <span>Medium Risk (35 – 65)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Moderate delays approaching or slightly exceeding statutory sanction windows, or moderate
                unspent balances awaiting district execution orders.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-1">
                <TbAlertTriangle size={18} />
                <span>High Risk (&gt; 65)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Severe sanction logjams (&gt;90 days), severe unspent capital accumulations, or civil projects
                with multi-year execution stoppages requiring priority review.
              </p>
            </div>
          </div>
        </section>

        {/* Machine Learning & AI Honest Disclosure */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl font-bold text-[#123b63] mb-3 flex items-center gap-2">
            <TbBulb className="text-cyan-700" size={24} />
            <span>Honest Model & Algorithm Disclosure</span>
          </h2>
          <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
            <p>
              In alignment with principles of responsible AI and open governance, this prototype is fully transparent about its algorithmic implementation:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-700">
              <li>
                <strong>Heuristic vs Black-Box Models:</strong> The scoring engine runs on deterministic, auditable mathematical heuristics rather than opaque deep neural networks. Every score can be directly decomposed into its underlying sanction days, expenditure figures, and milestone dates.
              </li>
              <li>
                <strong>Retrieval-Augmented Chatbot:</strong> The assistant widget uses semantic vector retrieval strictly grounded in statutory MPLADS guidelines documents, answering governance queries with citations rather than generating unverified assertions.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MethodologyPage;
