const twilio = require('twilio');
const argon2 = require('argon2');
const cron = require('node-cron');
const { isValidObjectId, default: mongoose } = require("mongoose");
const moment = require("moment");
const MemberProfile = require("../models/memberProfile");
const activityLogController = require('../controller/ActivityLog')
const { sendError } = require("../utils/helper");
const { generateMailTransporter } = require("../utils/email");
const { SendInvoiceAndBillingInfo, generateMonthlyReport } = require("../utils/EmailTemplate");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


// create a new member profile
exports.createMemberProfile = async(req,res) =>{
    const {MemberID,Name, Pno, Contact, Email, Password, MembershipStatus, MemberSince, Transaction, FamilyMember,Role} = req.body;

    console.log(req.body);

    const existingMember = await MemberProfile.findOne({ $or: [{ MemberID }, { Pno }] });
    if (existingMember) {
      return res.status(400).json({ message: 'MemberID or pno. already exists' });
    }

    const newMemberProfile = new MemberProfile({MemberID, Name, Pno, Contact, Email, Password, MembershipStatus, MemberSince, Transaction, FamilyMember, Role});
    await newMemberProfile.save();
    res.status(201).json({ message: 'Member profile created successfully', member: newMemberProfile});
}

// bulk member creation
exports.createBulkMemberProfile = async (req, res) => {
  const memberProfiles = req.body;

  if (!Array.isArray(memberProfiles) || memberProfiles.length === 0) {
    return sendError(res, 'Input must be a non-empty array of member profiles');
  }

  // Check for duplicate emails or phone numbers
  const emails = memberProfiles.map((member) => member.Email);
  const pnos = memberProfiles.map((member) => member.Pno);

  const existingMembers = await MemberProfile.find({
    $or: [{ Email: { $in: emails } }, { Pno: { $in: pnos } }],
  });

  if (existingMembers.length > 0) {
    const duplicateEmails = existingMembers.map((member) => member.Email);
    const duplicatePnos = existingMembers.map((member) => member.Pno);
    return res.status(400).json({
      message: 'Duplicate email or phone number found',
      duplicates: { emails: duplicateEmails, pnos: duplicatePnos },
    });
  }

  try {
    // Hash passwords for all member profiles
    const hashedMemberProfiles = await Promise.all(
      memberProfiles.map(async (member) => {
        const hashedPassword = await argon2.hash(member.Password);
        return { ...member, Password: hashedPassword };
      })
    );

    // Insert the member profiles with hashed passwords
    const createdMembers = await MemberProfile.insertMany(hashedMemberProfiles);

    res.status(201).json({ message: 'Member profiles created successfully', members: createdMembers });
  } catch (error) {
    console.error('Error creating member profiles:', error);
    res.status(500).json({ message: 'Failed to create member profiles' });
  }
};

// get a single Member profile
exports.getSingleMemberProfile = async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    return sendError(res, "Invalid request!");
  }

  try {
    const member = await MemberProfile.findById(userId);

    if (!member) {
      return sendError(res, "Invalid request, MemberProfile not found!", 404);
    }

    res.json(member);
  } catch (error) {
    console.error("Error fetching member profile:", error);
    return sendError(res, "Internal server error", 500);
  }
};

// get latest member profile created baseed on date

exports.getLatestMemberProfile = async(req, res) =>{
    const result = await MemberProfile.find().sort({createdAt: '-1'}).limit(12);
    res.json(result)
}

// get all the member list
exports.getAllMemberList = async(req,res) =>{
    const result = await MemberProfile.find()

    res.json(result);
}


