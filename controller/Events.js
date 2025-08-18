const Event = require('../models/Events');
const { sendError } = require('../utils/helper');
const path = require('path');
const fs = require('fs');

// Create a new event
exports.createNewEvent = async (req, res) => {
  try {
    const { EventName, EventDescription, EventDate, EventTime, EventVenues, LinkToRegister } = req.body;

    // Validate required fields
    if (!EventName || !EventDescription || !EventDate || !EventTime) {
      return sendError(res, "Missing required fields'");
    }

    // Validate date is in the future
    const eventDateTime = new Date(`${EventDate}T${EventTime}`);
    if (eventDateTime < new Date()) {
      return sendError(res, 'Event date and time must be in the future');
    }

    // Validate file type if present
    if (req.file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return sendError(res, 'Invalid file type. Only JPEG, PNG, and GIF are allowed');
      }
    }

    // Create and save the event
    const newEvent = new Event({
      EventPoster: req.file ? req.file.path : null,
      EventName: EventName.trim(),
      EventDescription: EventDescription.trim(),
      EventDate,
      EventTime,
      EventVenues: EventVenues ? EventVenues.trim() : null,
      LinkToRegister: LinkToRegister ? LinkToRegister.trim() : null,
    });

    await newEvent.save();

    // Remove file path from response if you want to be more secure
    const eventResponse = newEvent.toObject();
    if (eventResponse.EventPoster) {
      eventResponse.EventPoster = eventResponse.EventPoster.replace('public/', '');
    }

    return res.status(201).json({
      message: "Event created successfully",
      event: eventResponse
    });

  } catch (error) {
    console.error('Error creating event:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return sendError(res, 'Event with similar details already exists');
    }

    return res.status(500).json({ 
      message: 'Server error occurred while creating event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Fetch all events
exports.fetchAllEvents = async (req, res) => {
    try {
      const events = await Event.find();
      res.status(200).json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Fetch a single event by ID
exports.fetchSingleEvent = async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.status(200).json(event);
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }


// Update an event by ID
exports.updateEventbyId = async (req, res) => {
    try {
        const { eventID } = req.params;
        
        // 1. Find the event
        const event = await Event.findById(eventID);
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: 'Event not found' 
            });
        }

        // 2. Handle file upload if present
        if (req.file) {
            // Delete old image if it exists
            if (event.EventPoster) {
                const oldImagePath = path.join(__dirname, '..', event.EventPoster);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            // Update with new image path
            event.EventPoster = req.file.path;
        }

        // 3. Update other fields
        const fieldsToUpdate = [
            'EventName', 
            'EventDescription', 
            'EventDate', 
            'EventTime', 
            'EventVenues', 
            'LinkToRegister'
        ];

        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                event[field] = req.body[field];
            }
        });

        // 4. Save changes
        const updatedEvent = await event.save();

        // 5. Prepare response
        const response = {
            success: true,
            message: 'Event updated successfully',
            event: {
                _id: updatedEvent._id,
                EventName: updatedEvent.EventName,
                EventDescription: updatedEvent.EventDescription,
                EventDate: updatedEvent.EventDate,
                EventTime: updatedEvent.EventTime,
                EventVenues: updatedEvent.EventVenues,
                LinkToRegister: updatedEvent.LinkToRegister,
                EventPoster: updatedEvent.EventPoster
                    ? updatedEvent.EventPoster.replace(/\\/g, '/') // Convert path for URLs
                    : null
            }
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
};

// Delete an event by ID
exports.deleteEventById = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.eventID);
    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
