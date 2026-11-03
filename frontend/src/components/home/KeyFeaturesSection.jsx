import React from 'react';
import Reveal from '../../animations/Reveal';
import Card from '../shared/Card';
import { IconMap, IconChartBar, IconShieldCheck, IconUsers } from '../shared/HomeIcons';

const KeyFeaturesSection = () => {
  return (
    <section className="bg-slate-50 px-6 lg:px-10 py-10 lg:py-12 border-b border-slate-100">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-7">
            <div aria-hidden="true" className="w-8 h-1 bg-cyan-600 rounded-full mb-3" />
            <h2 className="text-2xl font-extrabold text-[#123b63]">
              Key Features
            </h2>
          </div>
        </Reveal>
        <Reveal staggerChildren={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
            {[
              {
                icon: IconMap,
                title: "Interactive India Map",
                desc: "Visualize risk levels across all constituencies.",
                accent: "cyan",
                metric: "Constituency View",
                tag: "GIS Mapping",
              },
              {
                icon: IconChartBar,
                title: "Data-Driven Insights",
                desc: "AI analytics for fund utilization and progress.",
                accent: "emerald",
                metric: "Real-time Metrics",
                tag: "Fund Analytics",
              },
              {
                icon: IconShieldCheck,
                title: "Transparency & Accountability",
                desc: "Access verified information in one place.",
                accent: "amber",
                metric: "Public Records",
                tag: "MoSPI Verified",
              },
              {
                icon: IconUsers,
                title: "Public Awareness",
                desc: "Empowering citizens with reliable data.",
                accent: "navy",
                metric: "Citizen Portals",
                tag: "Civic Empowerment",
              },
            ].map(({ icon: Icon, title, desc, accent, metric, tag }, idx) => (
              <Card
                key={title}
                index={`0${idx + 1}`}
                title={title}
                description={desc}
                icon={Icon}
                accent={accent}
                metric={metric}
                tag={tag}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default KeyFeaturesSection;
