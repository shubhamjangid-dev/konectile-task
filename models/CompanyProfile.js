const mongoose = require('mongoose');

const CompanyProfileSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
  }, 
  contact: {
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
  about: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  logoUrl: {
    type: String,
    trim: true,
  },
  socialLinks: {
    facebook: {
      type: String,
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
    },
    instagram: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
  },       
}, { timestamps: true }); 

 
// Create the Mongoose model
const CompanyProfile = mongoose.model('CompanyProfile', CompanyProfileSchema);

 
module.exports = CompanyProfile;
 