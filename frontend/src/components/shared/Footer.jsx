import React from 'react';
import { Link } from 'react-router-dom';
import EmblemImage from './EmblemImage';

export const Footer = () => {
  return (
    <footer className="bg-[#0b2545] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
        {/* Project Brand Lockup */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-2.5">
            <EmblemImage
              alt="MPLADS Risk Monitor"
              width="36"
              height="44"
              className="w-9 h-11 object-contain shrink-0"
            />
            <div>
              <p className="font-bold text-sm leading-tight text-white">
                MPLADS Risk Monitor
              </p>
              <p className="text-xs text-slate-300">
                Smart India Hackathon 2026 Prototype
              </p>
              <p className="text-[11px] text-slate-400">
                Independent Research & Analytics Initiative
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed mt-2">
            An independent prototype platform demonstrating expenditure surveillance,
            heuristic anomaly detection, and data-driven monitoring for Member of
            Parliament Local Area Development Scheme funds using publicly available data.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">
            Public Transparency
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>
              <Link to="/about" className="hover:text-white transition-colors">
                About the SIH Project
              </Link>
            </li>
            <li>
              <Link to="/data-sources" className="hover:text-white transition-colors">
                Data Sources & Integrity
              </Link>
            </li>
            <li>
              <Link to="/methodology" className="hover:text-white transition-colors">
                Risk Methodology & Heuristics
              </Link>
            </li>
            <li>
              <Link to="/#geospatial-map" className="hover:text-white transition-colors">
                Constituency Risk Map
              </Link>
            </li>
          </ul>
        </div>

        {/* External Resources */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">
            Official Portals & Resources
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>
              <a
                href="https://mplads.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Official MoSPI MPLADS Portal
              </a>
            </li>
            <li>
              <a
                href="https://www.india.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                National Portal of India
              </a>
            </li>
            <li>
              <a
                href="/llms.txt"
                className="hover:text-white transition-colors"
              >
                AI System Context (llms.txt)
              </a>
            </li>
            <li>
              <Link
                to="/login"
                className="hover:text-white transition-colors"
              >
                Evaluator Demo Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright & Statutory Disclaimer */}
      <div className="border-t border-white/10 px-4 sm:px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 text-[11px] text-slate-400 text-center sm:text-left">
          <p className="font-medium text-slate-300">
            Independent Smart India Hackathon Prototype • SIH 2026
          </p>
          <p className="leading-relaxed">
            This platform is an independent Smart India Hackathon prototype and is not affiliated with, operated by, or endorsed by the Government of India, MoSPI, or any government department. It analyses publicly available information to demonstrate data-driven monitoring of MPLADS projects.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
