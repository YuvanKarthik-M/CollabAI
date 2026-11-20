import React, { useState } from 'react';
import { updateProfile } from '../services/api';
import { 
  User, Mail, Code, Sparkles, Save, CheckCircle2, 
  Lock, Shield, Zap, AlertCircle, ArrowRight
} from 'lucide-react';
import SkillSelect from './SkillSelect';

export default function Profile({ user, setUser }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    skills: Array.isArray(user?.skills) 
      ? user.skills 
      : (user?.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean) : []),
    interests: user?.interests ? (Array.isArray(user.interests) ? user.interests.join(', ') : user.interests) : ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Parse live preview of comma-separated interests
  const parsedInterests = typeof formData.interests === 'string'
    ? formData.interests.split(',').map(i => i.trim()).filter(Boolean)
    : (Array.isArray(formData.interests) ? formData.interests : []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        name: formData.name.trim(),
        skills: Array.isArray(formData.skills) 
          ? formData.skills 
          : formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: parsedInterests
      };

      const res = await updateProfile(payload);
      
      // Update local storage and app state seamlessly
      const updatedProfileData = { ...res.data, token: user.token };
      localStorage.setItem('profile', JSON.stringify(updatedProfileData));
      setUser(updatedProfileData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const role = user?.role || 'student';
  const roleBadgeStyle = role === 'admin'
    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/80'
    : role === 'organisation'
    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
    : 'bg-blue-950/80 text-blue-300 border-blue-700/80';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* HEADER OVERVIEW HERO CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* User Avatar Initial */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{formData.name || 'User Profile'}</h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${roleBadgeStyle}`}>
                  {role}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Mail size={13} className="text-slate-500" />
                <span>{formData.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl text-center min-w-[90px]">
              <div className="text-lg font-black text-blue-400">{formData.skills.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Skills</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl text-center min-w-[90px]">
              <div className="text-lg font-black text-amber-400">{parsedInterests.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interests</div>
            </div>
          </div>
        </div>
      </div>

      {/* ALERT BANNERS */}
      {success && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs sm:text-sm rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>Profile and matching preferences updated successfully!</span>
          </div>
          <button onClick={() => setSuccess(false)} className="text-emerald-400 hover:text-white font-bold px-2 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 text-red-300 text-xs sm:text-sm rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(false)} className="text-red-400 hover:text-white font-bold px-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* MAIN FORM CONTENT */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: ACCOUNT CREDENTIALS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-blue-500" /> Account Information
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Your personal identity and login details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-slate-500" /> Full Name *
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                required 
                placeholder="Your Name"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* Email Address (Locked) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-500" /> Email Address
                </label>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                  <Lock size={10} /> Locked
                </span>
              </div>
              <input 
                type="email" 
                value={formData.email} 
                disabled 
                className="w-full px-3.5 py-2.5 bg-slate-800/50 border border-slate-800 rounded-xl text-slate-400 cursor-not-allowed text-xs sm:text-sm select-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: SKILLS & MATCHING PREFERENCES */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Zap size={16} className="text-blue-500" /> Skill Matching & Interests
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              These skills directly calculate your match score with student teams across all events and hackathons.
            </p>
          </div>

          {/* Skills Multi-Select Dropdown */}
          <div className="space-y-1.5">
            <SkillSelect
              selectedSkills={formData.skills}
              onChange={(newSkills) => setFormData({ ...formData, skills: newSkills })}
              theme="dark"
              label="Technical Skills"
              placeholder="Search or select skills (e.g. React, Python, Machine Learning)..."
            />
            <p className="text-[11px] text-slate-500">
              Sorted alphabetically. Type in the box to filter or add custom technologies.
            </p>
          </div>

          {/* Interests Field */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" /> Project Interests (Comma Separated)
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={formData.interests} 
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })} 
                placeholder="e.g. Artificial Intelligence, Web3, FinTech, Robotics, HealthTech"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* Live Visual Preview of Interests */}
            {parsedInterests.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500">Preview as seen by teams:</span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedInterests.map((interest, idx) => (
                    <span 
                      key={idx} 
                      className="bg-amber-950/50 text-amber-300 border border-amber-900/60 text-xs px-2.5 py-0.5 rounded-lg font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={16} /> Save Profile Changes
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
