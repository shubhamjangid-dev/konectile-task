const mongoose = require('mongoose');
const { Schema } = mongoose;

const biometricAuthSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: false,
  },
  biometricType: {
    type: String,
    required: true,
    enum: ['fingerprint', 'face']
  },
  biometricData: {
    type: String,
    required: true
  },
  deviceInfo: {
    deviceId: {
      type: String,
      required: true
    },
    browser: String,
    os: String,
    device: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for better query performance
biometricAuthSchema.index({ userId: 1, 'deviceInfo.deviceId': 1 });
biometricAuthSchema.index({ biometricType: 1 });
biometricAuthSchema.index({ isActive: 1 });

const BiometricAuth = mongoose.model('BiometricAuth', biometricAuthSchema);

module.exports = BiometricAuth; 