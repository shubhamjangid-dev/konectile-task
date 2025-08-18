const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/userAuth');
const {
  getAllLoginHistory,
  getUserLoginHistory,
  deleteLoginHistory,
  deleteAllLoginHistory,
  getActiveSessions,
  getFailedAttempts
} = require('../controller/loginHistory');

// Get all login history (paginated)
router.get('/all', isAuth, getAllLoginHistory);

// Get login history for a specific user
router.get('/user/:userId', getUserLoginHistory);

// Get active sessions
router.get('/active-sessions', isAuth, getActiveSessions);

// Get failed login attempts
router.get('/failed-attempts', isAuth, getFailedAttempts);

// Delete a specific login history entry
router.delete('/:id', isAuth, deleteLoginHistory);

// Delete all login history
router.delete('/all', isAuth, deleteAllLoginHistory);

module.exports = router; 