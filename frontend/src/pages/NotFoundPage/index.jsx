import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmblemImage from '../../components/shared/EmblemImage';
import usePageSeo from '../../hooks/usePageSeo';
import { TbArrowLeft, TbHome, TbLayoutDashboard, TbSearch, TbCompass } from 'react-icons/tb';

const NotFoundPage = () => {
  const navigate = useNavigate();

  usePageSeo(
    'Page Not Found (404) | MPLADS Risk Monitor',
    'The requested page or project could not be located on the MPLADS governance portal.'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 antialiased selection:bg-cyan-500/20 selection:text-cyan-900">
      {/* Top Govt Bar */}
      <header className="bg-[#0d2744] text-white border-b border-white/10 px-6 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1">
            <EmblemImage width="34" height="42" className="w-8 h-10 object-contain shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400 leading-none">Government of India</p>
              <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                MPLADS Risk Monitor
              </h1>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <TbHome size={16} aria-hidden="true" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main 404 Hero Section */}
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle Background Radial Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#123b63_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        <div className="max-w-xl w-full text-center relative z-10 py-12">
          {/* Large Stylized 404 Graphic */}
          <div className="relative inline-block mb-2">
            <span className="text-8xl sm:text-9xl font-black tracking-tighter text-[#123b63]/10 select-none block">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
                <TbCompass className="text-amber-600 animate-spin" style={{ animationDuration: '8s' }} size={16} aria-hidden="true" />
                Page Not Found
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#123b63] tracking-tight mb-3">
            The requested page does not exist
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto mb-8 text-pretty">
            The URL may be misspelled, the project reference may have changed, or the document has been relocated in the national directory.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 justify-center items-center mb-10">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) navigate(-1);
                else navigate('/');
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-sm font-semibold rounded-xl transition-all duration-150 flex items-center gap-2 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <TbArrowLeft size={18} aria-hidden="true" />
              <span>Go Back</span>
            </button>
            <Link
              to="/da"
              className="px-5 py-2.5 bg-[#123b63] hover:bg-[#0c2a47] active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a8e8]"
            >
              <TbLayoutDashboard size={18} aria-hidden="true" />
              <span>DA Dashboard</span>
            </Link>
            <Link
              to="/mp"
              className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <TbLayoutDashboard size={18} aria-hidden="true" />
              <span>MP Portal</span>
            </Link>
          </div>

          {/* Helpful Navigation Links Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-left max-w-lg mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Popular Portal Sections</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link to="/da/projects" className="p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-[#123b63] font-medium transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" aria-hidden="true"></span>
                District Projects
              </Link>
              <Link to="/da/review" className="p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-[#123b63] font-medium transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                Review Queue
              </Link>
              <Link to="/mp/projects" className="p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-[#123b63] font-medium transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
                MP Projects
              </Link>
              <Link to="/login" className="p-2.5 rounded-lg hover:bg-slate-50 text-slate-700 hover:text-[#123b63] font-medium transition-colors flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true"></span>
                Portal Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <p>Ministry of Statistics and Programme Implementation (MoSPI) • Government of India</p>
      </footer>
    </div>
  );
};

export default NotFoundPage;

