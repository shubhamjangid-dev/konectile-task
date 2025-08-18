const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Transaction schema
const TransactionSchema = new Schema({
  MemberID: { type: String, required: true }, 
  Month: { type: String, required: true }, 
  FromDate: { type: Date, required: true }, 
  ToDate: { type: Date, required: true }, 
  TransactionList: [{
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    items: [{
      itemCode: { type: String, required: true },
      itemName: { type: String, required: true },
      itemGroup : { type: Number, required: false },
      qty: { type: Number, required: true },
      amount: { type: Number, required: true },
      gstPercentage: { type: Number, required: true },
      purchaseRate: { type: Number, required: true },
    }],
    Timestamp: { type: Date, default: Date.now },
  }],
  Timestamp: { type: Date, default: Date.now }, 
});

// Create the Mongoose model
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;