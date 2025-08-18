const mongoose = require("mongoose");
const { Schema } = mongoose;
const argon2 = require("argon2");

// Define the TransactionList schema
const TransactionListSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    items: [
      {
        itemCode: { type: String, required: false },
        itemName: { type: String, required: true },
        itemGroup : { type: Number, required: false },
        qty: { type: Number, required: true },
        amount: { type: Number, required: true },
        gstPercentage: { type: Number, required: true },
        purchaseRate: { type: Number, required: false },
      },
    ],
  },
  { timestamps: true }
);

// Define the Transaction schema
const TransactionSchema = new Schema(
  {
    Month: { type: String, required: true },
    FromDate: { type: Date, required: true },
    ToDate: { type: Date, required: true },
    TransactionList: [TransactionListSchema],
  },
  { timestamps: true }
);

// Define the FamilyMember schema
const FamilyMemberSchema = new Schema({
  Name: {
    type: String,
    required: true,
    minlength: [2, "Name must be at least 2 characters long"],
  },
  Relation: {
    type: String,
    enum: ["son", "daughter", "wife", "husband"],
    required: true,
  },
});

// Define the MemberProfile schema
const MemberProfileSchema = new Schema({
  MemberID: {
    type: String,
    required: true,
    unique: true,
  },
  Name: { type: String, required: true },
  Pno: { type: String, required: false },
  Contact: { type: String, required: false },
  Email: {
    type: String,
    required: false,
    lowercase: true,
    set: (value) => (value ? value.toLowerCase() : value),
  },
  Password: { type: String, required: true },
  MembershipStatus: {
    type: String,
    enum: {
      values: ["active", "inactive"],
      message: "MembershipStatus must be either 'active' or 'inactive'",
    },
    default: "active",
  },
  MemberSince: { type: Date, default: Date.now },
  Transaction: { type: [TransactionSchema], default: [] },
  FamilyMember: { type: [FamilyMemberSchema], default: [] },
  Role: {
    type: String,
    required: true,
    default: "user",
    enum: {
      values: ["user", "viewer"],
      message: "Role must be either 'user' or 'viewer'",
    },
  },
  session_id: { type: String },
});

// Add indexes
MemberProfileSchema.index({ Email: 1 });
MemberProfileSchema.index({ Contact: 1 });

// Pre-save middleware to hash the password
MemberProfileSchema.pre("save", async function (next) {
  if (!this.isModified("Password")) return next();

  try {
    this.Password = await argon2.hash(this.Password);
    next();
  } catch (error) {
    next(new Error("Failed to hash password"));
  }
});

// Create the Mongoose model
const MemberProfile = mongoose.model("MemberProfile", MemberProfileSchema);

module.exports = MemberProfile;