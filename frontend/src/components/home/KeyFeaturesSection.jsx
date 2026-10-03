import React from 'react';
import { motion } from 'framer-motion';
import Reveal from '../../animations/Reveal';
import Card from '../shared/Card';
import { TbMap, TbChartBar, TbShieldCheck, TbUsers } from 'react-icons/tb';

const KeyFeaturesSection = () => {
  return (
    <section className="bg-slate-50 px-6 lg:px-10 py-10 lg:py-12 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-7">
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-8 h-1 bg-cyan-500 rounded-full mb-3 origin-left" 
            />
            <h2 className="text-2xl font-extrabold text-[#123b63]">
              Key Features
            </h2>
          </div>
        </Reveal>
        <Reveal staggerChildren={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: TbMap,
                title: "Interactive India Map",
                desc: "Visualize risk levels across all constituencies.",
              },
              {
                icon: TbChartBar,
                title: "Data-Driven Insights",
                desc: "AI-powered analysis of fund utilization and project progress.",
              },
              {
                icon: TbShieldCheck,
                title: "Transparency & Accountability",
                desc: "Access verified information in one place.",
              },
              {
                icon: TbUsers,
                title: "Public Awareness",
                desc: "Empowering citizens with reliable data.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                title={title}
                description={desc}
                icon={Icon}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default KeyFeaturesSection;
