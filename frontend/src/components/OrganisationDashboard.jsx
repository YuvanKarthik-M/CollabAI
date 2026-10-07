import React, { useState, useEffect, useCallback } from 'react';
import { 
  createOrgEvent, getMyOrgEvents, updateOrgEvent, deleteOrgEvent 
} from '../services/api';
import { 
  Building2, Calendar, MapPin, Users, Globe, Plus, 
  Trash2, Edit, CheckCircle, Ban, RefreshCw, X, AlertCircle, Award
} from 'lucide-react';

export default function OrganisationDashboard({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Hackathon',
    eventDate: '',
    venue: '',
    mode: 'online',
    type: 'team',
    maxTeamSize: 4,
    eligibility: 'Open for all students'
  });
  const [submitting, setSubmitting] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchMyEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyOrgEvents();
      setEvents(res.data);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to fetch organisation events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Hackathon',
      eventDate: '',
      venue: '',
      mode: 'online',
      type: 'team',
      maxTeamSize: 4,
      eligibility: 'Open for all students'
    });
    setEditingEvent(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (ev) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title || '',
      description: ev.description || '',
      category: ev.category || 'Hackathon',
      eventDate: ev.eventDate || '',
      venue: ev.venue || '',
      mode: ev.mode || 'online',
      type: ev.type || 'team',
      maxTeamSize: ev.maxTeamSize || 4,
      eligibility: ev.eligibility || 'Open for all students'
    });
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingEvent) {
        await updateOrgEvent(editingEvent._id, formData);
        showAlert('success', `Event "${formData.title}" updated successfully`);
      } else {
        await createOrgEvent(formData);
        showAlert('success', `New Event "${formData.title}" published successfully`);
      }
      setShowModal(false);
      resetForm();
      fetchMyEvents();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await deleteOrgEvent(eventToDelete._id);
      showAlert('success', `Event "${eventToDelete.title}" deleted successfully`);
      setEventToDelete(null);
      fetchMyEvents();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete event');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Organisation Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">{currentUser.name}</h1>
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <Building2 size={14} /> Organization Portal
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Host & manage hackathons, competitions, and technical events for student collaboration teams.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          <Plus size={16} /> Create New Event
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Hosted Events</p>
              <h3 className="text-3xl font-black text-white mt-1">{events.length}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Active Events</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {events.filter(e => e.status === 'active').length}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Suspended Events</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {events.filter(e => e.status === 'suspended').length}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
              <Ban size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Award className="text-emerald-500" size={20} /> My Published Events ({events.length})
          </h2>

          <button
            onClick={fetchMyEvents}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto text-emerald-500 mb-2" />
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
            <Calendar size={36} className="mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No Events Published Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first event, hackathon, or competition so student teams can discover and select it!
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
            >
              + Create Event Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((ev) => (
              <div 
                key={ev._id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between relative overflow-hidden"
              >
                {/* Event Status Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  ev.status === 'suspended' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        {ev.category || 'Hackathon'}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1.5">{ev.title}</h3>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      ev.status === 'suspended'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}>
                      {ev.status === 'suspended' ? 'Suspended by Admin' : 'Active'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {ev.description}
                  </p>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                      <Calendar size={14} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{ev.eventDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                      <MapPin size={14} className="text-blue-400 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                      <Globe size={14} className="text-purple-400 shrink-0" />
                      <span className="capitalize">{ev.mode}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/60 p-2 rounded-xl border border-slate-800">
                      <Users size={14} className="text-amber-400 shrink-0" />
                      <span>{ev.type === 'team' ? `Team (Max ${ev.maxTeamSize})` : 'Individual'}</span>
                    </div>
                  </div>

                  {/* Eligibility */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">Eligibility:</span> {ev.eligibility}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(ev)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit size={14} /> Edit
                  </button>

                  <button
                    onClick={() => setEventToDelete(ev)}
                    className="px-3 py-1.5 bg-red-950/60 border border-red-800/80 hover:bg-red-900 text-red-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="text-emerald-500" size={20} />
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Event Title */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. National AI Hackathon 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Event Description *
                </label>
                <textarea
                  placeholder="Provide detailed information about problem statements, timeline, and guidelines..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Row 2: Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Coding Contest">Coding Contest</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Paper Presentation">Paper Presentation</option>
                    <option value="Project Expo">Project Expo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oct 25, 2026 or 2026-10-25"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Row 3: Venue & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Venue / Link *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Auditorium / Zoom Link"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Event Mode
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Participation Type & Max Team Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Participation Format
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="team">Team Participation</option>
                    <option value="individual">Individual Participation</option>
                  </select>
                </div>

                {formData.type === 'team' && (
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Max Team Size
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={10}
                      value={formData.maxTeamSize}
                      onChange={(e) => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) || 4 })}
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Eligibility Description */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Eligibility Description
                </label>
                <textarea
                  placeholder="e.g. Open to all registered undergraduate CS / IT students..."
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Publish Event'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
              <AlertCircle size={20} /> Confirm Event Deletion
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete event <span className="font-bold text-white">{eventToDelete.title}</span>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
