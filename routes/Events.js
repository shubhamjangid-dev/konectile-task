const express = require('express');
const { createNewEvent, fetchAllEvents, fetchSingleEvent, updateEventbyId, deleteEventById } = require('../controller/Events');
const upload = require('../multer/upload');
const { isAuth } = require('../middleware/userAuth');

const router = express.Router();

router.post(
    '/create',
    upload.single('EventPoster'), 
    isAuth,
    createNewEvent
);

router.get('/fetch-events',fetchAllEvents);
router.get('/fetch-single-event',isAuth, fetchSingleEvent);
router.put(
    '/:eventID/update-event',
    upload.single('EventPoster'),
    isAuth,
    updateEventbyId
);
router.delete('/:eventID/delete-event',isAuth,deleteEventById);

module.exports = router

