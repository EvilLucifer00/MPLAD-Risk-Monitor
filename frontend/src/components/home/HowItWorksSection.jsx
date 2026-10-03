import React from 'react';
import { motion } from 'framer-motion';
import { TbChevronRight } from 'react-icons/tb';

const HowItWorksSection = () => {
  return (
    <section className="bg-white px-6 lg:px-10 py-10 lg:py-12 border-b border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        {/* Left label */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="lg:w-56 shrink-0"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 mb-2">
            A More Transparent
            <br />
            and Accountable Tomorrow
          </p>
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-8 h-1 bg-cyan-500 rounded-full mb-3 origin-left" 
          />
          <h2 className="text-3xl font-extrabold text-[#123b63] leading-tight">
            How It Works
          </h2>
        </motion.div>

        {/* Steps */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            visible: {
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="flex flex-1 flex-col sm:flex-row items-start gap-4"
        >
          {[
            {
              n: 1,
              title: "Explore",
              desc: "Browse the interactive map to view constituencies and risk levels.",
            },
            {
              n: 2,
              title: "Understand",
              desc: "Access key insights and development indicators.",
            },
            {
              n: 3,
              title: "Enable Change",
              desc: "Promote transparency and informed decision-making.",
            },
          ].map(({ n, title, desc }, idx, arr) => (
            <React.Fragment key={n}>
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
                }}
                className="flex-1 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#123b63] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  {n}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-base">
                    {title}
                  </p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </motion.div>
              {idx < arr.length - 1 && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.6 } }
                  }}
                  className="shrink-0 mt-2 hidden sm:block"
                >
                  <TbChevronRight
                    size={20}
                    className="text-slate-300"
                  />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
