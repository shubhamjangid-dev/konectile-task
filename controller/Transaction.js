const { sendError } = require('../utils/helper');
const MemberProfile = require("../models/memberProfile");
const mongoose = require('mongoose');
const activityLogController = require('../controller/ActivityLog')

  // delete all transaction of a member - very critical 
  exports.deleteTransactionData = async (req, res) => {
    try {
      const {performedBy, memberId, transactionId } = req.params;
  
      const {roles} = req.body;
  
      console.log(memberId, transactionId);
  
  
      if(!performedBy || !memberId || !transactionId ) return sendError(res, 'memberID and transactionID is required')
  
      if (roles !== 'superadmin') return sendError(res, 'only admin can delete a member!')
  
      const member = await MemberProfile.findOne({ MemberID: memberId });
  
      console.log(member)
      if (!member) return sendError(res, "Member not found.")
  
      // Remove the transaction from the Transaction array
      member.Transaction = member.Transaction.filter(
        (transaction) => transaction._id.toString() !== transactionId
      );
  
      await member.save();

      await activityLogController.recordActivity(
            'delete', 
            member.Transaction, 
            {
              _id: performedBy.id,
              username: performedBy.username,
              role: performedBy.roles,
              name: performedBy.name, 
              
            }
          );
      res.status(200).json({ message: "Transaction deleted successfully.", member });
    } catch (error) {
      res.status(500).json({ error: "Server error while deleting transaction.", details: error.message });
    }
  };

//   update a whole transaction data
  exports.updateTransactionData = async (req, res) => {
    try {
      const { memberId, transactionId } = req.params;
      const updateData = req.body;
  
      // Check if the user is an admin or editor
      if (req.user.role !== admin && req.user.role !== editor) {
        return res.status(403).json({ error: "Only admin or editor can update transactions." });
      }
  
      // Find the member and update the transaction
      const member = await MemberProfile.findOne({ MemberID: memberId });
      if (!member) {
        return res.status(404).json({ error: "Member not found." });
      }
  
      // Find the transaction and update it
      const transaction = member.Transaction.id(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found." });
      }
  
      Object.assign(transaction, updateData);
      await member.save();

      await activityLogController.recordActivity(
            'update', 
            transaction.invoiceNumber, 
            {
              _id: "67de7f64bdda35f5c10d50b1",
              username: "ziacodes",
              role: "superadmin",
              name: "Syed Ziauddin",
              
            }
          );
  
      res.status(200).json({ message: "Transaction updated successfully.", member });
    } catch (error) {
      res.status(500).json({ error: "Server error while updating transaction.", details: error.message });
    }
  };
  
  
// update a transactionList of transaction
exports.updateTransactionInList = async (req, res) => {
  try {
    const { Pno } = req.params;
    const {performedBy, invoiceNumber, updateData, roles } = req.body;

    // Validate inputs
    if(!performedBy || !Pno){
      return sendError(res, 'Pno and performedBy are required');
    }

    if(!invoiceNumber || !updateData || !updateData.items ){
      return sendError(res, 'invoiceNumber and updateData with items are required');
    }

    // Check admin privileges
    if (!roles?.includes('admin')) {
      return res.status(403).json({ 
        success: false,
        message: "Only admin can update transactions" 
      });
    }

    // Find the member with the transaction
    const member = await MemberProfile.findOne({
      Pno,
      "Transaction.TransactionList.invoiceNumber": invoiceNumber
    });

    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: "Member or transaction not found" 
      });
    }

    // Find the exact transaction position
    let transactionPeriodIndex = -1;
    let transactionIndex = -1;

    member.Transaction.forEach((period, pIdx) => {
      period.TransactionList.forEach((transaction, tIdx) => {
        if (transaction.invoiceNumber === invoiceNumber) {
          transactionPeriodIndex = pIdx;
          transactionIndex = tIdx;
        }
      });
    });

    if (transactionIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: "Transaction not found in any period" 
      });
    }

    // Prepare the items with proper ObjectIds
    const updatedItems = updateData.items.map(item => {
      // If item has a temporary ID, find matching item to preserve original ID
      if (item._id && item._id.startsWith('temp-')) {
        const originalItem = member.Transaction[transactionPeriodIndex]
          .TransactionList[transactionIndex]
          .items.find(i => i.itemName === item.itemName);
        
        return {
          itemName: item.itemName,
          qty: item.qty,
          amount: item.amount,
          gstPercentage: item.gstPercentage,
          _id: originalItem?._id || new mongoose.Types.ObjectId()
        };
      }
      
      return {
        itemName: item.itemName,
        qty: item.qty,
        amount: item.amount,
        gstPercentage: item.gstPercentage,
        _id: item._id || new mongoose.Types.ObjectId()
      };
    });

    // Build the update path
    const updatePath = `Transaction.${transactionPeriodIndex}.TransactionList.${transactionIndex}`;

    // Update the document
    const updateResult = await MemberProfile.updateOne(
      { Pno },
      {
        $set: {
          [`${updatePath}.items`]: updatedItems,
          [`${updatePath}.invoiceDate`]: updateData.invoiceDate || new Date(),
          [`${updatePath}.updatedAt`]: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes made to transaction"
      });
    }

    await activityLogController.recordActivity(
          'update', 
          invoiceNumber, 
          {
            _id: performedBy.id,
            username: performedBy.username,
            role: performedBy.roles,
            name: performedBy.name, 
          }
        );

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      updatedTransaction: {
        invoiceNumber,
        items: updatedItems,
        invoiceDate: updateData.invoiceDate || new Date()
      }
    });

  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during transaction update",
      error: error.message
    });
  }
};

// delete a transactionList of transaction 
exports.deleteTransactionFromList = async (req, res) => {
  try {
    const { Pno } = req.params;
    const { performedBy, transactionId, invoiceNumber, roles } = req.body; // Removed invoiceNumber

    // Validate inputs - Now only checks for transactionId
    if (!performedBy || !Pno || !transactionId) {
      return res.status(400).json({ 
        success: false,
        message: "Pno and transactionId are required" 
      });
    }

    // Check admin privileges
    if (!roles || !roles.includes('admin')) {
      return res.status(403).json({ 
        success: false,
        message: "You are not authorized to delete a transaction." 
      });
    }

    // Build query condition (only uses transactionId)
    const queryCondition = { 
      Pno,
      "Transaction.TransactionList": {
        $elemMatch: { "_id": transactionId } 
      }
    };

    // Build update operation (only uses transactionId)
    const updateOperation = {
      $pull: {
        "Transaction.$[].TransactionList": { "_id": transactionId }
      }
    };

    // Perform the update
    const result = await MemberProfile.updateOne(queryCondition, updateOperation);

    if (result.modifiedCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Transaction not found or already deleted." 
      });
    }

    // Log activity (uses transactionId)
    await activityLogController.recordActivity(
      'delete', 
      invoiceNumber, 
      {
        _id: performedBy.id,
        username: performedBy.username,
        role: performedBy.roles,
        name: performedBy.name, 
      }
    );

    return res.status(200).json({ 
      success: true,
      message: "Transaction deleted successfully." 
    });

  } catch (error) {
    console.error("Error deleting transaction:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error while deleting transaction",
      error: error.message 
    });
  }
};