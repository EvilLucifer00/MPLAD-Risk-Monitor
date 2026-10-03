import React from 'react';
import { motion } from 'framer-motion';
import Reveal from '../../animations/Reveal';
import AnimatedCounter from '../shared/AnimatedCounter';
import { TbMapPin, TbCurrencyRupee, TbAlertTriangle } from 'react-icons/tb';
import { IoIosConstruct } from 'react-icons/io';

const OverviewSection = () => {
  return (
    <section className="min-h-0 bg-slate-50 px-6 lg:px-12 py-10 lg:py-10">
      <div className="max-w-8xl mx-auto">
        <Reveal>
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-[#123b63] mb-4">
              Overview
            </h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-20 h-1.25 bg-cyan-600 rounded-full origin-left"
            />
          </div>
        </Reveal>

        <Reveal staggerChildren={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatedCounter
              end={543}
              title="Constituencies"
              icon={TbMapPin}
              iconColor="text-[#123b63]"
              iconBg="bg-[#f0f7ff]"
              sub="Across all states and union territories"
            />
            <AnimatedCounter
              prefix="₹ "
              end={12500}
              suffix=" Cr"
              title="Invested This Year"
              icon={TbCurrencyRupee}
              iconColor="text-teal-600"
              iconBg="bg-teal-50"
              sub="In constituency development"
            />
            <AnimatedCounter
              end={18450}
              suffix="+"
              title="Total Projects"
              icon={IoIosConstruct}
              iconColor="text-[#123b63]"
              iconBg="bg-[#f0f7ff]"
              sub="Across sectors and regions"
            />
            <AnimatedCounter
              end={142}
              title="Critical Cases"
              icon={TbAlertTriangle}
              iconColor="text-red-500"
              iconBg="bg-red-50"
              sub="Requiring closer monitoring"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default OverviewSection;
