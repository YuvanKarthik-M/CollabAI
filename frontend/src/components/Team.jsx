import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, PlusCircle, Send, X, Calendar, 
  CheckCircle, XCircle, Bell, Sparkles, Code, 
  Shield, Mail, Crown, ArrowRight 
} from 'lucide-react';

export default function Teams({ user }) {
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState([]);
  const [discoverTeams, setDiscoverTeams] = useState([]);
  const [myInvitations, setMyInvitations] = useState([]);
  const [officialEvents, setOfficialEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscoverTeam, setSelectedDiscoverTeam] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedInvite, setSelectedInvite] = useState(null);

  const [form, setForm] = useState({
    name: '', eventName: '', description: '', requiredSkills: '', requiredInterests: ''
  });

  const fetchData = async () => {
    try {
      const [teamsRes, invitesRes, eventsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/teams', {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        axios.get('http://localhost:5000/api/teams/invitations/me', {
          headers: { Authorization: `Bearer ${user.token}` }
        }),
        axios.get('http://localhost:5000/api/events', {
          headers: { Authorization: `Bearer ${user.token}` }
        })
      ]);
      setMyTeams(teamsRes.data.myTeams || []);
      setDiscoverTeams(teamsRes.data.discoverTeams || []);
      setMyInvitations(invitesRes.data || []);
      setOfficialEvents(eventsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const finalForm = {
        ...form,
        eventName: form.eventName.trim() || 'General Project'
      };
      await axios.post('http://localhost:5000/api/teams', finalForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setForm({ name: '', eventName: '', description: '', requiredSkills: '', requiredInterests: '' });
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      alert('Error creating team');
    }
  };

  const handleJoin = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.post(`http://localhost:5000/api/teams/${id}/join`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Join request sent!');
      fetchData();
      setSelectedDiscoverTeam(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleRequestResolution = async (teamId, applicantId, action) => {
    try {
      await axios.post('http://localhost:5000/api/teams/requests/action', 
        { teamId, applicantId, action },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSelectedRequest(null);
      fetchData();
    } catch (err) {
      alert('Error updating request');
    }
  };

  const handleInvitationResponse = async (teamId, action) => {
    try {
      await axios.post('http://localhost:5000/api/teams/invitations/action', 
        { teamId, action },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSelectedInvite(null);
      fetchData();
    } catch (err) {
      alert('Error responding to invitation');
    }
  };

  const incomingRequests = myTeams
    .filter(t => (t.creator?._id || t.creator) === user._id)
    .flatMap(t => (t.requests || []).map(student => ({ student, team: t })));

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* ========================================================================= */}
      {/* NOTIFICATIONS: INCOMING INVITATIONS & LEADER REQUESTS                    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        
        {/* Student Incoming Team Invitations Banner */}
        {myInvitations.length > 0 && (
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-sm">
              <Mail size={18} className="animate-bounce" />
              Direct Team Invitations ({myInvitations.length})
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {myInvitations.map(team => (
                <button
                  key={team._id}
                  onClick={() => setSelectedInvite(team)}
                  className="bg-slate-900 hover:bg-slate-800 border border-emerald-800/40 px-3.5 py-2 rounded-xl text-left transition-all flex items-center gap-3 shrink-0 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs">
                    {team.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{team.name}</div>
                    <div className="text-[11px] text-slate-400">Invited by: {team.creator?.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Team Leader Requests Banner */}
        {incomingRequests.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-amber-400 font-semibold text-sm">
              <Bell size={18} className="animate-bounce" />
              Pending Member Join Requests ({incomingRequests.length})
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {incomingRequests.map(({ student, team }) => (
                <button
                  key={`${team._id}-${student._id}`}
                  onClick={() => setSelectedRequest({ student, team })}
                  className="bg-slate-900 hover:bg-slate-800 border border-amber-800/40 px-3.5 py-2 rounded-xl text-left transition-all flex items-center gap-3 shrink-0 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center text-xs">
                    {student.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{student.name}</div>
                    <div className="text-[11px] text-slate-400">For: {team.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: MY ACTIVE TEAMS (VIEW ONLY -> CLICK OPENS FULL WORKSPACE)     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Shield className="text-emerald-500" size={20} /> My Active Teams ({myTeams.length})
          </h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 px-3.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle size={15} /> Create Team
          </button>
        </div>

        {myTeams.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-sm text-slate-500">
            You are not part of any teams yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {myTeams.map(team => {
              const isCreator = (team.creator?._id || team.creator) === user._id;
              return (
                <div 
                  key={team._id} 
                  onClick={() => navigate(`/teams/${team._id}`)}
                  className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-slate-700 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{team.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isCreator 
                          ? 'bg-purple-950/60 text-purple-400 border-purple-900/50' 
                          : 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50'
                      }`}>
                        {isCreator ? 'Leader' : 'Member'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 text-[11px] font-medium">
                        {team.eventName || 'General Project'}
                      </span>
                      <span>• {team.members?.length || 1} members</span>
                      <span className={`text-[11px] ${team.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {team.isOpen ? '• Accepting Invites' : '• Invites Closed'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{team.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-medium">Click to enter workspace</span>
                    <span className="text-xs text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open Team <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: DISCOVER TEAMS (CLICK OPENS DETAILS POPUP)                     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Users className="text-blue-500" size={20} /> Discover Teams
        </h3>

        <div className="grid gap-3">
          {discoverTeams.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-sm text-slate-500">
              No active teams available for joining at this moment.
            </div>
          ) : (
            discoverTeams.map(team => {
              const isPending = team.requests?.some(r => (r._id || r) === user._id);
              return (
                <div 
                  key={team._id} 
                  onClick={() => setSelectedDiscoverTeam(team)}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-start cursor-pointer hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-100">{team.name}</h4>
                      {team.eventName && (
                        <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 border border-slate-700">
                          <Calendar size={11} /> {team.eventName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1.5 line-clamp-2">{team.description}</p>
                    
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {team.requiredSkills?.map((s, idx) => (
                        <span key={idx} className="bg-blue-950/60 text-blue-400 border border-blue-900/50 text-xs px-2.5 py-1 rounded-lg font-medium">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="ml-4 shrink-0" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleJoin(team._id, e)}
                      disabled={isPending}
                      className={`text-xs font-medium py-1.5 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                        isPending 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                          : 'bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      <Send size={13} /> {isPending ? 'Requested' : 'Request to Join'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Modal: Non-Member Discover Team Details */}
      {selectedDiscoverTeam && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedDiscoverTeam.name}</h3>
                <span className="text-xs text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Calendar size={13} /> {selectedDiscoverTeam.eventName || 'General Project'}
                </span>
              </div>
              <button onClick={() => setSelectedDiscoverTeam(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1">
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">About Project</h5>
                <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-800">{selectedDiscoverTeam.description}</p>
              </div>

              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Required Skills</h5>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedDiscoverTeam.requiredSkills?.map((s, idx) => (
                    <span key={idx} className="bg-blue-950/60 text-blue-400 border border-blue-900/50 text-xs px-2.5 py-1 rounded-lg font-medium">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Existing Members ({selectedDiscoverTeam.members?.length || 0})
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedDiscoverTeam.members?.map(m => {
                    const isLeader = m._id === (selectedDiscoverTeam.creator?._id || selectedDiscoverTeam.creator);
                    return (
                      <div key={m._id} className="flex items-center justify-between bg-slate-800/60 border border-slate-800 p-2.5 rounded-xl text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold flex items-center justify-center text-xs">
                            {m.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              {m.name}
                              {isLeader && (
                                <span className="text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800/60 px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                                  <Crown size={9} /> Leader
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Mail size={10} /> {m.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0">
              <button onClick={() => setSelectedDiscoverTeam(null)} className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl cursor-pointer">
                Close
              </button>
              <button 
                onClick={() => handleJoin(selectedDiscoverTeam._id)}
                className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={13} /> Request to Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Team */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="text-blue-500" size={20} /> Create a New Team
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTeam} className="space-y-3">
              <input 
                type="text" placeholder="Team Name" value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} required 
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Event / Hackathon Name
                </label>
                <input 
                  type="text" 
                  placeholder="General Project (or type official event name)" 
                  value={form.eventName} 
                  onChange={e => setForm({...form, eventName: e.target.value})} 
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <input 
                type="text" placeholder="Required Skills (comma separated)" value={form.requiredSkills} 
                onChange={e => setForm({...form, requiredSkills: e.target.value})} 
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input 
                type="text" placeholder="Required Interests (comma separated)" value={form.requiredInterests} 
                onChange={e => setForm({...form, requiredInterests: e.target.value})} 
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <textarea 
                placeholder="Project Description" value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} required 
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                rows="3"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer">
                  Publish Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Incoming Invitation Detail */}
      {selectedInvite && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Team Invitation</h3>
                <span className="text-xs text-emerald-400 font-medium">Invited to join {selectedInvite.name}</span>
              </div>
              <button onClick={() => setSelectedInvite(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                <div><b className="text-slate-300">Team Leader:</b> <span className="text-slate-400">{selectedInvite.creator?.name} ({selectedInvite.creator?.email})</span></div>
                <div><b className="text-slate-300">Event:</b> <span className="text-slate-400">{selectedInvite.eventName || 'General Project'}</span></div>
              </div>

              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Project Description</h5>
                <p className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800">{selectedInvite.description}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button 
                onClick={() => handleInvitationResponse(selectedInvite._id, 'reject')}
                className="flex-1 py-2 text-xs font-medium bg-red-950/60 text-red-400 border border-red-900/50 hover:bg-red-900/60 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <XCircle size={14} /> Decline
              </button>
              <button 
                onClick={() => handleInvitationResponse(selectedInvite._id, 'accept')}
                className="flex-1 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckCircle size={14} /> Accept & Join Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Leader Candidate Join Request */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Member Request</h3>
                <span className="text-xs text-slate-400">Applying for: <b className="text-slate-200">{selectedRequest.team.name}</b></span>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl">
                <div className="text-sm font-bold text-slate-200">{selectedRequest.student.name}</div>
                <div className="text-xs text-slate-400">{selectedRequest.student.email}</div>
              </div>

              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Code size={13} /> Skills
                </h5>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedRequest.student.skills?.length > 0 ? (
                    selectedRequest.student.skills.map((skill, idx) => (
                      <span key={idx} className="bg-blue-950/60 text-blue-400 border border-blue-900/50 text-xs px-2.5 py-1 rounded-lg font-medium">{skill}</span>
                    ))
                  ) : <span className="text-xs text-slate-500">No skills listed</span>}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <Sparkles size={13} /> Interests
                </h5>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedRequest.student.interests?.length > 0 ? (
                    selectedRequest.student.interests.map((interest, idx) => (
                      <span key={idx} className="bg-amber-950/60 text-amber-400 border border-amber-900/50 text-xs px-2.5 py-1 rounded-lg font-medium">{interest}</span>
                    ))
                  ) : <span className="text-xs text-slate-500">No interests listed</span>}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button 
                onClick={() => handleRequestResolution(selectedRequest.team._id, selectedRequest.student._id, 'reject')}
                className="flex-1 py-2 text-xs font-medium bg-red-950/60 text-red-400 border border-red-900/50 hover:bg-red-900/60 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <XCircle size={14} /> Reject
              </button>
              <button 
                onClick={() => handleRequestResolution(selectedRequest.team._id, selectedRequest.student._id, 'accept')}
                className="flex-1 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckCircle size={14} /> Accept into Team
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}