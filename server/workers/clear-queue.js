import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

const clearQueue = async () => {
  try {
    const queue = new Queue('vite-deployment-queue', { connection: redis });
    
    console.log('🧹 Clearing all jobs from vite-deployment-queue...');
    
    // First, get counts
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();
    
    console.log(`Jobs found - Waiting: ${waiting.length}, Active: ${active.length}, Completed: ${completed.length}, Failed: ${failed.length}`);
    
    // Stop active jobs
    if (active.length > 0) {
      console.log('⏹️  Stopping active jobs...');
      for (const job of active) {
        try {
          await job.moveToFailed(new Error('Queue cleared by admin'), '0');
        } catch (e) {
          console.log(`Could not fail job ${job.id}: ${e.message}`);
        }
      }
    }
    
    // Clear all job types
    await queue.clean(0, 'waiting');
    await queue.clean(0, 'active'); 
    await queue.clean(0, 'completed');
    await queue.clean(0, 'failed');
    
    console.log('✅ Queue cleared successfully!');
    
    // Close connections
    await queue.close();
    await redis.quit();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing queue:', error);
    process.exit(1);
  }
};

clearQueue();