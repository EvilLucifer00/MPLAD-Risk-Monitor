import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import PortalPageLoader from '../../components/shared/PortalPageLoader';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  TbLayoutDashboard, 
  TbBriefcase, 
  TbClipboardCheck,
  TbSettings, 
  TbBell, 
  TbSearch, 
  TbFileDescription,
  TbBuildingBank,
  TbUserScan,
  TbLogout,
  TbX
} from 'react-icons/tb';
import { IconMenu } from '../../components/shared/HomeIcons';
import EmblemImage from '../../components/shared/EmblemImage';
import { daApi } from '../../api/daApi';
import { useAuthStore } from '../../store/useAuthStore';
import { subscribePortalSync } from '../../utils/portalSync';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, useDaReviewQueue, useDaNotifications } from '../../api/queries';
import { QueryStatusIndicator } from '../../components/shared/QueryStatusBanner';
import { documentsApi } from '../../api/mpladsApi';
import { CACHE_TIMES } from '../../constants/cacheConfig';
import useDialogA11y from '../../hooks/useDialogA11y';

// Lazy-loaded to eliminate heavy AI chat bundle from critical route waterfall
const AiAssistantWidget = lazy(() => import('../../components/shared/AiAssistantWidget.jsx'));
const DaLayout = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarA11yRef = useDialogA11y(isSidebarOpen, () => setIsSidebarOpen(false));
  const { data: queueData } = useDaReviewQueue();
  const pendingReviewCount = Array.isArray(queueData) ? queueData.length : 0;
  const { data: notifData } = useDaNotifications();
  const notifications = Array.isArray(notifData) ? notifData : [];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const notificationsRef = useRef(null);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    return subscribePortalSync((event) => {
      if (event.type === 'PROJECT_SUBMITTED') {
        const dist = user?.dist || user?.id;
        queryClient.invalidateQueries({ queryKey: queryKeys.da.reviewQueue(dist) });
        queryClient.invalidateQueries({ queryKey: queryKeys.da.stats(dist) });
        queryClient.invalidateQueries({ queryKey: queryKeys.da.projects(dist) });
      }
    });
  }, [queryClient, user?.dist, user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/da/projects?search=${encodeURIComponent(globalSearch.trim())}`);
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const prefetchDaRoute = (routePath) => {
    const dist = user?.dist || user?.id;
    switch (routePath) {
      case '/da':
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.stats(dist),
          queryFn: ({ signal }) => daApi.getDashboardStats({ signal }),
          staleTime: CACHE_TIMES.FINANCIAL_STATUS.staleTime,
        });
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.recommendations(dist),
          queryFn: ({ signal }) => daApi.getRecommendations({ signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.districtMps(dist),
          queryFn: ({ signal }) => daApi.getDistrictMPs({ signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.projects(dist, {}),
          queryFn: ({ signal }) => daApi.getProjects({}, { signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        break;
      case '/da/projects':
        import('./DaProjects.jsx');
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.districtMps(dist),
          queryFn: ({ signal }) => daApi.getDistrictMPs({ signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        break;
      case '/da/review':
        import('./DaProjectReview.jsx');
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.reviewQueue(dist),
          queryFn: ({ signal }) => daApi.getReviewQueue({ signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.districtMps(dist),
          queryFn: ({ signal }) => daApi.getDistrictMPs({ signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.agencies(dist),
          queryFn: ({ signal }) => daApi.getImplementingAgencies({ signal }),
          staleTime: CACHE_TIMES.REFERENCE.staleTime,
        });
        break;
      case '/da/documents':
        import('./DaDocuments.jsx');
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.documents(dist, {}),
          queryFn: ({ signal }) => documentsApi.getDmDocuments({}, { signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.projects(dist, {}),
          queryFn: ({ signal }) => daApi.getProjects({}, { signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        break;
      case '/da/notifications':
        import('./DaNotifications.jsx');
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.notifications(dist),
          queryFn: ({ signal }) => daApi.getNotifications({ signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        break;
      case '/da/agencies':
        import('./DaIADirectory.jsx');
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.agencies(dist),
          queryFn: ({ signal }) => daApi.getImplementingAgencies({ signal }),
          staleTime: CACHE_TIMES.REFERENCE.staleTime,
        });
        break;
      case '/da/vendors':
        import('./DaVendorWatchlist.jsx');
        queryClient.prefetchQuery({
          queryKey: queryKeys.da.vendors(dist),
          queryFn: ({ signal }) => daApi.getVendors({ signal }),
          staleTime: CACHE_TIMES.LISTS_REPORTS.staleTime,
        });
        break;
      case '/da/settings':
        import('./DaSettings.jsx');
        break;
      default:
        break;
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/da', icon: TbLayoutDashboard },
    { name: 'My Projects', path: '/da/projects', icon: TbBriefcase },
    { name: 'Project Review', path: '/da/review', icon: TbClipboardCheck },
    { name: 'Documents', path: '/da/documents', icon: TbFileDescription },
    { name: 'Notifications', path: '/da/notifications', icon: TbBell },
    { name: 'IA Directory', path: '/da/agencies', icon: TbBuildingBank },
    { name: 'Vendor Watchlist', path: '/da/vendors', icon: TbUserScan },
    { name: 'Settings', path: '/da/settings', icon: TbSettings },
  ];

  const handleMarkAsRead = async (id) => {
    await daApi.markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d2744] text-white overflow-y-auto custom-scrollbar-dark overflow-x-hidden relative">
      {/* Top Header */}
      <div className="p-5 sm:p-6 flex items-start justify-between gap-2 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3.5">
          <EmblemImage width="40" height="48" className="w-10 h-12 object-contain shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 leading-none">SIH Prototype</div>
            <h2 className="font-bold text-xl leading-tight tracking-tight mt-0.5">DA Portal</h2>
            <p className="text-[11px] text-sky-200/80 font-medium tracking-tight mt-0.5 leading-snug whitespace-normal">
              District Authority • MPLADS
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
      <nav aria-label="District Authority Portal Navigation" className="flex-1 px-4 space-y-1 mt-4 relative z-10">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || 
                          (link.path !== '/da' && location.pathname.startsWith(link.path));
          const Icon = link.icon;

          return (
            <Link
              key={link.path}
              to={link.path}
              onMouseEnter={() => prefetchDaRoute(link.path)}
              onFocus={() => prefetchDaRoute(link.path)}
              onTouchStart={() => prefetchDaRoute(link.path)}
              onClick={() => setIsSidebarOpen(false)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-[#183e68] text-white border-l-4 border-l-[#ff9933] font-semibold' 
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-300'} aria-hidden="true" />
              <span>{link.name}</span>
              
              {/* Badge for review queue */}
              {link.name === 'Project Review' && pendingReviewCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-[#b91c1c] text-white px-1.5 py-0.5 rounded min-w-[18px] text-center">
                  <span className="sr-only">({pendingReviewCount} pending reviews)</span>
                  <span aria-hidden="true">{pendingReviewCount}</span>
                </span>
              )}
              
              {/* Notification Badge */}
              {link.name === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto w-4 h-4 bg-[#b91c1c] text-white rounded text-[10px] font-bold flex items-center justify-center">
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
            <path d="M 135,75 C 135,35 170,25 200,25 C 230,25 265,35 265,75" stroke="white" strokeWidth="2" fill="url(#dome_grad_da)" opacity="0.5" />
            
            {/* Dome rib lines for 3D volume */}
            <path d="M 200,25 Q 175,45 175,77" stroke="white" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M 200,25 Q 225,45 225,77" stroke="white" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M 200,25 L 200,78" stroke="white" strokeWidth="0.5" fill="none" opacity="0.4" />

            {/* Dome Top Spire */}
            <line x1="200" y1="25" x2="200" y2="10" stroke="white" strokeWidth="1.5" opacity="0.7" />
            <circle cx="200" cy="8" r="2" fill="white" opacity="0.8" />
            
            <defs>
              <linearGradient id="dome_grad_da" x1="0%" y1="0%" x2="0%" y2="100%">
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
            Transparent<br/>
            Governance<br/>
            For All
          </h3>
          <div className="flex h-1 w-24 rounded-full overflow-hidden">
            <div className="flex-1 bg-[#ff9933]"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-[#138808]"></div>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Smart India Hackathon 2026<br/>
            Independent Analytics Prototype<br/>
            Public MPLADS Data Study
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={isSidebarOpen ? sidebarA11yRef : null}
        aria-label="District Authority Navigation"
        aria-modal={isSidebarOpen ? "true" : undefined}
        role={isSidebarOpen ? "dialog" : undefined}
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {renderSidebarContent()}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 h-14 bg-white border-b border-slate-300 flex items-center justify-between px-3 sm:px-4 lg:px-6 z-30 transition-colors gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation sidebar"
              className="p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded lg:hidden shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
            >
              <IconMenu size={20} className="sm:w-5 sm:h-5" />
            </button>
            <form 
              onSubmit={handleGlobalSearch} 
              className="flex items-center bg-white border border-slate-300 rounded px-3 py-1.5 flex-1 min-w-0 transition-colors focus-within:border-[#123b63] focus-within:ring-1 focus-within:ring-[#123b63]"
            >
              <TbSearch className="text-slate-400 mr-2 shrink-0" size={15} aria-hidden="true" />
              <input 
                type="text" 
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search projects, MPs, vendors..." 
                aria-label="Search projects, MPs, vendors"
                className="bg-transparent border-none outline-none text-xs sm:text-sm w-full min-w-0 placeholder:text-slate-400 leading-normal text-slate-800"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  aria-label="Clear search input"
                  className="p-1 -mr-1 text-slate-400 hover:text-slate-600 rounded transition-colors shrink-0"
                >
                  <TbX size={14} />
                </button>
              )}
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
            <QueryStatusIndicator />
            {/* Notification Bell */}
            <div ref={notificationsRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={showNotifications}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                <TbBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded border border-slate-200 shadow-md overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Notifications</h3>
                    <span className="text-[11px] font-semibold bg-[#123b63] text-white px-2 py-0.5 rounded">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-center text-slate-500 py-6 text-xs">
                        No active notifications
                      </p>
                    ) : (
                      notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 hover:bg-slate-50 transition-colors ${!notif.read ? "bg-blue-50/20" : ""}`}
                        >
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                              {new Date(notif.timestamp).toLocaleDateString()}
                            </span>
                            {!notif.read && (
                              <button
                                onClick={() => handleMarkAsRead(notif.id)}
                                className="text-[10px] font-bold text-[#123b63] hover:underline"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <Link
                    to="/da/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="block text-center text-xs font-bold text-[#123b63] py-2.5 bg-slate-50 hover:bg-slate-100 border-t border-slate-200 transition-colors"
                  >
                    View All Notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="District Authority Profile menu"
                aria-expanded={showProfileMenu}
                className="w-8 h-8 rounded bg-slate-100 border border-slate-300 text-[#123b63] font-bold text-xs hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#123b63]"
              >
                DA
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded border border-slate-200 shadow-md overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded bg-slate-200 border border-slate-300 flex items-center justify-center text-[#123b63] font-bold text-sm">
                        DA
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-800 leading-tight truncate">
                          {user?.dm_name || user?.name || "District Magistrate"}
                        </h3>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                          District Authority
                        </p>
                        <p className="text-[10px] font-semibold text-[#123b63] mt-0.5 truncate">
                          {user?.dist
                            ? `${user.dist}${user?.state ? `, ${user.state}` : ""}`
                            : (user?.district ? `${user.district}${user?.state ? `, ${user.state}` : ""}` : "District Authority")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                    >
                      <TbLogout size={16} />
                      <span className="font-semibold">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 lg:p-8"
        >
          <div className="max-w-7xl mx-auto min-h-full pb-20 w-full min-w-0">
            <Suspense fallback={<PortalPageLoader message="Loading page..." />}>
              <Outlet />
            </Suspense>
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

export default DaLayout;
