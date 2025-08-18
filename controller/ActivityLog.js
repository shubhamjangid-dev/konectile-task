// controllers/activityLogController.js
const ActivityLog = require('../models/ActivityLog');
const { default: mongoose } = require('mongoose');
const User = require('../models/user');

// Record a new activity
exports.recordActivity = async (action, invoiceNumber, user, changes = null) => {
  try {
    const activity = new ActivityLog({
      action,
      invoiceNumber,
      performedBy: user._id,
      changes
    });
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error recording activity:', error);
    throw error;
  }
};

// Get all activity logs (with pagination)
exports.getAllActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      // .limit(limit)
      .populate('performedBy', 'name email')
      .populate('invoiceNumber', 'invoiceNumber totalAmount');

    const total = await ActivityLog.countDocuments();

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get activities for a specific transaction
exports.getTransactionActivities = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.transactionId)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
    }

    const activities = await ActivityLog.find({ 
      transactionId: req.params.transactionId 
    })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'name email');

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching transaction activities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Clear all activity logs (admin only)
exports.clearAllActivities = async (req, res) => {

  try {
    const {userInfo} = req.body;
    if (!userInfo || !userInfo.roles) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const isUserExist = await User.findById(userInfo.id);
    if (!isUserExist) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the user is a superadmin
    if (isUserExist.roles !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Unauthorized user' });
    }

    await ActivityLog.deleteMany({});
    res.json({ success: true, message: 'All activity logs cleared' });
  } catch (error) {
    console.error('Error clearing activities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// get single activity log

exports.getLatestActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name email')
      .populate('invoiceNumber', 'invoiceNumber totalAmount');

    const total = await ActivityLog.countDocuments();

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};