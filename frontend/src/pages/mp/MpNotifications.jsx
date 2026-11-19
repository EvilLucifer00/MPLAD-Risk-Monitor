import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState, useEffect } from 'react';
import { api } from '../../api/mpApi';
import { useMpNotifications, queryKeys } from '../../api/queries';
import { useQueryClient } from '@tanstack/react-query';
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

  const queryClient = useQueryClient();
  const { data: notifData, isLoading } = useMpNotifications();
  const [localNotifications, setLocalNotifications] = useState(null);
  const notifications = localNotifications ?? (Array.isArray(notifData) ? notifData : []);
  const loading = isLoading && !notifData;
  const [filter, setFilter] = useState('All');

  const handleMarkAsRead = async (id) => {
    await api.markNotificationRead(id);
    setLocalNotifications(prev => (prev ?? notifications).map(n => n.id === id ? { ...n, read: true } : n));
    queryClient.invalidateQueries({ queryKey: queryKeys.mp.notifications() });
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    await Promise.all(unreadIds.map(id => api.markNotificationRead(id)));
    setLocalNotifications(prev => (prev ?? notifications).map(n => ({ ...n, read: true })));
    queryClient.invalidateQueries({ queryKey: queryKeys.mp.notifications() });
  };

  const handleDeleteNotification = (id) => {
    setLocalNotifications(prev => (prev ?? notifications).filter(n => n.id !== id));
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

  if (isLoading || !notifData) {
    return <PortalPageLoader message="Loading Notifications..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto min-h-full flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">Official Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Official alerts, sanction advisories, and risk notifications for your constituency.</p>
        </div>
        <button 
          type="button"
          onClick={handleMarkAllRead}
          aria-label="Mark all unread notifications as read"
          className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
        >
          <TbChecklist size={16} aria-hidden="true" />
          <span>Mark all as read</span>
        </button>
      </header>

      {/* Filter Section */}
      <section aria-labelledby="notification-filters-heading">
        <h2 id="notification-filters-heading" className="sr-only">Notification Category Filters</h2>
        <div className="bg-white p-2 rounded border border-slate-200 flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter notifications by category">
          {['All', 'Unread', 'warning', 'success', 'info'].map(f => (
            <button 
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
                filter === f 
                  ? 'bg-[#123b63] text-white' 
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
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
        className="bg-white rounded border border-slate-200 overflow-auto flex-1"
      >
        <h2 id="notifications-feed-heading" className="sr-only">Notifications List</h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500" role="status" aria-live="polite">
            <div className="w-8 h-8 border-3 border-[#123b63] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs sm:text-sm font-medium">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
            <TbBell size={40} className="text-slate-300 mb-3" aria-hidden="true" />
            <p className="font-semibold text-sm">No notifications found</p>
            <p className="text-xs text-slate-400 mt-1">No alerts match the chosen filter category.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-slate-100">
            {filteredNotifications.map(notif => (
              <li key={notif.id}>
                <article 
                  className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
                    !notif.read ? 'bg-blue-50/20' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded shrink-0 ${
                    notif.type === 'warning' ? 'bg-amber-100 text-amber-800' :
                    notif.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-[#123b63]'
                  }`} aria-hidden="true">
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <h3 className={`text-xs sm:text-sm ${!notif.read ? 'font-bold text-[#123b63]' : 'font-semibold text-slate-800'}`}>
                        {notif.title || (notif.type === 'warning' ? 'AI Risk Advisory' : notif.type === 'success' ? 'Sanction Update' : 'Administrative Notice')}
                      </h3>
                      <time dateTime={notif.timestamp} className="text-[11px] font-medium text-slate-500 tabular-nums">
                        {new Date(notif.timestamp).toLocaleString("en-GB")}
                      </time>
                    </div>
                    <p className={`text-xs sm:text-sm ${!notif.read ? 'text-slate-800' : 'text-slate-600'} leading-relaxed`}>
                      {notif.message}
                    </p>
                    
                    {notif.projectId && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          Ref: {notif.projectId}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1 shrink-0">
                    {!notif.read && (
                      <button 
                        type="button"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1 text-[#123b63] hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
                        title="Mark as read"
                        aria-label="Mark notification as read"
                      >
                        <TbCheck size={16} aria-hidden="true" />
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => handleDeleteNotification(notif.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      title="Delete"
                      aria-label="Delete notification"
                    >
                      <TbTrash size={16} aria-hidden="true" />
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
