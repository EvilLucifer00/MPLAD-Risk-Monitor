import React from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '../../components/shared/Toolbar';
import Footer from '../../components/shared/Footer';
import usePageSeo from '../../hooks/usePageSeo';
import {
  TbDatabase,
  TbShieldCheck,
  TbMathFunction,
  TbAlertCircle,
  TbExternalLink,
  TbCheck,
  TbFileSpreadsheet,
  TbMap2,
} from 'react-icons/tb';

const DataSourcesPage = () => {
  usePageSeo(
    'Data Sources & Data Integrity | MPLADS Risk Monitor',
    'Understand data provenance, derived metrics, and demonstration datasets utilized by the MPLADS Risk Monitor SIH prototype.'
  );

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
              Data Sources & Integrity
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[#123b63] text-xs font-bold uppercase tracking-wider mb-4 border border-slate-200">
              <TbDatabase size={15} />
              <span>Data Provenance & Integrity</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#123b63] tracking-tight leading-tight">
              Data Sources, Derived Metrics & Synthesis Disclosures
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              Transparent disclosure of data origins, computational formulas, demonstration datasets,
              and analytical boundaries used across the prototype.
            </p>
          </div>
        </div>

        {/* Synthetic Baseline Disclosure Banner */}
        <div
          role="region"
          aria-label="Demonstration Data Disclosure"
          className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-5 mb-10 flex items-start gap-3.5 text-cyan-950"
        >
          <TbAlertCircle size={24} className="text-cyan-800 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="font-bold block mb-1">
              Demonstration & Synthetic Data Disclosure
            </strong>
            <p>
              To provide a comprehensive interactive evaluation of 543 Parliamentary Constituencies without
              compromising privacy or relying on unstable real-time scraping, this prototype utilizes
              <strong> demonstration baseline snapshots and synthetic project scenarios</strong>. These datasets
              simulate realistic operational variations (such as sanction lags and unspent balances) for system evaluation
              and must <strong>not</strong> be cited as official audit findings or allegations against specific representatives.
            </p>
          </div>
        </div>

        {/* 3 Categories Section */}
        <div className="space-y-8">
          {/* Category 1: Official Data Sources */}
          <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#123b63] flex items-center justify-center shrink-0">
                <TbFileSpreadsheet size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#123b63]">
                  1. Official Public Reference Sources
                </h2>
                <p className="text-xs text-slate-500">
                  Authoritative public documents and spatial datasets establishing real-world baseline schema
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#123b63] mb-1.5 flex items-center justify-between">
                    <span>MoSPI MPLADS Portal</span>
                    <a
                      href="https://mplads.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-[#123b63]"
                      title="Open portal"
                    >
                      <TbExternalLink size={14} />
                    </a>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Official guidelines documentation, permissible works schedules, installment release rules,
                    and statutory timeline specifications published by the Ministry of Statistics and Programme Implementation.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <TbCheck size={14} className="text-emerald-600" />
                  <span>Ground truth for statutory business rules</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#123b63] mb-1.5 flex items-center justify-between">
                    <span>Open Govt Data (OGD)</span>
                    <a
                      href="https://data.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-[#123b63]"
                      title="Open data portal"
                    >
                      <TbExternalLink size={14} />
                    </a>
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Historical national aggregates, state-wise fund release ceilings (₹5 Cr/year/constituency),
                    and published sector distributions across public infrastructure domains.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <TbCheck size={14} className="text-emerald-600" />
                  <span>Baseline financial limits and categories</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#123b63] mb-1.5 flex items-center justify-between">
                    <span>Parliamentary Boundaries GIS</span>
                    <TbMap2 size={15} className="text-slate-400" />
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Public domain Survey of India and Election Commission administrative boundary GeoJSON polygons
                    for all 543 Lok Sabha constituencies, optimized for high-performance interactive rendering.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <TbCheck size={14} className="text-emerald-600" />
                  <span>Geographic coordinates & boundary polygons</span>
                </div>
              </div>
            </div>
          </section>

          {/* Category 2: Derived Metrics & Formulas */}
          <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#123b63] flex items-center justify-center shrink-0">
                <TbMathFunction size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#123b63]">
                  2. Derived Computational Metrics
                </h2>
                <p className="text-xs text-slate-500">
                  Mathematical formulas executed by the analytics engine to identify operational delays and risk states
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-[#123b63] mb-1">Fund Utilisation Rate</h3>
                <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[#123b63] block mb-2">
                  Utilisation (%) = (Total Expenditure ÷ Total Entitlement Released) × 100
                </code>
                <p className="text-xs text-slate-600">
                  Measures the percentage of disbursed public capital that has been converted into verified field expenditure.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-[#123b63] mb-1">Sanction Delay (Days)</h3>
                <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[#123b63] block mb-2">
                  Delay = Date(District Sanction) − Date(MP Recommendation)
                </code>
                <p className="text-xs text-slate-600">
                  Evaluates administrative processing speed against the official MoSPI norm of <strong>75 days</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-[#123b63] mb-1">Execution Lag Index</h3>
                <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[#123b63] block mb-2">
                  Lag = Days Elapsed from Work Order ÷ Scheduled Completion Period (Days)
                </code>
                <p className="text-xs text-slate-600">
                  Flags civil infrastructure works that exceed their stipulated completion timelines (standard norm: 12 months).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-sm text-[#123b63] mb-1">Cost Escalation Variance</h3>
                <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono text-[#123b63] block mb-2">
                  Variance (%) = ((Actual Expenditure − Sanctioned Amount) ÷ Sanctioned Amount) × 100
                </code>
                <p className="text-xs text-slate-600">
                  Detects budget overruns and unauthorized financial escalations requiring administrative sanction review.
                </p>
              </div>
            </div>
          </section>

          {/* Category 3: Synthetic & Demonstration Models */}
          <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <TbShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#123b63]">
                  3. Demonstration Datasets & Synthetic Generation Rules
                </h2>
                <p className="text-xs text-slate-500">
                  Specific disclosures regarding synthetic test fixtures and baseline data
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                In order to guarantee that hackathon evaluators can test every capability across the entire country:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-700">
                <li>
                  <strong>Constituency Risk Snapshot (<code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">constituencyRiskData.json</code>):</strong>
                  Contains 543 baseline records. While constituency names, state boundaries, and Lok Sabha allocations are real,
                  the specific numeric distribution of flagged works and composite scores are calibrated demonstration baselines designed to stress-test choropleth color grading and multi-level filtering.
                </li>
                <li>
                  <strong>Evaluation Demonstration Roles:</strong> Accounts such as <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">MP-001</code> (Member of Parliament) and <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">DM-001</code> (District Authority) access isolated database records demonstrating two-way recommendation and sanction review.
                </li>
                <li>
                  <strong>Statutory Integrity:</strong> No actual public funds or legal liabilities are affected by actions submitted within this prototype.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DataSourcesPage;
