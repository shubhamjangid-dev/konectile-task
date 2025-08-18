const express = require('express');
const bookingController = require('../controller/AgendaCalender');

const router = express.Router();

router.post('/create', bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBooking);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);
router.get('/availability/:date', bookingController.getAvailableSlots);

module.exports = router;