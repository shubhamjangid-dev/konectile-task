const cron = require('node-cron');
const RenderPayment = require('../models/Render-Payment');
const logger = require('../utils/logger');

class PaymentResetService {
  constructor() {
    this.initScheduler();
  }

  initScheduler() {
    // Run at 12:05 AM on the 28th of every month
    cron.schedule('5 0 28 * *', async () => {
      try {
        logger.info('Starting monthly payment status reset...');
        
        // Reset all unpaid payments from previous month
        const result = await RenderPayment.updateMany(
          { 
            isPaid: true,
            nextDueDate: { 
              $lte: new Date() // Due date has passed
            } 
          },
          { 
            $set: { isPaid: false },
            $currentDate: { lastResetDate: true }
          }
        );
        
        logger.info(`Reset ${result.modifiedCount} payment records`);
        
        // Update next due date for all records
        await this.updateNextDueDates();
        
      } catch (error) {
        logger.error('Error in payment reset job:', error);
      }
    });
  }

  async updateNextDueDates() {
    try {
      const now = new Date();
      let nextMonth = now.getMonth() + 1;
      let year = now.getFullYear();
      
      if (nextMonth > 11) {
        nextMonth = 0;
        year++;
      }
      
      const nextDueDate = new Date(year, nextMonth, 28);
      
      await RenderPayment.updateMany(
        {},
        { $set: { nextDueDate } }
      );
      
      logger.info('Updated next due dates for all payment records');
    } catch (error) {
      logger.error('Error updating next due dates:', error);
    }
  }
}

module.exports = new PaymentResetService();

