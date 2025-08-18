const { default: mongoose } = require("mongoose");
const Inventory = require("../models/ClubInventory"); // Import the Inventory model

// 1. Insert a single inventory item
const insertSingleInventory = async (req, res) => {
  try {
    const itemData = req.body; // Get data from the request body
    const newItem = new Inventory(itemData);
    const savedItem = await newItem.save();
    res.status(201).json({
      success: true,
      message: "Single inventory item inserted successfully",
      data: savedItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error inserting single inventory item",
      error: error.message,
    });
  }
};

// 2. Insert bulk inventory items

const insertBulkInventory = async (req, res) => {

  console.log(req.body);
  try {
    // 1. Validate input is an array
    if (!Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Please send an array of inventory items",
        error: "Expected array but got something else"
      });
    }

    // 2. Prepare error tracking
    const errors = [];
    const successfulItems = [];
    const duplicateItems = [];

    // 3. Process each item with clear numbering
    for (let i = 0; i < req.body.length; i++) {
      const item = req.body[i];
      const itemNumber = i + 1; // Show 1-based index to users
      const itemErrors = [];

      // Required field checks
      if (!item.ItemCode) itemErrors.push("Missing Item Code (required)");
      if (!item.ItemName) itemErrors.push("Missing Item Name (required)");
      if (item.Rate === undefined) itemErrors.push("Missing Rate (required)");
      if (item.IssueRate === undefined) itemErrors.push("Missing Issue Rate (required)");

      // Numeric validation
      if (item.Rate < 0) itemErrors.push("Rate cannot be negative");
      if (item.IssueRate < 0) itemErrors.push("Issue Rate cannot be negative");
      if (item.UnitQty < 0) itemErrors.push("Unit Quantity cannot be negative");

      // If any errors, add to errors list
      if (itemErrors.length > 0) {
        errors.push({
          itemNumber,
          itemCode: item.ItemCode || 'Not provided',
          errors: itemErrors
        });
        continue;
      }

      // Prepare valid item for insertion
      const inventoryItem = {
        ...item,
        createdAt: new Date(),
        createdBy: req.user?.id || 'system'
      };

      // Try to save each item individually for precise error reporting
      try {
        const savedItem = await Inventory.create(inventoryItem);
        successfulItems.push({
          itemNumber,
          itemCode: savedItem.ItemCode,
          _id: savedItem._id
        });
      } catch (saveError) {
        if (saveError.code === 11000) { // Duplicate key error
          duplicateItems.push({
            itemNumber,
            itemCode: inventoryItem.ItemCode,
            error: "Duplicate Item Code - already exists"
          });
        } else {
          errors.push({
            itemNumber,
            itemCode: inventoryItem.ItemCode,
            errors: [`Database error: ${saveError.message}`]
          });
        }
      }
    }

    // 4. Prepare the response
    const result = {
      success: true,
      totalItems: req.body.length,
      succeeded: successfulItems.length,
      failed: errors.length + duplicateItems.length,
      details: {
        successfulItems,
        validationErrors: errors,
        duplicateItems
      }
    };

    // 5. Different HTTP statuses based on results
    if (errors.length + duplicateItems.length === 0) {
      return res.status(201).json(result);
    }
    if (successfulItems.length === 0) {
      return res.status(400).json({
        ...result,
        success: false,
        message: "All items failed to process"
      });
    }
    return res.status(207).json({ // Multi-status
      ...result,
      message: "Some items failed to process"
    });

  } catch (error) {
    console.error('Bulk inventory error:', error);
    return res.status(500).json({
      success: false,
      message: "Server encountered an unexpected error",
      error: error.message
    });
  }
};



// 3. Delete an inventory item by ItemCode
const deleteInventoryItem = async (req, res) => {
  try {
    const { itemCode } = req.params; 
    const {roles} = req.body;

    if (!itemCode ) {
      return res.status(400).json({ 
        success: false,
        message: "ItemCode is required" 
      });
    }

    // Check admin privileges
    if (!roles || !roles.includes('admin')) {
      return res.status(403).json({ 
        success: false,
        message: "You are not authorized!." 
      });
    }


    const deletedItem = await Inventory.findOneAndDelete({ ItemCode: itemCode });
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
      data: deletedItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error deleting inventory item",
      error: error.message,
    });
  }
};

// 4. Update an inventory item by ItemCode
const updateInventoryItem = async (req, res) => {
  try {
    const { itemCode } = req.params;
    const updateData = req.body;
    const updatedItem = await Inventory.findOneAndUpdate(
      { ItemCode: itemCode },
      { $set: updateData },
      { new: true } 
    );

    console.log(updatedItem)
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating inventory item",
      error: error.message,
    });
  }
};

// 5. Fetch all inventory items
const fetchAllInventoryItems = async (req, res) => {
  try {
    const allItems = await Inventory.find({});
    res.status(200).json({
      success: true,
      message: "All inventory items fetched successfully",
      data: allItems,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error fetching all inventory items",
      error: error.message,
    });
  }
};

// 6. Fetch a single inventory item by ItemCode
const fetchSingleInventoryItem = async (req, res) => {
  try {
    const { itemCode } = req.params; // Get ItemCode from URL params
    const item = await Inventory.findOne({ ItemCode: itemCode });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Single inventory item fetched successfully",
      data: item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error fetching single inventory item",
      error: error.message,
    });
  }
};


const getNextItemCode = async (req, res) => {
  try {
    // Find the document with the highest ItemCode
    const lastItem = await Inventory.findOne()
      .sort({ ItemCode: -1 }) // Sort in descending order
      .select('ItemCode')      // Only select the ItemCode field
      .lean();                 // Return as plain JavaScript object

    let nextItemCode = 100; // Default starting value if no items exist

    if (lastItem && lastItem.ItemCode) {
      // Increment the highest ItemCode by 1
      nextItemCode = lastItem.ItemCode + 1;
    }

    res.status(200).json({
      success: true,
      message: 'Next available item code retrieved successfully',
      data: nextItemCode
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving next item code',
      error: error.message
    });
  }
};

module.exports = {
  insertSingleInventory,
  insertBulkInventory,
  deleteInventoryItem,
  updateInventoryItem,
  fetchAllInventoryItems,
  fetchSingleInventoryItem,
  getNextItemCode
};