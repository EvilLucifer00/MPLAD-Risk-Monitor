import React, { useState } from 'react';
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

const MpSettings = () => {
  usePageSeo(
    'Settings | MP Portal',
    'Manage MP profile details, notification preferences, and security settings.'
  );

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
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account profile, preferences, and security.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 flex-1 items-start">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0" aria-label="Settings Navigation">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <TbUserCircle size={40} className="text-slate-300" aria-hidden="true" />
            <div>
              <p className="font-bold text-[#123b63]">Hon. Member</p>
              <p className="text-xs text-slate-500">Delhi Constituency</p>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl active:scale-95 transition-[transform,background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
                    activeTab === tab.id 
                      ? 'bg-cyan-50 text-[#123b63]' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} className={activeTab === tab.id ? 'text-[#123b63]' : 'text-slate-400'} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area Form */}
        <form 
          onSubmit={handleSave}
          className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 w-full"
        >
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div 
              id="panel-profile"
              role="tabpanel"
              aria-labelledby="tab-profile"
              className="space-y-6 animate-in fade-in duration-300"
            >
              <fieldset>
                <legend className="text-lg font-bold tracking-tight text-[#123b63]">Profile Information</legend>
                <p className="text-sm text-slate-500 mt-1">Update your official contact details.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-2">
                    <label htmlFor="mp-full-name" className="text-sm font-semibold text-slate-700 block">Full Name</label>
                    <input 
                      id="mp-full-name" 
                      type="text" 
                      defaultValue="Hon. Member" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mp-constituency" className="text-sm font-semibold text-slate-700 block">Constituency</label>
                    <div className="relative">
                      <TbBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input 
                        id="mp-constituency" 
                        type="text" 
                        defaultValue="Delhi" 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150 cursor-not-allowed text-slate-600" 
                        disabled 
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Constituency allocation is centrally verified and cannot be changed here.</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mp-email" className="text-sm font-semibold text-slate-700 block">Official Email Address</label>
                    <div className="relative">
                      <TbMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input 
                        id="mp-email" 
                        type="email" 
                        defaultValue="mp.delhi@sansad.nic.in" 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mp-phone" className="text-sm font-semibold text-slate-700 block">Contact Number</label>
                    <div className="relative">
                      <TbPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input 
                        id="mp-phone" 
                        type="tel" 
                        defaultValue="+91 98765 43210" 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150" 
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
              className="space-y-6 animate-in fade-in duration-300"
            >
              <fieldset>
                <legend className="text-lg font-bold text-[#123b63]">Notification Preferences</legend>
                <p className="text-sm text-slate-500 mt-1">Choose how and when you receive updates.</p>

                <div className="space-y-4 pt-6">
                  {[
                    { id: 'notif-status', title: 'Project Status Updates', desc: 'Receive alerts when a project gets sanctioned, rejected, or completed.' },
                    { id: 'notif-risk', title: 'AI Risk Warnings', desc: 'Critical alerts when the ML system detects potential fraud or delays.' },
                    { id: 'notif-reports', title: 'Monthly Reports', desc: 'Get a summary of fund utilization at the end of each month.' },
                    { id: 'notif-sms', title: 'SMS Alerts', desc: 'Receive urgent notifications via text message.' }
                  ].map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div>
                        <label htmlFor={item.id} className="font-semibold text-slate-800 text-sm cursor-pointer">{item.title}</label>
                        <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          id={item.id}
                          type="checkbox" 
                          className="sr-only peer" 
                          defaultChecked={idx !== 3} 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#123b63] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
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
              className="space-y-6 animate-in fade-in duration-300"
            >
              <fieldset>
                <legend className="text-lg font-bold tracking-tight text-[#123b63]">Security & Password</legend>
                <p className="text-sm text-slate-500 mt-1">Manage your password and security settings.</p>

                <div className="space-y-4 pt-6 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="mp-current-pass" className="text-sm font-semibold text-slate-700 block">Current Password</label>
                    <input 
                      id="mp-current-pass" 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mp-new-pass" className="text-sm font-semibold text-slate-700 block">New Password</label>
                    <input 
                      id="mp-new-pass" 
                      type="password" 
                      placeholder="Enter new password" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="mp-confirm-pass" className="text-sm font-semibold text-slate-700 block">Confirm New Password</label>
                    <input 
                      id="mp-confirm-pass" 
                      type="password" 
                      placeholder="Confirm new password" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#123b63]/20 focus:border-[#123b63] transition-[border-color,box-shadow] duration-150" 
                    />
                  </div>
                </div>
              </fieldset>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5" role="status">
                <TbCheck size={18} aria-hidden="true" /> Settings updated successfully!
              </span>
            ) : <span />}
            <button 
              type="submit"
              disabled={saving}
              className="bg-[#123b63] hover:bg-[#0c2a47] active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-[transform,background-color] duration-150 flex items-center gap-2 shadow-sm disabled:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
            >
              <TbDeviceFloppy size={18} aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MpSettings;
