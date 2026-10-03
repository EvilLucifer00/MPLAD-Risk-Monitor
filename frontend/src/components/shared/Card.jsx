import React from "react";
import { motion } from "framer-motion";

const Card = ({ title, description, icon: Icon }) => {
  const isIdentifyRisks = title === "Identify Risks";
  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#123B63] hover:border-[#000914] transition-all duration-300 cursor-pointer overflow-hidden relative">
      {/* Thin cyan top border on hover */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-10" />
      
      <div className="flex items-center gap-3 mb-1.5 relative z-10">
        {Icon && (
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-white/20 group-hover:text-white transition-colors duration-300">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Icon size={20} className={isIdentifyRisks ? "group-hover:animate-pulse" : ""} />
            </motion.div>
          </div>
        )}
        <h3 className="text-base font-bold text-slate-800 group-hover:text-white transition-colors duration-300">
          {title}
        </h3>
      </div>
      <p className="text-slate-600 group-hover:text-white/90 text-[13px] leading-relaxed transition-colors duration-300">
        {description}
      </p>
    </div>
  );
};

export default Card;
