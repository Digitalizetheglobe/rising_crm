import cron from 'node-cron';
import { markOverduePaymentsService } from '../modules/payments/payment.service';
import { logger } from '../config/logger';

// Runs daily at midnight — marks all Pending payments past dueDate as Overdue
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await markOverduePaymentsService();
    logger.info(`[Cron] Overdue payments marked: ${result.markedOverdue}`);
  } catch (error) {
    logger.error('[Cron] Failed to mark overdue payments:', error);
  }
});