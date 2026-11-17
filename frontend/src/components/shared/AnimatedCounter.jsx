import React, { useState, useEffect, useRef } from "react";

const ACCENT_STYLES = {
  navy: {
    borderTop: "border-t-[#123b63]",
    iconBox: "text-[#123b63] bg-blue-50/70 border border-blue-200",
    badge: "bg-blue-50 text-[#0d2847] border-blue-200",
  },
  emerald: {
    borderTop: "border-t-emerald-700",
    iconBox: "text-emerald-800 bg-emerald-50 border border-emerald-200",
    badge: "bg-emerald-50 text-emerald-900 border-emerald-300",
  },
  amber: {
    borderTop: "border-t-amber-700",
    iconBox: "text-amber-900 bg-amber-50 border border-amber-200",
    badge: "bg-amber-50 text-amber-950 border-amber-300",
  },
  rose: {
    borderTop: "border-t-rose-700",
    iconBox: "text-rose-900 bg-rose-50 border border-rose-200",
    badge: "bg-rose-50 text-rose-950 border-rose-300",
  },
  cyan: {
    borderTop: "border-t-[#123b63]",
    iconBox: "text-[#123b63] bg-slate-50 border border-slate-200",
    badge: "bg-slate-100 text-[#0d2847] border-slate-300",
  },
};

const AnimatedCounter = ({
  end,
  duration = 1500,
  prefix = "",
  suffix = "",
  title,
  icon: Icon,
  iconColor,
  iconBg,
  sub,
  decimals = 0,
  index,
  tag,
  accent,
  className = "",
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef(null);
  const displayRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) return;

    let startTime = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeOutExpo = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      const currentValue = easeOutExpo * end;

      if (displayRef.current) {
        displayRef.current.textContent = `${prefix}${currentValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
      }

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasAnimated, prefix, suffix, decimals]);

  const resolvedAccent =
    accent ||
    (iconColor?.includes("teal") || iconColor?.includes("emerald")
      ? "emerald"
      : iconColor?.includes("red") || iconColor?.includes("rose")
      ? "rose"
      : iconColor?.includes("orange") || iconColor?.includes("amber")
      ? "amber"
      : "navy");

  const styles = ACCENT_STYLES[resolvedAccent] || ACCENT_STYLES.navy;

  return (
    <div 
      ref={counterRef} 
      className={`relative flex flex-col justify-between bg-white border border-slate-200 border-t-2 ${styles.borderTop} rounded p-3.5 sm:p-4 min-w-0 select-text cursor-default ${className}`}
    >
      {/* Top Row: Icon + Tag / Index */}
      <div className="flex items-start justify-between gap-1.5 mb-2.5">
        {Icon && (
          <div 
            className={`p-1.5 rounded shrink-0 ${styles.iconBox}`}
            aria-hidden="true"
          >
            <Icon size={18} className="w-4.5 h-4.5" />
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {tag && (
            <span
              className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${styles.badge}`}
            >
              {tag}
            </span>
          )}
          {index && (
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {index}
            </span>
          )}
        </div>
      </div>

      {/* Metric & Label Content */}
      <div className="flex flex-col min-w-0 flex-1 justify-between">
        <div>
          <div
            ref={displayRef}
            className="text-xl sm:text-2xl xl:text-3xl font-bold text-slate-900 leading-tight tabular-nums tracking-tight"
          >
            {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
          </div>
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mt-1 truncate">
            {title}
          </div>
        </div>
        {sub && (
          <div className="text-xs text-slate-500 font-normal mt-1 leading-snug line-clamp-2">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedCounter;
