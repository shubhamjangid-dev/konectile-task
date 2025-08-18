const express = require('express');
const { sendMessageOnWhatsapp, sendEmailNotification, sendSMSOnPhone } = require('../controller/NotificationController');

const router = express.Router();

// send message on whatasapp
router.post('/send-message-on-whatsapp',sendMessageOnWhatsapp);

// send email 
router.post('/send-email-notification',sendEmailNotification);

router.post('/send-sms-on-phone',sendSMSOnPhone);

module.exports = router

