const { default: mongoose } = require('mongoose');
const RenderPayment = require('../models/Render-Payment');
const logger = require('../utils/logger');
const axios = require('axios');

exports.getRenderInvoiceUrl = async (req, res) => {
  try {
    // Since Render doesn't expose billing via API, we'll return the static URL
    // You can store this in your environment variables
    const staticInvoiceUrl = process.env.RENDER_INVOICE_URL || 
      'https://invoice.stripe.com/i/acct_1CTbIsBmBV2o9vP5/live_YWNjdF8xQ1RiSXNCbUJWMm85dlA1LF9TYlJJOU1vQzRiZ1Z5TVBmRVF5V2NLcndkWDA5MzV5LDE0MjA3NDAxNQ0200z1k4pZNb?s=ap';
    
    // You might want to store these values in your database or environment variables
    const mockInvoiceData = {
      amountDue: 10.00, // Example amount - update with your actual value
      dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(), // 5 days from now
      status: 'open'
    };

    res.json({
      success: true,
      invoiceUrl: staticInvoiceUrl,
      amountDue: mockInvoiceData.amountDue,
      dueDate: mockInvoiceData.dueDate,
      status: mockInvoiceData.status
    });

  } catch (error) {
    console.error('Error handling invoice request:', error);
    res.status(500).json({
      success: false,
      message: 'Could not retrieve invoice information'
    });
  }
};

/**
 * @desc   Get all Render services
 * @route  GET /api/render/services
 * @access Private
 */
exports.getRenderServices = async (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    
    // Build the API URL
    let apiUrl = `https://api.render.com/v1/services?limit=${limit}`;
    if (cursor) {
      apiUrl += `&cursor=${cursor}`;
    }

    // Make request to Render API
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    // Transform the response data to a more usable format
    const services = response.data.map(item => ({
      cursor: item.cursor,
      service: {
        id: item.service.id,
        name: item.service.name,
        type: item.service.type,
        url: item.service.serviceDetails?.url,
        region: item.service.serviceDetails?.region,
        plan: item.service.serviceDetails?.plan,
        status: item.service.suspended === 'not_suspended' ? 'active' : 'suspended',
        createdAt: item.service.createdAt,
        updatedAt: item.service.updatedAt,
        dashboardUrl: item.service.dashboardUrl,
        repo: item.service.repo,
        branch: item.service.branch,
        autoDeploy: item.service.autoDeploy === 'yes',
        runtime: item.service.serviceDetails?.runtime,
        instanceCount: item.service.serviceDetails?.numInstances,
        openPorts: item.service.serviceDetails?.openPorts || []
      }
    }));

    res.json({
      success: true,
      count: services.length,
      data: services,
      nextCursor: services[services.length - 1]?.cursor || null
    });

  } catch (error) {
    console.error('Error fetching Render services:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to fetch services';
    
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || errorMessage;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.response?.data || error.message
    });
  }
};

/**
 * @desc    Create a new payment record
 * @route   POST /api/payments
 * @access  Private
 */

exports.createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { paymentUrl } = req.body;

    // Validate payment URL
    if (!paymentUrl || !paymentUrl.startsWith('https://')) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Valid payment URL starting with https:// is required'
      });
    }

    // Calculate next due date (28th of current or next month)
    const now = new Date();
    let dueDate = new Date(now.getFullYear(), now.getMonth(), 28);
    if (now.getDate() > 28) {
      dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 28);
    }

    // Delete all existing payments before creating new one
    await RenderPayment.deleteMany({}).session(session);

    // Create new payment
    const payment = new RenderPayment({
      paymentUrl,
      isPaid: false,
      nextDueDate: dueDate
    });

    await payment.save({ session });

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: payment
    });

  } catch (error) {
    await session.abortTransaction();
    
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({
        success: false,
        message: 'A payment with this URL already exists'
      });
    }
    
    logger.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment record'
    });
  } finally {
    session.endSession();
  }
};


/**
 * @desc    Get all payment records
 * @route   GET /api/payments
 * @access  Private
 */
exports.getPayments = async (req, res) => {
  try {
    const payments = await RenderPayment.find({});

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};


/**
 * @desc    Update payment status
 * @route   PUT /api/payments/:id
 * @access  Private
 */
exports.updatePayment = async (req, res) => {
  try {
    const { isPaid, amount, transactionId } = req.body;
    
    const payment = await RenderPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // If marking as paid, update payment history
    if (isPaid && !payment.isPaid) {
      payment.paymentHistory.push({
        date: new Date(),
        amount: amount || 0,
        transactionId: transactionId || null
      });
      
      // Set next due date to 28th of next month
      const now = new Date();
      let nextMonth = now.getMonth() + 1;
      let year = now.getFullYear();
      if (nextMonth > 11) {
        nextMonth = 0;
        year++;
      }
      payment.nextDueDate = new Date(year, nextMonth, 28);
    }

    payment.isPaid = isPaid;
    await payment.save();

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    logger.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment'
    });
  }
};


/**
 * @desc    Manually reset payment statuses (for testing/emergency)
 * @route   POST /api/payments/reset
 * @access  Private/Admin
 */
exports.resetPayments = async (req, res) => {
  try {
    const now = new Date();
    const result = await RenderPayment.updateMany(
      {},
      { $set: { isPaid: true }}
    );

    res.json({
      success: true,
      message: `Reset ${result.modifiedCount} payment records`,
      resetAt: now
    });

  } catch (error) {
    logger.error('Error resetting payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset payments'
    });
  }
};
