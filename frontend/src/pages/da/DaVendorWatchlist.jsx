import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState, useEffect } from 'react';
import { daApi } from '../../api/daApi';
import { useDaVendors, queryKeys } from '../../api/queries';
import { useQueryClient } from '@tanstack/react-query';
import { TbSearch, TbFlag, TbAlertTriangle, TbUserScan, TbX, TbCheck, TbLoader2 } from 'react-icons/tb';
import { usePageSeo } from '../../hooks/usePageSeo';

const DaVendorWatchlist = () => {
  usePageSeo(
    'Vendor Watchlist | DA Portal',
    'Monitor and flag contracted vendors across district MPLADS projects based on risk scores and audit findings.'
  );

  const queryClient = useQueryClient();
  const { data: vendorsData, isLoading } = useDaVendors();
  const [vendorsOverride, setVendorsOverride] = useState(null);
  const vendors = vendorsOverride || (Array.isArray(vendorsData) ? vendorsData : []);
  const loading = isLoading && !vendorsData;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFlagged, setFilterFlagged] = useState('All');
  
  // Flag modal
  const [showFlagModal, setShowFlagModal] = useState(null);
  const [flagNotes, setFlagNotes] = useState('');
  const [flagging, setFlagging] = useState(false);

  const handleFlag = async (vendorId) => {
    if (!flagNotes.trim()) return;
    setFlagging(true);
    try {
      await daApi.flagVendor(vendorId, { notes: flagNotes });
      setVendorsOverride(vendors.map(v => v.id === vendorId ? { ...v, flagged: true, flagNotes: flagNotes } : v));
      queryClient.invalidateQueries({ queryKey: queryKeys.da.all });
      setShowFlagModal(null);
    } catch {
      // Handled gracefully
    }
    setFlagging(false);
  };

  const handleUnflag = async (vendorId) => {
    try {
      await daApi.unflagVendor(vendorId);
      setVendorsOverride(vendors.map(v => v.id === vendorId ? { ...v, flagged: false, flagNotes: '' } : v));
      queryClient.invalidateQueries({ queryKey: queryKeys.da.all });
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

  if (isLoading || !vendorsData) {
    return <PortalPageLoader message="Loading Vendor Watchlist..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-full flex flex-col">
      {/* Flag Modal */}
      {showFlagModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
          onClick={() => setShowFlagModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="flag-vendor-title"
        >
          <div className="bg-white rounded border border-slate-300 shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-red-200 bg-red-50/50">
              <h3 id="flag-vendor-title" className="text-lg font-bold tracking-tight text-red-800 flex items-center gap-2">
                <TbFlag size={20} aria-hidden="true" /> Flag Vendor for Audit
              </h3>
              <p className="text-xs text-red-700 mt-1">
                Mark vendor "{vendors.find(v => v.id === showFlagModal)?.name}" as high-risk across district records.
              </p>
            </div>
            <div className="p-5">
              <label htmlFor="flag-notes-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Flag Notes *</label>
              <textarea 
                id="flag-notes-input"
                value={flagNotes} 
                onChange={e => setFlagNotes(e.target.value)} 
                rows={4}
                placeholder="Describe why this vendor is being flagged (e.g., cost overruns, quality issues, suspected fraud)..."
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 resize-none transition-colors"
              />
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button 
                onClick={() => { setShowFlagModal(null); setFlagNotes(''); }} 
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleFlag(showFlagModal)} 
                disabled={!flagNotes.trim() || flagging}
                className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded hover:bg-red-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-700"
              >
                {flagging ? <TbLoader2 size={15} className="animate-spin" aria-hidden="true" /> : <TbFlag size={15} aria-hidden="true" />} Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Vendor Watchlist</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Monitor and flag contracted vendors across all district MPLADS projects based on risk scores.</p>
        </div>
        <div className="flex items-center gap-2" role="status" aria-label={`${flaggedCount} vendors flagged for risk`}>
          <span className="text-xs font-bold text-red-800 bg-red-50 px-3 py-1.5 rounded border border-red-200 flex items-center gap-1.5">
            <TbFlag size={15} aria-hidden="true" /> {flaggedCount} Flagged
          </span>
        </div>
      </header>

      {/* Filters */}
      <section aria-labelledby="vendor-filter-heading" className="bg-white p-4 rounded border border-slate-300">
        <h2 id="vendor-filter-heading" className="sr-only">Filter Vendors</h2>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input 
              type="text" 
              id="vendor-search-input"
              placeholder="Search by vendor name or registration ID..."
              aria-label="Search vendors by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#123b63] focus:border-[#123b63] transition-colors"
            />
          </div>
          <div className="flex gap-1.5" role="toolbar" aria-label="Filter vendors by status">
            {['All', 'Flagged', 'Clean'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilterFlagged(f)}
                aria-pressed={filterFlagged === f}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] ${
                  filterFlagged === f 
                    ? 'bg-[#123b63] text-white border border-[#123b63]' 
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* Vendors Table */}
      <section aria-labelledby="vendor-table-heading" className="bg-white rounded border border-slate-300 overflow-hidden flex-1">
        <h2 id="vendor-table-heading" className="sr-only">Vendors Risk Status Table</h2>
        <div className="overflow-x-auto h-full">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500" role="status">
              <TbUserScan size={48} className="text-slate-300 mb-4" aria-hidden="true" />
              <p className="font-semibold text-slate-700">No vendors found</p>
              <p className="text-xs text-slate-500 mt-1">Try refining your search terms or filter selection.</p>
            </div>
          ) : (
            <table role="table" className="w-full text-left border-collapse">
              <caption className="sr-only">District Vendor Watchlist and Risk Status</caption>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 text-xs uppercase tracking-wider">
                  <th scope="col" className="px-5 py-3 font-semibold">Vendor</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-center">Projects</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-center">Avg Risk</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold hidden md:table-cell">Flag Notes</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map(vendor => (
                  <tr key={vendor.id} className={`hover:bg-slate-50 transition-colors ${vendor.flagged ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {vendor.flagged && <TbFlag size={16} className="text-red-600 shrink-0" aria-hidden="true" />}
                        <div>
                          <p className="font-bold text-[#123b63] text-sm">{vendor.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{vendor.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-sm font-bold text-[#123b63] tabular-nums">{vendor.projectsCount}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold tabular-nums border ${
                        vendor.avgRiskScore >= 60 ? 'bg-red-50 text-red-800 border-red-200' :
                        vendor.avgRiskScore >= 40 ? 'bg-amber-50 text-amber-900 border-amber-200' :
                        'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {vendor.avgRiskScore}/100
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {vendor.flagged ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                          <TbAlertTriangle size={13} aria-hidden="true" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <TbCheck size={13} aria-hidden="true" /> Clear
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell max-w-[250px]">
                      {vendor.flagNotes ? (
                        <p className="text-xs text-slate-700 line-clamp-2">{vendor.flagNotes}</p>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {vendor.flagged ? (
                        <button 
                          onClick={() => handleUnflag(vendor.id)}
                          aria-label={`Unflag vendor ${vendor.name}`}
                          className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        >
                          Unflag
                        </button>
                      ) : (
                        <button 
                          onClick={() => setShowFlagModal(vendor.id)}
                          aria-label={`Flag vendor ${vendor.name}`}
                          className="px-3 py-1 bg-red-50 text-red-800 border border-red-200 text-xs font-bold rounded hover:bg-red-100 transition-colors flex items-center gap-1 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                        >
                          <TbFlag size={13} aria-hidden="true" /> Flag
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
