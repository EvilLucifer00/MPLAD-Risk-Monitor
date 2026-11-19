import React, { useState } from 'react';
import PortalPageLoader from '../../components/shared/PortalPageLoader';
import { 
  TbUserCircle, 
  TbBell, 
  TbLock, 
  TbDeviceFloppy,
  TbMail,
  TbPhone,
  TbBuilding,
  TbCheck
} from 'react-icons/tb';
import usePageSeo from '../../hooks/usePageSeo';
import { useAuthStore } from '../../store/useAuthStore';

const MpSettings = () => {
  usePageSeo(
    'Settings | MP Portal',
    'Manage MP profile details, notification preferences, and security settings.'
  );

  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <PortalPageLoader message="Loading Settings..." />;
  }

  const displayName = user?.mp_name || 'Hon. Member';
  const displayConstituency = user?.constituency 
    ? `${user.constituency}${user?.state ? ', ' + user.state : ''}`
    : (user?.dist ? `${user.dist}${user?.state ? ', ' + user.state : ''}` : 'Constituency');
  const displayEmail = user?.email || (user?.mp_name ? `${user.mp_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sansad.nic.in` : 'mp.office@sansad.nic.in');
  const displayPhone = user?.phone || '+91 98765 43210';

  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 min-h-full flex flex-col">
      <header className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">Account & Portal Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage official profile verification details, alert preferences, and credentials.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 flex-1 items-start">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-white rounded border border-slate-200 overflow-hidden shrink-0" aria-label="Settings Navigation">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
            <TbUserCircle size={36} className="text-slate-400" aria-hidden="true" />
            <div>
              <p className="font-bold text-sm text-[#123b63]">{displayName}</p>
              <p className="text-xs text-slate-500">{displayConstituency}</p>
            </div>
          </div>
          <nav role="tablist" aria-label="Settings categories" className="p-2 space-y-1">
            {[
              { id: 'profile', label: 'Profile Information', icon: TbUserCircle },
              { id: 'notifications', label: 'Notification Preferences', icon: TbBell },
              { id: 'security', label: 'Security & Password', icon: TbLock },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
                    activeTab === tab.id 
                      ? 'bg-[#123b63] text-white' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-slate-500'} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area Form */}
        <form 
          onSubmit={handleSave}
          className="flex-1 bg-white rounded border border-slate-200 p-5 sm:p-7 w-full"
        >
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div 
              id="panel-profile"
              role="tabpanel"
              aria-labelledby="tab-profile"
              className="space-y-5"
            >
              <fieldset>
                <legend className="text-base font-bold tracking-tight text-[#123b63] border-b border-slate-200 pb-2 w-full">Official Representative Profile</legend>
                <p className="text-xs text-slate-500 mt-1">Verified contact details for parliamentary records.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1">
                    <label htmlFor="mp-full-name" className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">Representative Name</label>
                    <input 
                      id="mp-full-name" 
                      type="text" 
                      defaultValue={displayName} 
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="mp-constituency" className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">Constituency</label>
                    <div className="relative">
                      <TbBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input 
                        id="mp-constituency" 
                        type="text" 
                        defaultValue={displayConstituency} 
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs sm:text-sm cursor-not-allowed text-slate-600" 
                        disabled 
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Constituency allocation is centrally verified and cannot be edited locally.</p>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="mp-email" className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">Official Email</label>
                    <div className="relative">
                      <TbMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input 
                        id="mp-email" 
                        type="email" 
                        defaultValue={displayEmail} 
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="mp-phone" className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">Contact Number</label>
                    <div className="relative">
                      <TbPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input 
                        id="mp-phone" 
                        type="tel" 
                        defaultValue={displayPhone} 
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]" 
                      />
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div 
              id="panel-notifications"
              role="tabpanel"
              aria-labelledby="tab-notifications"
              className="space-y-5"
            >
              <fieldset>
                <legend className="text-base font-bold text-[#123b63] border-b border-slate-200 pb-2 w-full">Notification Preferences</legend>
                <p className="text-xs text-slate-500 mt-1">Configure automated dispatch of sanction alerts and ML risk flags.</p>

                <div className="space-y-3 pt-4">
                  {[
                    { id: 'notif-status', title: 'Project Status Updates', desc: 'Receive alerts when a project proposal is sanctioned, rejected, or completed.' },
                    { id: 'notif-risk', title: 'AI Risk Advisories', desc: 'Alerts when the ML risk model flags escalation or anomalies.' },
                    { id: 'notif-reports', title: 'Monthly Progress Summaries', desc: 'Monthly analytical digest of fund disbursements and completions.' },
                    { id: 'notif-sms', title: 'SMS Critical Dispatches', desc: 'Direct emergency SMS dispatches for critical project audits.' }
                  ].map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-3.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div>
                        <label htmlFor={item.id} className="font-semibold text-slate-800 text-xs sm:text-sm cursor-pointer">{item.title}</label>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          id={item.id}
                          type="checkbox" 
                          className="sr-only peer" 
                          defaultChecked={idx !== 3} 
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#123b63] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#123b63]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div 
              id="panel-security"
              role="tabpanel"
              aria-labelledby="tab-security"
              className="space-y-5"
            >
              <fieldset>
                <legend className="text-base font-bold tracking-tight text-[#123b63] border-b border-slate-200 pb-2 w-full">Portal Authentication</legend>
                <p className="text-xs text-slate-500 mt-1">Manage official access credentials and password policy.</p>

                <div className="space-y-3 pt-4 max-w-md">
                  <div className="space-y-1">
                    <label htmlFor="mp-current-pass" className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">Current Password</label>
                    <input 
                      id="mp-current-pass" 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="mp-new-pass" className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">New Password</label>
                    <input 
                      id="mp-new-pass" 
                      type="password" 
                      placeholder="Enter new password" 
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="mp-confirm-pass" className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">Confirm New Password</label>
                    <input 
                      id="mp-confirm-pass" 
                      type="password" 
                      placeholder="Confirm new password" 
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]" 
                    />
                  </div>
                </div>
              </fieldset>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5" role="status">
                <TbCheck size={16} aria-hidden="true" /> Settings updated successfully!
              </span>
            ) : <span />}
            <button 
              type="submit"
              disabled={saving}
              className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-5 py-2 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] disabled:opacity-75"
            >
              <TbDeviceFloppy size={16} aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MpSettings;