// get all the active member
exports.getAllActiveMembers = async (req, res) => {
  try {
    // Destructure query parameters
    const { search = '', limit = 1000 } = req.query;
    
    // Build the query with active status filter
    const query = {
      MembershipStatus: 'active',
      ...(search && {
        $or: [
          { Name: { $regex: search, $options: 'i' } },
          { Pno: { $regex: search, $options: 'i' } },
          { Contact: { $regex: search, $options: 'i' } }
        ]
      })
    };

    // Projection to control returned fields
    const projection = {
      Name: 1,
      Pno: 1,
      Contact: 1,
      MemberID: 1,
      MembershipStatus: 1,
      _id: 0 // Exclude MongoDB _id
    };

    // Execute query with pagination
    const activeMembers = await MemberProfile.find(query)
      .limit(parseInt(limit))
      .sort({ Name: 1 }) // Alphabetical sorting
      .lean(); // Faster plain JS objects

    // Cache control headers
    res.set('Cache-Control', 'public, max-age=300'); // 5 minute cache
    
    res.status(200).json(activeMembers);

  } catch (error) {
    console.error('Error fetching active members:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving active members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// edit a member 
exports.editMemberProfile = async (req, res) => {
  try {
    const { MemberID } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.MemberID;
    delete updates.Transaction;
    delete updates.MemberSince;
    delete updates.Role;
    delete updates.session_id;

    // If password is being updated, hash it
    if (updates.Password) {
      updates.Password = await argon2.hash(updates.Password);
    }

    // Convert email to lowercase if provided
    if (updates.Email) {
      updates.Email = updates.Email.toLowerCase();
    }

    const updatedMember = await MemberProfile.findOneAndUpdate(
      { MemberID },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-Password -session_id'); // Exclude sensitive fields

    if (!updatedMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.status(200).json({
      message: 'Member profile updated successfully',
      member: updatedMember
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating member profile',
      error: error.message 
    });
  }
};

// addd family member
exports.addFamilyMember = async (req, res) => {
  try {
    const { MemberID } = req.params;
    const { Name, Relation } = req.body;

    if (!Name || !Relation) {
      return res.status(400).json({ 
        message: 'Name and Relation are required' 
      });
    }

    const validRelations = ['son', 'daughter', 'wife', 'husband'];
    if (!validRelations.includes(Relation)) {
      return res.status(400).json({ 
        message: `Relation must be one of: ${validRelations.join(', ')}` 
      });
    }

    const newFamilyMember = {
      Name,
      Relation
    };

    const updatedMember = await MemberProfile.findOneAndUpdate(
      { MemberID },
      { $push: { FamilyMember: newFamilyMember } },
      { new: true }
    ).select('-Password -session_id'); // Exclude sensitive fields

    if (!updatedMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.status(201).json({
      message: 'Family member added successfully',
      member: updatedMember,
      newFamilyMember
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error adding family member',
      error: error.message 
    });
  }
};

// change membership status
exports.changeMemberStatus = async (req, res) => {
  try {
    const { MemberID } = req.params;
    const { MembershipStatus } = req.body;

    if (!MembershipStatus || !['active', 'inactive'].includes(MembershipStatus)) {
      return res.status(400).json({ 
        message: 'Valid MembershipStatus (active/inactive) is required' 
      });
    }

    const updatedMember = await MemberProfile.findOneAndUpdate(
      { MemberID },
      { $set: { MembershipStatus } },
      { new: true }
    ).select('-Password -session_id'); // Exclude sensitive fields

    if (!updatedMember) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.status(200).json({
      message: `Member status updated to ${MembershipStatus}`,
      member: updatedMember
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error changing member status',
      error: error.message 
    });
  }
};

// get all transction of a particular member 
exports.getMemberTransctionList = async (req, res) => {
  try {
    // Fetch all members with their transactions
    const members = await MemberProfile.find({}).select('Name MemberID Pno Contact Email Transaction');

    if (!members || members.length === 0) {
      return res.status(404).json({ message: 'No members found' });
    }

    // Extract transactions from all members
    const allTransactions = members.flatMap((member) => {
      return member.Transaction.map((transaction) => ({
        memberName: member.Name,
        memberID : member.MemberID,
        memberPno: member.Pno, 
        memberContact: member.Contact, 
        memberEmail: member.Email,
        ...transaction.toObject(), 
      }));
    });

    if (allTransactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    res.status(200).json({ message: 'Transactions fetched successfully', transactions: allTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// get transaction by member
exports.getTransactionsByMember = async (req, res) => {
  try {
    const { memberId } = req.params; 

    console.log(memberId)

    // Fetch the member by their ID and include their transactions
    const member = await MemberProfile.findById(memberId).select('Name Pno Contact Email Transaction');

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Extract transactions for the member
    const transactions = member.Transaction.map((transaction) => ({
      memberName: member.Name,
      memberPno: member.Pno,
      memberContact: member.Contact,
      memberEmail: member.Email,
      ...transaction.toObject(), // Convert Mongoose document to plain object
    }));

    if (transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found for this member' });
    }

    res.status(200).json({ message: 'Transactions fetched successfully', transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// save a single item transaction 
exports.saveTransactionDetails = async (req,res) => {
  try {
    const { memberID, invoiceNumber, invoiceDate, itemName, qty, amount,gstPercentage  } = req.body
    // Find the member by MemberID
    const member = await MemberProfile.findOne({MemberID:memberID });

    if (!member) return sendError(res, "Member not found!")

    // Create a new transaction entry
    const newTransaction = {
      ItemName: itemName, 
      Qty: qty, 
      Amount: amount, 
      TotalAmount: totalAmount,
      InvoiceDate: invoiceDate,
      InvoiceNumber: invoiceNumber
    };

    // Check if a transaction for the current month already exists
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    let transaction = member.Transaction.find((t) => t.Month === currentMonth);

    if (!transaction) {
      // Create a new transaction for the current month
      transaction = {
        Month: currentMonth,
        FromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of the month
        ToDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), // End of the month
        TransactionList: [newTransaction],
      };
      member.Transaction.push(transaction);
    } else {
      // Add the new transaction to the existing month's transaction list
      transaction.TransactionList.push(newTransaction);
    }

    // Save the updated member profile
    await member.save();

    res.status(201).json({ message: 'Transaction created successfully', transactionMember: member});
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
};

// create multi transactions
exports.saveMultiTransaction = async (req, res) => {
  const {performedBy, memberID, invoiceNumber, invoiceDate, items } = req.body;

  // Validate required fields
  if ( !performedBy || !memberID || !invoiceNumber || !invoiceDate || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'All fields are required, and items must be a non-empty array' });
  }

  try {

    let member;
    // Find the member by MemberID
    member = await MemberProfile.findOne({ Pno: memberID });    

    if (!member) {
      let findMemberByMemberId = await MemberProfile.findOne({MemberID: memberID});

      if(!findMemberByMemberId) 
        return res.status(404).json({ success: false, message: 'Member not found' });

      member = findMemberByMemberId;
    }

    if(member.MembershipStatus === 'inactive') 
      return res.status(404).json({ success: false, message: 'Billing can not be done as member is inactive.' });

    // Create a new transaction entry
    const newTransaction = {
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      items: items.map((item) => ({
        itemCode: item.itemCode,  
        itemName: item.itemName,
        itemGroup: item.itemGroup,
        qty: item.qty,
        amount: item.amount,
        gstPercentage: item.gstPercentage,
        purchaseRate: item.purchaseRate,
      })),
    };


    const transactionDate = new Date(invoiceDate);
    const transactionMonth = transactionDate.toLocaleString('default', { month: 'long' });
    const transactionYear = transactionDate.getFullYear();

    // Find or create a transaction for the month
    let transaction = member.Transaction.find((t) => {
      const tYear = new Date(t.FromDate).getFullYear();
      return t.Month === transactionMonth && tYear === transactionYear;
    });

    if (!transaction) {
      transaction = {
        Month: transactionMonth,
        FromDate: new Date(transactionYear, transactionDate.getMonth(), 1), // Start of the month
        ToDate: new Date(transactionYear, transactionDate.getMonth() + 1, 0), // End of the month
        TransactionList: [newTransaction],
      };
      member.Transaction.push(transaction);
    } else {
      transaction.TransactionList.push(newTransaction);
    }

    // Save the updated member profile
    await member.save();

    await activityLogController.recordActivity(
      'create', 
      newTransaction.invoiceNumber, 
      {
        _id: performedBy.id,
        username: performedBy.username,
        role: performedBy.roles,
        name: performedBy.name, 
      }
    );


    // Send email notification
    const transport = generateMailTransporter();
    await transport.sendMail({
      from: process.env.NODE_MAILER_USERNAME,
      to: member.Email,
      subject: `Order Invoice - ${invoiceNumber}`,
      html: SendInvoiceAndBillingInfo(member.Name, member.Pno, invoiceDate, invoiceNumber, items),
    });

    return res.status(200).json({ success: true, message: 'Transaction saved successfully', data: member });

    // Send SMS notification -  No balance in twilio ( 20$ spend for 342 sms oh shit )
      const itemsMessage = items
      .map((item, index) => {
        const itemTotal = item.amount; // amount already includes qty * unit price
        const itemGST = itemTotal * item.gstPercentage / 100; // GST for the item
        return `${index + 1}. ${item.itemName} - Qty: ${item.qty}, Amount: ₹${itemTotal.toFixed(2)} (GST: ₹${itemGST.toFixed(2)})`;
      })
      .join('\n');

      // Calculate total amount with GST
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0); // Sum of all amounts
      const gstAmount = items.reduce((sum, item) => sum + (item.amount * item.gstPercentage / 100), 0); // Sum of GST for all items
      const totalAmount = subtotal + gstAmount; // Total amount including GST

      // Format total amount
      const formattedTotalAmount = `₹${totalAmount.toFixed(2)}`;

        const formattedContact = `+91${member.Contact}`;
        const smsBody = `Hi Mr. ${member.Name},\n\nInvoice Number: ${invoiceNumber}\nInvoice Date: ${new Date(invoiceDate).toLocaleDateString()}\n\nYour order details:\n${itemsMessage}\n\nTotal Amount: ${formattedTotalAmount}\n\nCheck your all billing and invoices online at\n https://noaclub.vercel.app\n and login with your credentials\n\n Email: ${member.Email}\nPassword:${member.MemberID}\n\nThank you,\nNoamundi Club`;

          
          const smsResponse = await client.messages.create({
            body: smsBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedContact,
          });
          console.log('Twilio Response:', smsResponse);

          // Return success response
          res.status(200).json({ success: true, message: 'Transaction saved successfully', data: member });

  } catch (error) {
    console.error('Error saving transaction:', error);

    // Handle Twilio-specific errors
    if (error.code === 21211) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    } else if (error.code === 21614) {
      return res.status(400).json({ success: false, message: 'This phone number is not SMS-capable' });
    }

    // Generic error response
    res.status(500).json({ success: false, message: 'Failed to save transaction', error: error.message });
  }
};

// optimized transaction list 
exports.getMemberTransactionListV2 = async (req, res) => {
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Aggregate members with filtered Transaction array
    const members = await MemberProfile.aggregate([
      {
        $project: {
          Name: 1,
          MemberID: 1,
          Pno: 1,
          Contact: 1,
          Email: 1,

          // Filter Transaction array inside each member
          Transaction: {
            $filter: {
              input: '$Transaction',
              as: 'transaction',
              cond: {
                // transaction.FromDate <= now and transaction.ToDate >= twoMonthsAgo
                $and: [
                  { $lte: ['$$transaction.FromDate', new Date()] },
                  { $gte: ['$$transaction.ToDate', twoMonthsAgo] }
                ]
              }
            }
          }
        }
      },
      // Optionally filter out members with zero transactions after filtering
      {
        $match: {
          'Transaction.0': { $exists: true }
        }
      }
    ]);

    if (!members.length) {
      return res.status(404).json({ message: 'No transactions found in last 2 months' });
    }

    // Flatten transactions from members as you currently do
    const allTransactions = members.flatMap(member =>
      member.Transaction.map(transaction => ({
        memberName: member.Name,
        memberID: member.MemberID,
        memberPno: member.Pno,
        memberContact: member.Contact,
        memberEmail: member.Email,
        ...transaction,
      }))
    );

    if (allTransactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    res.status(200).json({
      message: 'Transactions fetched successfully',
      transactions: allTransactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

exports.getNextMemberId = async (req, res) => {
  try {
    // Fetch all member IDs (only MemberID field)
    const allMembers = await MemberProfile.find()
      .select('MemberID -_id')
      .lean();

    // Extract numeric part into a sorted array of numbers
    const memberNumbers = allMembers
      .map(m => {
        const match = m.MemberID.match(/P-(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(num => num !== null)
      .sort((a, b) => a - b);

    // Find the smallest missing number starting from 1
    let nextSeq = 1;
    for (let i = 0; i < memberNumbers.length; i++) {
      if (memberNumbers[i] === nextSeq) {
        nextSeq++;
      } else if (memberNumbers[i] > nextSeq) {
        // Found a gap, break the loop
        break;
      }
    }

    // Format the new ID
    const newId = `P-${nextSeq.toString().padStart(4, '0')}`;

    res.status(200).json({ success: true, memberId: newId });

  } catch (error) {
    console.error('Error generating member ID:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate member ID',
    });
  }
};



// report generation for members 
MonthlyConsumptionReportController = {
  // Flag to prevent concurrent execution
  isRunning: false,
  
  // Main function to trigger the report generation and sending
  async sendMonthlyConsumptionReports() {
    try {
      // Prevent multiple runs
      if (this.isRunning) {
        console.log("Report generation already in progress - skipping");
        return;
      }
      
      this.isRunning = true;
      console.log("Starting monthly consumption report generation...");
      
      // Calculate date ranges
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Get the 17th of last month
      const startDate = new Date(currentYear, currentMonth - 1, 17);
      
      // Get the 18th of current month
      const endDate = new Date(currentYear, currentMonth, 18);
      
      // Format dates for display
      const formattedStartDate = moment(startDate).format("MMMM Do, YYYY");
      const formattedEndDate = moment(endDate).format("MMMM Do, YYYY");
      
      // Get all active members
      const members = await MemberProfile.find({ 
        MembershipStatus: "active",
        Transaction: { $exists: true, $not: { $size: 0 } } 
      });
      
      if (!members.length) {
        console.log("No active members with transactions found.");
        return;
      }
      
      // Process each member's transactions
      for (const member of members) {
        try {
          const report = await this.generateMemberReport(member, startDate, endDate);
          
          if (report && report.totalAmount > 0) {
            await this.sendReportEmail(member, report, formattedStartDate, formattedEndDate);
            console.log(`Report sent to ${member.Email}`);
          } else {
            console.log(`No transactions found for ${member.Name} in the specified period`);
          }
        } catch (error) {
          console.error(`Error processing member ${member.MemberID}:`, error);
        }
      }
      
      console.log("Monthly consumption report process completed.");
    } catch (error) {
      console.error("Error in sendMonthlyConsumptionReports:", error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  },
  
  // Generate consumption report for a single member
  async generateMemberReport(member, startDate, endDate) {
    const report = {
      memberName: member.Name,
      memberId: member.MemberID,
      period: {
        start: startDate,
        end: endDate
      },
      transactions: [],
      itemsConsumed: {},
      totalAmount: 0,
      totalGST: 0,
      itemCategories: {}
    };
    
    // Process each transaction within the date range
    for (const monthlyTransaction of member.Transaction) {
      // Check if this monthly transaction falls within our date range
      const transactionMonth = new Date(monthlyTransaction.FromDate);
      if (transactionMonth >= startDate && transactionMonth <= endDate) {
        
        // Process each invoice in the monthly transaction
        for (const invoice of monthlyTransaction.TransactionList) {
          const invoiceDate = new Date(invoice.invoiceDate);
          
          // Only include invoices within our exact date range
          if (invoiceDate >= startDate && invoiceDate <= endDate) {
            const invoiceEntry = {
              invoiceNumber: invoice.invoiceNumber,
              date: invoice.invoiceDate,
              items: [],
              subtotal: 0,
              gst: 0,
              total: 0
            };
            
            // Process each item in the invoice
            for (const item of invoice.items) {
              invoiceEntry.subtotal += item.amount;
              invoiceEntry.gst += (item.amount * item.gstPercentage) / 100;
              
              // Add to items consumed summary
              if (!report.itemsConsumed[item.itemName]) {
                report.itemsConsumed[item.itemName] = {
                  quantity: 0,
                  totalAmount: 0,
                  gst: 0
                };
              }
              report.itemsConsumed[item.itemName].quantity += item.qty;
              report.itemsConsumed[item.itemName].totalAmount += item.amount;
              report.itemsConsumed[item.itemName].gst += (item.amount * item.gstPercentage) / 100;
              
              // Add to category summary if itemGroup exists
              if (item.itemGroup !== undefined) {
                if (!report.itemCategories[item.itemGroup]) {
                  report.itemCategories[item.itemGroup] = {
                    totalAmount: 0,
                    count: 0
                  };
                }
                report.itemCategories[item.itemGroup].totalAmount += item.amount;
                report.itemCategories[item.itemGroup].count += item.qty;
              }
              
              invoiceEntry.items.push({
                name: item.itemName,
                quantity: item.qty,
                rate: item.purchaseRate || item.amount / item.qty,
                amount: item.amount,
                gstPercentage: item.gstPercentage
              });
            }
            
            invoiceEntry.total = invoiceEntry.subtotal + invoiceEntry.gst;
            report.totalAmount += invoiceEntry.total;
            report.totalGST += invoiceEntry.gst;
            report.transactions.push(invoiceEntry);
          }
        }
      }
    }
    
    return report;
  },
  
  // Send the report via email
  async sendReportEmail(member, report, formattedStartDate, formattedEndDate) {
    const emailSubject = `Your Monthly Consumption Report (${formattedStartDate} - ${formattedEndDate})`;
    
    // Format items consumed for display
    const itemsList = Object.entries(report.itemsConsumed)
      .map(([name, data]) => 
        `${name} (Qty: ${data.quantity}, Amount: ₹${data.totalAmount.toFixed(2)}, GST: ₹${data.gst.toFixed(2)})`
      )
      .join("<br>");
    
    // Format categories if they exist
    let categoriesSection = "";
    if (Object.keys(report.itemCategories).length > 0) {
      categoriesSection = `
        <h3>Consumption by Category:</h3>
        <ul>
          ${Object.entries(report.itemCategories)
            .map(([category, data]) => 
              `<li>Category ${category}: ${data.count} items (₹${data.totalAmount.toFixed(2)})</li>`
            )
            .join("")}
        </ul>
      `;
    }

    // Send email notification
    const transport = generateMailTransporter();
    await transport.sendMail({
      from: process.env.NODE_MAILER_USERNAME,
      to: member.Email,
      subject: emailSubject,
      html: generateMonthlyReport(formattedStartDate, formattedEndDate, member, report, itemsList, categoriesSection),
    });
  },
  
  // Schedule this to run on the 28th of each month at 10:00 AM
  scheduleMonthlyReports() {
    // Using node-cron for more reliable scheduling
    cron.schedule('0 10 28 * *', async () => {
      console.log('Running scheduled monthly consumption reports...');
      await this.sendMonthlyConsumptionReports();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });
    
    console.log("Monthly reports scheduled to run on the 28th of each month at 10:00 AM");
  },
  
  // Manual trigger for testing
  async manualTrigger() {
    console.log("Manually triggering monthly reports...");
    await this.sendMonthlyConsumptionReports();
  }
};

// Initialize the scheduler when your app starts
exports.initializeMonthlyReports = function() {
  MonthlyConsumptionReportController.scheduleMonthlyReports();
  // MonthlyConsumptionReportController.manualTrigger()
};

