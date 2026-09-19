import React, { useState, useEffect } from 'react';
import { api } from '../../api/mockMpApi';
import { TbSearch, TbFileDescription, TbDownload, TbEye, TbFilter } from 'react-icons/tb';

const MpDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch all projects and flatten their documents
    api.getProjects().then(projects => {
      const allDocs = projects.flatMap(p => 
        p.documents.map(doc => ({
          ...doc,
          projectId: p.id,
          projectTitle: p.title
        }))
      );
      // Sort by upload date descending
      allDocs.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      setDocuments(allDocs);
      setLoading(false);
    });
  }, []);

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.projectTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#123b63]">Document Center</h1>
          <p className="text-sm text-slate-500 mt-1">Access and manage all project-related documents.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by document name or project title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
        <button className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          <TbFilter size={18} />
          <span>Filter</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="overflow-x-auto h-full">
          {filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 h-64 text-slate-500">
              <TbFileDescription size={48} className="text-slate-300 mb-4" />
              <p className="font-semibold">No documents found</p>
              <p className="text-sm mt-1">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Document Name</th>
                  <th className="p-4 font-semibold hidden md:table-cell">Associated Project</th>
                  <th className="p-4 font-semibold hidden sm:table-cell">Uploaded By</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                          <TbFileDescription size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#123b63] text-sm">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.size} • {doc.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm text-slate-700 line-clamp-1">{doc.projectTitle}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{doc.projectId}</p>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-700">{doc.uploader}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-[#123b63] hover:bg-slate-100 rounded transition-colors" title="Preview">
                          <TbEye size={18} />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded transition-colors" title="Download">
                          <TbDownload size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MpDocuments;
