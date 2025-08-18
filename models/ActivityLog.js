// models/ActivityLog.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const activityLogSchema = new Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete']
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    type: Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '30d' } // Auto delete after 30 days
  }
});

// Add compound index for better query performance
activityLogSchema.index({ transactionId: 1, action: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;