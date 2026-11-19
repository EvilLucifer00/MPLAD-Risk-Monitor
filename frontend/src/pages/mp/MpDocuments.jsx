import PortalPageLoader from '../../components/shared/PortalPageLoader';
import React, { useState, useMemo } from 'react';
import { useMpDocuments, useMpProjects } from '../../api/queries';
import { TbSearch, TbFileDescription, TbDownload, TbEye, TbFilter } from 'react-icons/tb';
import usePageSeo from '../../hooks/usePageSeo';

const MpDocuments = () => {
  usePageSeo(
    'Document Center | MP Portal',
    'Access and manage all project-related documents, sanction records, and technical estimates.'
  );

  const { data: docsData, isLoading: docsLoading } = useMpDocuments();
  const { data: projectsData, isLoading: projectsLoading } = useMpProjects();

  const [searchTerm, setSearchTerm] = useState('');

  // Combine direct documents with synthesized project sanction records
  const documents = useMemo(() => {
    const directDocs = Array.isArray(docsData) ? docsData : [];
    if (directDocs.length > 0) return directDocs;

    const projects = Array.isArray(projectsData) ? projectsData : [];
    const aggregated = [];

    projects.forEach((p) => {
      if (Array.isArray(p.documents) && p.documents.length > 0) {
        p.documents.forEach((doc) => {
          aggregated.push({
            id: doc.id || `DOC-${p.id}-${Math.random().toString(36).substr(2, 5)}`,
            name: doc.name || doc.file_name || `${p.title} - Proposal Document.pdf`,
            size: doc.size || '1.8 MB',
            type: doc.type || (doc.name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'PDF Document'),
            uploader: doc.uploader || doc.uploaded_by || 'MP Office',
            uploadDate: doc.uploadDate || doc.upload_date || p.startDate || p.submitDate || new Date().toISOString().split('T')[0],
            projectId: p.id,
            projectTitle: p.title,
            fileUrl: doc.fileUrl || doc.file_url || '#',
          });
        });
      } else if (p.document_link) {
        aggregated.push({
          id: `DOC-DPR-${p.id}`,
          name: `${(p.title || 'Project').replace(/\s+/g, '_')}_Detailed_Project_Report.pdf`,
          size: '2.4 MB',
          type: 'PDF',
          uploader: 'MP Office',
          uploadDate: p.startDate || p.submitDate || new Date().toISOString().split('T')[0],
          projectId: p.id,
          projectTitle: p.title || 'Untitled Project',
          fileUrl: p.document_link,
        });
      }
    });

    aggregated.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    return aggregated;
  }, [docsData, projectsData]);

  const filteredDocs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return documents.filter((doc) =>
      (doc.name && doc.name.toLowerCase().includes(term)) ||
      (doc.projectTitle && doc.projectTitle.toLowerCase().includes(term)) ||
      (doc.projectId && String(doc.projectId).toLowerCase().includes(term))
    );
  }, [documents, searchTerm]);

  const isAnyLoading = docsLoading || projectsLoading;
  const isAllLoaded = docsData !== undefined && projectsData !== undefined;

  if (isAnyLoading || !isAllLoaded) {
    return <PortalPageLoader message="Loading Documents..." />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto min-h-full flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">Document Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Official repository of project estimates, sanction letters, and technical approvals.</p>
        </div>
      </header>

      {/* Filter Section */}
      <section aria-labelledby="documents-filter-heading">
        <h2 id="documents-filter-heading" className="sr-only">Filter Documents</h2>
        <form 
          role="search" 
          onSubmit={(e) => e.preventDefault()}
          className="bg-white p-3.5 rounded border border-slate-200 flex flex-col sm:flex-row gap-3 items-center"
        >
          <div className="flex-1 relative w-full">
            <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
            <input 
              id="doc-search-input"
              type="search" 
              placeholder="Search by document name or project title..."
              aria-label="Search by document name or project title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
            />
          </div>
          <button 
            type="button"
            aria-label="Open document filter options"
            className="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3.5 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
          >
            <TbFilter size={16} aria-hidden="true" />
            <span>Filter</span>
          </button>
        </form>
      </section>

      {/* Documents List Section */}
      <section 
        aria-labelledby="documents-list-heading"
        className="bg-white rounded border border-slate-200 overflow-hidden flex-1"
      >
        <h2 id="documents-list-heading" className="sr-only">Document Repository</h2>
        <div className="overflow-x-auto h-full">
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbFileDescription size={40} className="text-slate-300 mb-3" aria-hidden="true" />
              <p className="font-semibold text-sm">No documents found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or keyword filter.</p>
            </div>
          ) : (
            <table role="table" className="w-full text-left border-collapse text-xs sm:text-sm">
              <caption className="sr-only">Parliamentary Project Documents Center</caption>
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider font-semibold">
                  <th scope="col" className="px-4 sm:px-5 py-3">Document Name</th>
                  <th scope="col" className="px-4 sm:px-5 py-3 hidden md:table-cell">Associated Project</th>
                  <th scope="col" className="px-4 sm:px-5 py-3 hidden sm:table-cell">Uploaded By</th>
                  <th scope="col" className="px-4 sm:px-5 py-3">Date</th>
                  <th scope="col" className="px-4 sm:px-5 py-3 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-50 text-[#123b63] border border-blue-200 rounded">
                          <TbFileDescription size={16} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#123b63] text-xs sm:text-sm">{doc.name}</p>
                          <p className="text-[11px] text-slate-500">{doc.size} • {doc.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-5 py-3 hidden md:table-cell">
                      <p className="text-slate-700 line-clamp-1">{doc.projectTitle}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.projectId}</p>
                    </td>
                    <td className="px-4 sm:px-5 py-3 hidden sm:table-cell">
                      <p className="text-slate-700">{doc.uploader}</p>
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <time dateTime={doc.uploadDate} className="text-slate-600 tabular-nums">
                        {doc.uploadDate && !isNaN(new Date(doc.uploadDate).getTime())
                          ? new Date(doc.uploadDate).toLocaleDateString("en-GB")
                          : 'N/A'}
                      </time>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          type="button"
                          className="p-1.5 text-slate-500 hover:text-[#123b63] hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]" 
                          title="Preview"
                          aria-label={`Preview document ${doc.name}`}
                          onClick={() => {
                            if (doc.fileUrl && doc.fileUrl !== '#') {
                              window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          <TbEye size={16} aria-hidden="true" />
                        </button>
                        <button 
                          type="button"
                          className="p-1.5 text-slate-500 hover:text-[#123b63] hover:bg-slate-100 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]" 
                          title="Download"
                          aria-label={`Download document ${doc.name}`}
                          onClick={() => {
                            if (doc.fileUrl && doc.fileUrl !== '#') {
                              window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          <TbDownload size={16} aria-hidden="true" />
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

export default MpDocuments;
