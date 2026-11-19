import React, { useState, useRef, useCallback, useEffect } from 'react';
import Card from '../shared/Card';
import { IconMap, IconChartBar, IconShieldCheck, IconUsers } from '../shared/HomeIcons';

const features = [
  {
    icon: IconMap,
    title: "Geospatial Surveillance",
    desc: "Choropleth mapping of project risk distribution across all 543 Lok Sabha seats.",
    accent: "navy",
    metric: "GIS Boundary Mapping",
    tag: "Spatial Analysis",
  },
  {
    icon: IconChartBar,
    title: "Expenditure Auditing",
    desc: "Automated rate variance checking against district Schedule of Rates (SoR) benchmarks.",
    accent: "emerald",
    metric: "SoR Benchmark Check",
    tag: "Financial Audit",
  },
  {
    icon: IconShieldCheck,
    title: "Statutory Guideline Verification",
    desc: "Embedded RAG verification ensuring work recommendations comply with MoSPI eligibility rules.",
    accent: "amber",
    metric: "MoSPI Rule Grounding",
    tag: "Compliance",
  },
  {
    icon: IconUsers,
    title: "Vendor Network Analysis",
    desc: "Graph detection of tender concentration and cartel formation among contracted executing agencies.",
    accent: "navy",
    metric: "Cartel Network Radar",
    tag: "Procurement",
  },
];

const KeyFeaturesSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);
  const tabsRef = useRef(null);

  // Auto-slide category tab headings so the active feature pill is always visible and centered
  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;
    const activeTab = container.children[activeIndex];
    if (!activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    // Determine horizontal offset required to center the active tab pill
    const relativeLeft = tabRect.left - containerRect.left;
    const targetScrollDelta = relativeLeft - (containerRect.width - tabRect.width) / 2;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    container.scrollBy({
      left: targetScrollDelta,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [activeIndex]);

  // Sync scroll position with activeIndex
  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, clientWidth } = trackRef.current;
    if (clientWidth === 0) return;
    const firstChild = trackRef.current.children[0];
    const cardWidth = firstChild ? firstChild.offsetWidth : clientWidth * 0.84;
    const newIndex = Math.round(scrollLeft / (cardWidth + 12));
    const clampedIndex = Math.max(0, Math.min(features.length - 1, newIndex));
    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);
    }
  }, [activeIndex]);

  const scrollToIndex = (idx) => {
    if (!trackRef.current) return;
    const slides = trackRef.current.children;
    if (slides[idx]) {
      slides[idx].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
      setActiveIndex(idx);
    }
  };

  return (
    <section
      className="bg-white px-4 sm:px-6 lg:px-12 py-8 border-b border-slate-200"
      aria-label="Key Governance Features"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-4 sm:mb-6 border-b border-slate-200 pb-2.5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#123b63]">
              System Capabilities
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Key Governance Features
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Core surveillance and monitoring mechanisms implemented for administrative verification.
            </p>
          </div>

          {/* Mobile Header Controls: Step Indicator + Arrows */}
          <div className="flex sm:hidden items-center justify-between pt-1">
            <span className="text-[11px] font-mono font-bold text-slate-500">
              Feature <span className="text-[#123b63]">0{activeIndex + 1}</span> / 0{features.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                aria-label="Previous feature card"
                className="w-7 h-7 rounded border border-slate-300 bg-white text-slate-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all text-xs font-bold"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollToIndex(Math.min(features.length - 1, activeIndex + 1))}
                disabled={activeIndex === features.length - 1}
                aria-label="Next feature card"
                className="w-7 h-7 rounded border border-slate-300 bg-white text-slate-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all text-xs font-bold"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE ONLY: Interactive Category Segmented Tabs */}
        <div
          ref={tabsRef}
          className="relative flex sm:hidden items-center gap-1.5 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar scroll-smooth"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y manipulation',
          }}
        >
          {features.map((f, idx) => (
            <button
              key={f.tag}
              type="button"
              onClick={() => scrollToIndex(idx)}
              aria-current={activeIndex === idx ? 'true' : undefined}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors duration-150 flex items-center gap-1.5 ${
                activeIndex === idx
                  ? 'bg-[#123b63] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className={`text-[10px] font-mono ${activeIndex === idx ? 'text-cyan-300' : 'text-slate-400'}`}>
                0{idx + 1}
              </span>
              <span>{f.tag}</span>
            </button>
          ))}
        </div>

        {/* MOBILE ONLY: Native Scroll-Snap Horizontal Track with Peek */}
        <div className="block sm:hidden">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 -mx-4 pb-3 pt-1 no-scrollbar"
            style={{
              scrollSnapType: 'x mandatory',
              touchAction: 'pan-y',
              scrollPaddingLeft: '1rem',
              WebkitOverflowScrolling: 'touch',
            }}
            role="region"
            aria-roledescription="carousel"
          >
            {features.map(({ icon: Icon, title, desc, accent, metric, tag }, idx) => (
              <div
                key={title}
                className="w-[84vw] max-w-[320px] shrink-0 snap-start flex flex-col"
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} of ${features.length}: ${title}`}
              >
                <Card
                  index={`0${idx + 1}`}
                  title={title}
                  description={desc}
                  icon={Icon}
                  accent={accent}
                  metric={metric}
                  tag={tag}
                  className="h-full shadow-xs"
                />
              </div>
            ))}
          </div>

          {/* Pagination Indicators on Mobile */}
          <div className="flex items-center justify-center gap-1.5 pt-2 pb-1" aria-hidden="true">
            {features.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx ? 'w-6 bg-[#123b63]' : 'w-1.5 bg-slate-300'
                }`}
                aria-label={`Go to feature ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* DESKTOP / TABLET: Standard 4-column Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {features.map(({ icon: Icon, title, desc, accent, metric, tag }, idx) => (
            <Card
              key={title}
              index={`0${idx + 1}`}
              title={title}
              description={desc}
              icon={Icon}
              accent={accent}
              metric={metric}
              tag={tag}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyFeaturesSection;
