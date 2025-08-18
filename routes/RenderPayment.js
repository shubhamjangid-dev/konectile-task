const express = require("express");
const { getRenderInvoiceUrl, getRenderServices, createPayment, getPayments, resetPayments } = require("../controller/RenderPayment");
const { isAuth } = require('../middleware/userAuth');

const router = express.Router()

router.post('/create-payment',isAuth,createPayment)
router.get('/get-render-payment',isAuth,getPayments);

router.put('/reset-status',resetPayments);

router.get('/payment',isAuth,getRenderInvoiceUrl);
router.get('/services',isAuth,getRenderServices);


module.exports = router