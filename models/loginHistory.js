const mongoose = require('mongoose');

const LoginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'MemberProfile']
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  deviceInfo: {
    type: {
      browser: String,
      os: String,
      device: String
    },
    required: true
  },
  macAddress: {
    type: String,
    required: false
  },
  location: {
    type: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String
    },
    required: false
  },
  loginStatus: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  loginAt: {
    type: Date,
    default: Date.now
  },
  logoutAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes for better query performance
LoginHistorySchema.index({ userId: 1, sessionId: 1 });
LoginHistorySchema.index({ loginAt: -1 });
LoginHistorySchema.index({ isActive: 1 });

module.exports = mongoose.model('LoginHistory', LoginHistorySchema); 