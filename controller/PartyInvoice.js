const PartyInvoice = require('../models/PartyInvoice');
const InvoiceCounter = require('../models/InvoiceCounter');

// Initialize counter with last used sequence
const initializeCounter = async () => {
  try {
    // Get the last invoice to find the highest sequence number
    const lastInvoice = await PartyInvoice.findOne().sort({ invoiceNumber: -1 });
    
    if (lastInvoice) {
      // Extract the sequence number from the last invoice number
      const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-').pop());
      
      // Update or create the counter with the last sequence number
      await InvoiceCounter.findByIdAndUpdate(
        { _id: 'invoiceId' },
        { seq: lastSeq },
        { upsert: true }
      );
      
      console.log(`Counter initialized with sequence: ${lastSeq}`);
    }
  } catch (error) {
    console.error('Error initializing counter:', error);
  }
};

// Initialize counter when the application starts
initializeCounter();

// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    // Validate request body
    if (!req.body.memberDetails || !req.body.memberDetails.name || !req.body.memberDetails.id) {
      return res.status(400).json({ 
        success: false,
        message: 'Member name and ID are required' 
      });
    }

    // Validate venue rows if present
    if (req.body.venueRows && !Array.isArray(req.body.venueRows)) {
      return res.status(400).json({
        success: false,
        message: 'Venue rows must be an array'
      });
    }

    // Validate menu rows if present
    if (req.body.menuRows && !Array.isArray(req.body.menuRows)) {
      return res.status(400).json({
        success: false,
        message: 'Menu rows must be an array'
      });
    }

    // Create new invoice - let the pre-save middleware handle invoice number
    const invoice = new PartyInvoice(req.body);

    // Save the invoice
    await invoice.save();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error || * marked are required field',
        errors: messages
      });
    }
    
    // Handle duplicate key error (in case of race condition with invoice numbers)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Invoice number conflict. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    // Add pagination, sorting, and filtering if needed
    const invoices = await PartyInvoice.find()
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Get single invoice
exports.getInvoice = async (req, res) => {
  try {

    console.log(req.params)
    const invoice = await PartyInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await PartyInvoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
      data: {}
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await PartyInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Get next invoice number
exports.getNextInvoiceNumber = async (req, res) => {
  try {
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
    
    // Calculate financial year
    // If month is April or later, use current year as start of FY
    // Otherwise, use previous year as start of FY
    const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const fyEndYear = fyStartYear + 1;
    const financialYear = `${fyStartYear.toString().slice(-2)}/${fyEndYear.toString().slice(-2)}`;

    // Get the current counter
    const counter = await InvoiceCounter.findById('invoiceId');
    
    // If no counter exists yet, start with 1
    const nextSeq = counter ? counter.seq + 1 : 1;
    
    // Format the next invoice number with financial year
    const nextInvoiceNumber = `INV-NC/${financialYear}-${nextSeq.toString().padStart(5, '0')}`;

    res.status(200).json({
      success: true,
      data: {
        nextInvoiceNumber,
        sequence: nextSeq,
        financialYear
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error getting next invoice number',
      error: err.message
    });
  }
};

// Reset counter to last used sequence
exports.resetCounter = async (req, res) => {
  try {
    await initializeCounter();
    
    res.status(200).json({
      success: true,
      message: 'Counter reset successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error resetting counter',
      error: err.message
    });
  }
};