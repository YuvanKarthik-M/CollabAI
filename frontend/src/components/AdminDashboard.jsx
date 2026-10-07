import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAdminStats, 
  getAdminTeams, deleteAdminTeam,
  getAdminOrganisations, deleteAdminOrganisation,
  getAdminEvents, toggleSuspendEvent, deleteAdminEvent
} from '../services/api';
import { 
  UsersRound, Building2, Calendar, ShieldCheck, 
  Search, Trash2, RefreshCw, AlertTriangle, CheckCircle, Ban
} from 'lucide-react';

export default function AdminDashboard({ currentUser }) {
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'organisations' | 'events'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Teams State
  const [teams, setTeams] = useState([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(false);

  // Organisations State
  const [organisations, setOrganisations] = useState([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Events State
  const [events, setEvents] = useState([]);
  const [eventSearch, setEventSearch] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Alerts and Modals
  const [alert, setAlert] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'team'|'org'|'event', item: {} }

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await getAdminStats();
      setStats(res.data);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to fetch admin stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Teams
  const fetchTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);
      const res = await getAdminTeams(teamSearch);
      setTeams(res.data);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to fetch teams');
    } finally {
      setLoadingTeams(false);
    }
  }, [teamSearch]);

  // Fetch Organisations
  const fetchOrganisations = useCallback(async () => {
    try {
      setLoadingOrgs(true);
      const res = await getAdminOrganisations(orgSearch);
      setOrganisations(res.data);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to fetch organisations');
    } finally {
      setLoadingOrgs(false);
    }
  }, [orgSearch]);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await getAdminEvents(eventSearch);
      setEvents(res.data);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoadingEvents(false);
    }
  }, [eventSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'teams') fetchTeams();
    if (activeTab === 'organisations') fetchOrganisations();
    if (activeTab === 'events') fetchEvents();
  }, [activeTab, fetchTeams, fetchOrganisations, fetchEvents]);

  // Handle Deletion confirmation
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'team') {
        await deleteAdminTeam(itemToDelete.item._id);
        showAlert('success', `Team "${itemToDelete.item.name}" removed successfully`);
        fetchTeams();
      } else if (itemToDelete.type === 'org') {
        await deleteAdminOrganisation(itemToDelete.item._id);
        showAlert('success', `Organisation "${itemToDelete.item.name}" removed successfully`);
        fetchOrganisations();
      } else if (itemToDelete.type === 'event') {
        await deleteAdminEvent(itemToDelete.item._id);
        showAlert('success', `Event "${itemToDelete.item.title}" deleted successfully`);
        fetchEvents();
      }
      fetchStats();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to perform delete action');
    } finally {
      setItemToDelete(null);
    }
  };

  // Toggle Suspend Event
  const handleToggleSuspend = async (event) => {
    try {
      await toggleSuspendEvent(event._id);
      showAlert('success', `Event "${event.title}" is now ${event.status === 'suspended' ? 'active' : 'suspended'}`);
      fetchEvents();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to toggle event suspend status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <ShieldCheck size={14} /> System Administrator
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Centralized platform oversight: moderate teams, organizations, and events.
          </p>
        </div>

        <button
          onClick={() => { fetchStats(); if (activeTab === 'teams') fetchTeams(); if (activeTab === 'organisations') fetchOrganisations(); if (activeTab === 'events') fetchEvents(); }}
          className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loadingStats ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Alert Notification Toast */}
      {alert && (
        <div className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-between transition-all ${
          alert.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' 
            : 'bg-red-950/60 border-red-800/80 text-red-300'
        }`}>
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1">✕</button>
        </div>
      )}

      {/* 3 Primary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Teams */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Teams</p>
              <h3 className="text-4xl font-black text-white mt-1">
                {loadingStats ? '...' : stats?.totalTeams || 0}
              </h3>
            </div>
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
              <UsersRound size={26} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Platform student collaboration teams</p>
        </div>

        {/* Total Organisations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Organisations</p>
              <h3 className="text-4xl font-black text-white mt-1">
                {loadingStats ? '...' : stats?.totalOrganisations || 0}
              </h3>
            </div>
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Building2 size={26} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Registered event hosts and organizations</p>
        </div>

        {/* Total Events */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Events</p>
              <h3 className="text-4xl font-black text-white mt-1">
                {loadingStats ? '...' : stats?.totalEvents || 0}
              </h3>
            </div>
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <Calendar size={26} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Hackathons, workshops and challenges</p>
        </div>

      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-3.5 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'teams'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UsersRound size={18} /> Teams ({teams.length})
        </button>

        <button
          onClick={() => setActiveTab('organisations')}
          className={`pb-3.5 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'organisations'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 size={18} /> Organisations ({organisations.length})
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3.5 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar size={18} /> Events ({events.length})
        </button>
      </div>

      {/* TAB 1: TEAMS MANAGEMENT */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search team by name or event..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="w-full max-w-md pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    <th className="py-3.5 px-6">Team Name</th>
                    <th className="py-3.5 px-4">Event</th>
                    <th className="py-3.5 px-4">Leader / Creator</th>
                    <th className="py-3.5 px-4">Members</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {loadingTeams ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto text-indigo-500 mb-2" />
                        Loading teams...
                      </td>
                    </tr>
                  ) : teams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No teams found.
                      </td>
                    </tr>
                  ) : (
                    teams.map((t) => (
                      <tr key={t._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-100">{t.name}</td>
                        <td className="py-4 px-4 text-blue-400 font-medium">{t.eventName || 'General Project'}</td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-200">{t.creator?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-slate-400">{t.creator?.email || ''}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                            {t.members?.length || 0} Member(s)
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setItemToDelete({ type: 'team', item: t })}
                            className="px-3 py-1.5 bg-red-950/60 border border-red-800/80 hover:bg-red-900 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} /> Remove Team
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANISATIONS MANAGEMENT */}
      {activeTab === 'organisations' && (
        <div className="space-y-6">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search organisation by name or email..."
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              className="w-full max-w-md pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    <th className="py-3.5 px-6">Organisation Name</th>
                    <th className="py-3.5 px-4">Contact Email</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {loadingOrgs ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto text-indigo-500 mb-2" />
                        Loading organisations...
                      </td>
                    </tr>
                  ) : organisations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        No registered organisations found.
                      </td>
                    </tr>
                  ) : (
                    organisations.map((org) => (
                      <tr key={org._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-100 flex items-center gap-2">
                          <Building2 size={16} className="text-emerald-400" /> {org.name}
                        </td>
                        <td className="py-4 px-4 text-slate-300">{org.email}</td>
                        <td className="py-4 px-4 text-slate-400">
                          {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setItemToDelete({ type: 'org', item: org })}
                            className="px-3 py-1.5 bg-red-950/60 border border-red-800/80 hover:bg-red-900 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} /> Remove Organisation
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENTS MANAGEMENT */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search events by title or category..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="w-full max-w-md pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    <th className="py-3.5 px-6">Event Title</th>
                    <th className="py-3.5 px-4">Host Organisation</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {loadingEvents ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto text-indigo-500 mb-2" />
                        Loading events...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        No events found.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr key={ev._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-100">{ev.title}</div>
                          <div className="text-[11px] text-slate-400">{ev.category || 'Hackathon'}</div>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {ev.organisation?.name || 'Unknown Organisation'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            ev.status === 'suspended'
                              ? 'bg-amber-950 text-amber-400 border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          }`}>
                            {ev.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleToggleSuspend(ev)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              ev.status === 'suspended'
                                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                                : 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900'
                            }`}
                          >
                            {ev.status === 'suspended' ? 'Activate Event' : 'Suspend Event'}
                          </button>

                          <button
                            onClick={() => setItemToDelete({ type: 'event', item: ev })}
                            className="px-3 py-1.5 bg-red-950/60 border border-red-800/80 hover:bg-red-900 text-red-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Delete Event
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} /> Confirm Removal
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove {itemToDelete.type}: <span className="font-bold text-white">
                {itemToDelete.item.name || itemToDelete.item.title}
              </span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Delete / Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
