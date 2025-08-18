const express = require('express');
const { insertSingleInventory, insertBulkInventory, deleteInventoryItem, updateInventoryItem, fetchSingleInventoryItem, fetchAllInventoryItems, getNextItemCode } = require('../controller/ClubInventory');
const { isAuth } = require('../middleware/userAuth');

const router = express.Router();

router.post(
    '/create',
    isAuth,
    insertSingleInventory
);

router.post(
    '/create-in-bulk',
    isAuth,
    insertBulkInventory
);

router.delete(
    '/:itemCode/delete',
    isAuth,
    deleteInventoryItem
);

router.put(
    '/:itemCode/update',
    isAuth,
    updateInventoryItem
);

router.get(
    '/fetch-all-items',
    fetchAllInventoryItems
);

router.get(
    '/fetch-next-item-code',
    isAuth,
    getNextItemCode
);

module.exports = router

