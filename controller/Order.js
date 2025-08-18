const Order = require("../models/Order");
const MemberProfile = require("../models/memberProfile");
const { SendOrderNotAcceptedNotification, SendOrderAcceptedNotification } = require("../utils/EmailTemplate");
const { generateMailTransporter } = require("../utils/email");
const { saveMultiTransaction } = require("./member");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { MemberID, orderDate, orderType, deliveryLocation,roomNo, order } = req.body;

    // Validate required fields
    if (!MemberID || !orderDate || !order || !Array.isArray(order)) {
      return res.status(400).json({ 
        success: false,
        message: "MemberID, orderDate, and order items are required" 
      });
    }

    // Check if member exists
    const member = await MemberProfile.findById(MemberID);
    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: "Member not found" 
      });
    }

    // Check existing pending orders for this member
    const pendingOrders = await Order.find({ 
      MemberID,
      status: "pending"
    });

    if (pendingOrders.length >= 2) {
      return res.status(400).json({
        success: false,
        message: "You already have 2 pending orders. Please wait until they are accepted before placing new orders."
      });
    }

    // Create new order
    const newOrder = new Order({
      MemberID,
      MemberName: member.Name,
      orderDate,
      orderType,
      ...(orderType === 'parcel' && {
        deliveryLocation,
        roomNo
      }),
      order,
      status: "pending" // Default status
    });

    const savedOrder = await newOrder.save();
    
    
    // Broadcast update to all connected clients
    await this.broadcastOrderUpdate();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while creating order",
      error: error.message 
    });
  }
};


