import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Calendar, Shield, Users, Code, 
  Sparkles, ToggleLeft, ToggleRight, Mail, Crown, 
  Settings, UserPlus, Search, Send, X, Clock 
} from 'lucide-react';
import TeamChat from './TeamChat';

export default function TeamDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Leader Management Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    eventName: '', 
    description: '', 
    requiredSkills: '', 
    requiredInterests: '', 
    isOpen: true 
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/teams', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      const myTeam = (res.data.myTeams || []).find(t => t._id === id);

      if (!myTeam) {
        alert('Access Denied: You are not an active member of this team.');
        navigate('/', { replace: true });
        return;
      }

      setTeam(myTeam);
      setEditForm({
        name: myTeam.name,
        eventName: myTeam.eventName || '',
        description: myTeam.description,
        requiredSkills: myTeam.requiredSkills ? myTeam.requiredSkills.join(', ') : '',
        requiredInterests: myTeam.requiredInterests ? myTeam.requiredInterests.join(', ') : '',
        isOpen: myTeam.isOpen
      });
    } catch (err) {
      console.error('Error fetching team details', err);
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [id, user._id]);

  const handleToggleRecruitment = async () => {
    try {
      await axios.put(`http://localhost:5000/api/teams/${team._id}`, { isOpen: !team.isOpen }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTeam(prev => ({ ...prev, isOpen: !prev.isOpen }));
      setEditForm(prev => ({ ...prev, isOpen: !prev.isOpen }));
    } catch (err) {
      alert('Error updating recruitment status');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/teams/${team._id}`, editForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTeam(res.data);
      setEditForm({
        name: res.data.name,
        eventName: res.data.eventName || '',
        description: res.data.description,
        requiredSkills: res.data.requiredSkills ? res.data.requiredSkills.join(', ') : '',
        requiredInterests: res.data.requiredInterests ? res.data.requiredInterests.join(', ') : '',
        isOpen: res.data.isOpen
      });
      setShowEditModal(false);
    } catch (err) {
      alert('Error saving team updates');
    }
  };

  const openInviteModal = async () => {
    setShowInviteModal(true);
    setCandidateSearch('');
    setLoadingCandidates(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/teams/${team._id}/candidates`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCandidates(res.data);
    } catch (err) {
      alert('Error fetching candidate students');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSearchCandidates = async (query) => {
    setCandidateSearch(query);
    try {
      const res = await axios.get(`http://localhost:5000/api/teams/${team._id}/candidates?search=${query}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCandidates(res.data);
    } catch (err) {
      console.error('Candidate search error', err);
    }
  };

  const handleSendInvite = async (studentId) => {
    try {
      await axios.post(`http://localhost:5000/api/teams/${team._id}/invite`, 
        { studentId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setCandidates(prev => prev.filter(c => c._id !== studentId));
      fetchTeam();
      alert('Invitation sent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400 text-sm">Validating workspace access...</div>;
  }

  if (!team) return null;

  const isLeader = (team.creator?._id || team.creator) === user._id;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: TEAM DETAILS & MEMBER ROSTER */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-100">{team.name}</h1>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                    isLeader 
                      ? 'bg-purple-950/60 text-purple-400 border-purple-900/50' 
                      : 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50'
                  }`}>
                    {isLeader ? 'Team Leader' : 'Team Member'}
                  </span>
                </div>
                {team.eventName && (
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
                    <Calendar size={13} className="text-blue-400" /> {team.eventName}
                  </span>
                )}
              </div>

              {isLeader && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={openInviteModal}
                    className="bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600 hover:text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={14} /> Invite Teammates
                  </button>

                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings size={14} /> Edit Team
                  </button>

                  <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-300">Recruiting</span>
                    <button onClick={handleToggleRecruitment} className="cursor-pointer">
                      {team.isOpen ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} className="text-slate-500" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Project Overview</h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                {team.description}
              </p>
            </div>

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

          {/* Member Roster */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users size={18} className="text-blue-500" /> Team Members ({(team.members?.length || 0) + (team.invitations?.length || 0)})
              </h3>
              <span className="text-xs text-slate-400">
                {team.members?.length || 0} active • {team.invitations?.length || 0} invited
              </span>
            </div>

            <div className="space-y-3">
              {team.members?.map(m => {
                const memberIsLeader = (m._id || m) === (team.creator?._id || team.creator);
                return (
                  <div key={m._id} className="bg-slate-800/60 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          {m.name}
                          {memberIsLeader && (
                            <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                              <Crown size={10} /> Leader
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail size={10} /> {m.email}
                        </div>
                      </div>
                    </div>

                    {m.skills && m.skills.length > 0 && (
                      <div className="flex gap-1 flex-wrap sm:justify-end">
                        {m.skills.map((skill, idx) => (
                          <span key={idx} className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {team.invitations?.map(inv => (
                <div key={inv._id || inv} className="bg-slate-800/30 border border-dashed border-slate-700 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-400 font-bold flex items-center justify-center text-xs shrink-0">
                      {inv.name ? inv.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        {inv.name || 'Invited Student'}
                        <span className="text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <Clock size={10} /> Invited
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {inv.email}
                      </div>
                    </div>
                  </div>

                  {inv.skills && inv.skills.length > 0 && (
                    <div className="flex gap-1 flex-wrap sm:justify-end">
                      {inv.skills.map((skill, idx) => (
                        <span key={idx} className="bg-slate-800/50 text-slate-400 border border-slate-700/60 text-[10px] px-2 py-0.5 rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DOCKED CHAT */}
        <div className="lg:col-span-5 sticky top-24">
          <TeamChat teamId={team._id} user={user} />
        </div>
      </div>

      {/* EDIT TEAM MODAL (WITH SKILLS & INTERESTS RESTORED) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Settings className="text-blue-500" size={18} /> Edit Team Details
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Team Name</label>
                <input 
                  type="text" placeholder="Team Name" value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} required 
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Event / Hackathon Name</label>
                <input 
                  type="text" placeholder="Event Name" value={editForm.eventName} 
                  onChange={e => setEditForm({...editForm, eventName: e.target.value})} 
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Required Skills (Comma separated)</label>
                <input 
                  type="text" placeholder="React, Python, Node.js" value={editForm.requiredSkills} 
                  onChange={e => setEditForm({...editForm, requiredSkills: e.target.value})} 
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Required Interests (Comma separated)</label>
                <input 
                  type="text" placeholder="AI, Web3, FinTech" value={editForm.requiredInterests} 
                  onChange={e => setEditForm({...editForm, requiredInterests: e.target.value})} 
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea 
                  placeholder="Description" value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} required 
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE TEAMMATES MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <UserPlus className="text-purple-400" size={18} /> Invite Teammates
                </h3>
                <span className="text-xs text-slate-400">Search and invite candidates directly</span>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
              <input 
                type="text"
                placeholder="Search candidates by name, email, or skill..."
                value={candidateSearch}
                onChange={(e) => handleSearchCandidates(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {loadingCandidates ? (
                <div className="text-center py-8 text-xs text-slate-500">Finding candidates...</div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No students available to invite.</div>
              ) : (
                candidates.map(candidate => (
                  <div key={candidate._id} className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-slate-200">{candidate.name}</div>
                      <div className="text-[11px] text-slate-400">{candidate.email}</div>
                    </div>
                    <button 
                      onClick={() => handleSendInvite(candidate._id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Send size={12} /> Invite
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}