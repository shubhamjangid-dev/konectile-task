const mongoose = require('mongoose');
const argon2 = require('argon2');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
  }, 
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true,
  }, 
  password: { 
    type: String, 
    required: true 
  }, 
  roles: { 
    type: String, 
    enum: ['superadmin', 'admin', 'editor', 'cashier'], 
    required: true,
    default:'cashier'
  }, 
  phoneNumber: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true, 
    lowercase: true,
  },
  permissions: {
    type: [String],
    default: function () {
      switch (this.roles) {
        case "superadmin":
          return ["read", "write", "update", "delete"];
        case "admin":
          return ["read", "write", "update"];
        case "editor":
          return ["read", "update"];
        case "cashier":
          return ["read", "write"];
        default:
          return [];
      }
    },
  },
  allowed_device_fingerprint: { 
    type: String, 
    required: function() { return this.roles === 'superadmin'; } 
  }, 
  allowed_latitude: { 
    type: Number, 
    required: function() { return this.roles === 'superadmin'; } 
  }, 
  allowed_longitude: { 
    type: Number, 
    required: function() { return this.roles === 'superadmin'; } 
  }, 
  session_id: { 
    type: String 
  }, 
}, { timestamps: true }); 


UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); 
 
  try {
    // Hash the password using Argon2
    this.password = await argon2.hash(this.password);
    next();
  } catch (error) {
    next(error);
  }
});
 
// Create the Mongoose model
const User = mongoose.model('User', UserSchema);

 
module.exports = User;
 