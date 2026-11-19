import React from 'react';
import { Link } from 'react-router-dom';
import Toolbar from '../../components/shared/Toolbar';
import Footer from '../../components/shared/Footer';
import usePageSeo from '../../hooks/usePageSeo';
import {
  TbInfoCircle,
  TbShieldCheck,
  TbChartBar,
  TbCpu,
  TbBuildingCommunity,
  TbArrowRight,
  TbFileText,
  TbDatabase,
} from 'react-icons/tb';

const AboutPage = () => {
  usePageSeo(
    'About the Project | Smart India Hackathon Prototype',
    'Learn about MPLADS Risk Monitor: an independent Smart India Hackathon 2026 prototype demonstrating data-driven fund utilization monitoring, heuristic risk scoring, and public transparency.'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Application Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs text-slate-500">
            <li>
              <Link to="/" className="hover:text-[#123b63] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-[#123b63]" aria-current="page">
              About the Project
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[#123b63] text-xs font-bold uppercase tracking-wider mb-4 border border-slate-200">
              <TbInfoCircle size={15} />
              <span>Smart India Hackathon 2026 Prototype</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#123b63] tracking-tight leading-tight">
              About MPLADS Risk Monitor
            </h1>
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              An independent research and engineering prototype engineered to demonstrate
              how public datasets, automated anomaly heuristics, and geospatial intelligence
              can strengthen parliamentary fund monitoring in India.
            </p>
          </div>
        </div>

        {/* Prototype Independence Notice Callout */}
        <div
          role="region"
          aria-label="Statutory Independence Notice"
          className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 mb-10 flex items-start gap-3.5 text-amber-900"
        >
          <TbShieldCheck size={24} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="font-bold block mb-1">
              Independent Prototype Notice & Disclaimers
            </strong>
            <p>
              This web platform is an independent innovation prototype developed exclusively for the
              Smart India Hackathon (SIH) 2026 evaluation. It is <strong>not affiliated with, operated by, or endorsed by</strong> the
              Government of India, the Ministry of Statistics and Programme Implementation (MoSPI),
              or any official district administration.
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 2-Column Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Background & Challenge */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-bold text-[#123b63] mb-4 flex items-center gap-2">
                <TbBuildingCommunity className="text-cyan-700" size={22} />
                <span>The Challenge: MPLADS Monitoring at Scale</span>
              </h2>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Under the Member of Parliament Local Area Development Scheme (MPLADS), each Member of
                  Parliament (MP) has the entitlement to recommend developmental works to the tune of ₹5 Crore
                  per annum to their respective District Authorities. The scheme aims to create durable community
                  assets in areas such as drinking water, primary education, public sanitation, healthcare, and rural roads.
                </p>
                <p>
                  With 543 Lok Sabha constituencies spanning hundreds of thousands of individual civil projects,
                  traditional paper-based or disjointed portal tracking faces critical friction:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>
                    <strong>Sanction Bottlenecks:</strong> Significant time lags between MP recommendation and administrative sanction by District Authorities (often exceeding the statutory 75-day norm).
                  </li>
                  <li>
                    <strong>Unspent Balances:</strong> Idle funds accumulating across fiscal years without timely utilization certificates (UCs).
                  </li>
                  <li>
                    <strong>Expenditure Clustering:</strong> Spikes in contract awards toward the conclusion of tenure cycles rather than distributed developmental execution.
                  </li>
                  <li>
                    <strong>Information Asymmetry:</strong> Citizens and evaluators lack unified visual dashboards correlating risk indicators across constituencies.
                  </li>
                </ul>
              </div>
            </section>

            {/* The Solution */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-bold text-[#123b63] mb-4 flex items-center gap-2">
                <TbCpu className="text-cyan-700" size={22} />
                <span>The Prototype Solution</span>
              </h2>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  MPLADS Risk Monitor demonstrates a modern, transparent monitoring architecture combining:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-sm text-[#123b63] mb-1">Geospatial Choropleth</h3>
                    <p className="text-xs text-slate-600">
                      Interactive map of 543 parliamentary constituencies showing utilization rates, sanctioned works, and risk tiers at a glance.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-sm text-[#123b63] mb-1">Heuristic Anomaly Flags</h3>
                    <p className="text-xs text-slate-600">
                      Transparent statistical rules measuring sanction lags, execution progress, cost variations, and idle balances.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-sm text-[#123b63] mb-1">Multi-Role Demonstrations</h3>
                    <p className="text-xs text-slate-600">
                      Role-based portal flows for Parliamentarians (project recommendations) and District Authorities (sanction review).
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-sm text-[#123b63] mb-1">Guidelines Reference</h3>
                    <p className="text-xs text-slate-600">
                      Intelligent reference assistant explaining statutory permissible works, installment rules, and audit parameters.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Architecture & Engineering Standards */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-bold text-[#123b63] mb-4 flex items-center gap-2">
                <TbChartBar className="text-cyan-700" size={22} />
                <span>Engineering & Accessibility Standards</span>
              </h2>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Built with strict adherence to modern web standards, performance optimization, and accessibility principles:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>
                    <strong>Zero-Flash In-Memory Caching:</strong> Powered by TanStack Query with stale-while-revalidate caching so navigating between sections is instantaneous without false-stale risks.
                  </li>
                  <li>
                    <strong>Accessible Semantic Markup:</strong> Compliant with WCAG 2.2 AA guidelines, supporting full keyboard navigation, screen reader live regions, and reduced motion modes.
                  </li>
                  <li>
                    <strong>Optimized Bundle Architecture:</strong> Lightweight SVG vector assets, lazy-loaded components, and code splitting ensuring near-instantaneous First Contentful Paint.
                  </li>
                </ul>
              </div>
            </section>
          </div>

          {/* Sidebar / Reference Cards */}
          <div className="space-y-6">
            {/* Quick Links Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#123b63] mb-3">
                Transparency Resources
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link
                    to="/data-sources"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold group transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <TbDatabase size={16} className="text-[#123b63]" />
                      <span>Data Sources & Integrity</span>
                    </span>
                    <TbArrowRight size={14} className="text-slate-400 group-hover:text-[#123b63] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/methodology"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold group transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <TbFileText size={16} className="text-[#123b63]" />
                      <span>Risk Methodology & Rules</span>
                    </span>
                    <TbArrowRight size={14} className="text-slate-400 group-hover:text-[#123b63] group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Hackathon Specs Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs text-xs space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#123b63]">
                Project Metadata
              </h3>
              <div className="border-t border-slate-100 pt-2 space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Initiative</span>
                  <span className="font-semibold text-slate-800">Smart India Hackathon</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Edition</span>
                  <span className="font-semibold text-slate-800">SIH 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scope</span>
                  <span className="font-semibold text-slate-800">543 Lok Sabha Seats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-emerald-700">Prototype / Live Demo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Evaluation Portal</span>
                  <Link to="/login" className="font-semibold text-[#123b63] hover:underline">
                    Demo Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Reusable Footer */}
      <Footer />
    </div>
  );
};

export default AboutPage;
