import React, { useState, useEffect, Suspense, lazy } from "react";
import Toolbar from "../../components/shared/Toolbar";
import Card from "../../components/shared/Card";
import {
  IconWallet,
  IconShieldExclamation,
  IconChartBar,
  IconScale,
  IconMapPin,
  IconTwitter,
  IconLinkedin,
  IconYoutube,
  IconMail
} from "../../components/shared/HomeIcons";
import IndianMonumentsSkyline from "../../components/shared/IndianMonumentsSkyline";
import EmblemImage from "../../components/shared/EmblemImage";

// Code-split below-the-fold & secondary components to ensure instantaneous FCP and LCP
const RiskMap = lazy(() => import("../../components/map/RiskMap"));
const OverviewSection = lazy(() => import("../../components/home/OverviewSection"));
const HowItWorksSection = lazy(() => import("../../components/home/HowItWorksSection"));
const KeyFeaturesSection = lazy(() => import("../../components/home/KeyFeaturesSection"));
const AiAssistantWidget = lazy(() => import("../../components/shared/AiAssistantWidget.jsx"));
import Reveal from "../../animations/Reveal";

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
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = useAvif ? "/images/mplad_headquarters.avif" : "/images/mplad_headquarters.webp";
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
    // Fallback passive scroll listener for browsers lacking CSS animation-timeline
    if (typeof window === 'undefined') return;
    if (window.CSS && window.CSS.supports && window.CSS.supports('animation-timeline', 'scroll()')) return;
    let ticking = false;
    const updateProgress = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const total = document.documentElement.scrollHeight - window.innerHeight;
          const prog = total > 0 ? window.scrollY / total : 0;
          document.documentElement.style.setProperty('--scroll-progress', prog.toString());
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="w-full bg-slate-50 relative overflow-x-clip min-h-screen">
      {/* Scroll Progress Bar - Pure CSS Scroll-Driven / Off-Thread Composited (Indian Flag Tiranga: Saffron, White, Green side-by-side) */}
      <div
        className="fixed top-0 left-0 right-0 h-[3.5px] origin-left z-[9999] pointer-events-none scroll-progress-indicator flex"
        aria-hidden="true"
      >
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-[#FFFFFF]" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      {/* ── STICKY NAVIGATION BAR (Stays sticky for the entire homepage!) ── */}
      <Toolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterState={filterState}
        setFilterState={setFilterState}
        filterRisk={filterRisk}
        setFilterRisk={setFilterRisk}
        statesList={statesList}
      />

      {/* ── PAGE 1 CONTAINER (All decorative SVGs are strictly scoped here) ── */}
      <div className="flex flex-col w-full relative overflow-hidden pb-4">
        {/* BACKGROUND DECORATIONS */}
        {/* Top Right Ashoka Chakra */}
        <svg
          className="hidden lg:block absolute top-[-8%] right-[-2%] w-[45%] max-w-[600px] aspect-square pointer-events-none z-0 opacity-[0.04]"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#123b63"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#123b63"
            strokeWidth="0.5"
          />
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="50"
              x2="50"
              y2="8"
              stroke="#123b63"
              strokeWidth="1"
              transform={`rotate(${i * 15} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="5" fill="#123b63" />
        </svg>

        {/* Top Right Tricolor Swoosh */}
        <svg
          className="hidden lg:block absolute top-0 right-0 w-[38%] h-[50%] pointer-events-none z-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 0 C 40 30, 70 70, 100 100 L 100 0 Z"
            fill="#138808"
            opacity="0.12"
          />
          <path
            d="M 20 0 C 50 30, 80 60, 100 80 L 100 0 Z"
            fill="#ffffff"
            opacity="0.5"
          />
          <path
            d="M 40 0 C 60 25, 85 45, 100 60 L 100 0 Z"
            fill="#FF9933"
            opacity="0.15"
          />
        </svg>

        {/* Bottom Left Tricolor Swoosh */}
        <svg
          className="hidden lg:block absolute bottom-0 left-0 w-[30%] h-[35%] pointer-events-none z-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 0 C 30 50, 60 80, 100 100 L 0 100 Z"
            fill="#FF9933"
            opacity="0.12"
          />
          <path
            d="M 0 25 C 25 55, 50 85, 80 100 L 0 100 Z"
            fill="#ffffff"
            opacity="0.5"
          />
          <path
            d="M 0 50 C 15 65, 40 90, 60 100 L 0 100 Z"
            fill="#138808"
            opacity="0.12"
          />
        </svg>

        {/* Bottom Right Skyline & Text */}
        <div className="absolute bottom-4 right-2 sm:right-6 lg:right-12 flex flex-col items-end gap-1.5 lg:gap-2 z-0 pointer-events-none max-w-[95vw]">
                    <IndianMonumentsSkyline
            variant="light"
            className="w-[280px] sm:w-[350px] lg:w-[450px] h-auto lg:h-[55px] opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
          <div className="flex items-center gap-1.5 lg:gap-3 w-full justify-end">
            <div className="flex gap-0.5 shrink-0">
              <div className="w-2.5 lg:w-4 h-0.5 bg-[#FF9933]"></div>
              <div className="w-2.5 lg:w-4 h-0.5 bg-[#ffffff]"></div>
              <div className="w-2.5 lg:w-4 h-0.5 bg-[#138808]"></div>
            </div>
            <p className="text-[6.5px] sm:text-[7.5px] lg:text-[9px] font-bold tracking-[0.1em] lg:tracking-[0.2em] text-slate-600 uppercase whitespace-nowrap">
              Sabka Saath | Sabka Vikas | Mazboot Bharat
            </p>
            <div className="flex gap-0.5 shrink-0">
              <div className="w-2.5 lg:w-4 h-0.5 bg-[#FF9933]"></div>
              <div className="w-2.5 lg:w-4 h-0.5 bg-[#ffffff]"></div>
              <div className="w-2.5 lg:w-4 h-0.5 bg-[#138808]"></div>
            </div>
          </div>
        </div>

        <main
          id="main-content"
          className="flex flex-col lg:flex-row w-full flex-1 min-h-0 relative z-10"
        >
          <div className="w-full lg:w-[52%] px-4 sm:px-6 py-3 flex flex-col">
            <div className="relative w-full mb-4 shadow-xl rounded-3xl shrink-0 overflow-hidden isolate transform-gpu clip-corners-fix">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-ken-burns rounded-3xl bg-mplad-headquarters"
              />
              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#123b63]/95 via-[#123b63]/70 to-black/30 rounded-3xl pointer-events-none" />

              <div className="relative z-10 px-6 py-5 flex flex-col h-full">
                {/* Government Logo + Information */}
                <div className="flex items-center gap-3 mb-4">
                  <EmblemImage
                    width="32"
                    height="40"
                    alt="Government of India"
                    className="w-8 h-10 object-contain"
                  />
                  <div className="text-white leading-tight">
                    <p className="text-[10px] uppercase tracking-wider text-slate-100 font-bold mb-0.5">
                      Government of India
                    </p>
                    <p className="font-semibold text-xs drop-shadow-sm">
                      Ministry of Statistics and Programme Implementation
                    </p>
                  </div>
                </div>

                {/* Page 1 Header - Unwrapped from Reveal to eliminate 770ms element render delay for LCP */}
                <h1 className="font-extrabold mt-6 lg:mt-10 text-2xl lg:text-3xl text-white leading-tight tracking-tight drop-shadow-md max-w-2xl">
                  Connecting Public Funds to <br />
                  <span className="text-cyan-400 relative inline-block mt-1">
                    Public Impact
                    <span className="absolute -bottom-1.5 left-0 w-full h-1 bg-cyan-400 rounded-full opacity-80" />
                  </span>
                </h1>
                <p className="font-light mt-3 text-sm lg:text-base text-slate-200 max-w-xl leading-normal">
                  Transparency that drives development,
                  <br /> powered by AI-driven insights.
                </p>
              </div>
            </div>

            <div className="px-1 flex-1 flex flex-col">
              {/* Civic Focus Header */}
              <div className="flex items-center justify-between pt-1 pb-2 px-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF9933]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#138808]" />
                  </div>
                  <h2 className="text-[10.5px] sm:text-xs font-bold uppercase tracking-wider text-[#123b63]">
                    Core Pillars
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("geospatial-map");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Live Platform: 543 Constituencies Online (Click to view map)"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/80 text-[10px] sm:text-[11px] font-bold text-emerald-800 shadow-2xs cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 select-none"
                >
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="animate-live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="animate-live-blink relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
                  </span>
                  Live Platform
                </button>
              </div>

              <Reveal staggerChildren={0.08}>
                <div className="grid grid-cols-2 gap-2 sm:gap-3.5 pt-0.5">
                  <Card
                    index="01"
                    title="Track Funds"
                    icon={IconWallet}
                    accent="emerald"
                    tag="Real-Time"
                    metric="₹5 Cr / Seat"
                    description="Monitor MPLADS fund allocation and utilization across all constituencies in real-time."
                  />
                  <Card
                    index="02"
                    title="Identify Risks"
                    icon={IconShieldExclamation}
                    accent="amber"
                    tag="AI Radar"
                    metric="AI Anomaly Engine"
                    description="Our AI-driven risk scoring highlights anomalies and potential delays in project execution."
                  />
                  <Card
                    index="03"
                    title="Compare Performance"
                    icon={IconChartBar}
                    accent="cyan"
                    tag="543 Seats"
                    metric="State Benchmarks"
                    description="Evaluate and compare the performance of different states and representatives effortlessly."
                  />
                  <Card
                    index="04"
                    title="Ensure Accountability"
                    icon={IconScale}
                    accent="navy"
                    tag="Open Data"
                    metric="MoSPI Audit Trail"
                    description="Promote transparency in public spending by giving citizens access to critical financial data."
                  />
                </div>
              </Reveal>

              <Reveal delay={0.25}>
                <div
                  onClick={() => {
                    const el = document.getElementById("geospatial-map");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-3 sm:mt-5 bg-white border border-slate-200/90 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 mb-2 shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center gap-3.5 relative overflow-hidden group shrink-0 cursor-pointer touch-manipulation"
                >
                  <div
                    aria-hidden="true"
                    className="absolute top-0 right-0 w-32 h-32 bg-cyan-100/60 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-80 transition-opacity duration-500"
                  />
                  <div className="relative z-10 flex gap-3.5 w-full items-center">
                    <div className="p-2 bg-blue-50 text-[#123b63] rounded-xl shrink-0 group-hover:bg-[#123b63] group-hover:text-white transition-colors duration-200">
                      <IconMapPin
                        size={22}
                        className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 text-cyan-800 group-hover:text-cyan-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h2 className="font-extrabold text-[13.5px] sm:text-base text-[#123b63] tracking-tight">
                          Explore the Geospatial Map
                        </h2>
                        <span className="text-cyan-800 font-bold text-xs group-hover:translate-x-1 transition-transform duration-150 flex items-center gap-0.5">
                          View <span className="text-[10px]">→</span>
                        </span>
                      </div>
                      <p className="font-medium text-slate-600 text-[11px] sm:text-xs leading-snug sm:leading-relaxed mt-0.5 truncate sm:text-wrap">
                        Select any of the 543 constituencies to view AI risk scoring & analytics.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          <div id="geospatial-map" className="relative w-full lg:w-[48%] p-4 lg:p-4 mt-4 lg:mt-0 flex items-start">
            {/* MOBILE ONLY: Background Decorations tightly wrapping the map */}
            <svg
              className="lg:hidden absolute top-[-5%] right-[-5%] w-[70%] aspect-square pointer-events-none z-0 opacity-[0.05]"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#123b63"
                strokeWidth="2"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#123b63"
                strokeWidth="0.5"
              />
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="8"
                  stroke="#123b63"
                  strokeWidth="1"
                  transform={`rotate(${i * 15} 50 50)`}
                />
              ))}
              <circle cx="50" cy="50" r="5" fill="#123b63" />
            </svg>
            <svg
              className="lg:hidden absolute top-0 right-0 w-[55%] h-[70%] pointer-events-none z-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 0 C 40 30, 70 70, 100 100 L 100 0 Z"
                fill="#138808"
                opacity="0.12"
              />
              <path
                d="M 20 0 C 50 30, 80 60, 100 80 L 100 0 Z"
                fill="#ffffff"
                opacity="0.5"
              />
              <path
                d="M 40 0 C 60 25, 85 45, 100 60 L 100 0 Z"
                fill="#FF9933"
                opacity="0.15"
              />
            </svg>
            <svg
              className="lg:hidden absolute bottom-[-5%] left-[-2%] w-[45%] h-[50%] pointer-events-none z-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 0 C 30 50, 60 80, 100 100 L 0 100 Z"
                fill="#FF9933"
                opacity="0.12"
              />
              <path
                d="M 0 25 C 25 55, 50 85, 80 100 L 0 100 Z"
                fill="#ffffff"
                opacity="0.5"
              />
              <path
                d="M 0 50 C 15 65, 40 90, 60 100 L 0 100 Z"
                fill="#138808"
                opacity="0.12"
              />
            </svg>

            <div
              ref={mapContainerRef}
              onMouseEnter={() => !mapMounted && setMapMounted(true)}
              onTouchStart={() => !mapMounted && setMapMounted(true)}
              className="relative z-10 w-full h-[320px] sm:h-[400px] lg:h-[680px] overflow-hidden rounded-2xl lg:rounded-xl"
            >
              {mapMounted ? (
                <Suspense
                  fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/5 rounded-2xl border border-slate-200">
                      <div className="w-9 h-9 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-semibold text-slate-600 mt-3 tracking-wide">
                        Loading Geospatial Map...
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
                  className="w-full h-full flex flex-col items-center justify-center bg-slate-900/5 rounded-2xl border border-slate-200 cursor-pointer group"
                >
                  <div className="w-9 h-9 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold text-slate-600 mt-3 tracking-wide group-hover:text-cyan-800 transition-colors">
                    Initializing Geospatial Map...
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── PAGE 2 CONTENT ── */}
      <div className="w-full relative">
        {/* ── Stats Section ── */}
        <Suspense fallback={<div className="min-h-[160px]" />}>
          <OverviewSection />
        </Suspense>

        {/* ── How It Works ── */}
        <Suspense fallback={<div className="min-h-[160px]" />}>
          <HowItWorksSection />
        </Suspense>

        {/* ── Key Features ── */}
        <Suspense fallback={<div className="min-h-[160px]" />}>
          <KeyFeaturesSection />
        </Suspense>

        {/* ── Our Vision ── */}
        <section className="bg-blue-50 px-6 lg:px-10 py-10 lg:py-12 border-b border-slate-200 overflow-hidden relative">
          <svg
            className="absolute -right-6 sm:-right-2 lg:-right-12 bottom-0 w-[290px] sm:w-[350px] lg:w-[410px] h-auto max-h-[96%] opacity-40 pointer-events-none select-none transition-opacity duration-300"
            viewBox="0 0 280 290"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* ── Base / Cascading Plinth Steps (flush with bottom edge) ── */}
            <rect x="16" y="282" width="248" height="8" rx="0.5" fill="#c3dcf7" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            <rect x="26" y="275" width="228" height="7" rx="0.5" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            <rect x="34" y="268" width="212" height="7" rx="0.5" fill="#d9e8fa" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />

            {/* ── Left Pier Plinth Base ── */}
            <rect x="38" y="256" width="64" height="12" rx="1" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            <rect x="42" y="252" width="56" height="4" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.1" strokeLinejoin="round" />

            {/* ── Right Pier Plinth Base ── */}
            <rect x="178" y="256" width="64" height="12" rx="1" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            <rect x="182" y="252" width="56" height="4" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.1" strokeLinejoin="round" />

            {/* ── Left Pier Main Shaft ── */}
            <rect x="42" y="128" width="58" height="124" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            {/* Outer pilaster vertical line */}
            <line x1="52" y1="128" x2="52" y2="252" stroke="#6492cc" strokeWidth="1.2" strokeLinecap="round" />
            {/* Lower panel */}
            <rect x="56" y="224" width="40" height="24" rx="1.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.2" />
            {/* Lower dividing moulding band */}
            <rect x="42" y="216" width="58" height="5" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.1" />
            {/* Middle panel */}
            <rect x="56" y="176" width="40" height="36" rx="1.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.2" />
            {/* Circular Medallion in middle panel */}
            <circle cx="76" cy="194" r="10" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.4" />
            <circle cx="76" cy="194" r="5.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.1" />
            {/* Upper dividing moulding band */}
            <rect x="42" y="167" width="58" height="5" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.1" />
            {/* Upper niche panel */}
            <rect x="56" y="136" width="40" height="27" rx="1.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.2" />
            {/* Pier Capital / Impost Moulding */}
            <rect x="38" y="124" width="64" height="5" rx="0.5" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />

            {/* ── Right Pier Main Shaft ── */}
            <rect x="180" y="128" width="58" height="124" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            {/* Outer pilaster vertical line */}
            <line x1="228" y1="128" x2="228" y2="252" stroke="#6492cc" strokeWidth="1.2" strokeLinecap="round" />
            {/* Lower panel */}
            <rect x="184" y="224" width="40" height="24" rx="1.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.2" />
            {/* Lower dividing moulding band */}
            <rect x="180" y="216" width="58" height="5" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.1" />
            {/* Middle panel */}
            <rect x="184" y="176" width="40" height="36" rx="1.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.2" />
            {/* Circular Medallion in middle panel */}
            <circle cx="204" cy="194" r="10" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.4" />
            <circle cx="204" cy="194" r="5.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.1" />
            {/* Upper dividing moulding band */}
            <rect x="180" y="167" width="58" height="5" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.1" />
            {/* Upper niche panel */}
            <rect x="184" y="136" width="40" height="27" rx="1.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.2" />
            {/* Pier Capital / Impost Moulding */}
            <rect x="178" y="124" width="64" height="5" rx="0.5" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />

            {/* ── Central Great Archway & Opening ── */}
            {/* Opening through gate */}
            <path
              d="M100,268 L100,128 A40,40 0 0,1 180,128 L180,268 Z"
              fill="#edf5fd"
              stroke="#6492cc"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Inner concentric archivolt ring */}
            <path
              d="M96,128 A44,44 0 0,1 184,128"
              fill="none"
              stroke="#6492cc"
              strokeWidth="1.2"
            />
            {/* Outer concentric archivolt ring */}
            <path
              d="M92,128 A48,48 0 0,1 188,128"
              fill="none"
              stroke="#6492cc"
              strokeWidth="1.3"
            />

            {/* Keystone at arch apex */}
            <polygon
              points="135,82 145,82 147,96 133,96"
              fill="#bcd5f3"
              stroke="#6492cc"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* ── Spandrel Circular Medallions ── */}
            <circle cx="112" cy="107" r="7.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.3" />
            <circle cx="112" cy="107" r="4" fill="#cfe1f7" stroke="#6492cc" strokeWidth="0.9" />
            <circle cx="168" cy="107" r="7.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.3" />
            <circle cx="168" cy="107" r="4" fill="#cfe1f7" stroke="#6492cc" strokeWidth="0.9" />

            {/* ── Entablature & Cornice ── */}
            {/* Architrave */}
            <rect x="36" y="86" width="208" height="8" fill="#d9e8fa" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            {/* Frieze with Dentils */}
            <rect x="32" y="76" width="216" height="10" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            {/* Row of Dentil Blocks */}
            {Array.from({ length: 24 }).map((_, i) => (
              <rect
                key={`ig-dt-${i}`}
                x={36 + i * 8.8}
                y="78"
                width="4.3"
                height="6"
                rx="0.4"
                fill="#bcd5f3"
                stroke="#6492cc"
                strokeWidth="0.8"
              />
            ))}
            {/* Projecting Cornice */}
            <rect x="28" y="70" width="224" height="6" rx="0.8" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.4" strokeLinejoin="round" />

            {/* ── Attic Story ── */}
            {/* Attic Base Moulding */}
            <rect x="38" y="66" width="204" height="4" fill="#d9e8fa" stroke="#6492cc" strokeWidth="1.1" strokeLinejoin="round" />
            {/* Attic Main Wall */}
            <rect x="40" y="36" width="200" height="30" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />

            {/* Left Circular Medallion on Attic */}
            <circle cx="66" cy="51" r="8.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.3" />
            <circle cx="66" cy="51" r="4.5" fill="#cfe1f7" stroke="#6492cc" strokeWidth="0.9" />

            {/* Central Cartouche Inscription Panel with Rounded Corners */}
            <rect x="90" y="41" width="100" height="20" rx="4.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.3" strokeLinejoin="round" />
            <rect x="94" y="44" width="92" height="14" rx="3" fill="#edf5fd" stroke="#6492cc" strokeWidth="0.9" strokeDasharray="3 1.5" />

            {/* Right Circular Medallion on Attic */}
            <circle cx="214" cy="51" r="8.5" fill="#deecfb" stroke="#6492cc" strokeWidth="1.3" />
            <circle cx="214" cy="51" r="4.5" fill="#cfe1f7" stroke="#6492cc" strokeWidth="0.9" />

            {/* Attic Cornice Ledge */}
            <rect x="38" y="32" width="204" height="4" rx="0.5" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.2" strokeLinejoin="round" />

            {/* ── Stepped Pyramidal Roof / Cupola ── */}
            {/* Step 1 */}
            <rect x="56" y="26" width="168" height="6" rx="0.5" fill="#d9e8fa" stroke="#6492cc" strokeWidth="1.2" strokeLinejoin="round" />
            {/* Step 2 */}
            <rect x="74" y="20" width="132" height="6" rx="0.5" fill="#cfe1f7" stroke="#6492cc" strokeWidth="1.2" strokeLinejoin="round" />
            {/* Step 3 */}
            <rect x="94" y="15" width="92" height="5" rx="0.5" fill="#bcd5f3" stroke="#6492cc" strokeWidth="1.1" strokeLinejoin="round" />
            {/* Rounded Dome Cap */}
            <path
              d="M110,15 Q140,5 170,15 Z"
              fill="#cfe1f7"
              stroke="#6492cc"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            {/* Summit Finial / Crest */}
            <rect x="136" y="4" width="8" height="2" fill="#6492cc" rx="0.5" />
            <circle cx="140" cy="3" r="1.5" fill="#6492cc" />
          </svg>

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center relative z-10">
            {/* Heading */}
            <div className="lg:w-52 shrink-0">
              <div className="w-8 h-1 bg-cyan-500 rounded-full mb-3" />
              <h2 className="text-3xl font-extrabold text-[#123b63] leading-tight">
                Our Vision
              </h2>
            </div>

            {/* Vision text */}
            <div className="flex-1 max-w-lg">
              <p className="text-slate-600 text-sm leading-relaxed">
                To enable transparent, data-driven and accountable development
                across every constituency, ensuring that public funds create
                meaningful impact in people's lives.
              </p>
            </div>

            {/* Quote */}
            <div className="flex-1 max-w-sm">
              <p className="text-[#123b63] font-semibold italic text-base leading-relaxed">
                "Development is not just about funds,
                <br />
                but about the lives it touches."
              </p>
              <div className="flex gap-1 mt-3">
                <div className="w-8 h-1 bg-[#FF9933] rounded-full" />
                <div className="w-8 h-1 bg-slate-300 rounded-full" />
                <div className="w-8 h-1 bg-[#138808] rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#0d2847] text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 lg:pt-12 pb-4 sm:pb-6 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 lg:gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <EmblemImage
                  alt="Emblem of India - MoSPI"
                  width="40"
                  height="48"
                  className="w-10 h-12 object-contain"
                />
                <div>
                  <p className="font-extrabold text-base leading-tight">
                    MPLADS Risk Monitor
                  </p>
                  <p className="text-xs text-slate-300">by MoSPI</p>
                </div>
              </div>
              <p className="text-xs text-cyan-300 font-semibold mb-2">
                Connecting <span className="text-white">Public</span> Funds to
                Public Impact.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                A data-driven platform for transparent and accountable
                development across India.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-sm font-bold mb-4 text-white">Quick Links</p>
              <ul className="space-y-2">
                {["Home", "About", "Features", "Contact"].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-xs text-slate-300 hover:text-white transition-colors duration-150"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="text-sm font-bold mb-4 text-white">Resources</p>
              <ul className="space-y-2">
                {[
                  "Data Sources",
                  "FAQs",
                  "User Guide",
                  "Privacy Policy",
                  "Terms of Use",
                ].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-xs text-slate-300 hover:text-white transition-colors duration-150"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow Us */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-sm font-bold mb-4 text-white">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { Icon: IconTwitter, label: "Twitter" },
                  { Icon: IconLinkedin, label: "LinkedIn" },
                  { Icon: IconYoutube, label: "YouTube" },
                  { Icon: IconMail, label: "Email" },
                ].map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-cyan-500 transition-colors duration-200"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Indian Monuments Skyline resting directly on the bottom line, sized and shifted to align with Government of India text in desktop mode */}
          <div className="px-6 lg:px-10">
            <div className="max-w-7xl mx-auto flex justify-center sm:justify-end">
              <div className="w-full max-w-[340px] sm:max-w-none sm:w-[480px] lg:w-[505px] pointer-events-none select-none -mb-[1.5px] sm:translate-x-1 lg:translate-x-2">
                <IndianMonumentsSkyline
                  variant="dark"
                  className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity duration-300 block"
                />
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 px-6 lg:px-10 py-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2 text-center sm:text-left">
              <p className="text-xs text-slate-300">
                © 2026{" "}
                <span className="font-semibold text-white">
                  MPLADS Risk Monitor
                </span>
                . All rights reserved.
              </p>
              <p className="text-xs text-slate-300">
                Government of India &nbsp;|&nbsp; Ministry of Statistics and
                Programme Implementation
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

