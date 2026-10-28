import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  TbLayoutDashboard, 
  TbBriefcase, 
  TbFilePlus, 
  TbSettings, 
  TbBell, 
  TbSearch, 
  TbChartBar, 
  TbFileDescription, 
  TbLogout,
  TbX
} from 'react-icons/tb';
import { IconMenu } from '../../components/shared/HomeIcons';
import EmblemImage from '../../components/shared/EmblemImage';
import { api } from '../../api/mockMpApi';
import { useAuthStore } from '../../store/useAuthStore';

// Lazy-loaded to eliminate heavy AI chat bundle from critical route waterfall
const AiAssistantWidget = lazy(() => import('../../components/shared/AiAssistantWidget.jsx'));

const MpLayout = () => {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/mp/projects?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Lock browser viewport to single page (eliminates browser window scrollbar)
    document.documentElement.classList.add('portal-locked');
    document.body.classList.add('portal-locked');
    return () => {
      document.documentElement.classList.remove('portal-locked');
      document.body.classList.remove('portal-locked');
    };
  }, []);

  useEffect(() => {
    // Fetch notifications on mount
    api.getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinks = [
    { name: 'Dashboard', path: '/mp', icon: TbLayoutDashboard },
    { name: 'My Projects', path: '/mp/projects', icon: TbBriefcase },
    { name: 'Submit Project', path: '/mp/submit', icon: TbFilePlus },
    { name: 'Reports', path: '/mp/reports', icon: TbChartBar },
    { name: 'Documents', path: '/mp/documents', icon: TbFileDescription },
    { name: 'Notifications', path: '/mp/notifications', icon: TbBell },
    { name: 'Settings', path: '/mp/settings', icon: TbSettings },
  ];

  const handleMarkAsRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d2744] text-white overflow-y-auto custom-scrollbar-dark overflow-x-hidden relative">
      {/* Top Header */}
      <div className="p-5 sm:p-6 flex items-start justify-between gap-2 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3.5">
          <EmblemImage width="40" height="48" className="w-10 h-12 object-contain shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 leading-none">Govt of India</div>
            <h2 className="font-bold text-xl leading-tight tracking-tight mt-0.5">MP Portal</h2>
            <p className="text-[11px] text-sky-200/80 font-medium tracking-tight mt-0.5 leading-snug whitespace-normal">
              Member of Parliament • MPLADS
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close navigation sidebar"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 rounded-lg lg:hidden transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 shrink-0 mt-0.5"
        >
          <TbX size={20} />
        </button>
      </div>
      
      {/* Navigation Links */}
      <nav aria-label="Member of Parliament Portal Navigation" className="flex-1 px-4 space-y-1 mt-4 relative z-10">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || 
                          (link.path !== '/mp' && location.pathname.startsWith(link.path));
          const Icon = link.icon;
          
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsSidebarOpen(false)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-[#00a8e8] text-white shadow-md' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} aria-hidden="true" />
              <span className="font-medium text-sm">{link.name}</span>
              
              {/* Notification Badge specifically for the Notifications tab */}
              {link.name === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto w-4 h-4 bg-[#ef4444] rounded-full border border-[#0d2744] flex items-center justify-center">
                  <span className="sr-only">({unreadCount} unread)</span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full" aria-hidden="true"></span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="px-6 pb-6 pt-32 relative z-10 mt-auto overflow-hidden">
        {/* Parliament Background SVG */}
        <div className="absolute bottom-28 left-0 right-0 h-64 -z-10 opacity-25 pointer-events-none flex items-end justify-center">
          <svg viewBox="0 0 400 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
            {/* Base platform */}
            <path d="M 10,135 A 190,15 0 0,0 390,135 L 390,140 A 190,15 0 0,1 10,140 Z" fill="white" opacity="0.15" />
            <path d="M 15,130 A 185,14 0 0,0 385,130 L 385,135 A 185,14 0 0,1 15,135 Z" fill="white" opacity="0.2" />
            
            {/* Main building body behind pillars */}
            <path d="M 20,130 A 180,13 0 0,0 380,130 L 380,95 A 180,13 0 0,1 20,95 Z" fill="white" opacity="0.05" />

            {/* Pillars calculated in 3D perspective (elliptical) */}
            {Array.from({ length: 45 }).map((_, i) => {
              const theta = Math.PI - (i / 44) * Math.PI;
              const x = 200 + 180 * Math.cos(theta);
              const yBottom = 130 + 13 * Math.sin(theta);
              const yTop = 95 + 13 * Math.sin(theta);
              const width = 2.5 * Math.sin(theta) + 0.5;

              return (
                <rect 
                  key={`pillar-${i}`} 
                  x={x - width/2} 
                  y={yTop} 
                  width={width} 
                  height={yBottom - yTop} 
                  fill="white" 
                  opacity="0.5" 
                />
              );
            })}

            {/* Cornice / Roof lower */}
            <path d="M 15,95 A 185,14 0 0,0 385,95 L 385,90 A 185,14 0 0,1 15,90 Z" fill="white" opacity="0.4" />
            {/* Roof upper tier */}
            <path d="M 20,90 A 180,13 0 0,0 380,90 L 380,85 A 180,13 0 0,1 20,85 Z" fill="white" opacity="0.3" />

            {/* Central Dome */}
            <path d="M 130,80 A 70,5 0 0,0 270,80 L 270,75 A 70,5 0 0,1 130,75 Z" fill="white" opacity="0.4" />
            <path d="M 135,75 C 135,35 170,25 200,25 C 230,25 265,35 265,75" stroke="white" strokeWidth="2" fill="url(#dome_grad)" opacity="0.5" />
            
            {/* Dome rib lines for 3D volume */}
            <path d="M 200,25 Q 175,45 175,77" stroke="white" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M 200,25 Q 225,45 225,77" stroke="white" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M 200,25 L 200,78" stroke="white" strokeWidth="0.5" fill="none" opacity="0.4" />

            {/* Dome Top Spire */}
            <line x1="200" y1="25" x2="200" y2="10" stroke="white" strokeWidth="1.5" opacity="0.7" />
            <circle cx="200" cy="8" r="2" fill="white" opacity="0.8" />
            
            <defs>
              <linearGradient id="dome_grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor="white" stopOpacity="0.0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Decorative subtle background gradient for the footer */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#091b2e] to-transparent -z-20"></div>
        
        <div className="mb-8">
          <h3 className="font-bold text-white text-base leading-tight mb-3">
            People's<br/>
            Development<br/>
            Our Commitment
          </h3>
          <div className="flex h-1 w-24 rounded-full overflow-hidden">
            <div className="flex-1 bg-[#ff9933]"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-[#138808]"></div>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Government of India<br/>
            Ministry of Statistics and<br/>
            Programme Implementation
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen h-[100dvh] max-h-[100dvh] w-full max-w-full min-w-0 overflow-hidden bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        aria-label="Member of Parliament Navigation"
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {renderSidebarContent()}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 lg:px-8 z-30 transition-all duration-200 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="p-2 text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200 rounded-xl lg:hidden transition-all active:scale-95 shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] shadow-xs"
            >
              <IconMenu size={22} className="sm:w-6 sm:h-6" />
            </button>
            <form 
              onSubmit={handleGlobalSearch} 
              className="flex items-center bg-slate-100/90 hover:bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#123b63]/25 focus-within:border-slate-300 border border-transparent rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex-1 min-w-0 transition-all duration-150"
            >
              <TbSearch className="text-slate-400 mr-2 shrink-0" size={16} aria-hidden="true" />
              <input 
                type="text" 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search projects, vendors..." 
                aria-label="Search projects and vendors"
                className="bg-transparent border-none outline-none text-base sm:text-sm w-full min-w-0 placeholder:text-slate-400 leading-normal text-slate-800"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  aria-label="Clear search input"
                  className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors shrink-0"
                >
                  <TbX size={14} />
                </button>
              )}
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative">
            {/* Notification Bell */}
            <div ref={notificationsRef} className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={showNotifications}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                <TbBell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Notifications</h3>
                    <span className="text-xs font-semibold bg-[#123b63] text-white px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-slate-500 py-6 text-sm">No notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <p className="text-sm text-slate-700 leading-relaxed">{notif.message}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(notif.timestamp).toLocaleDateString()}
                            </span>
                            {!notif.read && (
                              <button 
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="text-[10px] font-bold text-sky-800 hover:text-sky-950 focus-visible:underline"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile Menu */}
            <div ref={profileMenuRef} className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Member of Parliament Profile menu"
                aria-expanded={showProfileMenu}
                className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-800 font-bold border border-cyan-200 hover:bg-cyan-200 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
              >
                MP
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 transform origin-top-right transition-all duration-200 ease-out animate-in fade-in zoom-in-95"
                >
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-800 font-bold border border-cyan-200 text-lg">
                        MP
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 leading-tight">{user?.mp_name || 'Rahul Sharma'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Member of Parliament</p>
                        <p className="text-[10px] font-semibold text-cyan-600 mt-1">
                          {user?.constituency ? `${user.constituency}${user?.state ? `, ${user.state}` : ''}` : 'Varanasi, UP'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <TbLogout size={18} />
                      <span className="font-medium">Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50 p-4 sm:p-6 lg:p-8 w-full max-w-full min-w-0">
          <div className="max-w-7xl mx-auto min-h-full pb-20 w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Floating Assistant */}
      <Suspense fallback={null}>
        <AiAssistantWidget />
      </Suspense>
    </div>
  );
};

export default MpLayout;
