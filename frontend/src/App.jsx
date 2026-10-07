import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import Auth from './components/Auth.jsx';
import Profile from './components/Profile';
import Teams from './components/Team';
import TeamDetails from './components/TeamDetails';
import AdminDashboard from './components/AdminDashboard';
import OrganisationDashboard from './components/OrganisationDashboard';
import { User, ShieldCheck, Users, Building2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const profile = localStorage.getItem('profile');
    if (profile) {
      setUser(JSON.parse(profile));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('profile');
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {user && (
        <nav className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-40 gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xl font-black text-white tracking-tight flex items-center">
              <span>Collab</span><span className="text-blue-500">AI</span>
            </Link>

            {/* Role Badge */}
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
              user.role === 'admin'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700/80'
                : user.role === 'organisation'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700/80'
                : 'bg-blue-950 text-blue-300 border-blue-700/80'
            }`}>
              {user.role || 'student'}
            </span>
          </div>
          
          <div className="flex items-center gap-5">
            {/* Navigation items based on role */}
            {user.role === 'admin' ? (
              <Link 
                to="/" 
                className="text-sm font-medium text-indigo-400 font-semibold flex items-center gap-1.5"
              >
                <ShieldCheck size={16} /> Admin Dashboard
              </Link>
            ) : user.role === 'organisation' ? (
              <Link 
                to="/" 
                className="text-sm font-medium text-emerald-400 font-semibold flex items-center gap-1.5"
              >
                <Building2 size={16} /> Events Portal
              </Link>
            ) : (
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname === '/' ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-blue-400'
                }`}
              >
                <Users size={16} /> Student Teams
              </Link>
            )}

            <Link 
              to="/profile" 
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                location.pathname === '/profile' ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-blue-400'
              }`}
            >
              <User size={18}/> {user.name}
            </Link>

            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 px-3.5 rounded-xl transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </nav>
      )}

      <main className="p-6 max-w-7xl mx-auto">
        <Routes>
          {!user ? (
            <Route path="*" element={<Auth setUser={setUser} />} />
          ) : user.role === 'admin' ? (
            /* ADMIN ROUTES */
            <>
              <Route path="/" element={<AdminDashboard currentUser={user} />} />
              <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : user.role === 'organisation' ? (
            /* ORGANISATION ROUTES */
            <>
              <Route path="/" element={<OrganisationDashboard currentUser={user} />} />
              <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            /* STUDENT ROUTES */
            <>
              <Route path="/" element={<Teams user={user} />} />
              <Route path="/teams/:id" element={<TeamDetails user={user} />} />
              <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}