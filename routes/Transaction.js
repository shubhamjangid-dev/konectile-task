const express = require('express');
const { deleteTransactionData, deleteTransactionFromList, updateTransactionInList } = require('../controller/Transaction');

const router = express.Router()

// delte all transaction of a member - very critical
// router.delete("/:memberId/all-transactions/:transactionId", deleteTransactionData);
// router.put("/:memberId/transactions/:transactionId", updateTransaction);


// delete transaction list 
router.delete("/:Pno/delete", deleteTransactionFromList);

// update transactionList
router.put("/:Pno/update", updateTransactionInList);

module.exports = router