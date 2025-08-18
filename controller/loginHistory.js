const LoginHistory = require('../models/loginHistory');
const { sendError } = require('../utils/helper');

// Get all login history with pagination
exports.getAllLoginHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [loginHistory, total] = await Promise.all([
      LoginHistory.find()
        .sort({ loginAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email name'),
      LoginHistory.countDocuments()
    ]);

    res.json({
      success: true,
      data: loginHistory,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    return sendError(res, 'Failed to fetch login history', 500);
  }
};

// Get login history for a specific user
exports.getUserLoginHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [loginHistory, total] = await Promise.all([
      LoginHistory.find({ userId })
        .sort({ loginAt: -1 })
        .skip(skip)
        .limit(limit),
      LoginHistory.countDocuments({ userId })
    ]);

    res.json({
      success: true,
      data: loginHistory,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user login history:', error);
    return sendError(res, 'Failed to fetch user login history', 500);
  }
};

// Delete a specific login history entry
exports.deleteLoginHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedHistory = await LoginHistory.findByIdAndDelete(id);
    if (!deletedHistory) {
      return sendError(res, 'Login history not found', 404);
    }

    res.json({
      success: true,
      message: 'Login history deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting login history:', error);
    return sendError(res, 'Failed to delete login history', 500);
  }
};

// Delete all login history
exports.deleteAllLoginHistory = async (req, res) => {
  try {
    await LoginHistory.deleteMany({});
    
    res.json({
      success: true,
      message: 'All login history deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting all login history:', error);
    return sendError(res, 'Failed to delete all login history', 500);
  }
};

// Get active sessions
exports.getActiveSessions = async (req, res) => {
  try {
    const activeSessions = await LoginHistory.find({ isActive: true })
      .sort({ loginAt: -1 })
      .populate('userId', 'username email name');

    res.json({
      success: true,
      data: activeSessions
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return sendError(res, 'Failed to fetch active sessions', 500);
  }
};

// Get failed login attempts
exports.getFailedAttempts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [failedAttempts, total] = await Promise.all([
      LoginHistory.find({ loginStatus: 'failed' })
        .sort({ loginAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email name'),
      LoginHistory.countDocuments({ loginStatus: 'failed' })
    ]);

    res.json({
      success: true,
      data: failedAttempts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching failed attempts:', error);
    return sendError(res, 'Failed to fetch failed login attempts', 500);
  }
}; 