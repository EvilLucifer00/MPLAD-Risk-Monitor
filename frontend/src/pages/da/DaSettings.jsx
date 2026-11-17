import React, { useState } from 'react';
import { TbUser, TbBell, TbShield, TbDeviceFloppy, TbCheck } from 'react-icons/tb';
import { usePageSeo } from '../../hooks/usePageSeo';
import { useAuthStore } from '../../store/useAuthStore';

const DaSettings = () => {
  usePageSeo(
    'Settings | DA Portal',
    'District Authority account preferences, notification alerts, and administrative security settings.'
  );

  const user = useAuthStore((state) => state.user);
  const displayName = user?.dm_name || user?.name || 'District Authority';
  const displayDesignation = user?.designation || 'District Collector & District Authority';
  const displayDistrict = user?.dist ? `${user.dist} District` : (user?.district ? `${user.district} District` : 'District Authority');
  const displayState = user?.state || 'Uttar Pradesh';

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
      <header className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Official Profile & Settings</h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">Manage your administrative credentials and notification preferences.</p>
      </header>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-6"
      >
        {/* Profile */}
        <fieldset className="bg-white rounded border border-slate-300 p-5 sm:p-6">
          <legend className="sr-only">Profile Information</legend>
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
            <div className="p-2 bg-slate-100 text-[#123b63] rounded border border-slate-200" aria-hidden="true">
              <TbUser size={20} />
            </div>
            <h2 className="text-base font-bold tracking-tight text-[#123b63]">Profile Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="da-fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Full Name</label>
              <input id="da-fullname" type="text" defaultValue={displayName} readOnly
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#123b63]" />
            </div>
            <div>
              <label htmlFor="da-designation" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Designation</label>
              <input id="da-designation" type="text" defaultValue={displayDesignation} readOnly
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#123b63]" />
            </div>
            <div>
              <label htmlFor="da-district" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">District</label>
              <input id="da-district" type="text" defaultValue={displayDistrict} readOnly
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#123b63]" />
            </div>
            <div>
              <label htmlFor="da-state" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">State</label>
              <input id="da-state" type="text" defaultValue={displayState} readOnly
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#123b63]" />
            </div>
          </div>
        </fieldset>

        {/* Notification Preferences */}
        <fieldset className="bg-white rounded border border-slate-300 p-5 sm:p-6">
          <legend className="sr-only">Notification Preferences</legend>
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200">
            <div className="p-2 bg-slate-100 text-[#123b63] rounded border border-slate-200" aria-hidden="true">
              <TbBell size={20} />
            </div>
            <h2 className="text-base font-bold tracking-tight text-[#123b63]">Notification Preferences</h2>
          </div>
          <ul role="list" className="divide-y divide-slate-200">
            {[
              { key: 'newSubmissions', label: 'New Project Submissions', desc: 'Notify when MPs submit new projects for review' },
              { key: 'riskAlerts', label: 'AI Risk Alerts', desc: 'Critical and high-risk project auto-detection alerts' },
              { key: 'vendorFlags', label: 'Vendor Flag Alerts', desc: 'Notifications when vendors are flagged across projects' },
              { key: 'documentUploads', label: 'Document Uploads', desc: 'Notify when MPs upload requested documents' },
              { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Automated weekly district summary email' },
            ].map(item => (
              <li key={item.key} className="flex items-center justify-between py-3">
                <div>
                  <p id={`label-${item.key}`} className="text-xs sm:text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(notifSettings[item.key])}
                  aria-labelledby={`label-${item.key}`}
                  onClick={() => setNotifSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#123b63] ${
                    notifSettings[item.key] ? 'bg-[#123b63]' : 'bg-slate-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${
                    notifSettings[item.key] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </li>
            ))}
          </ul>
        </fieldset>

        {/* Security */}
        <section aria-labelledby="da-security-heading" className="bg-white rounded border border-slate-300 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
            <div className="p-2 bg-slate-100 text-[#123b63] rounded border border-slate-200" aria-hidden="true">
              <TbShield size={20} />
            </div>
            <h2 id="da-security-heading" className="text-base font-bold tracking-tight text-[#123b63]">Security Settings</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">Two-Factor Authentication</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Required for statutory actions (sanction, reject, suspend)</p>
              </div>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">Enabled</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-t border-slate-100">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">Session Timeout</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Automatic logout after inactivity period</p>
              </div>
              <span className="text-xs font-semibold text-slate-700 tabular-nums">30 minutes</span>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end items-center gap-4 pt-2">
          <div role="status" aria-live="polite">
            {saved && (
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <TbCheck size={16} aria-hidden="true" /> Settings updated successfully
              </span>
            )}
          </div>
          <button
            type="submit"
            className={`px-5 py-2 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#123b63] ${
              saved 
                ? 'bg-emerald-700 text-white' 
                : 'bg-[#123b63] hover:bg-[#0c2a47] text-white'
            }`}
          >
            {saved ? <><TbCheck size={16} aria-hidden="true" /> Saved!</> : <><TbDeviceFloppy size={16} aria-hidden="true" /> Save Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DaSettings;
