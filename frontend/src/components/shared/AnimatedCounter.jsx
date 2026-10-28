import React, { useState, useEffect, useRef } from "react";

const ACCENT_STYLES = {
  navy: {
    bar: "from-[#123b63] via-blue-700 to-cyan-600",
    glow: "bg-blue-500/15",
    borderHover: "hover:border-blue-300/80",
    badge: "bg-blue-50 text-[#0d2847] border-blue-300/80",
    num: "text-[#0d2847] group-hover:text-black font-extrabold",
    dot: "bg-[#123b63]",
  },
  emerald: {
    bar: "from-emerald-600 via-emerald-500 to-teal-500",
    glow: "bg-emerald-400/15",
    borderHover: "hover:border-emerald-300/80",
    badge: "bg-emerald-50 text-emerald-900 border-emerald-300/80",
    num: "text-emerald-800 group-hover:text-emerald-950 font-extrabold",
    dot: "bg-emerald-600",
  },
  amber: {
    accentGradient: "from-[#FF9933] via-amber-500 to-orange-500",
    bar: "from-[#FF9933] via-amber-500 to-orange-500",
    glow: "bg-amber-400/15",
    borderHover: "hover:border-amber-300/80",
    badge: "bg-amber-50 text-amber-950 border-amber-300/80",
    num: "text-amber-900 group-hover:text-amber-950 font-extrabold",
    dot: "bg-amber-600",
  },
  rose: {
    bar: "from-rose-600 via-red-600 to-orange-500",
    glow: "bg-rose-400/15",
    borderHover: "hover:border-rose-300/80",
    badge: "bg-rose-50 text-rose-950 border-rose-300/80",
    num: "text-rose-900 group-hover:text-rose-950 font-extrabold",
    dot: "bg-rose-600",
  },
  cyan: {
    bar: "from-cyan-600 via-sky-500 to-blue-600",
    glow: "bg-cyan-400/15",
    borderHover: "hover:border-cyan-300/80",
    badge: "bg-cyan-50 text-cyan-950 border-cyan-300/80",
    num: "text-cyan-900 group-hover:text-cyan-950 font-extrabold",
    dot: "bg-cyan-600",
  },
};

const AnimatedCounter = ({
  end,
  duration = 2000,
  prefix = "",
  suffix = "",
  title,
  icon: Icon,
  iconColor = "text-[#123b63]",
  iconBg = "bg-blue-50",
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
      
      // easeOutExpo easing function for more dramatic slowdown
      const easeOutExpo = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      const currentValue = easeOutExpo * end;

      if (displayRef.current) {
        displayRef.current.textContent = `${prefix}${currentValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
      }

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end); // Update state only when animation finishes
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasAnimated, prefix, suffix]);

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
      className={`group relative flex flex-col justify-between bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-4.5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] hover:shadow-xl hover:-translate-y-1 active:scale-[0.97] transition-all duration-200 ease-out min-w-0 overflow-hidden select-none transform-gpu touch-manipulation ${styles.borderHover} ${className}`}
    >
      {/* Top Themed Accent Bar */}
      <div
        aria-hidden="true"
        className={`absolute top-0 left-0 right-0 h-[2.5px] sm:h-[3px] bg-gradient-to-r ${styles.bar} opacity-95 group-hover:h-[4px] transition-all duration-200`}
      />

      {/* Ambient Corner Soft Radial Glow */}
      <div
        aria-hidden="true"
        className={`absolute -top-10 -right-10 w-20 sm:w-28 h-20 sm:h-28 rounded-full ${styles.glow} blur-xl pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity duration-300`}
      />

      {/* Top Row: Icon Container + (Tag / Index) */}
      <div className="relative z-10 flex items-start justify-between gap-1.5 mb-2 sm:mb-3">
        {Icon && (
          <div 
            className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 ${iconBg} ${iconColor} transition-all duration-300 ease-out shadow-xs group-hover:scale-105 ${
              hasAnimated ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <Icon size={18} className="sm:w-5 sm:h-5 xl:w-6 xl:h-6" strokeWidth={2} aria-hidden="true" />
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          {tag && (
            <span
              className={`hidden md:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${styles.badge}`}
            >
              <span className={`w-1 h-1 rounded-full ${styles.dot}`} aria-hidden="true" />
              {tag}
            </span>
          )}
          {index && (
            <span className={`text-[10.5px] sm:text-xs font-mono font-extrabold tracking-tight transition-colors duration-200 ${styles.num}`}>
              {index}
            </span>
          )}
        </div>
      </div>

      {/* Metric & Label Content */}
      <div className="relative z-10 flex flex-col min-w-0 flex-1 justify-between">
        <div>
          <div
            ref={displayRef}
            className="text-lg sm:text-2xl xl:text-3xl font-extrabold text-[#0a2540] group-hover:text-[#123b63] leading-tight whitespace-nowrap truncate tabular-nums tracking-tight transition-colors duration-150"
          >
            {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
          </div>
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase tracking-wider mt-1 sm:mt-1.5 truncate">
            {title}
          </div>
        </div>
        {sub && (
          <div className="text-[10px] sm:text-[11.5px] text-slate-600 font-medium mt-1 sm:mt-1.5 leading-snug line-clamp-1 sm:line-clamp-none transition-colors duration-150">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedCounter;
