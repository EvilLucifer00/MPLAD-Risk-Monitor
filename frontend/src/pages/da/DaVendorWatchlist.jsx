import React, { useState, useEffect } from 'react';
import { daApi } from '../../api/mockDaApi';
import { mockVendors } from '../../data/mockDaData';
import { TbSearch, TbFlag, TbAlertTriangle, TbUserScan, TbX, TbCheck, TbLoader2 } from 'react-icons/tb';
import { usePageSeo } from '../../hooks/usePageSeo';

const DaVendorWatchlist = () => {
  usePageSeo(
    'Vendor Watchlist | DA Portal',
    'Monitor and flag contracted vendors across district MPLADS projects based on risk scores and audit findings.'
  );

  const [vendors, setVendors] = useState(() => mockVendors);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFlagged, setFilterFlagged] = useState('All');
  
  // Flag modal
  const [showFlagModal, setShowFlagModal] = useState(null);
  const [flagNotes, setFlagNotes] = useState('');
  const [flagging, setFlagging] = useState(false);

  useEffect(() => {
    daApi.getVendors().then(data => {
      if (data && data.length) {
        setVendors(data);
      }
      setLoading(false);
    });
  }, []);

  const handleFlag = async (vendorId) => {
    if (!flagNotes.trim()) return;
    setFlagging(true);
    try {
      const updated = await daApi.flagVendor(vendorId, { notes: flagNotes });
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, flagged: true, flagNotes: flagNotes } : v));
      setShowFlagModal(null);
    } catch {
      // Handled gracefully
    }
    setFlagging(false);
  };

  const handleUnflag = async (vendorId) => {
    try {
      await daApi.unflagVendor(vendorId);
    } catch {
      // Handled gracefully
    }
  };

  const filtered = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFlag = filterFlagged === 'All' || 
      (filterFlagged === 'Flagged' && v.flagged) || 
      (filterFlagged === 'Clean' && !v.flagged);
    return matchesSearch && matchesFlag;
  });

  const flaggedCount = vendors.filter(v => v.flagged).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-full flex flex-col">
      {/* Flag Modal */}
      {showFlagModal && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" 
          onClick={() => setShowFlagModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="flag-vendor-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-red-100 bg-red-50/30">
              <h3 id="flag-vendor-title" className="text-lg font-bold tracking-tight text-red-700 flex items-center gap-2">
                <TbFlag size={22} aria-hidden="true" /> Flag Vendor
              </h3>
              <p className="text-sm text-red-600 mt-1">
                Flag "{vendors.find(v => v.id === showFlagModal)?.name}" for future reference.
              </p>
            </div>
            <div className="p-6">
              <label htmlFor="flag-notes-input" className="block text-sm font-semibold text-slate-700 mb-1.5">Flag Notes *</label>
              <textarea 
                id="flag-notes-input"
                value={flagNotes} 
                onChange={e => setFlagNotes(e.target.value)} 
                rows={4}
                placeholder="Describe why this vendor is being flagged (e.g., cost overruns, quality issues, suspected fraud)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none transition-[border-color,box-shadow] duration-150"
              />
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => { setShowFlagModal(null); setFlagNotes(''); }} 
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-[transform,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleFlag(showFlagModal)} 
                disabled={!flagNotes.trim() || flagging}
                className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 active:scale-95 disabled:opacity-50 transition-[transform,background-color] duration-150 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
              >
                {flagging ? <TbLoader2 size={16} className="animate-spin" aria-hidden="true" /> : <TbFlag size={16} aria-hidden="true" />} Flag Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Vendor Watchlist</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and flag vendors across all district projects.</p>
        </div>
        <div className="flex items-center gap-2" role="status" aria-label={`${flaggedCount} vendors flagged for risk`}>
          <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1.5">
            <TbFlag size={16} aria-hidden="true" /> {flaggedCount} Flagged
          </span>
        </div>
      </header>

      {/* Filters */}
      <section aria-labelledby="vendor-filter-heading" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 id="vendor-filter-heading" className="sr-only">Filter Vendors</h2>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input 
              type="text" 
              id="vendor-search-input"
              placeholder="Search by vendor name..."
              aria-label="Search vendors by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-[border-color,box-shadow] duration-150"
            />
          </div>
          <div className="flex gap-2" role="toolbar" aria-label="Filter vendors by status">
            {['All', 'Flagged', 'Clean'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilterFlagged(f)}
                aria-pressed={filterFlagged === f}
                className={`px-4 py-2 rounded-lg text-sm font-semibold active:scale-95 transition-[transform,background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
                  filterFlagged === f ? 'bg-cyan-100 text-cyan-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* Vendors Table */}
      <section aria-labelledby="vendor-table-heading" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <h2 id="vendor-table-heading" className="sr-only">Vendors Risk Status Table</h2>
        <div className="overflow-x-auto h-full">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500" role="status">
              <TbUserScan size={48} className="text-slate-300 mb-4" aria-hidden="true" />
              <p className="font-semibold">No vendors found</p>
            </div>
          ) : (
            <table role="table" className="w-full text-left border-collapse">
              <caption className="sr-only">District Vendor Watchlist and Risk Status</caption>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <th scope="col" className="px-5 py-3.5 font-semibold">Vendor</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-center">Projects</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-center">Avg Risk</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold hidden md:table-cell">Flag Notes</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(vendor => (
                  <tr key={vendor.id} className={`hover:bg-slate-50/50 transition-colors ${vendor.flagged ? 'bg-red-50/20' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {vendor.flagged && <TbFlag size={16} className="text-red-500 shrink-0" aria-hidden="true" />}
                        <div>
                          <p className="font-bold text-[#123b63] text-sm">{vendor.name}</p>
                          <p className="text-xs text-slate-500">{vendor.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-bold text-[#123b63]">{vendor.projectsCount}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                        vendor.avgRiskScore >= 60 ? 'bg-red-50 text-red-800' :
                        vendor.avgRiskScore >= 40 ? 'bg-amber-50 text-amber-900' :
                        'bg-emerald-50 text-emerald-800'
                      }`}>
                        {vendor.avgRiskScore}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {vendor.flagged ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          <TbAlertTriangle size={13} aria-hidden="true" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800">
                          <TbCheck size={13} aria-hidden="true" /> Clear
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell max-w-[250px]">
                      {vendor.flagNotes ? (
                        <p className="text-xs text-slate-600 line-clamp-2">{vendor.flagNotes}</p>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {vendor.flagged ? (
                        <button 
                          onClick={() => handleUnflag(vendor.id)}
                          aria-label={`Unflag vendor ${vendor.name}`}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 active:scale-95 transition-[transform,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          Unflag
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowFlagModal(vendor.id)}
                          aria-label={`Flag vendor ${vendor.name}`}
                          className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-xs font-bold rounded-lg hover:bg-red-100 active:scale-95 transition-[transform,background-color] duration-150 flex items-center gap-1 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        >
                          <TbFlag size={14} aria-hidden="true" /> Flag
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default DaVendorWatchlist;
