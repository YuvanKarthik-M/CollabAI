import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Teams from './components/Team';
import TeamDetails from './components/TeamDetails';
import { User } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
        <nav className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-40">
          <h2 className="text-xl font-bold text-blue-500 tracking-tight">Team Collaboration Platform</h2>
          
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
            <Link to="/profile" className="flex gap-2 text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">
              <User width={24}/>{user.name}
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

      <main className="p-6">
        <Routes>
          {!user ? (
            <Route path="*" element={<Auth setUser={setUser} />} />
          ) : (
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