import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Automatically attach JWT token to headers if user is logged in
API.interceptors.request.use((req) => {
  const profile = localStorage.getItem('profile');
  if (profile) {
    req.headers.Authorization = `Bearer ${JSON.parse(profile).token}`;
  }
  return req;
});

// Auth Endpoints
export const loginUser = (formData) => API.post('/auth/login', formData);
export const registerUser = (formData) => API.post('/auth/register', formData);

// User Profile
export const updateProfile = async (userData) => {
  return await API.put('/users/profile', userData);
};

// Admin Endpoints
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminTeams = (search = '') => API.get(`/admin/teams?search=${encodeURIComponent(search)}`);
export const deleteAdminTeam = (teamId) => API.delete(`/admin/teams/${teamId}`);
export const getAdminOrganisations = (search = '') => API.get(`/admin/organisations?search=${encodeURIComponent(search)}`);
export const deleteAdminOrganisation = (orgId) => API.delete(`/admin/organisations/${orgId}`);
export const getAdminEvents = (search = '') => API.get(`/admin/events?search=${encodeURIComponent(search)}`);
export const toggleSuspendEvent = (eventId) => API.put(`/admin/events/${eventId}/suspend`);
export const deleteAdminEvent = (eventId) => API.delete(`/admin/events/${eventId}`);

// Organisation Events Endpoints
export const createOrgEvent = (eventData) => API.post('/events', eventData);
export const getMyOrgEvents = () => API.get('/events/my');
export const getActiveEvents = () => API.get('/events');
export const updateOrgEvent = (eventId, eventData) => API.put(`/events/${eventId}`, eventData);
export const deleteOrgEvent = (eventId) => API.delete(`/events/${eventId}`);