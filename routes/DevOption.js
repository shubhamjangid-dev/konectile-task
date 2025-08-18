// routes/devOptionsRoutes.js
const express = require('express');
const router = express.Router();
const devOptionsController = require('../controller/DevOption');

// Get current options
router.get('/:userId/', devOptionsController.getDevOptions);

// Update options
router.put('/:userId', devOptionsController.updateDevOptions);

// Reset to defaults
router.delete('/reset', devOptionsController.resetDevOptions);

module.exports = router;