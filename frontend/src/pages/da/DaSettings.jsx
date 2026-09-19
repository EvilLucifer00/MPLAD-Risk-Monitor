import React, { useState } from 'react';
import { TbUser, TbBell, TbShield, TbDeviceFloppy, TbCheck } from 'react-icons/tb';

const DaSettings = () => {
  const [saved, setSaved] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    newSubmissions: true,
    riskAlerts: true,
    vendorFlags: true,
    documentUploads: false,
    weeklyReport: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#123b63]">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and notification preferences.</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <TbUser size={22} />
          </div>
          <h2 className="text-lg font-bold text-[#123b63]">Profile Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input type="text" defaultValue="Shri R.K. Verma, IAS" readOnly
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Designation</label>
            <input type="text" defaultValue="District Collector & District Authority" readOnly
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">District</label>
            <input type="text" defaultValue="Lucknow District" readOnly
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
            <input type="text" defaultValue="Uttar Pradesh" readOnly
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600" />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <TbBell size={22} />
          </div>
          <h2 className="text-lg font-bold text-[#123b63]">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'newSubmissions', label: 'New Project Submissions', desc: 'Notify when MPs submit new projects for review' },
            { key: 'riskAlerts', label: 'AI Risk Alerts', desc: 'Critical and high-risk project auto-detection alerts' },
            { key: 'vendorFlags', label: 'Vendor Flag Alerts', desc: 'Notifications when vendors are flagged across projects' },
            { key: 'documentUploads', label: 'Document Uploads', desc: 'Notify when MPs upload requested documents' },
            { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Automated weekly district summary email' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifSettings[item.key] ? 'bg-cyan-500' : 'bg-slate-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifSettings[item.key] ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TbShield size={22} />
          </div>
          <h2 className="text-lg font-bold text-[#123b63]">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Two-Factor Authentication</p>
              <p className="text-[12px] text-slate-500 mt-0.5">Extra security for destructive actions (suspend, reject)</p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg">Enabled</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Session Timeout</p>
              <p className="text-[12px] text-slate-500 mt-0.5">Auto-logout after inactivity</p>
            </div>
            <span className="text-sm font-semibold text-slate-600">30 minutes</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
            saved 
              ? 'bg-emerald-600 text-white' 
              : 'bg-[#123b63] hover:bg-[#0c2a47] text-white'
          }`}
        >
          {saved ? <><TbCheck size={18} /> Saved!</> : <><TbDeviceFloppy size={18} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
};

export default DaSettings;
