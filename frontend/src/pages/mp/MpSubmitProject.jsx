import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalPageLoader from '../../components/shared/PortalPageLoader';
import { projectsApi, userManagementApi } from '../../api/mpladsApi';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, useMpSubmitProjectMutation } from '../../api/queries';
import { useAuthStore } from '../../store/useAuthStore';
import { usePageSeo } from '../../hooks/usePageSeo';
import { compressFiles } from '../../utils/imageCompressor';
import { 
  TbUpload, 
  TbFile, 
  TbTrash, 
  TbCheck, 
  TbBuilding, 
  TbMapPin, 
  TbCurrencyRupee, 
  TbAlignLeft,
  TbArrowRight,
  TbAlertCircle
} from 'react-icons/tb';

const MpSubmitProject = () => {
  const submitMutation = useMpSubmitProjectMutation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  usePageSeo(
    'Submit New Project Proposal | MP Portal',
    'Recommend and submit a new MPLADS development project to the District Authority with project details and supporting estimates.'
  );
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [assignedDm, setAssignedDm] = useState(null);
  const [loadingDm, setLoadingDm] = useState(Boolean(user?.dist));

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    estimatedCost: '',
    district: user?.dist || '',
    implementingAgency: ''
  });

  const [files, setFiles] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDm = async () => {
      if (user?.dist) {
        try {
          const data = await userManagementApi.getDmByDistrict(user.dist);
          if (!isMounted) return;
          if (Array.isArray(data) && data.length > 0) setAssignedDm(data[0]);
          else if (data && data.dm_name) setAssignedDm(data);
        } catch {
          // Handled gracefully
        } finally {
          if (isMounted) setLoadingDm(false);
        }
      } else {
        setLoadingDm(false);
      }
    };
    fetchDm();
    return () => {
      isMounted = false;
    };
  }, [user?.dist]);

  useEffect(() => {
    if (user?.dist && !formData.district) {
      setFormData(prev => ({ ...prev, district: user.dist }));
    }
  }, [user?.dist, formData.district]);

  if (loadingDm || !user) {
    return <PortalPageLoader message="Loading Proposal Workspace..." />;
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type.includes('pdf') ? 'PDF' : 'Image',
        uploader: 'MP Office',
        uploadDate: new Date().toISOString().split('T')[0],
        rawFile: file
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const rawFileObjects = files.map(f => f.rawFile).filter(Boolean);
      const optimizedFiles = await compressFiles(rawFileObjects);
      await submitMutation.mutateAsync({
        title: formData.title,
        category: formData.category,
        estimatedCost: Number(formData.estimatedCost),
        implementingAgency: formData.implementingAgency,
        description: formData.description,
        files: optimizedFiles
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/mp/projects');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit proposal. Please verify all fields.');
      setSubmitting(false);
    }
  };

  const isFormValid = Object.values(formData).every(val => String(val).trim() !== '') && Number(formData.estimatedCost) > 0;

  if (success) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full max-w-lg mx-auto text-center space-y-4 p-8 bg-white border border-slate-200 rounded">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full flex justify-center items-center mb-2">
          <TbCheck size={28} />
        </div>
        <h1 className="text-xl font-bold text-[#123b63]">Project Proposal Submitted</h1>
        <p className="text-xs sm:text-sm text-slate-600">Your proposal has been logged and transmitted to the District Authority for technical scrutiny and sanction. Redirecting...</p>
      </div>
    );
  }

  return (
    <article aria-labelledby="submit-proposal-heading" className="max-w-4xl mx-auto space-y-6">
      <header className="border-b border-slate-200 pb-3">
        <h1 id="submit-proposal-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-[#123b63]">Submit New Proposal</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Recommend a new MPLADS development work to the District Authority.</p>
      </header>

      {/* Progress Steps */}
      <nav aria-label="Proposal Submission Progress">
        <ol className="flex items-center justify-between mb-6 list-none p-0 m-0">
          {[
            { num: 1, label: 'Project Details' },
            { num: 2, label: 'Documents' },
            { num: 3, label: 'Review & Submit' }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <li className="flex flex-col items-center gap-1.5" aria-current={step === s.num ? 'step' : undefined}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step >= s.num ? 'bg-[#123b63] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {step > s.num ? <TbCheck size={14} strokeWidth={3} aria-hidden="true" /> : s.num}
                </div>
                <span className={`text-xs font-semibold ${step >= s.num ? 'text-[#123b63]' : 'text-slate-500'}`}>{s.label}</span>
              </li>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                  step > s.num ? 'bg-[#123b63]' : 'bg-slate-200'
                }`} aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 3) handleSubmit();
        }}
        className="bg-white rounded border border-slate-200 p-5 sm:p-7"
      >
        
        {/* STEP 1: Details */}
        {step === 1 && (
          <fieldset className="space-y-5 border-none p-0 m-0">
            <legend className="text-base font-bold tracking-tight text-[#123b63] border-b border-slate-200 pb-2 w-full">1. Basic Project Information</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label htmlFor="project-title-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Project Title</label>
                <div className="relative">
                  <TbAlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input 
                    id="project-title-input"
                    type="text" name="title" value={formData.title} onChange={handleInputChange}
                    placeholder="e.g. Construction of Community Hall"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="project-category-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Development Sector</label>
                <select 
                  id="project-category-select"
                  name="category" value={formData.category} onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
                >
                  <option value="" disabled>Select Category</option>
                  <option value="Community Infrastructure">Community Infrastructure</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Public Transport">Public Transport</option>
                </select>
              </div>

              <div>
                <label htmlFor="project-cost-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Estimated Cost (₹)</label>
                <div className="relative">
                  <TbCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input 
                    id="project-cost-input"
                    type="number" name="estimatedCost" value={formData.estimatedCost} onChange={handleInputChange}
                    placeholder="e.g. 1500000"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="project-district-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Constituency / District</label>
                <div className="relative">
                  <TbMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input 
                    id="project-district-input"
                    type="text" name="district" value={formData.district} onChange={handleInputChange}
                    placeholder={user?.constituency ? `e.g. ${user.constituency}` : "e.g. Constituency Name"}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="project-agency-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Implementing Agency</label>
                <div className="relative">
                  <TbBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input 
                    id="project-agency-input"
                    type="text" name="implementingAgency" value={formData.implementingAgency} onChange={handleInputChange}
                    placeholder="e.g. PWD, Zila Parishad"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63]"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="project-desc-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Detailed Scope of Work</label>
                <textarea 
                  id="project-desc-input"
                  name="description" value={formData.description} onChange={handleInputChange}
                  rows={3}
                  placeholder="Provide an objective description of the proposed developmental asset..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm focus:outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] resize-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button 
                type="button"
                onClick={() => setStep(2)}
                disabled={!isFormValid}
                className="bg-[#123b63] hover:bg-[#0c2a47] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                Proceed to Documents <TbArrowRight aria-hidden="true" />
              </button>
            </div>
          </fieldset>
        )}

        {/* STEP 2: Documents */}
        {step === 2 && (
          <fieldset className="space-y-5 border-none p-0 m-0">
            <legend className="text-base font-bold tracking-tight text-[#123b63] border-b border-slate-200 pb-2 w-full">2. Supporting Estimates & Approvals</legend>
            <p className="text-xs sm:text-sm text-slate-500">Upload preliminary estimates, administrative requisition letters, or site photographs.</p>
            
            {/* Upload Zone */}
            <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded p-6 text-center relative hover:bg-slate-100 transition-colors">
              <input 
                type="file" multiple 
                onChange={handleFileChange}
                aria-label="Upload supporting documents (PDF, DOCX, JPG or PNG up to 10MB)"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <div className="w-10 h-10 bg-blue-50 text-[#123b63] border border-blue-200 rounded flex justify-center items-center mx-auto mb-2">
                <TbUpload size={20} aria-hidden="true" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#123b63]">Click to upload or drag files here</p>
              <p className="text-[11px] text-slate-500 mt-1">PDF, DOCX, JPG or PNG (Max 10 MB per file)</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Attached Documents ({files.length})</h3>
                <ul role="list" className="space-y-2">
                  {files.map(f => (
                    <li key={f.id} className="flex items-center justify-between p-2.5 rounded border border-slate-200 bg-white">
                      <div className="flex items-center gap-2.5">
                        <TbFile size={18} className="text-slate-500" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-medium text-slate-800">{f.name}</p>
                          <p className="text-[10px] text-slate-500">{f.size}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(f.id)} 
                        aria-label={`Remove file ${f.name}`}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                      >
                        <TbTrash size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-200">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-600 hover:text-slate-900 border border-slate-300 px-4 py-2 rounded text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={() => setStep(3)}
                className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-5 py-2 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                Review Proposal <TbArrowRight aria-hidden="true" />
              </button>
            </div>
          </fieldset>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <fieldset className="space-y-5 border-none p-0 m-0">
            <legend className="text-base font-bold tracking-tight text-[#123b63] border-b border-slate-200 pb-2 w-full">3. Review and Confirm Proposal</legend>
            
            <div className="bg-slate-50 rounded p-4 border border-slate-200 space-y-3">
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Project Title</dt>
                  <dd className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">{formData.title}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Outlay</dt>
                  <dd className="text-xs sm:text-sm font-bold text-[#123b63] mt-0.5 tabular-nums">₹{Number(formData.estimatedCost).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category</dt>
                  <dd className="text-xs sm:text-sm font-medium text-slate-800 mt-0.5">{formData.category}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Implementing Agency</dt>
                  <dd className="text-xs sm:text-sm font-medium text-slate-800 mt-0.5">{formData.implementingAgency}</dd>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-3 mt-1">
                  <dt className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Description</dt>
                  <dd className="text-xs text-slate-700 leading-relaxed">{formData.description}</dd>
                </div>
              </dl>
            </div>
            
            <div className="bg-blue-50/50 rounded p-3 border border-blue-200 flex items-start gap-3">
              <TbFile size={20} className="text-[#123b63] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-slate-900">{files.length} Document(s) Attached</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  These records will be submitted to the District Authority {assignedDm?.dm_name ? `(${assignedDm.dm_name})` : ''} for administrative review.
                </p>
              </div>
            </div>

            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs flex items-center gap-2">
                <TbAlertCircle size={18} className="shrink-0 text-red-600" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-200">
              <button 
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="text-slate-600 hover:text-slate-900 border border-slate-300 px-4 py-2 rounded text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-5 py-2 rounded text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63]"
              >
                {submitting ? 'Transmitting Proposal...' : 'Confirm & Forward for Sanction'}
              </button>
            </div>
          </fieldset>
        )}

      </form>
    </article>
  );
};

export default MpSubmitProject;
