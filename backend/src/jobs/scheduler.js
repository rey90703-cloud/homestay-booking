const cron = require('node-cron');
const cleanupExpiredHolds = require('./cleanupExpiredHolds');

/**
 * Initialize all scheduled jobs
 */
function initializeScheduler() {
  console.log('[Scheduler] Initializing scheduled jobs...');

  // Run cleanup every 5 minutes
  // Cron format: */5 * * * * = every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Scheduler] Running cleanup expired holds job...');
    try {
      const result = await cleanupExpiredHolds();
      console.log(`[Scheduler] Cleanup completed: ${result.cancelled} bookings cancelled`);
    } catch (error) {
      console.error('[Scheduler] Cleanup job failed:', error);
    }
  });

  console.log('[Scheduler] Scheduled jobs initialized successfully');
  console.log('[Scheduler] - Cleanup expired holds: Every 5 minutes');
}

module.exports = { initializeScheduler };
