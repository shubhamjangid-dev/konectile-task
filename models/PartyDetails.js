const mongoose = require('mongoose');

const partyDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  gstNo: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('PartyDetails', partyDetailsSchema);