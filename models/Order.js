const mongoose = require("mongoose");

// Define the order item schema
const orderItemSchema = new mongoose.Schema({
  issueRate: { type: Number, required: true }, 
  itemCode: { type: Number, required: true }, 
  itemName: { type: String, required: true }, 
  itemGroup : { type: Number, required: false },
  qty: { type: Number, required: true }, 
  gstPercentage: { type: Number, required: true },
  purchaseRate: { type: Number, required: true },
});

// Define the order schema
const orderSchema = new mongoose.Schema({

  MemberID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MemberProfile",
    required: true,
    autopopulate: true // If you're using mongoose-autopopulate
  },
  MemberName: {
    type: String,
    ref: "MemberProfile", // Reference to the MemberProfile collection
    required: true,
  },
  orderDate: {
    type: String, // Stored as a string in "DD/MM/YYYY" format
    required: true,
  },
  orderType:{
    type: String,
    enum: ["inRestaurant", "parcel"],
    required: true
  },
  deliveryLocation:{
    type: String,
    required:false
  },
  roomNo:{
    type: String,
    required:false
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"], // Allowed statuses
    default: "pending", // Default status is "pending"
  },
  order: [orderItemSchema], // Array of order items
});

// Create the Order model
const Order = mongoose.model("Order", orderSchema);

module.exports = Order;