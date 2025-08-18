const mongoose = require('mongoose');
const { Schema } = mongoose;

const DevOptionsSchema = new Schema({
  // Reference to the user who owns these settings
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Theme Settings
  theme: {
    selectedTheme: {
      type: String,
      enum: ['Light', 'Dark', 'System', 'Neomorphism', 'Glassmorphism', 'Noa'],
      default: 'System'
    },
    customColors: {
        primary: { type: String, default: '#6a5acd' },
        secondary: { type: String, default: '#9370db' }
      }
  },

  // Layout Settings
  layout: {
    menuStyle: {
      type: String,
      enum: ['mobile', 'desktop', 'list'],
      default: 'desktop'
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    draggableMenu: {
      type: Boolean,
      default: false
    }
  },

  // Order Settings
  orderSettings: {
    acceptingMode: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online'
    },
    mealOrderTypes: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      default: 'lunch'
    }
  },

  // Language Settings
  languageSettings: {
    applicationLanguage: {
      type: String,
      default: 'en'
    },
    autoDetectLanguage: {
      type: Boolean,
      default: true
    },
    translateMenuItems: {
      type: Boolean,
      default: false
    }
  },

  // View Mode
  viewMode: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },

  // Developer Tools
  developerTools: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    apiLogging: {
      type: Boolean,
      default: false
    },
    reduxDebugger: {
      type: Boolean,
      default: false
    },
    performanceLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },

  // Notification Preferences
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    soundEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update the updatedAt field before saving
DevOptionsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const DevOptions = mongoose.model('DevOptions', DevOptionsSchema);

module.exports = DevOptions;
