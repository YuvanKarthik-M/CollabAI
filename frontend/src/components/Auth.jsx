import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';
import { 
  Mail, Lock, User, LogIn, UserPlus, 
  Sparkles, MessageSquare, Eye, EyeOff, ShieldCheck,
  GraduationCap, Building2
} from 'lucide-react';

export default function Auth({ setUser }) {
  const [isSignup, setIsSignup] = useState(false);
  const [signupRole, setSignupRole] = useState('student'); // 'student' | 'organisation'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isSignup) {
        res = await registerUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: signupRole
        });
      } else {
        res = await loginUser({
          email: formData.email,
          password: formData.password
        });
      }

      localStorage.setItem('profile', JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col md:flex-row items-center justify-center px-6 max-w-6xl mx-auto gap-12 lg:gap-24">
      
      {/* Left Column: Branding */}
      <div className="w-full md:w-1/2 flex flex-col justify-center text-left space-y-8">
        <div>
          <h1 className="text-6xl lg:text-7xl font-black tracking-tight select-none flex items-center drop-shadow-[0_0_35px_rgba(59,130,246,0.75)] filter">
            <span className="text-white">Collab</span>
            <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-xl font-medium text-slate-400 mt-1">
            Student Teams & Event Collaboration Platform
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-200">
                Student Team Formation
              </h4>
              <p className="text-xs text-slate-400">Match based on skills and interests, invite members & chat.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Building2 size={22} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-200">
                Organization Events & Hackathons
              </h4>
              <p className="text-xs text-slate-400">Organizations host events for student teams to join.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-200">
                Centralized Admin Oversight
              </h4>
              <p className="text-xs text-slate-400">Moderation of teams, organizations, and active events.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Auth Card */}
      <div className="w-full md:w-1/2 max-w-md">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/50 relative overflow-hidden">
          
          {/* Card Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              {isSignup ? 'Create an Account' : 'Account Login'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isSignup 
                ? 'Select account type below to get started.' 
                : 'Enter your credentials to access your dashboard.'}
            </p>
          </div>

          {/* Sign Up Mode Switcher (Student vs Organization) */}
          {isSignup && (
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => setSignupRole('student')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  signupRole === 'student'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap size={16} /> Student
              </button>

              <button
                type="button"
                onClick={() => setSignupRole('organisation')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  signupRole === 'organisation'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 size={16} /> Organization
              </button>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="mb-5 p-3 bg-red-950/40 border border-red-800/60 text-red-400 text-xs rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  {signupRole === 'organisation' ? 'Organization Name' : 'Full Name'}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder={signupRole === 'organisation' ? 'TechCorp Foundation' : 'John Doe'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isSignup ? (
                <>
                  <UserPlus size={15} /> Sign Up as {signupRole === 'organisation' ? 'Organization' : 'Student'}
                </>
              ) : (
                <>
                  <LogIn size={15} /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Switch Mode Toggle */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {isSignup ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
                setShowPassword(false);
              }}
              className="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors ml-1 cursor-pointer"
            >
              {isSignup ? 'Log In' : 'Sign Up'}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}