exports.generateOTPVerificationEmail = (otp) => {
    const currentYear = new Date().getFullYear();
    const supportEmail = "support@konectile.com";
    const validityMinutes = 5;
    const logoUrl = "https://www.konectile.com/ims-logo.png";
  
    return `
      <html lang="en">
      <head>
        <style>
          /* Base styles */
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            color: #333333;
          }
          
          /* Email container */
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          
          /* Header */
          .header {
            background-color: #3f51b5;
            padding: 20px;
            text-align: center;
          }
          
          .logo-img {
            height: 60px;
            width: auto;
            margin-bottom: 10px;
          }
          
          .logo-text {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            margin-top: 10px;
            display: block;
          }
          
          /* Content */
          .content {
            padding: 30px;
          }
          
          h1 {
            color: #2c3e50;
            margin-top: 0;
            font-size: 24px;
            text-align: center;
          }
          
          .otp-container {
            margin: 30px 0;
            text-align: center;
          }
          
          .otp-code {
            display: inline-block;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 5px;
            color: #3f51b5;
            background-color: #f0f4ff;
            padding: 15px 25px;
            border-radius: 6px;
            border: 1px dashed #3f51b5;
          }
          
          .note {
            background-color: #fff8e1;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
          }
          
          /* Footer */
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #eeeeee;
          }
          
          .footer a {
            color: #3f51b5;
            text-decoration: none;
          }
          
          /* Responsive */
          @media only screen and (max-width: 600px) {
            .content {
              padding: 20px;
            }
            
            .otp-code {
              font-size: 24px;
              padding: 12px 20px;
            }
            
            .logo-img {
              height: 50px;
            }
            
            .logo-text {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Konectile Logo" class="logo-img">
            <span class="logo-text">Konectile</span>
          </div>
          
          <div class="content">
            <h1>OTP Verification</h1>
            
            <p>Dear Member,</p>
            
            <p>We've received a request to verify your account. Please use the following One-Time Password (OTP) to complete your verification:</p>
            
            <div class="otp-container">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p>This OTP is valid for ${validityMinutes} minutes. Please do not share this code with anyone.</p>
            
            <div class="note">
              <strong>Note:</strong> If you didn't request this OTP, please ignore this email or contact our support team immediately at <a href="mailto:${supportEmail}">${supportEmail}</a>.
            </div>
            
            <p>Thank you for being a valued member!</p>
            
            <p>Best regards,<br>Team Konectile</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${currentYear} Konectile. All rights reserved.</p>
            <p>
              <a href="mailto:${supportEmail}">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
};


exports.SendInvoiceAndBillingInfo = (name, pno, invoiceDate, invoiceNumber, items) => {
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = items.reduce((sum, item) => sum + (item.amount * item.gstPercentage / 100), 0);
    const total = subtotal + gstAmount;

    // Format date
    const formattedDate = new Date(invoiceDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

  return `
  <html>
  <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
  body {
      font-family: 'Segoe UI', Roboto, -apple-system, sans-serif;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      color: #333333;
      background-color: #f7fafc;
  }
  .invoice-container {
      max-width: 100%;
      width: 100%;
      margin: 0 auto;
      background: white;
  }
  .header {
      padding: 20px;
      color: inherit;
      text-align: center;
  }
  .logo {
      height: 70px;
      margin-bottom: 10px;
  }
  .company-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 5px;
  }
  .invoice-title {
      font-size: 24px;
      font-weight: 700;
      margin: 15px 0 5px;
  }
  .invoice-number {
      font-size: 14px;
      opacity: 0.9;
  }
  .details-container {
      padding: 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
  }
  .detail-box {
      flex: 1;
      min-width: 200px;
  }
  .label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
  }
  .value {
      font-size: 14px;
      margin-bottom: 15px;
  }
  .status {
      display: inline-block;
      padding: 4px 8px;
      background-color: #d97706;
      color: white;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
  }
  table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 20px;
      font-size: 14px;
  }
  th {
      text-align: left;
      padding: 12px 15px;
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 600;
  }
  td {
      padding: 12px 15px;
      border-bottom: 1px solid #e2e8f0;
  }
  .text-right {
      text-align: right;
  }
  .totals {
      margin-top: 20px;
      margin-left: auto;
      width: 100%;
      max-width: 300px;
  }
  .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
  }
  .total-label {
      font-weight: 500;
  }
  .total-value {
      font-weight: 500;
  }
  .grand-total {
      font-weight: 700;
      font-size: 16px;
      color: #2563eb;
  }
  .payment-info {
      background-color: #fffbeb;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #d97706;
  }
  .payment-info-title {
      font-weight: 600;
      color: #d97706;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
  }
  .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
  }
  @media only screen and (max-width: 600px) {
      .details-container {
          flex-direction: column;
          gap: 15px;
      }
      th, td {
          padding: 8px 10px;
          font-size: 13px;
      }
      .header {
          padding: 15px;
      }
      .invoice-title {
          font-size: 20px;
      }
  }
  </style>
  </head>
  <body>
  <div class="invoice-container">
  <div class="header">
      <img src="https://www.konectile.com/ims-logo.png" alt="Konectile" class="logo">
      <div class="company-name">Konectile</div>
  </div>

  <div style="padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
      <h1 class="invoice-title">INVOICE</h1>
      <div class="invoice-number">${invoiceNumber}</div>
  </div>

  <div class="details-container" style="border-bottom: 1px solid #e2e8f0;">
      <div class="detail-box">
          <div class="label">Billed To</div>
          <div class="value">${name}</div>
          <div class="label">P.No</div>
          <div class="value">${pno}</div>
      </div>
      
      <div class="detail-box">
          <div class="label">Invoice Date</div>
          <div class="value">${formattedDate}</div>
          <div class="label">Status</div>
          <div class="value"><span class="status">Payment Due</span></div>
      </div>
      
      <div class="detail-box">
          <div class="label">Payment Method</div>
          <div class="value">Salary Deduction</div>
          <div class="label">Due Date</div>
          <div class="value">Next Pay Cycle</div>
      </div>
  </div>

  <div style="padding: 20px;">
      <table>
          <thead>
              <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">GST</th>
                  <th class="text-right">Amount</th>
              </tr>
          </thead>
          <tbody>
              ${items.map(item => {
                  const unitPrice = item.amount / item.qty;
                  return `
                  <tr>
                      <td>${item.itemName}</td>
                      <td class="text-right">${item.qty}</td>
                      <td class="text-right">₹${unitPrice.toFixed(2)}</td>
                      <td class="text-right">${item.gstPercentage}%</td>
                      <td class="text-right">₹${item.amount.toFixed(2)}</td>
                  </tr>
                  `;
              }).join('')}
          </tbody>
      </table>
      
      <div class="totals">
          <div class="total-row">
              <div class="total-label">Subtotal </div>
              <div class="total-value">&ensp; ₹${subtotal.toFixed(2)}</div>
          </div>
          <div class="total-row">
              <div class="total-label">GST </div>
              <div class="total-value">&ensp; ₹${gstAmount.toFixed(2)}</div>
          </div>
          <div class="total-row" style="border-bottom: none;">
              <div class="total-label">Total Due </div>
              <div class="total-value grand-total">&ensp; ₹${total.toFixed(2)}</div>
          </div>
      </div>
      
      <div class="payment-info">
          <div class="payment-info-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#d97706">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              Payment Notice
          </div>
          <p style="margin: 0; font-size: 13px;">
              This amount will be automatically deducted from your next salary payment. 
              Please contact HR if you have any questions about this deduction.
          </p>
      </div>
  </div>

  <div class="footer">
      <div style="margin-bottom: 8px;">
          <img src="https://www.konectile.com/ims-logo.png" alt="Konectile" style="height: 30px; opacity: 0.7;">
      </div>
      <div>Powering efficiency with AI driven solutions</div>
      <div style="margin-top: 8px;">
          <strong>Konectile</strong> | www.konectile.com | support@konectile.com
      </div>
  </div>
  </div>
  </body>
  </html>`;
};


exports.SendOrderNotAcceptedNotification = (name, pno, invoiceDate, invoiceNumber, reason = "") => {
    return `
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            width: 80%;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .order-details {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #fff9f9;
            border-left: 4px solid #ff6b6b;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 0.8em;
            color: #777;
        }
        .button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 12px 24px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 10px 0;
            cursor: pointer;
            border-radius: 8px;
            background-color: #ff6b6b;
        }
        .button-container{
            text-align: center;
            margin-top: 20px;
        }
        .reason-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #ffc107;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Order Not Accepted</h1>
        </div>
        
        <p>Dear ${name},</p>
        
        <p>We regret to inform you that your recent order could not be accepted at this time.</p>
        
        <div class="order-details">
            <p><strong>Order Reference:</strong> ${invoiceNumber}</p>
            <p><strong>Date:</strong> ${invoiceDate}</p>
            <p><strong>Member ID:</strong> ${pno}</p>
        </div>
        
        <div class="reason-box">
            <p><strong>Reason:</strong> ${reason || "Please contact our support team for more information about your order status."}</p>
            <p>If you believe this is an error or would like more information, please don't hesitate to contact us.</p>
        </div>
        
        <p>We apologize for any inconvenience this may have caused and appreciate your understanding.</p>
        
        <div class="button-container">
            <a href="${`http://ims.konectile.com`}" class="button">Contact Support</a>
        </div>

        <div class="footer">
            <p>Thank you for your continued support!</p>
            <p>&copy; ${new Date().getFullYear()} Konectile</p>
        </div>
    </div>
    </body>
    </html>`;
};

exports.SendOrderAcceptedNotification = (name, pno, orderDate, orderNumber, items, estimatedDelivery = "") => {
    // Calculate totals (same as your invoice template)
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = items.reduce((sum, item) => sum + (item.amount * item.gstPercentage / 100), 0);
    const total = subtotal + gstAmount;

    return `
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            width: 80%;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            color: #4CAF50;
        }
        .order-details {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9fff9;
            border-left: 4px solid #4CAF50;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 0.8em;
            color: #777;
        }
        .button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 12px 24px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 10px 0;
            cursor: pointer;
            border-radius: 8px;
        }
        .button-container{
            text-align: center;
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .total {
            text-align: right;
            font-weight: bold;
        }
        .delivery-info {
            background-color: #f0f8ff;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #2196F3;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
            <p>Your order has been successfully accepted!</p>
        </div>
        
        <p>Dear ${name},</p>
        
        <p>Thank you for your order. We're preparing your items and will notify you when they're on their way.</p>
        
        <div class="order-details">
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <p><strong>Member ID:</strong> ${pno}</p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>GST</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                <tr>
                    <td>${item.itemName}</td>
                    <td>${item.qty}</td>
                    <td>₹${(item.amount/item.qty).toFixed(2)}</td>
                    <td>${item.gstPercentage}%</td>
                    <td>₹${item.amount.toFixed(2)}</td>
                </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4" class="total">Subtotal:</td>
                    <td>₹${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="4" class="total">GST:</td>
                    <td>₹${gstAmount.toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="4" class="total"><strong>Order Total:</strong></td>
                    <td><strong>₹${total.toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>
        
        ${estimatedDelivery ? `
        <div class="delivery-info">
            <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
            <p>We'll send tracking information once your order ships.</p>
        </div>
        ` : ''}
        
        <p>If you have any questions about your order, please reply to this email or contact our support team.</p>
        
        <div class="button-container">
            <a href="${`http://ims.konectile.com/orders/${orderNumber}`}" class="button">View Order Status</a>
        </div>

        <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>&copy; ${new Date().getFullYear()} Konectile</p>
        </div>
    </div>
    </body>
    </html>`;
};

exports.generatePasswordChangedEmail = (name) => {
    const currentYear = new Date().getFullYear();
    const supportEmail = "support@konectile.com";
    const logoUrl = "https://www.konectile.com/ims-logo.png";
  
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Password Updated Successfully</title>
        <style>
          /* Base styles - matching existing design */
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            color: #333333;
          }
          
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          
          .header {
            background-color: #3f51b5;
            padding: 20px;
            text-align: center;
          }
          
          .logo-img {
            height: 60px;
            width: auto;
            margin-bottom: 10px;
          }
          
          .logo-text {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            margin-top: 10px;
            display: block;
          }
          
          .content {
            padding: 30px;
          }
          
          h1 {
            color: #2c3e50;
            margin-top: 0;
            font-size: 24px;
            text-align: center;
          }
          
          .success-icon {
            text-align: center;
            font-size: 60px;
            color: #4CAF50;
            margin: 20px 0;
          }
          
          .note {
            background-color: #e8f5e9;
            border-left: 4px solid #4CAF50;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
            border-radius: 0 4px 4px 0;
          }
          
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #eeeeee;
          }
          
          .footer a {
            color: #3f51b5;
            text-decoration: none;
          }
          
          @media only screen and (max-width: 600px) {
            .content {
              padding: 20px;
            }
            
            .logo-img {
              height: 50px;
            }
            
            .logo-text {
              font-size: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Konectile Logo" class="logo-img">
            <span class="logo-text">Konectile</span>
          </div>
          
          <div class="content">
            <div class="success-icon">✓</div>
            <h1>Password Changed Successfully</h1>
            
            <p>Dear ${name},</p>
            
            <p>Your Konectile account password has been successfully updated.</p>
            
            <div class="note">
              <strong>Security Tip:</strong> If you didn't make this change, please contact our support team immediately at <a href="mailto:${supportEmail}">${supportEmail}</a>.
            </div>
            
            <p>For your security, we recommend:</p>
            <ul>
              <li>Using a unique password that you don't use elsewhere</li>
              <li>Updating your password regularly</li>
              <li>Enabling two-factor authentication if available</li>
            </ul>
            
            <p>Thank you for helping keep your account secure!</p>
            
            <p>Best regards,<br>Team Konectile</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${currentYear}  Konectile. All rights reserved.</p>
            <p>
              <a href="mailto:${supportEmail}">Contact Support</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

exports.generateLoginAlertEmail = (user, loginInfo) => {
  const { deviceInfo, ipAddress, location, isFirstLogin } = loginInfo;
  const currentYear = new Date().getFullYear();
  const supportEmail = "support@konectile.com";
  const loginTime = new Date().toLocaleString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    timeZoneName: 'short'
  });

  // Dynamic gradient colors matching your design
  const gradientColors = {
    primary: "#FF0099",
    secondary: "#FFD700",
    gradient: "linear-gradient(45deg, #FF0099 30%, #FFD700 90%)"
  };

  // Device icon mapping
  const getDeviceIcon = () => {
    const device = (deviceInfo.device || '').toLowerCase();
    if (device.includes('iphone') || device.includes('mobile')) return '📱';
    if (device.includes('mac') || device.includes('apple')) return '💻';
    if (device.includes('windows')) return '🖥️';
    if (device.includes('tablet') || device.includes('ipad')) return '📱';
    return '🖥️';
  };

  const subject = isFirstLogin 
    ? `✨ Welcome to Konectile! First Login Detected` 
    : `🔐 New Login Alert: ${deviceInfo.device || 'New Device'} Detected`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary: ${gradientColors.primary};
          --secondary: ${gradientColors.secondary};
          --gradient: ${gradientColors.gradient};
          --success: #10B981;
          --warning: #F59E0B;
          --danger: #EF4444;
          --dark: #111827;
          --gray: #6B7280;
          --light-gray: #F9FAFB;
          --white: #FFFFFF;
          --radius-lg: 24px;
          --radius-md: 16px;
          --radius-sm: 8px;
          --shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          --transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }
        
        body {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background-color: var(--light-gray);
          color: var(--dark);
          -webkit-font-smoothing: antialiased;
        }
        
        .email-container {
          max-width: 640px;
          margin: 40px auto;
          background: var(--white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .header {
          background: var(--gradient);
          padding: 40px 32px;
          text-align: center;
          color: var(--white);
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          transform: rotate(30deg);
          pointer-events: none;
        }
        
        .logo {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 16px;
          display: inline-block;
          letter-spacing: -0.5px;
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
          position: relative;
          z-index: 1;
        }
        
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(5px);
          margin-top: 16px;
        }
        
        .content {
          padding: 48px 40px;
        }
        
        .greeting {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 32px;
          color: var(--dark);
          position: relative;
          display: inline-block;
        }
        
        .greeting::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 60px;
          height: 4px;
          background: var(--gradient);
          border-radius: 2px;
        }
        
        .alert-card {
          background: ${isFirstLogin ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
          border-radius: var(--radius-md);
          padding: 32px;
          margin-bottom: 40px;
          position: relative;
          overflow: hidden;
          transition: var(--transition);
          border: 1px solid ${isFirstLogin ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'};
        }
        
        .alert-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
          background: ${isFirstLogin ? 'var(--success)' : 'var(--warning)'};
        }
        
        .alert-title {
          font-weight: 700;
          margin: 0 0 12px 0;
          color: ${isFirstLogin ? 'var(--success)' : 'var(--warning)'};
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .alert-message {
          margin: 0;
          color: var(--dark);
          font-size: 16px;
          line-height: 1.7;
        }
        
        .info-section {
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 24px 0;
          color: var(--dark);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .section-title::before {
          content: "";
          display: inline-block;
          width: 24px;
          height: 3px;
          background: var(--gradient);
          border-radius: 3px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .info-card {
          background: var(--light-gray);
          border-radius: var(--radius-md);
          padding: 24px;
          transition: var(--transition);
          border: 1px solid rgba(0, 0, 0, 0.03);
          position: relative;
          overflow: hidden;
        }
        
        .info-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow);
          border-color: var(--primary);
        }
        
        .info-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: var(--gradient);
          opacity: 0;
          transition: var(--transition);
        }
        
        .info-card:hover::before {
          opacity: 1;
        }
        
        .info-icon {
          font-size: 24px;
          margin-bottom: 16px;
          color: var(--primary);
        }
        
        .info-label {
          font-size: 13px;
          color: var(--gray);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }
        
        .info-value {
          font-weight: 600;
          color: var(--dark);
          font-size: 16px;
          margin: 0;
        }
        
        .location-card {
          background: rgba(99, 102, 241, 0.05);
          border-radius: var(--radius-md);
          padding: 32px;
          margin-bottom: 40px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(99, 102, 241, 0.1);
        }
        
        .location-pin {
          position: absolute;
          right: 20px;
          top: 20px;
          font-size: 80px;
          opacity: 0.1;
          color: var(--primary);
          z-index: 0;
        }
        
        .location-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          position: relative;
          z-index: 1;
        }
        
        .location-item {
          background: rgba(255, 255, 255, 0.7);
          border-radius: var(--radius-sm);
          padding: 16px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .location-label {
          font-size: 12px;
          color: var(--gray);
          margin-bottom: 6px;
          font-weight: 500;
        }
        
        .location-value {
          font-weight: 600;
          color: var(--dark);
          font-size: 15px;
        }
        
        .action-section {
          text-align: center;
          margin: 48px 0;
        }
        
        .action-title {
          font-size: 18px;
          color: var(--gray);
          margin-bottom: 24px;
          position: relative;
          display: inline-block;
        }
        
        .action-title::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 3px;
          background: var(--gradient);
          border-radius: 3px;
        }
        
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient);
          color: var(--white);
          padding: 16px 32px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: var(--transition);
          box-shadow: 0 4px 12px rgba(255, 0, 153, 0.2);
          border: none;
          cursor: pointer;
          gap: 8px;
          margin: 0 8px;
        }
        
        .button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(255, 0, 153, 0.3);
        }
        
        .button-outline {
          background: transparent;
          color: var(--primary);
          border: 2px solid var(--primary);
          box-shadow: none;
        }
        
        .button-outline:hover {
          background: rgba(255, 0, 153, 0.05);
          transform: translateY(-2px);
        }
        
        .security-card {
          background: rgba(239, 68, 68, 0.05);
          border-radius: var(--radius-md);
          padding: 32px;
          margin: 48px 0;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(239, 68, 68, 0.1);
        }
        
        .security-title {
          color: var(--danger);
          font-weight: 700;
          margin: 0 0 20px 0;
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .security-list {
          margin: 0;
          padding-left: 20px;
        }
        
        .security-list li {
          margin-bottom: 12px;
          color: var(--dark);
          position: relative;
          padding-left: 24px;
          line-height: 1.7;
        }
        
        .security-list li::before {
          content: "•";
          color: var(--danger);
          font-size: 24px;
          position: absolute;
          left: 0;
          top: -2px;
        }
        
        .footer {
          background: var(--dark);
          padding: 48px 32px;
          text-align: center;
          color: var(--white);
          position: relative;
          overflow: hidden;
        }
        
        .footer::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 50%);
          pointer-events: none;
        }
        
        .footer-logo {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
          display: inline-block;
          color: var(--white);
        }
        
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        
        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.2s ease;
          font-size: 14px;
        }
        
        .footer-link:hover {
          color: var(--white);
        }
        
        .footer-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          margin: 8px 0;
          line-height: 1.6;
        }
        
        @media only screen and (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          
          .header {
            padding: 32px 24px;
          }
          
          .header h1 {
            font-size: 26px;
          }
          
          .content {
            padding: 32px 24px;
          }
          
          .button {
            width: 100%;
            margin-bottom: 12px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">Konectile</div>
          <h1>${isFirstLogin ? 'Welcome to Konectile' : 'Security Alert'}</h1>
          <div class="status-badge">${isFirstLogin ? 'First Login' : 'New Device'}</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${user.name.split(' ')[0] || 'there'},</div>
          
          <div class="alert-card">
            <h3 class="alert-title">
              ${isFirstLogin ? '🎉 Welcome to Konectile!' : '🔒 New login detected'}
            </h3>
            <p class="alert-message">
              ${isFirstLogin 
                ? `We're excited to have you on board! This email confirms your first successful login to your Konectile account at ${loginTime}.`
                : `We noticed a recent login to your Konectile account from a ${deviceInfo.device || 'new device'} at ${loginTime}. If this was you, no action is required.`
              }
            </p>
          </div>
          
          <div class="info-section">
            <h3 class="section-title">Login Details</h3>
            <div class="info-grid">
              <div class="info-card">
                <div class="info-icon">🕒</div>
                <div class="info-label">Login Time</div>
                <div class="info-value">${loginTime}</div>
              </div>
              
              <div class="info-card">
                <div class="info-icon">📶</div>
                <div class="info-label">IP Address</div>
                <div class="info-value">${ipAddress}</div>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <h3 class="section-title">Device Information</h3>
            <div class="info-grid">
              <div class="info-card">
                <div class="info-icon">${getDeviceIcon()}</div>
                <div class="info-label">Device Type</div>
                <div class="info-value">${deviceInfo.device || 'Unknown'}</div>
              </div>
              
              <div class="info-card">
                <div class="info-icon">🌐</div>
                <div class="info-label">Browser</div>
                <div class="info-value">${deviceInfo.browser || 'Unknown'}</div>
              </div>
              
              <div class="info-card">
                <div class="info-icon">💻</div>
                <div class="info-label">Operating System</div>
                <div class="info-value">${deviceInfo.os || 'Unknown'}</div>
              </div>
            </div>
          </div>
          
          ${location ? `
            <div class="location-card">
              <div class="location-pin">📍</div>
              <h3 class="section-title">Approximate Location</h3>
              <div class="location-grid">
                <div class="location-item">
                  <div class="location-label">City</div>
                  <div class="location-value">${location.city || 'Unknown'}</div>
                </div>
                <div class="location-item">
                  <div class="location-label">Country</div>
                  <div class="location-value">${location.country || 'Unknown'}</div>
                </div>
                ${location.region ? `
                  <div class="location-item">
                    <div class="location-label">Region</div>
                    <div class="location-value">${location.region}</div>
                  </div>
                ` : ''}
                ${location.timezone ? `
                  <div class="location-item">
                    <div class="location-label">Timezone</div>
                    <div class="location-value">${location.timezone}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <div class="action-section">
            <p class="action-title">Was this you?</p>
            <a href="#" class="button">
              <span>✅ Yes, it was me</span>
            </a>
            <a href="#" class="button button-outline">
              <span>🚨 No, secure my account</span>
            </a>
          </div>
          
          ${!isFirstLogin ? `
            <div class="security-card">
              <h3 class="security-title">
                <span>🚨 Security Recommendations</span>
              </h3>
              <ul class="security-list">
                <li><strong>Change your password</strong> immediately if you don't recognize this activity</li>
                <li><strong>Enable two-factor authentication</strong> for enhanced account protection</li>
                <li><strong>Review connected devices</strong> in your account settings</li>
                <li><strong>Contact support</strong> at ${supportEmail} if you notice suspicious activity</li>
              </ul>
            </div>
          ` : ''}
          
          ${isFirstLogin ? `
            <div style="text-align: center; margin: 48px 0 24px;">
              <a href="#" class="button" style="padding: 18px 40px; font-size: 18px;">
                <span>🚀 Get Started with Konectile</span>
              </a>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <div class="footer-logo">Konectile</div>
          <div class="footer-links">
            <a href="#" class="footer-link">Help Center</a>
            <a href="#" class="footer-link">Privacy Policy</a>
            <a href="#" class="footer-link">Terms of Service</a>
          </div>
          <p class="footer-text">
            &copy; ${currentYear} Konectile Technologies, Inc. All rights reserved.
          </p>
          <p class="footer-text">
            123 Security Lane, San Francisco, CA 94107
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};


exports.generateMonthlyReport = (
  formattedStartDate,
  formattedEndDate,
  member,
  report,
  itemsList,
  categoriesSection
) => {
  // Helper: Format date
  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // Helper: Map category code to readable name
  function mapCategory(code) {
    switch (String(code)) {
      case '5':
        return 'Dining';
      case '3':
        return 'Alcohol';
      case '6':
        return 'Snacks';
      default:
        return 'Others';
    }
  }

  // Family members
  const familyRows = (member.FamilyMember || [])
    .map((fm) => `<tr><td>${fm.Name}</td><td>${fm.Relation}</td></tr>`)
    .join('');

  // Category breakdown
  const categoryRows = Object.entries(report.itemCategories)
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
    .map(([category, data]) => {
      const percent = ((data.totalAmount / report.totalAmount) * 100).toFixed(1);
      return `
        <tr>
          <td>${mapCategory(category)}</td>
          <td>₹${data.totalAmount.toFixed(2)}</td>
          <td>
            <div class="bar-bg">
              <div class="bar-fill" style="width:${percent}%"></div>
            </div>
            <span class="bar-label">${percent}%</span>
          </td>
        </tr>
      `;
    })
    .join('');

  // Transaction table (Category replaced with Quantity)
  const transactionRows = report.transactions
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((transaction) => {
      const date = formatDate(transaction.date);
      const items = transaction.items.map((item) => item.name).join(', ');
      // Sum quantity for all items in this transaction
      const totalQuantity = transaction.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      return `
        <tr>
          <td>${date}</td>
          <td>${items}</td>
          <td>${totalQuantity}</td>
          <td>₹${transaction.total.toFixed(2)}</td>
          <td>₹${transaction.gst.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  // Top category
  const topCategoryCode = Object.entries(report.itemCategories)
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount)[0][0];
  const topCategory = mapCategory(topCategoryCode);

  // Member since
  const memberSince = member.MemberSince ? formatDate(member.MemberSince) : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Monthly Financial Report | Konectile</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6C5CE7;
      --accent: #E84393;
      --text: #2D3436;
      --text-light: #636E72;
      --background: #F7F8FA;
      --card-bg: #FFF;
      --border: #ECECEC;
    }
    body {
      font-family: 'Poppins', sans-serif;
      background: var(--background);
      color: var(--text);
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 900px;
      margin: 40px auto;
      background: var(--card-bg);
      border-radius: 18px;
      box-shadow: 0 8px 32px rgba(108,92,231,0.10);
      padding: 40px 32px 32px 32px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-weight: 800;
      font-size: 32px;
      color: var(--primary);
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .report-title {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .report-period {
      color: var(--text-light);
      font-size: 15px;
      margin-bottom: 2px;
    }
    .report-meta {
      color: var(--text-light);
      font-size: 13px;
      margin-bottom: 0;
    }
    .member-details {
      margin: 24px 0 12px 0;
      background: #F9F9FF;
      border-radius: 10px;
      padding: 18px 18px 8px 18px;
      font-size: 15px;
      color: var(--text);
      box-shadow: 0 2px 8px rgba(108,92,231,0.04);
    }
    .member-details strong {
      color: var(--primary);
      font-weight: 600;
      margin-right: 8px;
    }
    .family-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 0 0;
      background: #F9F9FF;
      border-radius: 8px;
      overflow: hidden;
      font-size: 15px;
    }
    .family-table th, .family-table td {
      padding: 7px 10px;
      text-align: left;
    }
    .family-table th {
      background: #F2F2FB;
      color: var(--primary);
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      border-bottom: 2px solid var(--border);
    }
    .family-table tr:not(:last-child) td {
      border-bottom: 1px solid var(--border);
    }
    .summary-cards {
      display: flex;
      gap: 20px;
      justify-content: space-between;
      margin: 32px 0 20px 0;
      flex-wrap: wrap;
    }
    .card {
      flex: 1 1 180px;
      min-width: 180px;
      margin: 10px;
      padding: 20px 18px 14px 18px;
      box-shadow: 0 4px 16px rgba(108,92,231,0.07);
      text-align: center;
      position: relative;
    }
    .card .label {
      font-size: 13px;
      font-weight: 500;
      opacity: 0.85;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .card .value {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -1px;
    }
    .bar-table {
      width: 100%;
      border-collapse: collapse;
      margin: 28px 0 40px 0;
      background: var(--background);
      border-radius: 10px;
      overflow: hidden;
    }
    .bar-table th, .bar-table td {
      padding: 12px 10px;
      text-align: left;
      font-size: 15px;
    }
    .bar-table th {
      background: #F2F2FB;
      color: var(--primary);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      border-bottom: 2px solid var(--border);
    }
    .bar-table tr:not(:last-child) td {
      border-bottom: 1px solid var(--border);
    }
    .bar-bg {
      background: #ECECEC;
      border-radius: 6px;
      width: 120px;
      height: 10px;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
      overflow: hidden;
    }
    .bar-fill {
      background: linear-gradient(90deg, var(--primary), var(--accent));
      height: 100%;
      border-radius: 6px;
    }
    .bar-label {
      font-size: 13px;
      color: var(--text-light);
      vertical-align: middle;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--primary);
      margin: 38px 0 14px 0;
      letter-spacing: 1px;
    }
    .transaction-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--background);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 30px;
    }
    .transaction-table th, .transaction-table td {
      padding: 10px 8px;
      text-align: left;
      font-size: 15px;
    }
    .transaction-table th {
      background: #F2F2FB;
      color: var(--primary);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      border-bottom: 2px solid var(--border);
    }
    .transaction-table tr:not(:last-child) td {
      border-bottom: 1px solid var(--border);
    }
    .add-cta {
      text-align: center;
      margin: 40px 0 0 0;
    }
    .add-btn {
      display: inline-block;
      color: white;
      font-weight: 700;
      font-size: 16px;
      padding: 14px 38px;
      border-radius: 30px;
      text-decoration: none;
      box-shadow: 0 4px 16px rgba(108,92,231,0.13);
      transition: background 0.2s, transform 0.2s;
      margin-top: 10px;
    }

    @media (max-width: 700px) {
      .container { padding: 16px 2vw; }
      .summary-cards { flex-direction: column; gap: 10px; }
      .card { min-width: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">Konectile</div>
      <div class="report-title">Monthly Financial Report</div>
      <div class="report-period">${formattedStartDate} – ${formattedEndDate}</div>
      <div class="report-meta">Member ID: ${member.MemberID} • ${report.transactions.length} Orders</div>
    </div>
    <!-- Member Details -->
    <div class="member-details">
      <div><strong>Name:</strong> ${member.Name}</div>
      <div><strong>Contact:</strong> ${member.Contact}</div>
      <div><strong>Email:</strong> ${member.Email}</div>
      <div><strong>Membership Status:</strong> ${member.MembershipStatus}</div>
      <div><strong>Member Since:</strong> ${memberSince}</div>
      ${familyRows ? `
      <div style="margin-top:16px;">
        <strong>Family Members:</strong>
        <table class="family-table">
          <thead>
            <tr><th>Name</th><th>Relation</th></tr>
          </thead>
          <tbody>
            ${familyRows}
          </tbody>
        </table>
      </div>
      ` : ''}
    </div>
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card">
        <div class="label">Total Spent</div>
        <div class="value">₹${report.totalAmount.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="label">GST</div>
        <div class="value">₹${report.totalGST.toFixed(2)}</div>
      </div>
    </div>
    <!-- Category Breakdown -->
    <div class="section-title">Category-wise Spending</div>
    <table class="bar-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Amount</th>
          <th>Share</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRows}
      </tbody>
    </table>
    <!-- Transactions Table -->
    <div class="section-title">Date-wise Transactions</div>
    <table class="transaction-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Items</th>
          <th>Quantity</th>
          <th>Amount</th>
          <th>GST</th>
        </tr>
      </thead>
      <tbody>
        ${transactionRows}
      </tbody>
    </table>
    <!-- Add Transaction CTA -->
    <div class="add-cta">
      <div style="color:var(--text-light);font-size:15px;margin-bottom:10px;">
        For any dispute or clarification, please contact our support team.
      </div>
      <a class="add-btn" href="ims.konectile.com">Log In</a>

      <p> Team Konectile </p>
    </div>
  </div>
</body>
</html>
  `;
};


