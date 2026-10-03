import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

const AnimatedCounter = ({ end, duration = 2000, prefix = "", suffix = "", title, icon: Icon, iconColor = "text-[#123b63]", iconBg = "bg-blue-50", sub, decimals = 0 }) => {
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

  return (
    <motion.div 
      ref={counterRef} 
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="flex items-center gap-3 xl:gap-4 bg-white border border-slate-200 rounded-2xl px-4 py-4 xl:px-5 xl:py-5 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0"
    >
      {Icon && (
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={hasAnimated ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`p-3 rounded-2xl shrink-0 ${iconBg} ${iconColor}`}
        >
          <Icon size={24} className="xl:w-7 xl:h-7" strokeWidth={2} />
        </motion.div>
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <div ref={displayRef} className="text-2xl xl:text-3xl font-extrabold text-[#123b63] leading-tight whitespace-nowrap truncate">
          {prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
        </div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
          {title}
        </div>
        {sub && (
          <div className="text-[11px] text-slate-400 mt-1 leading-snug">
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnimatedCounter;
