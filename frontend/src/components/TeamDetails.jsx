import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Calendar, Shield, Users, Code, 
  Sparkles, ToggleLeft, ToggleRight, Mail, Crown 
} from 'lucide-react';

export default function TeamDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/teams', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Find team in either myTeams or discoverTeams
      const foundTeam = [...(res.data.myTeams || []), ...(res.data.discoverTeams || [])].find(t => t._id === id);
      setTeam(foundTeam);
    } catch (err) {
      console.error('Error fetching team details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const handleToggleRecruitment = async () => {
    try {
      await axios.put(`http://localhost:5000/api/teams/${team._id}`, { isOpen: !team.isOpen }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTeam(prev => ({ ...prev, isOpen: !prev.isOpen }));
    } catch (err) {
      alert('Error updating recruitment status');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400 text-sm">Loading team information...</div>;
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 space-y-3">
        <p className="text-slate-400 text-sm">Team not found or access restricted.</p>
        <button onClick={() => navigate('/')} className="text-xs text-blue-400 hover:underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isLeader = (team.creator?._id || team.creator) === user._id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Main Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{team.name}</h1>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                isLeader 
                  ? 'bg-purple-950/60 text-purple-400 border-purple-900/50' 
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50'
              }`}>
                {isLeader ? 'Leader' : 'Member'}
              </span>
            </div>
            {team.eventName && (
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
                <Calendar size={13} className="text-blue-400" /> {team.eventName}
              </span>
            )}
          </div>

          {/* Leader Quick Toggle */}
          {isLeader && (
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-200">Invitations</div>
                <div className="text-[10px] text-slate-400">{team.isOpen ? 'Active' : 'Closed'}</div>
              </div>
              <button onClick={handleToggleRecruitment} className="cursor-pointer">
                {team.isOpen ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-slate-500" />}
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Project Overview</h3>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-800">
            {team.description}
          </p>
        </div>

        {/* Required Skills & Interests */}
        <div className="grid md:grid-cols-2 gap-4 pt-2">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Code size={14} className="text-blue-400" /> Required Skills
            </h4>
            <div className="flex gap-1.5 flex-wrap">
              {team.requiredSkills?.length > 0 ? (
                team.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-950/60 text-blue-400 border border-blue-900/50 text-xs px-2.5 py-1 rounded-lg">
                    {skill}
                  </span>
                ))
              ) : <span className="text-xs text-slate-500">None specified</span>}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" /> Required Interests
            </h4>
            <div className="flex gap-1.5 flex-wrap">
              {team.requiredInterests?.length > 0 ? (
                team.requiredInterests.map((interest, idx) => (
                  <span key={idx} className="bg-amber-950/60 text-amber-400 border border-amber-900/50 text-xs px-2.5 py-1 rounded-lg">
                    {interest}
                  </span>
                ))
              ) : <span className="text-xs text-slate-500">None specified</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Team Roster / Members List */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Users size={18} className="text-blue-500" /> Team Members ({team.members?.length || 0})
        </h3>

        <div className="grid gap-3">
          {team.members?.map(m => {
            const memberIsLeader = m._id === (team.creator?._id || team.creator);
            return (
              <div key={m._id} className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-sm">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                      {m.name}
                      {memberIsLeader && (
                        <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <Crown size={10} /> Leader
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail size={11} /> {m.email}
                    </div>
                  </div>
                </div>

                {/* Member Skill Badges */}
                <div className="flex gap-1.5 flex-wrap">
                  {m.skills?.map((skill, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-300 border border-slate-700 text-[11px] px-2 py-0.5 rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}