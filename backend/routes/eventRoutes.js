const express = require('express');
const router = express.Router();
const {
  createEvent,
  getMyEvents,
  getActiveEvents,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const protect = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getActiveEvents);
router.get('/my', authorize('organisation'), getMyEvents);
router.post('/', authorize('organisation'), createEvent);
router.put('/:id', authorize('organisation'), updateEvent);
router.delete('/:id', authorize('organisation'), deleteEvent);

module.exports = router;
