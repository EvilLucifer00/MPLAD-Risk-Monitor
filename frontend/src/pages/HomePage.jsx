import React, { useState } from "react";
import Toolbar from "../components/Toolbar";
import RiskMap from "../components/RiskMap";
import Card from "../components/Card";
import AnimatedCounter from "../components/AnimatedCounter";
import { TbWallet, TbShieldExclamation, TbChartBar, TbScale, TbMapPin, TbMap, TbTrendingUp, TbShieldCheck, TbUsers, TbChevronRight, TbCurrencyRupee, TbAlertTriangle } from "react-icons/tb";
import { IoIosConstruct } from "react-icons/io";
import { FaXTwitter, FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import { IoMdMail } from "react-icons/io";


const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [statesList, setStatesList] = useState([]);

  return (
    <div className="min-h-screen">
      {/* PAGE 1 CONTENT */}
      <div className="flex flex-col w-full h-screen bg-slate-50 relative overflow-hidden">
        {/* BACKGROUND DECORATIONS */}
        {/* Top Right Ashoka Chakra */}
        <svg
          className="absolute top-[-8%] right-[-2%] w-[45%] max-w-[600px] aspect-square pointer-events-none z-0 opacity-[0.04]"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#123b63"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#123b63"
            strokeWidth="0.5"
          />
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="50"
              x2="50"
              y2="8"
              stroke="#123b63"
              strokeWidth="1"
              transform={`rotate(${i * 15} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="5" fill="#123b63" />
        </svg>

        {/* Top Right Tricolor Swoosh */}
        <svg
          className="absolute top-0 right-0 w-[38%] h-[50%] pointer-events-none z-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 0 C 40 30, 70 70, 100 100 L 100 0 Z"
            fill="#138808"
            opacity="0.12"
          />
          <path
            d="M 20 0 C 50 30, 80 60, 100 80 L 100 0 Z"
            fill="#ffffff"
            opacity="0.5"
          />
          <path
            d="M 40 0 C 60 25, 85 45, 100 60 L 100 0 Z"
            fill="#FF9933"
            opacity="0.15"
          />
        </svg>

        {/* Bottom Left Tricolor Swoosh */}
        <svg
          className="absolute bottom-0 left-0 w-[30%] h-[35%] pointer-events-none z-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 0 C 30 50, 60 80, 100 100 L 0 100 Z"
            fill="#FF9933"
            opacity="0.12"
          />
          <path
            d="M 0 25 C 25 55, 50 85, 80 100 L 0 100 Z"
            fill="#ffffff"
            opacity="0.5"
          />
          <path
            d="M 0 50 C 15 65, 40 90, 60 100 L 0 100 Z"
            fill="#138808"
            opacity="0.12"
          />
        </svg>

        {/* Bottom Right Skyline & Text */}
        <div className="absolute bottom-4 right-12 flex flex-col items-end gap-2 z-0 pointer-events-none">
          <svg
            className="w-[450px] h-[55px] opacity-[0.12]"
            viewBox="0 0 700 90"
            fill="#94a3b8"
            preserveAspectRatio="xMaxYMax meet"
          >
            {/* Hawa Mahal */}
            <rect x="5" y="25" width="35" height="65" rx="2" />
            <rect x="10" y="30" width="8" height="10" rx="4" fill="#cbd5e1" />
            <rect x="22" y="30" width="8" height="10" rx="4" fill="#cbd5e1" />
            <rect x="10" y="45" width="8" height="10" rx="4" fill="#cbd5e1" />
            <rect x="22" y="45" width="8" height="10" rx="4" fill="#cbd5e1" />
            <path d="M5,25 L22,10 L40,25 Z" />
            {/* Small dome */}
            <path d="M55,90 L55,50 Q70,30 85,50 L85,90 Z" />
            <rect x="68" y="22" width="3" height="28" />
            {/* Qutub Minar */}
            <path d="M105,90 L110,15 L120,15 L125,90 Z" />
            <circle cx="115" cy="12" r="6" />
            <rect x="108" y="35" width="14" height="3" rx="1" fill="#cbd5e1" />
            <rect x="109" y="55" width="12" height="3" rx="1" fill="#cbd5e1" />
            {/* Building block */}
            <rect x="145" y="40" width="45" height="50" rx="3" />
            <rect x="152" y="47" width="10" height="14" rx="1" fill="#cbd5e1" />
            <rect x="168" y="47" width="10" height="14" rx="1" fill="#cbd5e1" />
            <rect x="152" y="67" width="10" height="14" rx="1" fill="#cbd5e1" />
            <rect x="168" y="67" width="10" height="14" rx="1" fill="#cbd5e1" />
            {/* India Gate */}
            <rect x="210" y="30" width="8" height="60" />
            <rect x="250" y="30" width="8" height="60" />
            <rect x="210" y="25" width="48" height="10" rx="2" />
            <path d="M218,90 L218,55 Q234,40 250,55 L250,90 Z" fill="#cbd5e1" />
            <rect x="230" y="15" width="4" height="15" />
            {/* Lotus Temple */}
            <path d="M290,90 L290,55 Q305,25 320,55 L320,90 Z" />
            <path d="M280,90 L295,50 Q305,35 315,50 L330,90 Z" fill="#cbd5e1" />
            <path d="M298,90 L298,60 Q305,40 312,60 L312,90 Z" />
            {/* Taj Mahal - center piece */}
            <rect x="350" y="45" width="60" height="45" rx="3" />
            <path d="M350,45 Q380,0 410,45 Z" />
            <rect x="377" y="-5" width="4" height="50" />
            <rect x="355" y="55" width="15" height="25" rx="7" fill="#cbd5e1" />
            <rect x="390" y="55" width="15" height="25" rx="7" fill="#cbd5e1" />
            {/* Taj minarets */}
            <rect x="335" y="35" width="7" height="55" />
            <circle cx="338" cy="32" r="5" />
            <rect x="418" y="35" width="7" height="55" />
            <circle cx="422" cy="32" r="5" />
            {/* Gateway of India */}
            <path d="M450,90 L450,35 L465,22 L480,35 L480,90 Z" />
            <rect x="458" y="50" width="14" height="40" rx="7" fill="#cbd5e1" />
            <rect x="450" y="30" width="30" height="8" rx="2" />
            {/* Parliament House */}
            <rect x="505" y="45" width="70" height="45" rx="4" />
            <path d="M505,45 Q540,15 575,45 Z" />
            <rect x="515" y="52" width="8" height="22" rx="1" fill="#cbd5e1" />
            <rect x="530" y="52" width="8" height="22" rx="1" fill="#cbd5e1" />
            <rect x="545" y="52" width="8" height="22" rx="1" fill="#cbd5e1" />
            <rect x="560" y="52" width="8" height="22" rx="1" fill="#cbd5e1" />
            {/* Charminar */}
            <rect x="600" y="40" width="30" height="50" rx="2" />
            <rect x="595" y="30" width="6" height="60" />
            <rect x="630" y="30" width="6" height="60" />
            <path d="M600,40 L615,25 L630,40 Z" />
            <rect x="610" y="55" width="10" height="20" rx="5" fill="#cbd5e1" />
            {/* Right dome */}
            <path d="M655,90 L655,50 Q672,25 690,50 L690,90 Z" />
            <rect x="671" y="18" width="3" height="32" />
          </svg>
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              <div className="w-4 h-0.5 bg-[#FF9933]"></div>
              <div className="w-4 h-0.5 bg-[#ffffff]"></div>
              <div className="w-4 h-0.5 bg-[#138808]"></div>
            </div>
            <p className="text-[9px] font-bold tracking-[0.2em] text-slate-500/60 uppercase">
              Sabka Vikas | Sajha Prayas | Mazboot Bharat
            </p>
            <div className="flex gap-0.5">
              <div className="w-4 h-0.5 bg-[#FF9933]"></div>
              <div className="w-4 h-0.5 bg-[#ffffff]"></div>
              <div className="w-4 h-0.5 bg-[#138808]"></div>
            </div>
          </div>
        </div>

        <Toolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterState={filterState}
          setFilterState={setFilterState}
          filterRisk={filterRisk}
          setFilterRisk={setFilterRisk}
          statesList={statesList}
        />
        <div className="flex flex-row w-full flex-1 overflow-hidden min-h-0 relative z-10">
          <div className="w-[52%] px-6 py-3 flex flex-col h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="relative w-full mb-4 overflow-hidden shadow-xl rounded-3xl shrink-0">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: "url('/mplad_headquarters.png')",
                }}
              />
              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#123b63]/95 via-[#123b63]/70 to-black/30" />

              <div className="relative z-10 px-6 py-5 flex flex-col h-full">
                {/* Government Logo + Information */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="/emblem.png"
                    alt="Government of India"
                    className="w-8 h-10 object-contain"
                  />
                  <div className="text-white leading-tight">
                    <p className="text-[10px] uppercase tracking-wider text-slate-100 font-bold mb-0.5">
                      Government of India
                    </p>
                    <p className="font-semibold text-xs drop-shadow-sm">
                      Ministry of Statistics and Programme Implementation
                    </p>
                  </div>
                </div>

                {/* Page 1 Header */}
                <h1 className="font-extrabold mt-10 text-2xl lg:text-3xl text-white leading-tight tracking-tight drop-shadow-md max-w-2xl">
                  Connecting Public Funds to <br />
                  <span className="text-cyan-400 relative inline-block mt-1">
                    Public Impact
                    <div className="absolute -bottom-1.5 left-0 w-full h-1 bg-cyan-400 rounded-full opacity-80" />
                  </span>
                </h1>
                <h2 className="font-light mt-3 text-sm lg:text-base text-slate-200 max-w-xl leading-normal">
                  Transparency that drives development,
                  <br /> powered by AI-driven insights.
                </h2>
              </div>
            </div>

            <div className="px-1 flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                <Card
                  title="Track Funds"
                  icon={TbWallet}
                  description="Monitor MPLADS fund allocation and utilization across all constituencies in real-time."
                />
                <Card
                  title="Identify Risks"
                  icon={TbShieldExclamation}
                  description="Our AI-driven risk scoring highlights anomalies and potential delays in project execution."
                />
                <Card
                  title="Compare Performance"
                  icon={TbChartBar}
                  description="Evaluate and compare the performance of different states and representatives effortlessly."
                />
                <Card
                  title="Ensure Accountability"
                  icon={TbScale}
                  description="Promote transparency in public spending by giving citizens access to critical financial data."
                />
              </div>

              <div className="mt-auto bg-white border border-slate-200 rounded-2xl px-5 py-3 mb-2 shadow-sm flex items-center gap-4 relative overflow-hidden group shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative z-10 flex gap-4 w-full items-start">
                  <div className="p-2 bg-blue-50 text-[#123b63] rounded-lg shrink-0 mt-0.5">
                    <TbMapPin
                      size={24}
                      className="animate-bounce"
                      style={{ animationDuration: "2s" }}
                    />
                  </div>
                  <div>
                    <h1 className="font-extrabold text-lg text-[#123b63] tracking-tight mb-0.5">
                      Explore the Map
                    </h1>
                    <h2 className="font-medium text-slate-500 text-[13px] leading-relaxed">
                      Select a constituency on the interactive map to view
                      detailed risk scoring.
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-[48%] p-4 pt-0 flex items-center justify-center">
            <div className="w-full h-[95%] overflow-hidden relative">
              <RiskMap
                searchTerm={searchTerm}
                filterState={filterState}
                filterRisk={filterRisk}
                setStatesList={setStatesList}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2 CONTENT */}
      <div className="w-full">
        {/* ── Stats Section ── */}
        <section className="min-h-0 bg-slate-50 px-12 py-16">
          <div className="max-w-8xl mx-auto">
            <div className="mb-10">
              <h2 className="text-4xl font-extrabold text-[#123b63] mb-4">
                Overview
              </h2>
              <div className="w-20 h-1.25 bg-cyan-600 rounded-full"></div>
            </div>

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
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="bg-white px-10 py-12 border-b border-slate-100">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 items-start">
            {/* Left label */}
            <div className="lg:w-56 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 mb-2">
                A More Transparent
                <br />
                and Accountable Tomorrow
              </p>
              <div className="w-8 h-1 bg-cyan-500 rounded-full mb-3" />
              <h2 className="text-3xl font-extrabold text-[#123b63] leading-tight">
                How It Works
              </h2>
            </div>

            {/* Steps */}
            <div className="flex flex-1 flex-col sm:flex-row items-start gap-4">
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
                  <div className="flex-1 flex items-start gap-3">
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
                  </div>
                  {idx < arr.length - 1 && (
                    <TbChevronRight
                      size={20}
                      className="text-slate-300 shrink-0 mt-2 hidden sm:block"
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── Key Features ── */}
        <section className="bg-slate-50 px-10 py-12 border-b border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="mb-7">
              <div className="w-8 h-1 bg-cyan-500 rounded-full mb-3" />
              <h2 className="text-2xl font-extrabold text-[#123b63]">
                Key Features
              </h2>
            </div>
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
          </div>
        </section>

        {/* ── Our Vision ── */}
        <section className="bg-blue-50 px-10 py-12 border-b border-slate-200 overflow-hidden relative">
          {/* India Gate silhouette — detailed */}
          <svg
            className="absolute right-10 bottom-0 h-[90%] opacity-[0.09] pointer-events-none"
            viewBox="0 0 300 400"
            fill="#123b63"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* ── Base platforms ── */}
            <rect x="10" y="380" width="280" height="20" rx="3" />
            <rect x="25" y="368" width="250" height="14" rx="2" />
            <rect x="35" y="358" width="230" height="12" rx="2" />

            {/* ── Left pillar group ── */}
            {/* Outer pillar */}
            <rect x="50" y="195" width="12" height="163" />
            {/* Inner pillar */}
            <rect x="65" y="195" width="12" height="163" />
            {/* Pillar base moulding */}
            <rect x="46" y="350" width="35" height="8" rx="1" />
            <rect x="48" y="345" width="31" height="6" rx="1" />
            {/* Capital */}
            <rect x="46" y="190" width="35" height="7" rx="1" />
            <rect x="48" y="186" width="31" height="5" rx="1" />
            {/* Fluting lines */}
            <line
              x1="56"
              y1="200"
              x2="56"
              y2="345"
              stroke="#dbeafe"
              strokeWidth="0.5"
            />
            <line
              x1="71"
              y1="200"
              x2="71"
              y2="345"
              stroke="#dbeafe"
              strokeWidth="0.5"
            />

            {/* ── Right pillar group ── */}
            <rect x="223" y="195" width="12" height="163" />
            <rect x="238" y="195" width="12" height="163" />
            <rect x="219" y="350" width="35" height="8" rx="1" />
            <rect x="221" y="345" width="31" height="6" rx="1" />
            <rect x="219" y="190" width="35" height="7" rx="1" />
            <rect x="221" y="186" width="31" height="5" rx="1" />
            <line
              x1="229"
              y1="200"
              x2="229"
              y2="345"
              stroke="#dbeafe"
              strokeWidth="0.5"
            />
            <line
              x1="244"
              y1="200"
              x2="244"
              y2="345"
              stroke="#dbeafe"
              strokeWidth="0.5"
            />

            {/* ── Main arch ── */}
            <path d="M77,195 Q150,80 223,195" strokeWidth="0" />
            {/* Inner arch cutout */}
            <path d="M85,195 Q150,100 215,195" fill="#dbeafe" />
            {/* Keystone */}
            <rect x="144" y="92" width="12" height="14" rx="1" />

            {/* ── Entablature / cornice ── */}
            <rect x="40" y="178" width="220" height="4" rx="1" />
            <rect x="38" y="172" width="224" height="7" rx="1" />
            <rect x="36" y="166" width="228" height="7" rx="1" />
            {/* Dentil moulding */}
            {Array.from({ length: 28 }).map((_, i) => (
              <rect
                key={`dentil-${i}`}
                x={42 + i * 8}
                y="163"
                width="4"
                height="3"
                rx="0.5"
              />
            ))}

            {/* ── Attic / upper wall ── */}
            <rect x="42" y="130" width="216" height="33" rx="2" />
            {/* Inscription panel */}
            <rect
              x="95"
              y="136"
              width="110"
              height="20"
              rx="2"
              fill="#dbeafe"
            />
            {/* INDIA text placeholder lines */}
            <rect x="115" y="142" width="70" height="3" rx="1" />
            <rect x="125" y="148" width="50" height="2" rx="1" />

            {/* ── Upper cornice ── */}
            <rect x="38" y="124" width="224" height="7" rx="1" />
            <rect x="40" y="120" width="220" height="5" rx="1" />

            {/* ── Stepped cupola ── */}
            <rect x="110" y="108" width="80" height="13" rx="2" />
            <rect x="118" y="98" width="64" height="11" rx="2" />
            <rect x="126" y="90" width="48" height="9" rx="2" />

            {/* ── Dome / cap ── */}
            <ellipse cx="150" cy="88" rx="18" ry="6" />
            <rect x="145" y="62" width="10" height="26" rx="2" />

            {/* ── Amar Jawan Jyoti ── */}
            <ellipse cx="150" cy="62" rx="8" ry="4" />
            {/* Flame */}
            <path d="M145,60 Q150,36 155,60 Z" fill="#FF9933" opacity="0.85" />
            <path d="M147,58 Q150,42 153,58 Z" fill="#FFD700" opacity="0.7" />

            {/* ── Side wall panels (left) ── */}
            <rect x="50" y="200" width="27" height="2" />
            <rect x="50" y="240" width="27" height="2" />
            <rect x="50" y="280" width="27" height="2" />
            <rect x="50" y="320" width="27" height="2" />

            {/* ── Side wall panels (right) ── */}
            <rect x="223" y="200" width="27" height="2" />
            <rect x="223" y="240" width="27" height="2" />
            <rect x="223" y="280" width="27" height="2" />
            <rect x="223" y="320" width="27" height="2" />
          </svg>

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center relative z-10">
            {/* Heading */}
            <div className="lg:w-52 shrink-0">
              <div className="w-8 h-1 bg-cyan-500 rounded-full mb-3" />
              <h2 className="text-3xl font-extrabold text-[#123b63] leading-tight">
                Our Vision
              </h2>
            </div>

            {/* Vision text */}
            <div className="flex-1 max-w-lg">
              <p className="text-slate-600 text-sm leading-relaxed">
                To enable transparent, data-driven and accountable development
                across every constituency, ensuring that public funds create
                meaningful impact in people's lives.
              </p>
            </div>

            {/* Quote */}
            <div className="flex-1 max-w-sm">
              <p className="text-[#123b63] font-semibold italic text-base leading-relaxed">
                "Development is not just about funds,
                <br />
                but about the lives it touches."
              </p>
              <div className="flex gap-1 mt-3">
                <div className="w-8 h-1 bg-[#FF9933] rounded-full" />
                <div className="w-8 h-1 bg-slate-300 rounded-full" />
                <div className="w-8 h-1 bg-[#138808] rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-[#0d2847] text-white">
          <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="/emblem.png"
                  alt="MPLADS"
                  className="w-10 h-12 object-contain"
                />
                <div>
                  <p className="font-extrabold text-base leading-tight">
                    MPLADS Risk Monitor
                  </p>
                  <p className="text-xs text-slate-400">by MoSPI</p>
                </div>
              </div>
              <p className="text-xs text-cyan-400 font-semibold mb-2">
                Connecting <span className="text-white">Public</span> Funds to
                Public Impact.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                A data-driven platform for transparent and accountable
                development across India.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-sm font-bold mb-4 text-white">Quick Links</p>
              <ul className="space-y-2">
                {["Home", "About", "Features", "Contact"].map(
                  (l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-xs text-slate-400 hover:text-cyan-400 transition-colors duration-150"
                      >
                        {l}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="text-sm font-bold mb-4 text-white">Resources</p>
              <ul className="space-y-2">
                {[
                  "Data Sources",
                  "FAQs",
                  "User Guide",
                  "Privacy Policy",
                  "Terms of Use",
                ].map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-xs text-slate-400 hover:text-cyan-400 transition-colors duration-150"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow Us */}
            <div>
              <p className="text-sm font-bold mb-4 text-white">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { Icon: FaXTwitter, label: "Twitter" },
                  { Icon: FaLinkedinIn, label: "LinkedIn" },
                  { Icon: FaYoutube, label: "YouTube" },
                  { Icon: IoMdMail, label: "Email" },
                ].map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-cyan-500 transition-colors duration-200"
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 px-10 py-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
              <p className="text-[11px] text-slate-500">
                © 2026{" "}
                <span className="font-semibold text-slate-400">
                  MPLADS Risk Monitor
                </span>
                . All rights reserved.
              </p>
              <p className="text-[11px] text-slate-500">
                Government of India &nbsp;|&nbsp; Ministry of Statistics and
                Programme Implementation
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;

