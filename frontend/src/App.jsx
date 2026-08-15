import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Teams from './components/Team';

export default function App() {
  const [user, setUser] = useState(null);

  // Check for saved user session on app load
  useEffect(() => {
    const profile = localStorage.getItem('profile');
    if (profile) {
      setUser(JSON.parse(profile));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('profile');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {user && (
        <nav className="flex justify-between items-center bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <h2 className="text-xl font-bold text-blue-600">Team Collaboration Platform</h2>
          
          {/* Navigation Links & User Bar */}
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/profile" 
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Edit Profile
            </Link>
            <span className="text-sm font-medium text-slate-600 border-l pl-4 border-slate-200">
              Welcome, {user.name}
            </span>
            <button 
              onClick={handleLogout} 
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </nav>
      )}

      <main className="p-6">
        <Routes>
          {/* If user is not logged in, force them to the Auth page */}
          {!user ? (
            <Route path="*" element={<Auth setUser={setUser} />} />
          ) : (
            <>
              {/* Main Dashboard Route with Active Teams and Team Creation */}
              <Route path="/" element={
                <div className="max-w-4xl mx-auto space-y-8 py-6">
                  {/* Welcome Banner */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Hub</h3>
                    <p className="text-slate-600 text-sm">
                      Welcome back, <span className="font-semibold text-slate-800">{user.name}</span>! Explore active teams below or create your own project team to start collaborating.
                    </p>
                  </div>

                  {/* Teams Component (Create Team + Active Teams List) */}
                  <Teams user={user} />
                </div>
              } />

              {/* Profile Route */}
              <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />

              {/* Catch-all redirect back to dashboard */}
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}