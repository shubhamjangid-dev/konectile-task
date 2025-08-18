const twilio = require('twilio');
const { generateMailTransporter, generateOTP } = require('../utils/email');
const { sendError } = require('../utils/helper');
const { SendInvoiceAndBillingInfo } = require('../utils/EmailTemplate');
const MemberProfile = require('../models/memberProfile');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendMessageOnWhatsapp = async(req, res) =>{

  const {to,message} = req.body;
  try {
    const response = await client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:${to}`
    });
    console.log(`Message sent: ${response.sid}`);
} catch (error) {
    console.error(`Error sending message: ${error.message}`);
}
}

exports.sendSMSOnPhone = async (req, res) => {
  try {
    const { Name, contact, items, invoiceNumber, invoiceDate } = req.body;

    if (!Name || !contact || !items || !Array.isArray(items) || !invoiceNumber || !invoiceDate) {
      return sendError(res, 'Name, contact, items (as an array), invoiceNumber, and invoiceDate are required', 400);
    }

    const memberProfile = await MemberProfile.findOne({ Contact: contact });
    if (!memberProfile) {
      return sendError(res, 'Not a registered club member', 404);
    }

    const formattedInvoiceDate = new Date(invoiceDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    let itemsMessage = 'Your order details:\n';
    let totalAmount = 0;

    items.forEach((item, index) => {
      itemsMessage += `${index + 1}. ${item.itemName} - Qty: ${item.qty}, Amount: ₹${item.amount}\n`;
      totalAmount += item.qty * item.amount;
    });

    itemsMessage += `\nTotal Amount: ₹${totalAmount}`;

    const formattedContact = `+91${contact}`;

    const response = await client.messages.create({
      body: `Greetings Mr. ${Name},\n\nInvoice Number: ${invoiceNumber}\nInvoice Date: ${formattedInvoiceDate}\n\n${itemsMessage}\n\ncheckout more at :https://noaclub.vercel.app by logging with your email(${memberProfile.Email}) and memberID(${memberProfile.MemberID}) \n\nThank you\nNoamundi Club`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedContact,
    });
    console.log('Twilio Response:', response);

    res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      twilioResponse: response,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);


    if (error.code === 21211) {
      return sendError(res, 'Invalid phone number', 400);
    } else if (error.code === 21614) {
      return sendError(res, 'This phone number is not SMS-capable', 400);
    }

    sendError(res, 'Failed to send SMS', 500);
  }
};


// for testing purpose only
exports.sendEmailNotification = async(req,res) =>{

  const {email} = req.body;

  if(!email) return sendError(res, "Email is required!");
  
    var transport = generateMailTransporter();

    const items = [
      {name:"Ganja ",qunatity: 1, rate:24, amount:30},
      {name:"Cigrate 1",qunatity: 1, rate:24, amount:30}
    ]

      transport.sendMail({
        from: process.env.NODE_MAILER_USERNAME,
        to: email,
        subject:"Order Invoice",
        html: SendInvoiceAndBillingInfo(name,pno,invoiceDate, invoiceNumber,items)
      });

      res.json({success : true, message: "Email sent successfully!"})
}