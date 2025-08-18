// controllers/bookingController.js
const Booking = require('../models/AgendaCalender');
const { DateTime } = require('luxon');

// Create a new booking
exports.createBooking = async (req, res) => {

  console.log(req.body)
  try {
    // Validate required fields
    if (!req.body.date || !req.body.timing) {
      return res.status(400).json({
        success: false,
        message: 'Date and timing are required fields'
      });
    }

    // Validate timing format
    const { timing } = req.body;
    if (typeof timing !== 'string' || !timing.includes(' - ')) {
      return res.status(400).json({
        success: false,
        message: 'Timing must be in format "HH:mm - HH:mm"'
      });
    }

    // Split timing with safety check
    const timeParts = timing.split(' - ').map(t => t.trim());
    if (timeParts.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timing format. Use "HH:mm - HH:mm"'
      });
    }

    const [startTime, endTime] = timeParts;

    // Validate time formats
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Times must be in HH:mm format'
      });
    }

    // Convert the booking date
    const bookingDate = new Date(req.body.date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    bookingDate.setHours(0, 0, 0, 0);

    // Find existing bookings
    const existingBookings = await Booking.find({
      date: bookingDate
    });

    // Convert to minutes for comparison
    const newStartMinutes = convertTimeToMinutes(startTime);
    const newEndMinutes = convertTimeToMinutes(endTime);

    // Validate time order
    if (newStartMinutes >= newEndMinutes) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Check for conflicts
    const conflictingBookings = existingBookings.filter(existing => {
      const [existingStart, existingEnd] = existing.timing.split(' - ');
      const existingStartMinutes = convertTimeToMinutes(existingStart);
      const existingEndMinutes = convertTimeToMinutes(existingEnd);

      return (
        (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes)
      );
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Time slot conflicts with existing booking(s)',
        conflictingBookings
      });
    }

    // Create booking
    const booking = new Booking({
      ...req.body,
      date: bookingDate
    });
    
    await booking.save();

    res.status(201).json({
      success: true,
      data: booking
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
};


// Helper functions
function convertTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isValidTime(time) {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

// Get all bookings for a date range
exports.getBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .sort({ date: 1, timing: 1 })

    // Group by date for calendar view
    if (req.query.groupBy === 'date') {
      const grouped = bookings.reduce((acc, booking) => {
        const dateStr = DateTime.fromJSDate(booking.date).toISODate();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(booking);
        return acc;
      }, {});

      return res.json({
        success: true,
        data: grouped
      });
    }

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get a single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('inventoryItems.itemId', 'name description category');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update a booking
exports.updateBooking = async (req, res) => {
  try {
    // First get the existing booking to compare changes
    const existingBooking = await Booking.findById(req.params.id);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check for time conflicts (excluding the current booking)
    if (req.body.timing) {
      const { date, timing } = req.body;
      const [startTime, endTime] = timing.split(' - ').map(t => t.trim());
      
      const conflictingBookings = await Booking.find({
        _id: { $ne: req.params.id },
        date: date ? new Date(date) : existingBooking.date,
        $or: [
          { 
            timing: { 
              $regex: new RegExp(`^${startTime}| - ${startTime}|${endTime} - | - ${endTime}$`) 
            } 
          },
          {
            $expr: {
              $function: {
                body: function(bookingTiming, newStart, newEnd) {
                  const [bookingStart, bookingEnd] = bookingTiming.split(' - ');
                  return (
                    (newStart >= bookingStart && newStart < bookingEnd) ||
                    (newEnd > bookingStart && newEnd <= bookingEnd) ||
                    (newStart <= bookingStart && newEnd >= bookingEnd)
                  );
                },
                args: ["$timing", startTime, endTime],
                lang: "js"
              }
            }
          }
        ]
      });

      if (conflictingBookings.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Time slot conflicts with existing booking',
          conflictingBookings
        });
      }
    }

    // Handle inventory item changes if specified
    if (req.body.inventoryItems) {
      // First, revert the quantities from the old items
      for (const item of existingBooking.inventoryItems) {
        await InventoryItem.findByIdAndUpdate(
          item.itemId,
          { $inc: { availableQuantity: item.quantity } }
        );
      }

      // Then check and reserve the new items
      const unavailableItems = [];
      
      for (const item of req.body.inventoryItems) {
        const inventoryItem = await InventoryItem.findById(item.itemId);
        if (!inventoryItem || inventoryItem.availableQuantity < item.quantity) {
          unavailableItems.push({
            itemId: item.itemId,
            available: inventoryItem ? inventoryItem.availableQuantity : 0,
            requested: item.quantity
          });
        }
      }

      if (unavailableItems.length > 0) {
        // If unavailable, revert the revert (put back the original quantities)
        for (const item of existingBooking.inventoryItems) {
          await InventoryItem.findByIdAndUpdate(
            item.itemId,
            { $inc: { availableQuantity: -item.quantity } }
          );
        }
        
        return res.status(400).json({
          success: false,
          message: 'Some inventory items are not available in the requested quantity',
          unavailableItems
        });
      }

      // If all items are available, reserve them
      for (const item of req.body.inventoryItems) {
        await InventoryItem.findByIdAndUpdate(
          item.itemId,
          { $inc: { availableQuantity: -item.quantity } }
        );
      }
    }

    // Update the booking
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('inventoryItems.itemId', 'name description');

    res.json({
      success: true,
      data: booking
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Return inventory items to available stock
    if (booking.inventoryItems && booking.inventoryItems.length > 0) {
      for (const item of booking.inventoryItems) {
        await InventoryItem.findByIdAndUpdate(
          item.itemId,
          { $inc: { availableQuantity: item.quantity } }
        );
      }
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get available time slots for a date
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.params;
    const { duration = 60 } = req.query; // Default duration in minutes
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const selectedDate = new Date(date);
    const dayStart = new Date(selectedDate.setHours(8, 0, 0, 0)); // 8 AM
    const dayEnd = new Date(selectedDate.setHours(22, 0, 0, 0)); // 10 PM
    
    // Get all bookings for the day
    const bookings = await Booking.find({
      date: {
        $gte: dayStart,
        $lte: dayEnd
      }
    }).sort({ timing: 1 });

    // Generate all possible slots (every 30 minutes)
    const allSlots = [];
    let currentTime = new Date(dayStart);
    
    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      if (slotEnd <= dayEnd) {
        allSlots.push({
          start: new Date(currentTime),
          end: slotEnd
        });
      }
      currentTime = new Date(currentTime.getTime() + 30 * 60000); // Move forward 30 minutes
    }

    // Filter out slots that conflict with existing bookings
    const availableSlots = allSlots.filter(slot => {
      return !bookings.some(booking => {
        const [bookingStart, bookingEnd] = booking.timing.split(' - ').map(t => {
          const [hours, minutes] = t.split(':').map(Number);
          const d = new Date(booking.date);
          d.setHours(hours, minutes, 0, 0);
          return d;
        });
        
        return (
          (slot.start >= bookingStart && slot.start < bookingEnd) ||
          (slot.end > bookingStart && slot.end <= bookingEnd) ||
          (slot.start <= bookingStart && slot.end >= bookingEnd)
        );
      });
    });

    // Format the response
    const formattedSlots = availableSlots.map(slot => {
      const startStr = slot.start.toTimeString().substring(0, 5);
      const endStr = slot.end.toTimeString().substring(0, 5);
      return `${startStr} - ${endStr}`;
    });

    res.json({
      success: true,
      data: formattedSlots
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};