// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  bookedBy: {
    type: String,
    required: true,
    trim: true
  },
  timing: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9] - ([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time range (use format "HH:MM - HH:MM")`
    }
  },
  event: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['Birthday Party', 'Team Meeting', 'Workshop', 'Sports Event', 'Music Session', 'Other'],
    default: 'Other'
  },
  contact: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address`
    }
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster date-based queries
bookingSchema.index({ date: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;