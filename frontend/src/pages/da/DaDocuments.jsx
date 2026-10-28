import React, { useState, useEffect } from 'react';
import { documentsApi } from '../../api/mpladsApi';
import { daApi } from '../../api/mockDaApi';
import { mockDaProjects } from '../../data/mockDaData';
import { TbSearch, TbFileDescription, TbDownload, TbEye, TbFilter } from 'react-icons/tb';
import { usePageSeo } from '../../hooks/usePageSeo';

const getInitialDaDocs = () => {
  try {
    const cached = sessionStorage.getItem('mplads_da_documents_cache');
    if (cached) return JSON.parse(cached);
  } catch {}
  return mockDaProjects.flatMap(p => 
    (p.documents || []).map(doc => ({
      ...doc,
      projectId: p.id,
      projectTitle: p.title,
      mpName: p.mpName,
      constituency: p.constituency,
    }))
  ).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
};

const DaDocuments = () => {
  usePageSeo(
    'Document Center | DA Portal',
    'Access, search, preview, and download project documents, sanction orders, and utilization certificates across district MPLADS works.'
  );

  const [documents, setDocuments] = useState(getInitialDaDocs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const realDocs = await documentsApi.getDmDocuments();
        if (realDocs && realDocs.length > 0) {
          setDocuments(realDocs);
          try { sessionStorage.setItem('mplads_da_documents_cache', JSON.stringify(realDocs)); } catch {}
          setLoading(false);
          return;
        }
      } catch {
        // Fallback gracefully
      }

      // Fallback: Fetch all projects and flatten their documents
      try {
        const projects = await daApi.getProjects();
        const allDocs = projects.flatMap(p => 
          (p.documents || []).map(doc => ({
            ...doc,
            projectId: p.id,
            projectTitle: p.title,
            mpName: p.mpName,
            constituency: p.constituency,
          }))
        );
        allDocs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        setDocuments(allDocs);
      } catch {
        // Handled gracefully
      }
      setLoading(false);
    };

    // Defer background data loading past initial paint and LCP measurement
    let timerId = null;
    let idleId = null;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => { loadDocs(); }, { timeout: 1500 });
    } else {
      timerId = setTimeout(loadDocs, 100);
    }

    return () => {
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.mpName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-full flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123b63]">Document Center</h1>
          <p className="text-sm text-slate-500 mt-1">Access all project documents across the district.</p>
        </div>
      </header>

      <section aria-labelledby="documents-filter-heading" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 id="documents-filter-heading" className="sr-only">Filter Documents</h2>
        <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input 
              type="text" 
              id="doc-search-input"
              placeholder="Search by document name, project, or MP..."
              aria-label="Search by document name, project, or MP"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-[border-color,box-shadow] duration-150"
            />
          </div>
        </form>
      </section>

      <section aria-labelledby="documents-list-heading" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <h2 id="documents-list-heading" className="sr-only">District Documents Directory</h2>
        <div className="overflow-x-auto h-full">
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500" role="status">
              <TbFileDescription size={48} className="text-slate-300 mb-4" aria-hidden="true" />
              <p className="font-semibold">No documents found</p>
              <p className="text-sm mt-1">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <table role="table" className="w-full text-left border-collapse">
              <caption className="sr-only">District Authority Project Documents Center</caption>
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <th scope="col" className="px-5 py-3.5 font-semibold">Document Name</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold hidden lg:table-cell">Associated Project</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold hidden md:table-cell">MP</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold hidden sm:table-cell">Uploaded By</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Date</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                          <TbFileDescription size={20} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-bold text-[#123b63] text-sm">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.size} • {doc.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-sm text-slate-700 line-clamp-1">{doc.projectTitle}</p>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">{doc.projectId}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-700">{doc.mpName}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-700">{doc.uploader}</p>
                    </td>
                    <td className="px-5 py-4">
                      <time dateTime={doc.uploadDate} className="text-sm text-slate-700">{new Date(doc.uploadDate).toLocaleDateString()}</time>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-1.5 text-slate-500 hover:text-[#123b63] hover:bg-slate-100 rounded-lg active:scale-90 transition-[transform,color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]" 
                          title="Preview"
                          aria-label={`Preview document ${doc.name}`}
                        >
                          <TbEye size={18} aria-hidden="true" />
                        </button>
                        <button 
                          className="p-1.5 text-slate-500 hover:text-cyan-800 hover:bg-slate-100 rounded-lg active:scale-90 transition-[transform,color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-800" 
                          title="Download"
                          aria-label={`Download document ${doc.name}`}
                        >
                          <TbDownload size={18} aria-hidden="true" />
                        </button>
                      </div>
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

export default DaDocuments;
