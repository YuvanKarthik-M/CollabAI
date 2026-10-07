const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllTeams,
  deleteTeam,
  getAllOrganisations,
  deleteOrganisation,
  getAllEvents,
  toggleSuspendEvent,
  deleteEvent
} = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);

// Teams routes
router.get('/teams', getAllTeams);
router.delete('/teams/:id', deleteTeam);

// Organisations routes
router.get('/organisations', getAllOrganisations);
router.delete('/organisations/:id', deleteOrganisation);

// Events routes
router.get('/events', getAllEvents);
router.put('/events/:id/suspend', toggleSuspendEvent);
router.delete('/events/:id', deleteEvent);

module.exports = router;
