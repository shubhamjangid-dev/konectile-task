const mongoose = require('mongoose');
const { Schema } = mongoose;

const RenderPaymentSchema = new Schema(
  {
    paymentUrl: {
      type: String,
      required: true,
      unique: true
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    lastPaymentDate: {
      type: Date,
      default: null
    },
    nextDueDate: {
      type: Date,
      required: true,
      default: () => {
        const now = new Date();
        // Set to 28th of current month if not past, else 28th of next month
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 28);
        return now.getDate() > 28 ? 
          new Date(now.getFullYear(), now.getMonth() + 1, 28) : 
          dueDate;
      }
    },
    paymentHistory: [{
      date: Date,
      amount: Number,
      transactionId: String
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for days until due
RenderPaymentSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const dueDate = this.nextDueDate;
  return Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
});

// Virtual for payment status
RenderPaymentSchema.virtual('paymentStatus').get(function() {
  if (this.isPaid) return 'paid';
  const now = new Date();
  return now > this.nextDueDate ? 'overdue' : 'pending';
});

// Pre-save hook to update nextDueDate when payment is made
RenderPaymentSchema.pre('save', function(next) {
  if (this.isModified('isPaid') && this.isPaid) {
    this.lastPaymentDate = new Date();
    
    // Set next due date to 28th of next month
    const now = new Date();
    let nextMonth = now.getMonth() + 1;
    let year = now.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      year++;
    }
    this.nextDueDate = new Date(year, nextMonth, 28);
  }
  next();
});

const RenderPayment = mongoose.model('RenderPayment', RenderPaymentSchema);

module.exports = RenderPayment;