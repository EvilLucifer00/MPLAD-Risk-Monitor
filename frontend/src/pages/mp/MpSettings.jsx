import React, { useState } from 'react';
import { 
  TbUserCircle, 
  TbBell, 
  TbLock, 
  TbDeviceFloppy,
  TbMail,
  TbPhone,
  TbBuilding
} from 'react-icons/tb';

const MpSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully! (Simulated)');
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-[#123b63]">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account profile, preferences, and security.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 items-start">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <TbUserCircle size={40} className="text-slate-300" />
            <div>
              <p className="font-bold text-[#123b63]">Hon. Member</p>
              <p className="text-xs text-slate-500">Delhi Constituency</p>
            </div>
          </div>
          <nav className="p-2 space-y-1">
            {[
              { id: 'profile', label: 'Profile Information', icon: TbUserCircle },
              { id: 'notifications', label: 'Notification Preferences', icon: TbBell },
              { id: 'security', label: 'Security & Password', icon: TbLock },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-cyan-50 text-cyan-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} className={activeTab === tab.id ? 'text-cyan-600' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 w-full">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-[#123b63]">Profile Information</h2>
                <p className="text-sm text-slate-500 mt-1">Update your official contact details.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Full Name</label>
                  <input type="text" defaultValue="Hon. Member" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Constituency</label>
                  <div className="relative">
                    <TbBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" defaultValue="Delhi" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" disabled />
                  </div>
                  <p className="text-[10px] text-slate-400">Constituency cannot be changed here.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Official Email Address</label>
                  <div className="relative">
                    <TbMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" defaultValue="mp.delhi@sansad.nic.in" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Contact Number</label>
                  <div className="relative">
                    <TbPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="tel" defaultValue="+91 98765 43210" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-[#123b63]">Notification Preferences</h2>
                <p className="text-sm text-slate-500 mt-1">Choose how and when you receive updates.</p>
              </div>

              <div className="space-y-4 pt-4">
                {[
                  { title: 'Project Status Updates', desc: 'Receive alerts when a project gets sanctioned, rejected, or completed.' },
                  { title: 'AI Risk Warnings', desc: 'Critical alerts when the ML system detects potential fraud or delays.' },
                  { title: 'Monthly Reports', desc: 'Get a summary of fund utilization at the end of each month.' },
                  { title: 'SMS Alerts', desc: 'Receive urgent notifications via text message.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={idx !== 3} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-[#123b63]">Security & Password</h2>
                <p className="text-sm text-slate-500 mt-1">Manage your password and security settings.</p>
              </div>

              <div className="space-y-4 pt-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">New Password</label>
                  <input type="password" placeholder="Enter new password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm disabled:opacity-75"
            >
              <TbDeviceFloppy size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MpSettings;
