import React from "react";

const Card = ({ title, description, icon: Icon }) => {
  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] hover:bg-[#123B63] hover:border-[#000914] transition-all duration-300 cursor-pointer">
      <div className="flex items-center gap-3 mb-1.5">
        {Icon && (
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-white/20 group-hover:text-white transition-colors duration-300">
            <Icon size={20} />
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
