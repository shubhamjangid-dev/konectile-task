const cron = require('node-cron');
const MemberProfile = require('../models/memberProfile');
const Transaction = require('../models/Transactions'); 

// Function to generate monthly report
const generateMonthlyReport = async () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    const members = await MemberProfile.find({});

    for (const member of members) {
      const transactions = member.Transaction.filter(transaction => {
        return transaction.FromDate >= firstDayOfMonth && transaction.ToDate <= lastDayOfMonth;
      });

      if (transactions.length > 0) {
        const monthlyReport = new Transaction({
          MemberID: member.MemberID, 
          Month: `${now.getFullYear()}-${now.getMonth() + 1}`,
          FromDate: firstDayOfMonth,
          ToDate: lastDayOfMonth,
          TransactionList: transactions.flatMap(t => t.TransactionList),
        });

        await monthlyReport.save(); 
      }
    }

    console.log('Monthly report generated successfully.');
  } catch (error) {
    console.error('Error generating monthly report:', error);
  }
};

// Schedule the cron job to run on the 18th of every month at midnight
cron.schedule('0 0 18 * *', () => {
  console.log('Running monthly report generation on the 18th of the month...');
  generateMonthlyReport();
});

module.exports = { generateMonthlyReport };