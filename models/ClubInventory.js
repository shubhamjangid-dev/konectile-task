const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
    {
      ItemCode: {
        type: Number,
        required: true,
        unique: true,
      },
      ItemGroup: {
        type: Number,
        required: true,
      },
      ItemSubGroup: {
        type: Number,
        required: true,
      },
      ItemName: {
        type: String,
        required: true,
      },
      ItemUnit: {
        type: Number,
        required: false,
      },
      UnitQty: {
        type: Number,
        required: false,
        min: 0,
      },
      Rate: {
        type: Number,
        required: true,
        min: 0,
      },
      IssueUnit: {
        type: Number,
        required: false,
      },
      IssueUnitqty: {
        type: Number,
        required: false,
        min: 0,
      },
      IssueRate: {
        type: Number,
        required: true,
        min: 0,
      },
      capacity: {
        type: Number,
        default: 0,
      },
      Saletaxcode: {
        type: String,
        required: false,
      },
      PartySaleRate: {
        type: Number,
        default: 0,
      },
      gstPercentage: {
        type: Number,
        default: 0,
      },
      isgstapplicable: {
        type: Boolean,
        default: false,
      },
      hsnid: {
        type: String,
        required: false,
      },
      ItemAliasCode: {
        type: String,
        required: false,
      },
      tally_acc_saleid: {
        type: String,
        required: false,
      },
      tally_acc_purchaseid: {
        type: String,
        required: false,
      },
    },
    {
      timestamps: true,
    }
  );

// Middleware to update ModificationDate before saving
inventorySchema.pre("save", function (next) {
  this.ModificationDate = Date.now();
  next();
});

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;