const mongoose = require('mongoose');

// Define the Event schema
const eventSchema = new mongoose.Schema({
  EventPoster: {
    type: String,
    required: false,
  },
  EventName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  EventDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  EventDate: {
    type: Date,
    required: true,
  },
  EventTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // HH:MM format
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`
    }
  },
  EventVenues: {
    type: String,
    required: false,
    trim: true,
  },
  LinkToRegister: {
    type: String,
    required: false,
    trim: true,
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL`
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active', 
  },
}, {
  timestamps: true,
});

// Add a method to check and update status
eventSchema.methods.updateStatus = function() {
  const eventDateTime = new Date(`${this.EventDate.toISOString().split('T')[0]}T${this.EventTime}`);
  this.status = eventDateTime < new Date() ? 'inactive' : 'active';
  return this.save();
};

// Pre-save hook to update status
eventSchema.pre('save', function(next) {
  const eventDateTime = new Date(`${this.EventDate.toISOString().split('T')[0]}T${this.EventTime}`);
  this.status = eventDateTime < new Date() ? 'inactive' : 'active';
  next();
});

// Create the Event model
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;