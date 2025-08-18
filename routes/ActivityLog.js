// routes/activityLogRoutes.js
const express = require('express');
const router = express.Router();
const activityLogController = require('../controller/ActivityLog');
const { isAuth } = require('../middleware/userAuth');

// Get all activity logs (admin sees all, others see their own)
router.get('/', activityLogController.getAllActivities);
router.get('/latest', activityLogController.getLatestActivity);

// Get activities for a specific transaction
router.get('/transaction/:transactionId', activityLogController.getTransactionActivities);

// Clear all activity logs (superadmin only)
router.delete('/', activityLogController.clearAllActivities);

module.exports = router;