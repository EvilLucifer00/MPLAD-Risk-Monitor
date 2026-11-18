import React, { useState, useEffect, Suspense, lazy } from "react";
import Toolbar from "../../components/shared/Toolbar";
import Card from "../../components/shared/Card";
import {
  IconWallet,
  IconShieldExclamation,
  IconChartBar,
  IconScale,
} from "../../components/shared/HomeIcons";
import IndianMonumentsSkyline from "../../components/shared/IndianMonumentsSkyline";
import EmblemImage from "../../components/shared/EmblemImage";

// Code-split below-the-fold & secondary components to ensure instantaneous FCP and LCP
const RiskMap = lazy(() => import("../../components/map/RiskMap"));
const OverviewSection = lazy(() => import("../../components/home/OverviewSection"));
const HowItWorksSection = lazy(() => import("../../components/home/HowItWorksSection"));
const KeyFeaturesSection = lazy(() => import("../../components/home/KeyFeaturesSection"));
const AiAssistantWidget = lazy(() => import("../../components/shared/AiAssistantWidget.jsx"));

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [statesList, setStatesList] = useState([]);
  const [mapMounted, setMapMounted] = useState(false);
  const [aiMounted, setAiMounted] = useState(false);

  const mapContainerRef = React.useRef(null);

  useEffect(() => {
    // 1. Defer heavy geospatial Map until viewport intersection or first user interaction
    const triggerMap = () => {
      setMapMounted(true);
      window.removeEventListener("scroll", triggerMap);
      window.removeEventListener("pointerdown", triggerMap);
      window.removeEventListener("keydown", triggerMap);
    };

    window.addEventListener("scroll", triggerMap, { passive: true, once: true });
    window.addEventListener("pointerdown", triggerMap, { passive: true, once: true });
    window.addEventListener("keydown", triggerMap, { passive: true, once: true });

    let observer;
    if (typeof window !== "undefined" && "IntersectionObserver" in window && mapContainerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            triggerMap();
            if (observer) observer.disconnect();
          }
        },
        { rootMargin: "150px" }
      );
      observer.observe(mapContainerRef.current);
    }

    // 2. Defer AI Assistant Widget off the critical path until first user scroll/interaction
    const triggerAi = () => {
      setAiMounted(true);
      window.removeEventListener("scroll", triggerAi);
      window.removeEventListener("pointerdown", triggerAi);
    };

    window.addEventListener("scroll", triggerAi, { passive: true, once: true });
    window.addEventListener("pointerdown", triggerAi, { passive: true, once: true });

    return () => {
      window.removeEventListener("scroll", triggerMap);
      window.removeEventListener("pointerdown", triggerMap);
      window.removeEventListener("keydown", triggerMap);
      window.removeEventListener("scroll", triggerAi);
      window.removeEventListener("pointerdown", triggerAi);
      if (observer) observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Priority Preload hero image specifically for HomePage LCP with AVIF detection
    const isAvifSupported = () => {
      try {
        const elem = document.createElement("canvas");
        return elem.getContext && elem.toDataURL("image/avif").indexOf("data:image/avif") === 0;
      } catch {
        return false;
      }
    };
    const useAvif = isAvifSupported();
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = useAvif
      ? (isMobile ? "/images/mplad_headquarters-mobile.avif" : "/images/mplad_headquarters.avif")
      : (isMobile ? "/images/mplad_headquarters-mobile.webp" : "/images/mplad_headquarters.webp");
    link.type = useAvif ? "image/avif" : "image/webp";
    link.fetchPriority = "high";
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if ((searchTerm || filterState || filterRisk) && !mapMounted) {
      setMapMounted(true);
    }
  }, [searchTerm, filterState, filterRisk, mapMounted]);

  useEffect(() => {
    // Scroll progress indicator fallback for browsers lacking CSS animation-timeline
    if (typeof window === 'undefined') return;
    if (window.CSS && window.CSS.supports && window.CSS.supports('animation-timeline', 'scroll()')) return;

    const progressEl = document.querySelector('.scroll-progress-indicator');
    if (!progressEl) return;

    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0) {
        const progressPercentage = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
        progressEl.style.transform = `scaleX(${progressPercentage})`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="w-full bg-slate-50 relative overflow-x-clip min-h-screen">
      {/* Scroll Progress Bar (Indian Flag Tiranga: Saffron, White, Green with smoothly blended boundaries) */}
      <div
        className="fixed top-0 left-0 right-0 h-[3.5px] origin-left z-[9999] pointer-events-none scroll-progress-indicator"
        aria-hidden="true"
      />

      {/* Official Header Toolbar */}
      <Toolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterState={filterState}
        setFilterState={setFilterState}
        filterRisk={filterRisk}
        setFilterRisk={setFilterRisk}
        statesList={statesList}
      />

      {/* Main Top Section */}
      <div className="w-full relative pb-4 px-4 sm:px-6 lg:px-12">
        <main
          id="main-content"
          className="max-w-7xl mx-auto flex flex-col lg:flex-row w-full flex-1 min-h-0 relative z-10"
        >
          {/* Left Column: Hero & Pillars */}
          <div className="w-full lg:w-[50%] py-4 lg:pr-6 flex flex-col border-b border-slate-200/80 pb-6 lg:border-b-0 lg:pb-4 lg:border-r">
            {/* Page 1 Hero Card */}
            <div className="relative w-full mb-4 shadow-xl rounded-3xl shrink-0 overflow-hidden isolate transform-gpu clip-corners-fix">
              {/* Background Image */}
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-ken-burns rounded-3xl bg-mplad-headquarters" />
              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#123b63]/95 via-[#123b63]/70 to-black/30 rounded-3xl pointer-events-none" />

              <div className="relative z-10 px-5 sm:px-6 py-4 sm:py-5 flex flex-col h-full justify-between">
                {/* Government Logo + Information */}
                <div className="flex items-center gap-3 pb-3 border-b border-white/15">
                  <EmblemImage
                    width="32"
                    height="40"
                    alt="Government of India"
                    className="w-8 h-10 object-contain drop-shadow-sm"
                  />
                  <div className="text-white leading-tight">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-200 font-bold">
                        Government of India
                      </p>
                      <span className="text-white/40 text-[9px]">•</span>
                      <span className="text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">
                        Official Portal
                      </span>
                    </div>
                    <p className="font-semibold text-xs sm:text-[13px] text-white tracking-tight mt-0.5">
                      Ministry of Statistics and Programme Implementation
                    </p>
                  </div>
                </div>

                {/* Scheme Identity & Headline */}
                <div className="my-2.5 sm:my-4">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-cyan-300 block mb-1">
                    Member of Parliament Local Area Development Scheme (MPLADS)
                  </span>

                  <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-[28px] text-white leading-tight tracking-tight drop-shadow-md">
                    Connecting Public Funds to{" "}
                    <span className="text-cyan-300 relative inline-block">
                      Public Impact
                      <span className="absolute -bottom-1 left-0 w-full h-[2.5px] bg-cyan-400 rounded-full opacity-90" />
                    </span>
                  </h1>

                  <p className="hidden sm:inline font-normal mt-2 sm:mt-2.5 text-xs text-slate-200 leading-relaxed max-w-xl">
                    National digital monitoring and risk surveillance platform
                    for public developmental works, fund utilization auditing,
                    and statutory compliance across 543 Parliamentary
                    Constituencies.
                  </p>
                </div>

                {/* Statutory Key Facts Strip - Hidden on mobile so image is not excessively cropped */}
                <div className="hidden sm:flex pt-2.5 border-t border-white/15 flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="text-slate-300">
                      Statutory Allocation:
                    </span>
                    <span className="font-semibold text-white tabular-nums">
                      ₹5.00 Cr / MP
                    </span>
                  </div>
                  <span className="text-white/30 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300">Coverage:</span>
                    <span className="font-semibold text-white">
                      543 Constituencies
                    </span>
                  </div>
                  <span className="text-white/30 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-slate-300">Scheme Nature:</span>
                    <span className="font-semibold text-white">
                      Non-Lapsable Fund
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Scheme Pillars Header */}
            <div className="px-1 flex-1 flex flex-col">
              <div className="border-b border-slate-200 pb-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#123b63]">
                  Core Scheme Pillars
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Key functional objectives established under the official
                  MPLADS governance framework.
                </p>
              </div>

              {/* Informational Cards Grid (Non-interactive) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <Card
                  index="01"
                  title="Fund Tracking"
                  icon={IconWallet}
                  accent="emerald"
                  tag="Allocation"
                  metric="₹5 Cr / Seat"
                  description="Real-time monitoring of fund releases, sanction orders, and utilization certificates."
                />
                <Card
                  index="02"
                  title="Risk Assessment"
                  icon={IconShieldExclamation}
                  accent="amber"
                  tag="Surveillance"
                  metric="4-Engine Check"
                  description="Algorithmic rate variance, delay hazards, and vendor concentration scoring."
                />
                <Card
                  index="03"
                  title="State Benchmarks"
                  icon={IconChartBar}
                  accent="cyan"
                  tag="543 Seats"
                  metric="National Analytics"
                  description="Comparative expenditure velocity and project completion rates across states."
                />
                <Card
                  index="04"
                  title="Statutory Audit"
                  icon={IconScale}
                  accent="navy"
                  tag="Transparency"
                  metric="MoSPI Audit Log"
                  description="Public accountability through immutable record trails and guideline validation."
                />
              </div>

              {/* Statutory Framework Quick Notice */}
              <div className="mt-3.5 bg-slate-100/60 border border-slate-200 rounded p-2.5 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#123b63]" />
                  <span className="font-semibold text-slate-800 text-[11px]">
                    Guideline Adherence:
                  </span>
                  <span className="text-[11px] text-slate-600">
                    MoSPI Non-Lapsable Fund Allocation Framework
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Para 2.1 • FY 2025-26
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: GIS Map Container */}
          <div
            id="geospatial-map"
            className="w-full lg:w-[50%] py-4 lg:pl-6 flex flex-col items-start"
          >
            <div className="w-full border-b border-slate-200 pb-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#123b63]">
                National Interactive Map
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                Constituency boundary choropleth based on official Survey of
                India cartographic data.
              </p>
            </div>

            <div
              ref={mapContainerRef}
              onMouseEnter={() => !mapMounted && setMapMounted(true)}
              onTouchStart={() => !mapMounted && setMapMounted(true)}
              className="relative z-10 w-full h-[360px] sm:h-[440px] lg:h-[640px] overflow-hidden mt-3 sm:mt-5"
            >
              {mapMounted ? (
                <Suspense
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-600">
                      <div className="w-8 h-8 border-2 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-medium text-slate-600 mt-3">
                        Loading Geospatial Data...
                      </p>
                    </div>
                  }
                >
                  <RiskMap
                    searchTerm={searchTerm}
                    filterState={filterState}
                    filterRisk={filterRisk}
                    setStatesList={setStatesList}
                  />
                </Suspense>
              ) : (
                <div
                  onClick={() => setMapMounted(true)}
                  className="w-full h-full flex flex-col items-center justify-center bg-slate-50 cursor-pointer"
                >
                  <div className="w-8 h-8 border-2 border-[#123b63] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-medium text-slate-600 mt-3">
                    Click to load national constituency map
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Official Scheme Transition Divider ── */}
      <div
        className="w-full bg-slate-100/80 border-y border-slate-200 py-3 sm:py-3.5 px-4 sm:px-6 lg:px-12 relative z-10"
        role="separator"
        aria-label="Section Transition Divider"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600">
          {/* Left: National Scheme Identification */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5 shrink-0" aria-hidden="true">
              <span className="w-5 h-0.5 bg-[#FF9933] rounded-full" />
              <span className="w-5 h-0.5 bg-slate-300 rounded-full" />
              <span className="w-5 h-0.5 bg-[#138808] rounded-full" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#123b63]">
                National Scheme Governance & Oversight
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Ministry of Statistics and Programme Implementation (MoSPI) •
                Statutory Monitoring Framework
              </p>
            </div>
          </div>

          {/* Right: Architectural Skyline Silhouette & Motto */}
          <div className="flex items-center gap-4">
            <IndianMonumentsSkyline
              variant="light"
              className="w-[180px] sm:w-[240px] lg:w-[300px] h-[32px] sm:h-[38px] opacity-70"
            />
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-300 text-[10px] font-bold tracking-widest text-slate-500 uppercase whitespace-nowrap">
              <span>Sabka Saath</span>
              <span className="text-[#FF9933]">•</span>
              <span>Sabka Vikas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scheme Information & Statistics */}
      <div className="w-full relative">
        <Suspense fallback={<div className="min-h-[120px]" />}>
          <OverviewSection />
        </Suspense>

        <Suspense fallback={<div className="min-h-[120px]" />}>
          <HowItWorksSection />
        </Suspense>

        <Suspense fallback={<div className="min-h-[120px]" />}>
          <KeyFeaturesSection />
        </Suspense>

        {/* Official Governance Mandate Section */}
        <section className="bg-slate-100 px-4 sm:px-6 lg:px-12 py-8 border-b border-slate-200">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-12 items-start">
            <div className="md:w-64 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#123b63]">
                Policy Framework
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                Statutory Mandate
              </h2>
            </div>

            <div className="flex-1">
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                The Member of Parliament Local Area Development Scheme is
                administered under comprehensive operational guidelines
                formulated by the Ministry of Statistics and Programme
                Implementation. Funds are non-lapsable and dedicated to creating
                durable public capital assets of community priority in rural and
                urban constituencies across India.
              </p>
            </div>

            <div className="md:w-72 shrink-0 border-l border-slate-300 pl-4">
              <p className="text-xs font-semibold text-slate-800">
                Guidelines for Indian Government Websites (GIGW)
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                Compliant with accessibility, open data standards, and
                transparent public reporting norms.
              </p>
            </div>
          </div>
        </section>

        {/* Standard Government Portal Footer */}
        <footer className="bg-[#0b2545] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {/* Ministry Brand Lockup */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-2.5">
                <EmblemImage
                  alt="State Emblem of India"
                  width="36"
                  height="44"
                  className="w-9 h-11 object-contain shrink-0"
                />
                <div>
                  <p className="font-bold text-sm leading-tight text-white">
                    MPLADS Risk Monitor
                  </p>
                  <p className="text-xs text-slate-300">
                    Ministry of Statistics & Programme Implementation
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Government of India
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed mt-2">
                An official open governance initiative providing real-time
                expenditure surveillance and anomaly detection for Member of
                Parliament developmental funds.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">
                Navigation
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    National Overview
                  </a>
                </li>
                <li>
                  <a
                    href="#geospatial-map"
                    className="hover:text-white transition-colors"
                  >
                    Geospatial Map
                  </a>
                </li>
                <li>
                  <a
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    Parliamentarian Portal
                  </a>
                </li>
                <li>
                  <a
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    District Authority Portal
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal & Policy */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">
                Statutory Resources
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>
                  <a
                    href="https://mplads.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Official MoSPI MPLADS Portal
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.india.gov.in"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    National Portal of India
                  </a>
                </li>
                <li>
                  <a
                    href="/llms.txt"
                    className="hover:text-white transition-colors"
                  >
                    LLM Guidance (llms.txt)
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Accessibility Statement
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="border-t border-white/10 px-4 sm:px-6 lg:px-12 py-3">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-400 text-center sm:text-left">
              <p>
                © 2026 Government of India. Ministry of Statistics and Programme
                Implementation.
              </p>
              <p>
                Designed in compliance with Guidelines for Indian Government
                Websites (GIGW).
              </p>
            </div>
          </div>
        </footer>
      </div>

      {aiMounted && (
        <Suspense fallback={null}>
          <AiAssistantWidget />
        </Suspense>
      )}
    </div>
  );
};

export default Home;
