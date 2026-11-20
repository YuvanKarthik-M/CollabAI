import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Calendar, Shield, Users, Code,
  Sparkles, ToggleLeft, ToggleRight, Mail, Crown,
  Settings, UserPlus, Search, Send, X, Clock, Award, CheckCircle, AlertCircle, TrendingUp, Zap, Check,
  LogOut, UserMinus
} from 'lucide-react';
import TeamChat from './TeamChat';
import { getActiveEvents, registerTeamForEvent, unregisterTeamFromEvent, leaveTeam as leaveTeamApi, removeTeamMember as removeTeamMemberApi } from '../services/api';
import SkillSelect from './SkillSelect';

function CandidateMatchBadge({ score }) {
  if (score >= 80) return (
    <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/70 px-1.5 py-0.5 rounded-full">
      <Zap size={9} /> {score}%
    </span>
  );
  if (score >= 50) return (
    <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800/70 px-1.5 py-0.5 rounded-full">
      <TrendingUp size={9} /> {score}%
    </span>
  );
  if (score > 0) return (
    <span className="text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-full">
      {score}%
    </span>
  );
  return null;
}

export default function TeamDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Event Registration Modal
  const [showEventRegisterModal, setShowEventRegisterModal] = useState(false);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [registeringEventId, setRegisteringEventId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  // Leader Management Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    eventName: '',
    description: '',
    requiredSkills: [],
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
        requiredSkills: Array.isArray(myTeam.requiredSkills)
          ? myTeam.requiredSkills
          : (myTeam.requiredSkills ? myTeam.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []),
        requiredInterests: Array.isArray(myTeam.requiredInterests)
          ? myTeam.requiredInterests.join(', ')
          : (myTeam.requiredInterests || ''),
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

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await getActiveEvents();
      setActiveEvents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const openEventRegisterModal = () => {
    fetchEvents();
    setShowEventRegisterModal(true);
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      setRegisteringEventId(eventId);
      const res = await registerTeamForEvent(eventId, team._id);
      setAlertMsg({ type: 'success', text: res.data.message });
      setShowEventRegisterModal(false);
      fetchTeam();
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to register team for event' });
    } finally {
      setRegisteringEventId(null);
    }
  };

  const handleUnregisterEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to unregister your team from this event?')) return;
    try {
      const res = await unregisterTeamFromEvent(eventId, team._id);
      setAlertMsg({ type: 'success', text: res.data.message });
      fetchTeam();
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Failed to unregister team' });
    }
  };

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
      const payload = {
        ...editForm,
        requiredSkills: Array.isArray(editForm.requiredSkills)
          ? editForm.requiredSkills
          : editForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        requiredInterests: typeof editForm.requiredInterests === 'string'
          ? editForm.requiredInterests.split(',').map(i => i.trim()).filter(Boolean)
          : editForm.requiredInterests
      };

      const res = await axios.put(`http://localhost:5000/api/teams/${team._id}`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTeam(res.data);
      setEditForm({
        name: res.data.name,
        eventName: res.data.eventName || '',
        description: res.data.description,
        requiredSkills: Array.isArray(res.data.requiredSkills)
          ? res.data.requiredSkills
          : (res.data.requiredSkills ? res.data.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []),
        requiredInterests: Array.isArray(res.data.requiredInterests)
          ? res.data.requiredInterests.join(', ')
          : (res.data.requiredInterests || ''),
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
      const studentCandidates = (res.data || []).filter(c => !c.role || c.role === 'student');
      setCandidates(studentCandidates);
    } catch (err) {
      alert('Error fetching candidate students');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSearchCandidates = async (query) => {
    setCandidateSearch(query);
    try {
      const res = await axios.get(`http://localhost:5000/api/teams/${team._id}/candidates?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const studentCandidates = (res.data || []).filter(c => !c.role || c.role === 'student');
      setCandidates(studentCandidates);
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

  const handleLeaveTeam = async () => {
    if (!window.confirm(`Are you sure you want to leave "${team.name}"? You will lose access to team chat and workspace.`)) {
      return;
    }
    try {
      await leaveTeamApi(team._id);
      alert('You have successfully left the team.');
      navigate('/', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave team');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || 'this student'} from the team?`)) {
      return;
    }
    try {
      await removeTeamMemberApi(team._id, memberId);
      setAlertMsg({ type: 'success', text: `${memberName || 'Member'} has been removed from the team.` });
      fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400 text-sm">Validating workspace access...</div>;
  }

  if (!team) return null;

  const isLeader = (team.creator?._id || team.creator) === user._id;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">

      {/* Back Button & Alert Toast */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {alertMsg && (
          <div className={`text-xs px-3.5 py-1.5 rounded-xl border flex items-center gap-2 ${alertMsg.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : 'bg-red-950/80 text-red-300 border-red-800'
            }`}>
            <span>{alertMsg.text}</span>
            <button onClick={() => setAlertMsg(null)} className="font-bold cursor-pointer">✕</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: TEAM DETAILS & MEMBER ROSTER */}
        <div className="lg:col-span-7 space-y-6">

          {/* Main Info Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-100">{team.name}</h1>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${isLeader
                      ? 'bg-purple-950/60 text-purple-400 border-purple-900/50'
                      : 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50'
                    }`}>
                    {isLeader ? 'Team Leader' : 'Team Member'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-400" /> {team.eventName || 'General Project'}
                  </span>

                  {team.registeredEvent && (
                    <span className="text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> Officially Registered
                    </span>
                  )}
                </div>
              </div>

              {isLeader ? (
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
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleLeaveTeam}
                    className="bg-red-950/40 text-red-400 border border-red-800/60 hover:bg-red-900/60 hover:text-red-200 text-xs font-semibold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <LogOut size={14} /> Leave Team
                  </button>
                </div>
              )}
            </div>

            {/* Official Event Registration Banner / Action */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    {team.registeredEvent ? `Event: ${team.eventName}` : 'Official Organization Event Registration'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {team.registeredEvent
                      ? 'Your team is registered for this official competition.'
                      : 'Register your team for hackathons or competitions hosted by Organizations.'}
                  </p>
                </div>
              </div>

              {isLeader && (
                <div>
                  {team.registeredEvent ? (
                    <button
                      onClick={() => handleUnregisterEvent(team.registeredEvent._id || team.registeredEvent)}
                      className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                    >
                      Unregister
                    </button>
                  ) : (
                    <button
                      onClick={openEventRegisterModal}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                    >
                      <Award size={14} /> Register Event
                    </button>
                  )}
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

                    <div className="flex items-center gap-2 sm:justify-end shrink-0 flex-wrap">
                      {m.skills && m.skills.length > 0 && (
                        <div className="flex gap-1 flex-wrap sm:justify-end">
                          {m.skills.map((skill, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {isLeader && !memberIsLeader && (
                        <button
                          onClick={() => handleRemoveMember(m._id, m.name)}
                          className="bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-800/60 text-xs font-semibold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                          title={`Remove ${m.name} from team`}
                        >
                          <UserMinus size={13} /> Remove
                        </button>
                      )}

                      {!isLeader && m._id === user._id && (
                        <button
                          onClick={handleLeaveTeam}
                          className="bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-800/60 text-xs font-semibold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-1"
                          title="Leave this team"
                        >
                          <LogOut size={13} /> Leave
                        </button>
                      )}
                    </div>
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

      {/* EVENT REGISTRATION MODAL FOR LEADER */}
      {showEventRegisterModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Award className="text-blue-500" size={20} /> Register Team for Event
                </h3>
                <span className="text-xs text-slate-400">Select an official published event for <b className="text-white">{team.name}</b></span>
              </div>
              <button onClick={() => setShowEventRegisterModal(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {loadingEvents ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading active events...</div>
              ) : activeEvents.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No active published events available.</div>
              ) : (
                activeEvents.map(ev => {
                  const isAlreadyRegistered = (ev.registeredTeams || []).some(t => (t._id || t) === team._id);
                  const isOverLimit = ev.type === 'team' && team.members.length > ev.maxTeamSize;

                  return (
                    <div key={ev._id} className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/50">
                            {ev.category}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-1">{ev.title}</h4>
                          <p className="text-[11px] text-slate-400">Host: {ev.organisation?.name || 'Organisation'}</p>
                        </div>

                        {isAlreadyRegistered ? (
                          <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-xl font-semibold flex items-center gap-1">
                            <CheckCircle size={12} /> Registered
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRegisterEvent(ev._id)}
                            disabled={registeringEventId === ev._id || isOverLimit}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${isOverLimit
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                              }`}
                          >
                            {registeringEventId === ev._id ? 'Registering...' : 'Register Team'}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                        <div>📅 {ev.eventDate} ({ev.mode})</div>
                        <div>📍 {ev.venue}</div>
                        <div>👥 {ev.type === 'team' ? `Max ${ev.maxTeamSize} members` : 'Individual'}</div>
                        <div>🎯 {ev.eligibility}</div>
                      </div>

                      {isOverLimit && (
                        <div className="text-[11px] text-red-400 flex items-center gap-1 pt-1">
                          <AlertCircle size={12} /> Team has {team.members.length} members (event max limit is {ev.maxTeamSize}).
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button onClick={() => setShowEventRegisterModal(false)} className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
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
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })} required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Event / Hackathon Name</label>
                <input
                  type="text" placeholder="Event Name" value={editForm.eventName}
                  onChange={e => setEditForm({ ...editForm, eventName: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Skills Dropdown Multi-Select */}
              <SkillSelect
                selectedSkills={Array.isArray(editForm.requiredSkills) ? editForm.requiredSkills : []}
                onChange={(skills) => setEditForm({ ...editForm, requiredSkills: skills })}
                theme="dark"
                label="Required Skills"
                placeholder="Search or type skills (e.g. React, Python)..."
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Required Interests (Comma separated)</label>
                <input
                  type="text" placeholder="AI, Frontend, Computer Vision" value={editForm.requiredInterests}
                  onChange={e => setEditForm({ ...editForm, requiredInterests: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                <textarea
                  placeholder="Description" value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })} required
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
                <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <TrendingUp size={11} className="text-blue-400" />
                  Sorted by skill match · <span className="text-emerald-400">■</span> you have · <span className="text-slate-500">■</span> doesn't have
                </span>
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
                candidates.map(candidate => {
                  const teamSkills = (team?.requiredSkills || []).map(s => s.trim().toLowerCase());
                  const candSkills = (candidate.skills || []).map(s => s.trim().toLowerCase());
                  const matchedSkills = teamSkills.filter(s => candSkills.includes(s));

                  return (
                    <div key={candidate._id} className="bg-slate-800/50 border border-slate-800 p-3 rounded-xl flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 flex-wrap">
                          {candidate.name}
                          <span className="text-[9px] font-semibold bg-blue-950/80 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded">
                            Student
                          </span>
                          {candidate.matchScore !== undefined && <CandidateMatchBadge score={candidate.matchScore} />}
                        </div>
                        <div className="text-[11px] text-slate-400">{candidate.email}</div>

                        {/* Skills with match highlighting */}
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {candidate.skills.map((s, idx) => {
                              const isMatch = teamSkills.includes(s.trim().toLowerCase());
                              return (
                                <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 font-medium ${isMatch
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}>
                                  {isMatch && <Check size={8} />}{s}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {teamSkills.length > 0 && matchedSkills.length > 0 && (
                          <div className="text-[10px] text-emerald-400 mt-1">
                            ✓ Matches {matchedSkills.length}/{teamSkills.length} required skills
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleSendInvite(candidate._id)}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Send size={12} /> Invite
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}