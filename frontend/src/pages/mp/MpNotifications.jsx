import React, { useState, useEffect } from 'react';
import { api } from '../../api/mockMpApi';
import { mockNotifications } from '../../data/mockMpData';
import { 
  TbBell, 
  TbCheck, 
  TbAlertTriangle, 
  TbInfoCircle, 
  TbChecklist,
  TbTrash
} from 'react-icons/tb';
import usePageSeo from '../../hooks/usePageSeo';

const MpNotifications = () => {
  usePageSeo(
    'Notifications | MP Portal',
    'Review system alerts, risk escalations, and project sanction updates for Member of Parliament.'
  );

  const [notifications, setNotifications] = useState(() => mockNotifications || []);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let isMounted = true;
    api.getNotifications().then(data => {
      if (isMounted && data?.length) {
        setNotifications(data);
      }
    }).catch(() => {
      // Graceful fallback to initial mock notifications
    });
    return () => { isMounted = false; };
  }, []);

  const handleMarkAsRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    await Promise.all(unreadIds.map(id => api.markNotificationRead(id)));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    return n.type === filter;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <TbAlertTriangle size={24} className="text-orange-500" aria-hidden="true" />;
      case 'success': return <TbCheck size={24} className="text-emerald-500" aria-hidden="true" />;
      case 'info':
      default: return <TbInfoCircle size={24} className="text-blue-500" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto min-h-full flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated on your projects and AI risk alerts.</p>
        </div>
        <button 
          type="button"
          onClick={handleMarkAllRead}
          aria-label="Mark all unread notifications as read"
          className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 px-4 py-2 rounded-xl text-sm font-semibold transition-[transform,background-color] duration-150 flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
        >
          <TbChecklist size={18} aria-hidden="true" />
          <span>Mark all as read</span>
        </button>
      </header>

      {/* Filter Section */}
      <section aria-labelledby="notification-filters-heading">
        <h2 id="notification-filters-heading" className="sr-only">Notification Category Filters</h2>
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2" role="toolbar" aria-label="Filter notifications by category">
          {['All', 'Unread', 'warning', 'success', 'info'].map(f => (
            <button 
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize active:scale-95 transition-[transform,background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
                filter === f 
                  ? 'bg-cyan-100 text-[#123b63] font-bold' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'warning' ? 'Alerts' : f}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications Feed */}
      <section 
        aria-labelledby="notifications-feed-heading"
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-auto flex-1"
      >
        <h2 id="notifications-feed-heading" className="sr-only">Notifications List</h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500" role="status" aria-live="polite">
            <div className="w-8 h-8 border-4 border-[#123b63] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
            <TbBell size={48} className="text-slate-300 mb-4" aria-hidden="true" />
            <p className="font-semibold">You're all caught up!</p>
            <p className="text-sm mt-1">No notifications match your current filter.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-slate-100">
            {filteredNotifications.map(notif => (
              <li key={notif.id}>
                <article 
                  className={`p-4 sm:p-6 flex items-start gap-4 transition-colors ${
                    !notif.read ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className={`p-3 rounded-full shrink-0 ${
                    notif.type === 'warning' ? 'bg-orange-100' :
                    notif.type === 'success' ? 'bg-emerald-100' : 'bg-blue-100'
                  }`} aria-hidden="true">
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <h3 className={`text-base ${!notif.read ? 'font-bold text-[#123b63]' : 'font-semibold text-slate-700'}`}>
                        {notif.title || (notif.type === 'warning' ? 'AI Risk Alert' : notif.type === 'success' ? 'Update' : 'Information')}
                      </h3>
                      <time dateTime={notif.timestamp} className="text-xs font-medium text-slate-500 whitespace-nowrap">
                        {new Date(notif.timestamp).toLocaleString()}
                      </time>
                    </div>
                    <p className={`text-sm ${!notif.read ? 'text-slate-800' : 'text-slate-600'} leading-relaxed`}>
                      {notif.message}
                    </p>
                    
                    {notif.projectId && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Project Ref: {notif.projectId}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0">
                    {!notif.read && (
                      <button 
                        type="button"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-2 text-cyan-800 hover:bg-cyan-50 rounded-lg active:scale-90 transition-[transform,color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        title="Mark as read"
                        aria-label="Mark notification as read"
                      >
                        <TbCheck size={20} aria-hidden="true" />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => handleDeleteNotification(notif.id)}
                      className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg active:scale-90 transition-[transform,color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      title="Delete"
                      aria-label="Delete notification"
                    >
                      <TbTrash size={20} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MpNotifications;
