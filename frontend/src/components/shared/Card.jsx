import React from "react";

const ACCENT_CONFIG = {
  emerald: {
    accentGradient: "from-emerald-600 via-emerald-500 to-teal-500",
    glow: "bg-emerald-400/15",
    badge: "bg-emerald-50 text-emerald-900 border-emerald-300/80",
    iconBox: "bg-emerald-50 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white border border-emerald-300/70",
    cornerBorder: "hover:border-emerald-300/80",
    dot: "bg-emerald-600",
    num: "text-emerald-800 group-hover:text-emerald-950",
    pillBg: "bg-emerald-50 text-emerald-900 border border-emerald-300/70",
  },
  amber: {
    accentGradient: "from-[#FF9933] via-amber-500 to-orange-500",
    glow: "bg-amber-400/15",
    badge: "bg-amber-50 text-amber-950 border-amber-300/80",
    iconBox: "bg-amber-50 text-amber-900 group-hover:bg-[#FF9933] group-hover:text-white border border-amber-300/70",
    cornerBorder: "hover:border-amber-300/80",
    dot: "bg-amber-600",
    num: "text-amber-900 group-hover:text-amber-950",
    pillBg: "bg-amber-50 text-amber-950 border border-amber-300/70",
  },
  cyan: {
    accentGradient: "from-cyan-600 via-sky-500 to-blue-600",
    glow: "bg-cyan-400/15",
    badge: "bg-cyan-50 text-cyan-950 border-cyan-300/80",
    iconBox: "bg-cyan-50 text-cyan-900 group-hover:bg-cyan-600 group-hover:text-white border border-cyan-300/70",
    cornerBorder: "hover:border-cyan-300/80",
    dot: "bg-cyan-600",
    num: "text-cyan-900 group-hover:text-cyan-950",
    pillBg: "bg-cyan-50 text-cyan-950 border border-cyan-300/70",
  },
  navy: {
    accentGradient: "from-[#123b63] via-blue-700 to-indigo-700",
    glow: "bg-blue-600/15",
    badge: "bg-blue-50 text-[#0d2847] border-blue-300/80",
    iconBox: "bg-blue-50 text-[#0d2847] group-hover:bg-[#123b63] group-hover:text-white border border-blue-300/70",
    cornerBorder: "hover:border-blue-300/80",
    dot: "bg-[#123b63]",
    num: "text-[#0d2847] group-hover:text-black",
    pillBg: "bg-blue-50 text-[#0d2847] border border-blue-300/70",
  },
};

const Card = ({
  title,
  description,
  icon: Icon,
  index,
  tag,
  accent,
  metric,
  className = "",
  onClick,
}) => {
  // Infer accent theme from title or fallback
  const resolvedAccent =
    accent ||
    (title?.includes("Fund")
      ? "emerald"
      : title?.includes("Risk")
      ? "amber"
      : title?.includes("Performance") || title?.includes("Data")
      ? "cyan"
      : title?.includes("Accountability") || title?.includes("Transparency")
      ? "navy"
      : "cyan");

  const styles = ACCENT_CONFIG[resolvedAccent] || ACCENT_CONFIG.cyan;
  const isIdentifyRisks = title?.includes("Risk");

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col justify-between h-full bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-out cursor-pointer overflow-hidden select-none transform-gpu active:scale-[0.97] touch-manipulation ${styles.cornerBorder} ${className}`}
    >
      {/* Top Themed Accent Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2.5px] sm:h-[3px] bg-gradient-to-r ${styles.accentGradient} opacity-95 group-hover:h-[4px] transition-all duration-200`}
      />

      {/* Ambient Corner Soft Radial Glow */}
      <div
        aria-hidden="true"
        className={`absolute -top-10 -right-10 w-20 sm:w-28 h-20 sm:h-28 rounded-full ${styles.glow} blur-xl pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity duration-300`}
      />

      {/* Top Row: Icon Container + (Tag / Index) */}
      <div className="relative z-10 flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2">
        {Icon && (
          <div
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all duration-200 ease-out shadow-xs shrink-0 ${styles.iconBox}`}
          >
            <div className="group-hover:scale-110 group-hover:rotate-2 transition-transform duration-150 ease-out">
              <Icon
                size={17}
                className={`sm:w-5 sm:h-5 ${isIdentifyRisks ? "group-hover:animate-pulse" : ""}`}
              />
            </div>
          </div>
        )}

        {/* Badge / Number Index */}
        <div className="flex items-center gap-1.5 ml-auto">
          {tag && (
            <span
              className={`hidden md:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${styles.badge}`}
            >
              <span className={`w-1 h-1 rounded-full ${styles.dot}`} />
              {tag}
            </span>
          )}
          {index && (
            <span
              className={`text-[10.5px] sm:text-xs font-mono font-extrabold tracking-tight transition-colors duration-200 ${styles.num}`}
            >
              {index}
            </span>
          )}
        </div>
      </div>

      {/* Text Body */}
      <div className="relative z-10 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-[12.5px] sm:text-[14.5px] font-extrabold text-slate-800 group-hover:text-[#123b63] transition-colors duration-150 leading-tight sm:leading-snug tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-slate-600 group-hover:text-slate-800 text-[10.5px] sm:text-[12px] leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none font-medium transition-colors duration-150">
            {description}
          </p>
        </div>

        {/* Micro-metric Pill */}
        {metric && (
          <div className="mt-2 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between">
            <span
              className={`text-[9px] sm:text-[10px] font-bold tracking-tight px-1.5 py-0.5 rounded-md flex items-center gap-1 ${styles.pillBg}`}
            >
              <span className={`w-1 h-1 rounded-full ${styles.dot} animate-pulse`} />
              {metric}
            </span>
            <span className="text-slate-600 group-hover:translate-x-0.5 group-hover:text-slate-900 transition-all duration-150 text-[10px] sm:text-[11px] leading-none font-bold">
              →
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
