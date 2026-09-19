import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { daApi } from '../../api/mockDaApi';
import { 
  TbBell, TbCheck, TbAlertTriangle, TbInfoCircle, TbChecklist, TbTrash, TbX
} from 'react-icons/tb';

const DaNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    daApi.getNotifications().then(data => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  const handleMarkAsRead = async (id) => {
    await daApi.markNotificationRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    await Promise.all(unreadIds.map(id => daApi.markNotificationRead(id)));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    return n.type === filter;
  });

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <TbAlertTriangle size={24} className="text-orange-500" />;
      case 'success': return <TbCheck size={24} className="text-emerald-500" />;
      case 'error': return <TbX size={24} className="text-red-500" />;
      case 'info':
      default: return <TbInfoCircle size={24} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#123b63]">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Stay updated on project reviews, AI alerts, and MP submissions.</p>
        </div>
        <button 
          onClick={handleMarkAllRead}
          className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <TbChecklist size={18} />
          <span>Mark all as read</span>
        </button>
      </div>

      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2">
        {['All', 'Unread', 'warning', 'success', 'info', 'error'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
              filter === f 
                ? 'bg-cyan-50 text-cyan-700' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {f === 'warning' ? 'Alerts' : f === 'error' ? 'Errors' : f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-auto flex-1">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
            <TbBell size={48} className="text-slate-300 mb-4" />
            <p className="font-semibold">You're all caught up!</p>
            <p className="text-sm mt-1">No notifications match your current filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 sm:p-6 flex items-start gap-4 transition-colors ${
                  !notif.read ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className={`p-3 rounded-full shrink-0 ${
                  notif.type === 'warning' ? 'bg-orange-100' :
                  notif.type === 'success' ? 'bg-emerald-100' :
                  notif.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {getIcon(notif.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <p className={`text-base ${!notif.read ? 'font-bold text-[#123b63]' : 'font-semibold text-slate-700'}`}>
                      {notif.type === 'warning' ? 'Risk Alert' : notif.type === 'success' ? 'Update' : notif.type === 'error' ? 'Escalation' : 'Information'}
                    </p>
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className={`text-sm ${!notif.read ? 'text-slate-700' : 'text-slate-500'} leading-relaxed`}>
                    {notif.message}
                  </p>
                  
                  {notif.projectId && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Ref: {notif.projectId}
                      </span>
                      <Link 
                        to={`/da/review/${notif.projectId}`}
                        className="text-xs font-bold text-cyan-700 hover:text-cyan-800"
                      >
                        View →
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  {!notif.read && (
                    <button 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <TbCheck size={20} />
                    </button>
                  )}
                  <button 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TbTrash size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DaNotifications;
