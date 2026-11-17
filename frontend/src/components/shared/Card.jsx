import React from "react";

const ACCENT_CONFIG = {
  emerald: {
    borderTop: "border-t-emerald-700",
    badge: "bg-emerald-50 text-emerald-900 border-emerald-300",
    iconBox: "text-emerald-800 bg-emerald-50 border border-emerald-200",
    metricBadge: "bg-emerald-50 text-emerald-900 border-emerald-200",
  },
  amber: {
    borderTop: "border-t-amber-700",
    badge: "bg-amber-50 text-amber-950 border-amber-300",
    iconBox: "text-amber-900 bg-amber-50 border border-amber-200",
    metricBadge: "bg-amber-50 text-amber-950 border-amber-200",
  },
  cyan: {
    borderTop: "border-t-[#123b63]",
    badge: "bg-slate-100 text-[#0d2847] border-slate-300",
    iconBox: "text-[#123b63] bg-slate-50 border border-slate-200",
    metricBadge: "bg-slate-50 text-slate-800 border-slate-200",
  },
  navy: {
    borderTop: "border-t-[#123b63]",
    badge: "bg-blue-50 text-[#0d2847] border-blue-200",
    iconBox: "text-[#123b63] bg-blue-50/60 border border-blue-200",
    metricBadge: "bg-blue-50/50 text-[#0d2847] border-blue-200",
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
  const isInteractive = typeof onClick === "function";

  const resolvedAccent =
    accent ||
    (title?.includes("Fund")
      ? "emerald"
      : title?.includes("Risk")
      ? "amber"
      : title?.includes("Accountability") || title?.includes("Transparency")
      ? "navy"
      : "cyan");

  const styles = ACCENT_CONFIG[resolvedAccent] || ACCENT_CONFIG.navy;

  const interactiveClasses = isInteractive
    ? "cursor-pointer hover:border-[#123b63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] focus-visible:border-transparent transition-colors duration-150"
    : "cursor-default";

  return (
    <div
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      className={`relative flex flex-col justify-between h-full bg-white border border-slate-200 rounded border-t-2 ${styles.borderTop} p-3 sm:p-4 text-left select-text ${interactiveClasses} ${className}`}
    >
      {/* Header: Icon + (Tag / Index) */}
      <div className="flex items-start justify-between gap-1.5 mb-2 sm:mb-2.5">
        {Icon && (
          <div
            className={`p-1 sm:p-1.5 rounded shrink-0 ${styles.iconBox}`}
            aria-hidden="true"
          >
            <Icon size={16} className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {tag && (
            <span
              className={`inline-flex items-center text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap ${styles.badge}`}
            >
              {tag}
            </span>
          )}
          {index && (
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-400">
              {index}
            </span>
          )}
        </div>
      </div>

      {/* Title & Body */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-slate-600 text-[11px] sm:text-xs leading-snug sm:leading-relaxed font-normal text-pretty">
            {description}
          </p>
        </div>

        {/* Supporting Metric Pill (No fake arrow!) */}
        {metric && (
          <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span
              className={`text-[9.5px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded border whitespace-nowrap tracking-tight ${styles.metricBadge}`}
            >
              {metric}
            </span>
            {isInteractive && (
              <span
                className="text-slate-500 text-xs font-semibold"
                aria-hidden="true"
              >
                View →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
