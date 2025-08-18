const express = require('express');
const { createOrder, deleteOrder, updateOrder, getOrderById, getPendingOrders, getPendingOrdersCount, getAllOrders, getAcceptedOrder, getAcceptedOrderCount, getOrderUpdates, getAllPendingOrderCountOnly } = require('../controller/Order');
const { isAuth } = require('../middleware/userAuth');

const router = express.Router()

// create an order
router.post('/create', createOrder);

// get all order
router.get('/get-all-order',isAuth,getAllOrders)
   
// delete/reject order
router.delete('/:id/delete', deleteOrder);

// update order
router.put('/:id/update',isAuth,updateOrder);

// get a order by -id
router.post('/get-order-byId',isAuth,getOrderById);

// get a status orders
router.post('/get-pending-orders',getPendingOrders);

router.post('/get-accepted-orders',isAuth,getAcceptedOrder);

// pending order count by member
router.get('/pending-count',getPendingOrdersCount);

router.get('/get-all-pending-count',getAllPendingOrderCountOnly)

router.get('/accepted-count',isAuth,getAcceptedOrderCount);


// SSE route
router.get('/updates', getOrderUpdates);


module.exports = router