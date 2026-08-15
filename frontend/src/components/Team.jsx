import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, PlusCircle, CheckCircle, Send } from 'lucide-react';

export default function Teams({ user }) {
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', requiredSkills: '', requiredInterests: '' });
  const [loading, setLoading] = useState(false);

  const fetchTeams = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/teams', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTeams(res.data);
    } catch (err) {
      console.error('Failed to fetch teams', err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/teams', form, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setForm({ name: '', description: '', requiredSkills: '', requiredInterests: '' });
      fetchTeams();
    } catch (err) {
      alert('Error creating team');
    }
  };

  const handleJoin = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/teams/${id}/join`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Request sent!');
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Create Team Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <PlusCircle className="text-blue-600" /> Create a New Team
        </h3>
        <form onSubmit={handleCreateTeam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" placeholder="Team Name" value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} required 
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
          <input 
            type="text" placeholder="Required Skills (comma separated)" value={form.requiredSkills} 
            onChange={e => setForm({...form, name: e.target.value})} 
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
          <textarea 
            placeholder="Project Description" value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})} required 
            className="md:col-span-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
          />
          <button type="submit" className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-colors">
            Publish Team
          </button>
        </form>
      </div>

      {/* Teams Feed */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="text-blue-600" /> Discover Teams
        </h3>
        <div className="grid gap-4">
          {teams.map(team => (
            <div key={team._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-slate-800">{team.name}</h4>
                <p className="text-sm text-slate-600 mt-1">{team.description}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {team.requiredSkills?.map((s, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-lg font-medium">{s}</span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => handleJoin(team._id)}
                className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-sm font-medium py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={16} /> Request to Join
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}