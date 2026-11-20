import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Users, PlusCircle, Send, X, Calendar, 
  CheckCircle, XCircle, Bell, Sparkles, Code, 
  Shield, Mail, Crown, ArrowRight, Award, MapPin, Globe, AlertCircle, Check, TrendingUp, Zap
} from 'lucide-react';
import { registerTeamForEvent, unregisterTeamFromEvent } from '../services/api';
import SkillSelect from './SkillSelect';

// Helper: compute match % between user and a team (client-side, matches backend logic)
function computeMatchScore(user, team) {
  const userSkills    = (user.skills    || []).map(s => s.trim().toLowerCase());
  const userInterests = (user.interests || []).map(i => i.trim().toLowerCase());
  const teamSkills    = (team.requiredSkills    || []).map(s => s.trim().toLowerCase());
  const teamInterests = (team.requiredInterests || []).map(i => i.trim().toLowerCase());

  const matchedSkills    = teamSkills.filter(s => userSkills.includes(s));
  const matchedInterests = teamInterests.filter(i => userInterests.includes(i));

  const skillScore    = teamSkills.length    > 0 ? matchedSkills.length    / teamSkills.length    : 0;
  const score         = Math.round(skillScore * 100);

  return { score, matchedSkills, matchedInterests };
}

function MatchBadge({ score }) {
  if (score >= 80) return (
    <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/70 px-2 py-0.5 rounded-full">
      <Zap size={10} /> {score}% Match
    </span>
  );
  if (score >= 50) return (
    <span className="flex items-center gap-1 text-[11px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800/70 px-2 py-0.5 rounded-full">
      <TrendingUp size={10} /> {score}% Match
    </span>
  );
  if (score > 0) return (
    <span className="flex items-center gap-1 text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
      {score}% Match
    </span>
  );
  return (
    <span className="text-[11px] text-slate-500 border border-slate-800 bg-slate-900 px-2 py-0.5 rounded-full">
      No match data
    </span>
  );
}

