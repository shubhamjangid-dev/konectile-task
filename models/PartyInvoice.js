const mongoose = require('mongoose');
const InvoiceCounter = require('./InvoiceCounter');

const venueRowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  session: { type: String},
  rental: { type: Number, default: 0 },
  acCharge: { type: Number, default: 0 },
  maintenance: { type: Number, default: 0 },
  security: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 }
});

const menuRowSchema = new mongoose.Schema({
  description: { type: String, required: true },
  qty: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  cgstPercent: { type: Number, default: 0 },
});


const partyInvoiceSchema = new mongoose.Schema({
  gstin: { type: String, default: '20AAEAN1606J1Z2' },
  invoiceNumber: { 
    type: String, 
    unique: true,
  },
  memberDetails: {
    name: { type: String, required: true },
    id: { type: String, required: true },
    address: { type: String, required: true },
    gstNo: { type: String, default: '' },
    natureOfFunction: { type: String, default: '' }
  },
  invoiceDetails: {
    bookingDate: { type: Date, default: Date.now },
    invoiceDate: { type: Date, default: Date.now },
    functionDate: { 
      type: Date, 
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    mobileNo: { type: String, default: '' },
    pax: { type: Number, default: 0 }
  },
  venueRows: [venueRowSchema],
  menuRows: [menuRowSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Calculate virtuals for totals
partyInvoiceSchema.virtual('venueTotalAmount').get(function() {
  return this.venueRows.reduce((sum, row) => {
    const subtotal = row.rental + row.acCharge + row.maintenance + row.security;
    const cgstAmount = subtotal * (row.cgst / 100);
    const sgstAmount = subtotal * (row.sgst / 100);
    return sum + subtotal + cgstAmount + sgstAmount;
  }, 0);
});

partyInvoiceSchema.virtual('menuTotalAmount').get(function() {
  return this.menuRows.reduce((sum, row) => {
    const subtotal = row.qty * row.rate;
    const sgstAmount = subtotal * (row.sgstPercent / 100);
    const cgstAmount = subtotal * (row.cgstPercent / 100);
    return sum + subtotal + sgstAmount + cgstAmount ;
  }, 0);
});

partyInvoiceSchema.virtual('totalInvoiceAmount').get(function() {
  return this.venueTotalAmount + this.menuTotalAmount;
});


partyInvoiceSchema.virtual('partyArrear').get(function() {
  return this.totalInvoiceAmount - this.totalReceivedAmount;
});

// Ensure virtuals are included when converting to JSON
partyInvoiceSchema.set('toJSON', { virtuals: true });
partyInvoiceSchema.set('toObject', { virtuals: true });

// Add pre-save middleware to generate invoice number
partyInvoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Get current date
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
      
      // Calculate financial year
      // If month is April or later, use current year as start of FY
      // Otherwise, use previous year as start of FY
      const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
      const fyEndYear = fyStartYear + 1;
      const financialYear = `${fyStartYear.toString().slice(-2)}/${fyEndYear.toString().slice(-2)}`;

      const counter = await InvoiceCounter.findByIdAndUpdate(
        { _id: 'invoiceId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      // Format invoice number with financial year (e.g., INV-NC/25/26-00001)
      this.invoiceNumber = `INV-NC/${financialYear}-${counter.seq.toString().padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  this.updatedAt = new Date();
  next();
});

const PartyInvoice = mongoose.model('PartyInvoice', partyInvoiceSchema);

module.exports = PartyInvoice;