// Update an order (status or items) - Enhanced version
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {performedBy, status, order } = req.body;

    if(!performedBy) {
      return res.status(400).json({ 
        success: false,
        message: "performedBy field is required" 
      });
    }

    // Validate at least one field to update
    if (!status && !order) {
      return res.status(400).json({ 
        success: false,
        message: "Either status or order items must be provided for update" 
      });
    }

    // Find order
    const existingOrder = await Order.findById(id).populate("MemberID", "MemberID Pno Name Email Contact");
    if (!existingOrder) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Prepare update object
    const updateData = {};
    if (status) {
      if (!["pending", "accepted", "rejected"].includes(status)) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid status value" 
        });
      }
      updateData.status = status;
    }

    if (order && Array.isArray(order)) {
      updateData.order = order;
    }

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // If order was accepted, create transaction
    if (status === "accepted") {
      const member = existingOrder.MemberID;
      const invoiceNumber = `#INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const invoiceDate = new Date();
      
      // Convert order items to transaction items format
      const transactionItems = existingOrder.order.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemGroup: item.itemGroup,
        qty: item.qty,
        amount: item.issueRate * item.qty,
        gstPercentage: item.gstPercentage,
        purchaseRate: item.purchaseRate,
      }));

      // Create transaction payload
      const transactionPayload = {
        performedBy: performedBy,
        memberID: member.MemberID,
        invoiceNumber,
        invoiceDate,
        items: transactionItems
      };


      // memberID, invoiceNumber, invoiceDate, items
      await saveMultiTransaction(
        { body: transactionPayload }, 
        { status: () => ({ json: () => {} }) } 
      );

      try {
        const transport = generateMailTransporter();
        await transport.sendMail({
          from: process.env.NODE_MAILER_USERNAME,
          to: member.Email,
          subject: `Order Accepted - ${invoiceNumber}`,
          html: SendOrderAcceptedNotification(existingOrder.MemberName,transactionPayload.memberID ,transactionPayload.invoiceDate,transactionPayload.invoiceNumber, transactionPayload.items, "30 minutes")
        });
      } catch (emailError) {
        console.error("Failed to send acceptance email:", emailError);
      }
    }

    res.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
      ...(status === "accepted" && { 
        transactionCreated: true,
        message: "Order accepted and transaction created successfully" 
      })
    });

  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while updating order",
      error: error.message 
    });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    const member = await MemberProfile.findById({_id : deletedOrder.MemberID})

  // Send email notification
    const transport = generateMailTransporter();
    await transport.sendMail({
      from: process.env.NODE_MAILER_USERNAME,
      to: member.Email,
      subject: `Order no - ${deletedOrder._id}`,
      html: SendOrderNotAcceptedNotification(member.Name,member.Pno, deletedOrder.orderDate,deletedOrder._id)
    });

    res.json({
      success: true,
      message: "Order deleted successfully",
      order: deletedOrder
    });

  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while deleting order",
      error: error.message 
    });
  }
};

// Get all orders (optional)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("MemberID", "Name MemberID");
    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching orders",
      error: error.message 
    });
  }
};

// Get order by ID (optional)
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("MemberID", "Name MemberID");
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching order",
      error: error.message 
    });
  }
};


// Get all pending orders
exports.getPendingOrders = async (req, res) => {
    try {
      const pendingOrders = await Order.find({ status: "pending" })
        .populate("MemberID", "Name MemberID Contact")
        .sort({ orderDate: 1 }); // Sort by orderDate ascending
  
      res.json({
        success: true,
        count: pendingOrders.length,
        orders: pendingOrders
      });
  
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error while fetching pending orders",
        error: error.message 
      });
    }
  };

// Get all accpted orders
exports.getAcceptedOrder = async (req, res) => {
  try {
    const acceptedOrder = await Order.find({ status: "accepted" })
      .populate("MemberID", "Name MemberID Contact")
      .sort({ orderDate: 1 }); 

    res.json({
      success: true,
      count: acceptedOrder.length,
      orders: acceptedOrder
    });

  } catch (error) {
    console.error("Error fetching pending orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching pending orders",
      error: error.message 
    });
  }
};

  // pending order count by members
exports.getPendingOrdersCount = async (req, res) => {
    try {
      const { memberId } = req.query;
      
      if (!memberId) {
        return res.status(400).json({
          success: false,
          message: "Member ID is required"
        });
      }
  
      const count = await Order.countDocuments({
        MemberID: memberId,
        status: "pending"
      });
  
      res.status(200).json({
        success: true,
        count
      });
  
    } catch (error) {
      console.error("Error getting pending orders count:", error);
      res.status(500).json({
        success: false,
        message: "Server error while getting pending orders count",
        error: error.message
      });
    }
  };


  // get accepted order count
exports.getAcceptedOrderCount = async (req, res) => {
    try {
      const { memberId } = req.query;
      
      if (!memberId) {
        return res.status(400).json({
          success: false,
          message: "Member ID is required"
        });
      }
  
      const count = await Order.countDocuments({
        MemberID: memberId,
        status: "accepted"
      });
  
      res.status(200).json({
        success: true,
        count
      });
  
    } catch (error) {
      console.error("Error getting pending orders count:", error);
      res.status(500).json({
        success: false,
        message: "Server error while getting pending orders count",
        error: error.message
      });
    }
  };


exports.getAllPendingOrderCountOnly = async (req, res) => {
  try {
    
    const count = await Order.countDocuments({
      status: "pending"
    });

    res.status(200).json({
      success: true,
      count
    });

  } catch (error) {
    console.error("Error getting pending orders count:", error);
    res.status(500).json({
      success: false,
      message: "Server error while getting pending orders count",
      error: error.message
    });
  }
};


const jwt = require('jsonwebtoken');
const allowedOrigins = [
  'http://localhost:5173',
  'https://noaclub.konectile.com',
  'https://ims.konectile.com'
];
const JWT_SECRET = process.env.SECRET_KEY

const clients = new Set();

exports.getOrderUpdates = async (req, res) => {
  const origin = req.headers.origin;

  // Handle preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }

  // CORS: Validate origin
  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: 'CORS origin not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // CHECK TOKEN FROM QUERY
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing authentication token' });
  }

  let userData;
  try {
    userData = jwt.verify(token, JWT_SECRET);
    // userData can be used for scoping if needed
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  // SSE HEADERS
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // REGISTER CLIENT
  clients.add(res);

  // Send initial orders
  try {
    const orders = await Order.find().populate("MemberID", "Name MemberID");
    sendEvent(res, {
      type: 'INIT',
      data: {
        success: true,
        count: orders.length,
        orders
      }
    });
  } catch (error) {
    sendEvent(res, {
      type: 'ERROR',
      data: {
        success: false,
        message: 'Failed to load initial data'
      }
    });
  }

  // Remove client when connection closes
  req.on('close', () => {
    clients.delete(res);
  });
};

function sendEvent(res, event) {
  try {
    res.write(`id: ${Date.now()}\n`);
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    // res.flush() for immediate send if supported
    if (typeof res.flush === "function") res.flush();
  } catch (error) {
    clients.delete(res);
  }
}

// Broadcast remains unchanged but uses the same clients set
exports.broadcastOrderUpdate = async () => {
  if (!clients.size) return;
  try {
    const orders = await Order.find().populate("MemberID", "Name MemberID");
    const update = {
      type: 'UPDATE',
      data: {
        success: true,
        count: orders.length,
        orders
      }
    };
    for (const client of [...clients]) {
      sendEvent(client, update);
    }
  } catch (err) {
    console.error("Error broadcasting update:", err);
  }
};



