const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const InvoiceCounter = mongoose.model('InvoiceCounter', invoiceCounterSchema);

module.exports = InvoiceCounter; 