import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/mockMpApi';
import { 
  TbUpload, 
  TbFile, 
  TbTrash, 
  TbCheck, 
  TbBuilding, 
  TbMapPin, 
  TbCurrencyRupee, 
  TbAlignLeft,
  TbArrowRight
} from 'react-icons/tb';

const MpSubmitProject = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    estimatedCost: '',
    district: '',
    implementingAgency: ''
  });

  const [files, setFiles] = useState([]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type.includes('pdf') ? 'PDF' : 'Image',
        uploader: 'MP Office',
        uploadDate: new Date().toISOString().split('T')[0]
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.submitProject({
        ...formData,
        estimatedCost: Number(formData.estimatedCost),
        sanctionedAmount: 0,
        documents: files
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/mp/projects');
      }, 2000);
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  };

  const isFormValid = Object.values(formData).every(val => val.trim() !== '') && formData.estimatedCost > 0;

  if (success) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full max-w-lg mx-auto text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex justify-center items-center mb-4">
          <TbCheck size={40} />
        </div>
        <h1 className="text-2xl font-bold text-[#123b63]">Project Submitted Successfully!</h1>
        <p className="text-slate-500">Your proposal has been forwarded for sanctioning. Redirecting to your projects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#123b63]">Submit New Proposal</h1>
        <p className="text-sm text-slate-500 mt-1">Recommend a new MPLADS work for your constituency.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Project Details' },
          { num: 2, label: 'Documents' },
          { num: 3, label: 'Review & Submit' }
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step >= s.num ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s.num ? <TbCheck size={16} strokeWidth={3} /> : s.num}
              </div>
              <span className={`text-xs font-semibold ${step >= s.num ? 'text-[#123b63]' : 'text-slate-400'}`}>{s.label}</span>
            </div>
            {i < 2 && (
              <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                step > s.num ? 'bg-cyan-500' : 'bg-slate-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        
        {/* STEP 1: Details */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[#123b63] border-b border-slate-100 pb-3">1. Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Title</label>
                <div className="relative">
                  <TbAlignLeft className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" name="title" value={formData.title} onChange={handleInputChange}
                    placeholder="e.g. Construction of Community Hall"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select 
                  name="category" value={formData.category} onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Cost (₹)</label>
                <div className="relative">
                  <TbCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" name="estimatedCost" value={formData.estimatedCost} onChange={handleInputChange}
                    placeholder="e.g. 1500000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">District / Constituency</label>
                <div className="relative">
                  <TbMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" name="district" value={formData.district} onChange={handleInputChange}
                    placeholder="e.g. North Delhi"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Implementing Agency</label>
                <div className="relative">
                  <TbBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" name="implementingAgency" value={formData.implementingAgency} onChange={handleInputChange}
                    placeholder="e.g. PWD, Zila Parishad"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Description</label>
                <textarea 
                  name="description" value={formData.description} onChange={handleInputChange}
                  rows={3}
                  placeholder="Provide a brief description of the proposed work..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)}
                disabled={!isFormValid}
                className="bg-[#123b63] hover:bg-[#0c2a47] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Next Step <TbArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Documents */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[#123b63] border-b border-slate-100 pb-3">2. Supporting Documents</h2>
            <p className="text-sm text-slate-500">Upload letters, initial estimates, or site photographs.</p>
            
            {/* Upload Zone */}
            <div className="border-2 border-dashed border-cyan-200 bg-cyan-50/30 rounded-xl p-8 text-center relative hover:bg-cyan-50/60 transition-colors">
              <input 
                type="file" multiple 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-full flex justify-center items-center mx-auto mb-3">
                <TbUpload size={24} />
              </div>
              <p className="font-semibold text-[#123b63]">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOCX, JPG or PNG (MAX. 10MB)</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-bold text-slate-700">Attached Files ({files.length})</h3>
                {files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <TbFile size={20} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{f.name}</p>
                        <p className="text-[10px] text-slate-500">{f.size}</p>
                      </div>
                    </div>
                    <button onClick={() => removeFile(f.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                      <TbTrash size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="bg-[#123b63] hover:bg-[#0c2a47] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                Review Proposal <TbArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-bold text-[#123b63] border-b border-slate-100 pb-3">3. Review and Confirm</h2>
            
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project Title</p>
                  <p className="text-sm font-semibold text-slate-800">{formData.title}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Cost</p>
                  <p className="text-sm font-semibold text-[#123b63]">₹{Number(formData.estimatedCost).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Category</p>
                  <p className="text-sm font-semibold text-slate-800">{formData.category}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Implementing Agency</p>
                  <p className="text-sm font-semibold text-slate-800">{formData.implementingAgency}</p>
                </div>
                <div className="col-span-2 border-t border-slate-200/60 pt-4 mt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{formData.description}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-4">
              <TbFile size={24} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{files.length} Document(s) Attached</p>
                <p className="text-xs text-slate-500 mt-0.5">These will be forwarded to the District Authority for review.</p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button 
                onClick={() => setStep(2)}
                disabled={submitting}
                className="text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit for Sanction'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MpSubmitProject;