function MatchBar({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-blue-500' : score > 0 ? 'bg-amber-500' : 'bg-slate-700';
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default function Teams({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-teams'); // 'my-teams' | 'discover-teams' | 'events'
  const [myTeams, setMyTeams] = useState([]);
  const [discoverTeams, setDiscoverTeams] = useState([]);
  const [myInvitations, setMyInvitations] = useState([]);
  const [officialEvents, setOfficialEvents] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscoverTeam, setSelectedDiscoverTeam] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedInvite, setSelectedInvite] = useState(null);

  // Event Team Registration Modal State
  const [selectedEventToRegister, setSelectedEventToRegister] = useState(null);
  const [selectedTeamIdToRegister, setSelectedTeamIdToRegister] = useState('');
  const [registering, setRegistering] = useState(false);
  const [alert, setAlert] = useState(null);

  const [form, setForm] = useState({
    name: '', eventName: '', description: '', requiredSkills: [], requiredInterests: ''
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

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
        eventName: form.eventName.trim() || 'General Project',
        requiredSkills: Array.isArray(form.requiredSkills) 
          ? form.requiredSkills 
          : form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        requiredInterests: typeof form.requiredInterests === 'string'
          ? form.requiredInterests.split(',').map(i => i.trim()).filter(Boolean)
          : form.requiredInterests
      };
      await axios.post('http://localhost:5000/api/teams', finalForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setForm({ name: '', eventName: '', description: '', requiredSkills: [], requiredInterests: '' });
      setShowCreateModal(false);
      fetchData();
      showAlert('success', 'Team published successfully!');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Error creating team');
    }
  };

  const handleJoin = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.post(`http://localhost:5000/api/teams/${id}/join`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      showAlert('success', 'Join request sent!');
      fetchData();
      setSelectedDiscoverTeam(null);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to send request');
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
      showAlert('error', 'Error updating request');
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
      showAlert('error', 'Error responding to invitation');
    }
  };

  // Handle Event Registration Submission
  const handleConfirmEventRegistration = async () => {
    if (!selectedTeamIdToRegister || !selectedEventToRegister) return;
    try {
      setRegistering(true);
      const res = await registerTeamForEvent(selectedEventToRegister._id, selectedTeamIdToRegister);
      showAlert('success', res.data.message);
      setSelectedEventToRegister(null);
      setSelectedTeamIdToRegister('');
      fetchData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to register team for event');
    } finally {
      setRegistering(false);
    }
  };

  const incomingRequests = myTeams
    .filter(t => (t.creator?._id || t.creator) === user._id)
    .flatMap(t => (t.requests || []).map(student => ({ student, team: t })));

  // User's teams where user is creator/leader
  const myLedTeams = myTeams.filter(t => (t.creator?._id || t.creator) === user._id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* Alert Toast */}
      {alert && (
        <div className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-between transition-all ${
          alert.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' 
            : 'bg-red-950/60 border-red-800/80 text-red-300'
        }`}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* NOTIFICATIONS BANNER */}
      <div className="space-y-4">
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

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('my-teams')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'my-teams'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={18} /> My Active Teams ({myTeams.length})
          </button>

          <button
            onClick={() => setActiveTab('discover-teams')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'discover-teams'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={18} /> Discover Teams ({discoverTeams.length})
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award size={18} /> Explore Events ({officialEvents.length})
          </button>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
        >
          <PlusCircle size={15} /> Create Team
        </button>
      </div>

      {/* TAB 1: MY ACTIVE TEAMS */}
      {activeTab === 'my-teams' && (
        <div className="space-y-4">
          {myTeams.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-sm text-slate-400 space-y-3">
              <Users size={32} className="mx-auto text-slate-600" />
              <p>You are not part of any teams yet.</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
              >
                + Create Your First Team
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myTeams.map(team => {
                const isCreator = (team.creator?._id || team.creator) === user._id;
                return (
                  <div 
                    key={team._id} 
                    onClick={() => navigate(`/teams/${team._id}`)}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-slate-700 transition-all group shadow-sm"
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

                      <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                        <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-md border border-slate-700 text-[11px] font-medium flex items-center gap-1">
                          <Calendar size={11} /> {team.eventName || 'General Project'}
                        </span>
                        <span>• {team.members?.length || 1} members</span>
                        <span className={`text-[11px] ${team.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {team.isOpen ? '• Recruiting' : '• Closed'}
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
      )}

      {/* TAB 2: DISCOVER TEAMS */}
      {activeTab === 'discover-teams' && (
        <div className="space-y-4">
          {/* Profile nudge if user has no skills/interests */}
          {(!user.skills?.length && !user.interests?.length) && (
            <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-300">Complete your profile to see your skill match!</div>
                <p className="text-xs text-amber-400/80 mt-0.5">Add your skills and interests in <a href="/profile" className="underline font-medium">Profile</a> to get personalized team recommendations sorted by how well you match.</p>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {discoverTeams.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-sm text-slate-500">
                No active teams available for joining at this moment.
              </div>
            ) : (
              discoverTeams.map(team => {
                const isPending = team.requests?.some(r => (r._id || r) === user._id);
                const { score, matchedSkills, matchedInterests } = computeMatchScore(user, team);
                // Use backend score if available (server-computed), else use client-computed
                const finalScore = team.matchScore ?? score;
                const userSkillsLower    = (user.skills    || []).map(s => s.trim().toLowerCase());
                const userInterestsLower = (user.interests || []).map(i => i.trim().toLowerCase());

                return (
                  <div 
                    key={team._id} 
                    onClick={() => setSelectedDiscoverTeam(team)}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-slate-700 transition-all group"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{team.name}</h4>
                          {team.eventName && (
                            <span className="text-[11px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1 border border-slate-700 shrink-0">
                              <Calendar size={11} /> {team.eventName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{team.description}</p>
                      </div>

                      {/* Match Badge + Join Button */}
                      <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                        <MatchBadge score={finalScore} />
                        <div onClick={e => e.stopPropagation()}>
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
                    </div>

                    {/* Match Progress Bar */}
                    <div className="mt-3">
                      <MatchBar score={finalScore} />
                    </div>

                    {/* Skills row: green = match, red = missing */}
                    {team.requiredSkills?.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mr-1.5">Skills:</span>
                        <div className="inline-flex gap-1.5 flex-wrap mt-1">
                          {team.requiredSkills.map((s, idx) => {
                            const hasIt = userSkillsLower.includes(s.trim().toLowerCase());
                            return (
                              <span key={idx} className={`text-xs px-2.5 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                                hasIt
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                  : 'bg-red-950/50 text-red-400 border-red-900/50'
                              }`}>
                                {hasIt && <Check size={10} />}
                                {s}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interests row */}
                    {team.requiredInterests?.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mr-1.5">Interests:</span>
                        <div className="inline-flex gap-1.5 flex-wrap mt-1">
                          {team.requiredInterests.map((i, idx) => {
                            const hasIt = userInterestsLower.includes(i.trim().toLowerCase());
                            return (
                              <span key={idx} className={`text-xs px-2.5 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                                hasIt
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {hasIt && <Check size={10} />}
                                {i}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Member count */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{team.members?.length || 1} member{(team.members?.length || 1) !== 1 ? 's' : ''} · {team.isOpen ? 'Recruiting' : 'Closed'}</span>
                      <span className="text-[11px] text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">View Details <ArrowRight size={11} /></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EXPLORE PUBLISHED EVENTS */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {officialEvents.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-sm text-slate-400">
              No active organization events published at the moment. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {officialEvents.map(ev => {
                const registeredTeamsCount = ev.registeredTeams?.length || 0;

                return (
                  <div key={ev._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900/60">
                            {ev.category || 'Hackathon'}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-1.5">{ev.title}</h3>
                          <p className="text-xs text-slate-400">Host: <b className="text-slate-200">{ev.organisation?.name || 'Organization'}</b></p>
                        </div>

                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {registeredTeamsCount} Registered Team(s)
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {ev.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                          <Calendar size={14} className="text-blue-400 shrink-0" />
                          <span className="truncate">{ev.eventDate}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                          <MapPin size={14} className="text-purple-400 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                          <Globe size={14} className="text-emerald-400 shrink-0" />
                          <span className="capitalize">{ev.mode}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                          <Users size={14} className="text-amber-400 shrink-0" />
                          <span>{ev.type === 'team' ? `Max ${ev.maxTeamSize} Members` : 'Individual'}</span>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">Eligibility:</span> {ev.eligibility}
                      </div>
                    </div>

                    {/* Action Button for Team Leaders */}
                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedEventToRegister(ev);
                          setSelectedTeamIdToRegister(myLedTeams[0]?._id || '');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
                      >
                        <Award size={15} /> Register Team for Event
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENT REGISTRATION MODAL */}
      {selectedEventToRegister && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Award className="text-blue-500" size={18} /> Register Team
                </h3>
                <span className="text-xs text-slate-400">Event: <b className="text-white">{selectedEventToRegister.title}</b></span>
              </div>
              <button onClick={() => setSelectedEventToRegister(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {myLedTeams.length === 0 ? (
              <div className="p-4 bg-amber-950/50 border border-amber-800/60 rounded-xl text-amber-300 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={16} /> Team Leader Role Required
                </div>
                <p>You must be a Team Leader to register a team for this event. Create a team first or ask your team leader to register!</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Team to Register *
                  </label>
                  <select
                    value={selectedTeamIdToRegister}
                    onChange={(e) => setSelectedTeamIdToRegister(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {myLedTeams.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.members?.length || 1} members)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300">
                  <div><b>Event Max Team Limit:</b> {selectedEventToRegister.maxTeamSize} Members</div>
                  <div><b>Host Organisation:</b> {selectedEventToRegister.organisation?.name || 'Organisation'}</div>
                  <div><b>Format:</b> {selectedEventToRegister.mode} ({selectedEventToRegister.venue})</div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedEventToRegister(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmEventRegistration}
                    disabled={registering || !selectedTeamIdToRegister}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {registering ? 'Registering...' : 'Confirm Registration'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL */}
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
                  placeholder="General Project" 
                  value={form.eventName} 
                  onChange={e => setForm({...form, eventName: e.target.value})} 
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Skills Dropdown Multi-Select */}
              <SkillSelect
                selectedSkills={Array.isArray(form.requiredSkills) ? form.requiredSkills : []}
                onChange={(skills) => setForm({ ...form, requiredSkills: skills })}
                theme="dark"
                label="Required Skills (Select from Dropdown)"
                placeholder="Search or type skills (e.g. React, Python)..."
              />

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Required Interests (Comma separated)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. AI, Open Source, Healthcare" 
                  value={form.requiredInterests} 
                  onChange={e => setForm({...form, requiredInterests: e.target.value})} 
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
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

      {/* DISCOVER TEAM DETAIL MODAL */}
      {selectedDiscoverTeam && (() => {
        const { score: modalScore } = computeMatchScore(user, selectedDiscoverTeam);
        const finalModalScore = selectedDiscoverTeam.matchScore ?? modalScore;
        const userSkillsLower    = (user.skills    || []).map(s => s.trim().toLowerCase());
        const userInterestsLower = (user.interests || []).map(i => i.trim().toLowerCase());
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{selectedDiscoverTeam.name}</h3>
                  <span className="text-xs text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
                    <Calendar size={13} /> {selectedDiscoverTeam.eventName || 'General Project'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MatchBadge score={finalModalScore} />
                  <button onClick={() => setSelectedDiscoverTeam(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer ml-1">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1">
                {/* Match Breakdown Panel */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><TrendingUp size={13} className="text-blue-400" /> Your Match Score</span>
                    <span className={`text-sm font-black ${finalModalScore >= 80 ? 'text-emerald-400' : finalModalScore >= 50 ? 'text-blue-400' : 'text-slate-400'}`}>{finalModalScore}%</span>
                  </div>
                  <MatchBar score={finalModalScore} />
                  {finalModalScore === 0 && (user.skills?.length > 0 || user.interests?.length > 0) && (
                    <p className="text-[11px] text-amber-400">Your current skills/interests don't match this team's requirements, but you can still apply!</p>
                  )}
                  {(!user.skills?.length && !user.interests?.length) && (
                    <p className="text-[11px] text-slate-500">Add skills & interests to your profile to see your match score.</p>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">About Project</h5>
                  <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-800">{selectedDiscoverTeam.description}</p>
                </div>

                {selectedDiscoverTeam.requiredSkills?.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Required Skills</h5>
                    <div className="flex gap-1.5 flex-wrap">
                      {selectedDiscoverTeam.requiredSkills.map((s, idx) => {
                        const hasIt = userSkillsLower.includes(s.trim().toLowerCase());
                        return (
                          <span key={idx} className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1 ${
                            hasIt ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' : 'bg-red-950/50 text-red-400 border-red-900/50'
                          }`}>
                            {hasIt ? <Check size={10} /> : <X size={10} />} {s}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      <span className="text-emerald-400 font-medium">■</span> You have this &nbsp;
                      <span className="text-red-400 font-medium">■</span> Missing from your profile
                    </p>
                  </div>
                )}

                {selectedDiscoverTeam.requiredInterests?.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Required Interests</h5>
                    <div className="flex gap-1.5 flex-wrap">
                      {selectedDiscoverTeam.requiredInterests.map((i, idx) => {
                        const hasIt = userInterestsLower.includes(i.trim().toLowerCase());
                        return (
                          <span key={idx} className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1 ${
                            hasIt ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {hasIt && <Check size={10} />} {i}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

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
        );
      })()}

      {/* INVITATION DETAIL MODAL */}
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

      {/* MEMBER JOIN REQUEST MODAL */}
      {selectedRequest && (() => {
        const { score: reqScore, matchedSkills: reqMatchedSkills, matchedInterests: reqMatchedInterests } = computeMatchScore(
          selectedRequest.student, selectedRequest.team
        );
        const teamSkillsLower    = (selectedRequest.team.requiredSkills    || []).map(s => s.trim().toLowerCase());
        const teamInterestsLower = (selectedRequest.team.requiredInterests || []).map(i => i.trim().toLowerCase());
        return (
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
                <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-200">{selectedRequest.student.name}</div>
                    <div className="text-xs text-slate-400">{selectedRequest.student.email}</div>
                  </div>
                  <MatchBadge score={reqScore} />
                </div>

                {/* Match bar */}
                {(teamSkillsLower.length > 0 || teamInterestsLower.length > 0) && (
                  <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1"><TrendingUp size={12} /> Skill Match</span>
                      <span className={`font-bold ${reqScore >= 80 ? 'text-emerald-400' : reqScore >= 50 ? 'text-blue-400' : 'text-slate-400'}`}>{reqScore}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${reqScore >= 80 ? 'bg-emerald-500' : reqScore >= 50 ? 'bg-blue-500' : reqScore > 0 ? 'bg-amber-500' : 'bg-slate-600'}`}
                        style={{ width: `${reqScore}%` }} />
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Code size={13} /> Skills
                  </h5>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedRequest.student.skills?.length > 0 ? (
                      selectedRequest.student.skills.map((skill, idx) => {
                        const isMatch = teamSkillsLower.includes(skill.trim().toLowerCase());
                        return (
                          <span key={idx} className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1 ${
                            isMatch
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                              : 'bg-blue-950/60 text-blue-400 border-blue-900/50'
                          }`}>
                            {isMatch && <Check size={10} />}{skill}
                          </span>
                        );
                      })
                    ) : <span className="text-xs text-slate-500">No skills listed</span>}
                  </div>
                  {teamSkillsLower.length > 0 && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      <span className="text-emerald-400">■</span> matches team requirement &nbsp;
                      <span className="text-blue-400">■</span> doesn't match requirement
                    </p>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Sparkles size={13} /> Interests
                  </h5>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedRequest.student.interests?.length > 0 ? (
                      selectedRequest.student.interests.map((interest, idx) => {
                        const isMatch = teamInterestsLower.includes(interest.trim().toLowerCase());
                        return (
                          <span key={idx} className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1 ${
                            isMatch
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                              : 'bg-amber-950/60 text-amber-400 border-amber-900/50'
                          }`}>
                            {isMatch && <Check size={10} />}{interest}
                          </span>
                        );
                      })
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
        );
      })()}

    </div>
  );
}