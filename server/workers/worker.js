import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import { 
  processCreateDeployment, 
  processCleanupDeployment, 
  processSessionCleanup,
  processDeploymentHealthCheck 
} from '../jobs/deploymentJobs.js';

// Redis connection for worker
const workerRedis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

// Redis connection for job queue
const queueRedis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

// Create queue instance for job scheduling
const jobQueue = new Queue('vite-deployment-queue', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGODB_URL || 'mongodb://localhost:27018/viteapp';
    await mongoose.connect(mongoURL);
    console.log('Worker: MongoDB connected successfully');
  } catch (error) {
    console.error('Worker: MongoDB connection error:', error);
    process.exit(1);
  }
};

console.log('🔍 WORKER DEBUG: Creating worker instance...');

const worker = new Worker('vite-deployment-queue', async (job) => {
  console.log(`🔥 WORKER DEBUG: Processing job: ${job.name} with ID: ${job.id}`);
  console.log(`🔥 WORKER DEBUG: Job data:`, JSON.stringify(job.data, null, 2));
  
  try {
    let result;
    
    switch (job.name) {
      case 'create-deployment':
        console.log('🔥 WORKER DEBUG: Calling processCreateDeployment');
        result = await processCreateDeployment(job);
        break;
      case 'cleanup-deployment':
        console.log('🔥 WORKER DEBUG: Calling processCleanupDeployment');
        result = await processCleanupDeployment(job);
        break;
      case 'session-cleanup':
        console.log('🔥 WORKER DEBUG: Calling processSessionCleanup');
        result = await processSessionCleanup(job);
        break;
      case 'deployment-health-check':
        console.log('🔥 WORKER DEBUG: Calling processDeploymentHealthCheck');
        result = await processDeploymentHealthCheck(job);
        break;
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
    
    console.log(`🔥 WORKER DEBUG: Job ${job.id} completed successfully:`, result);
    return result;
    
  } catch (error) {
    console.error(`🔥 WORKER DEBUG: Job ${job.id} failed:`, error);
    throw error;
  }
}, {
  connection: workerRedis,
  concurrency: 3,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
});

console.log('🔍 WORKER DEBUG: Worker instance created');

worker.on('completed', (job, result) => {
  console.log(`🔥 WORKER DEBUG: ✅ Job completed: ${job.id} (${job.name})`, result);
});

worker.on('failed', (job, err) => {
  console.error(`🔥 WORKER DEBUG: ❌ Job failed: ${job?.id} (${job?.name})`, err);
});

worker.on('error', (err) => {
  console.error('🔥 WORKER DEBUG: Worker error:', err);
});

worker.on('ready', () => {
  console.log('🔥 WORKER DEBUG: Worker is ready and waiting for jobs');
});

worker.on('active', (job) => {
  console.log(`🔥 WORKER DEBUG: Job ${job.id} is now active`);
});

worker.on('waiting', (job) => {
  console.log(`🔥 WORKER DEBUG: Job ${job.id} is waiting`);
});

worker.on('stalled', (jobId) => {
  console.log(`🔥 WORKER DEBUG: Job ${jobId} stalled`);
});

worker.on('progress', (job, progress) => {
  console.log(`🔥 WORKER DEBUG: Job ${job.id} progress: ${progress}`);
});

// Periodic job scheduling
setInterval(async () => {
  try {
    // Schedule session cleanup every 5 minutes
    await jobQueue.add('session-cleanup', {}, {
      repeat: { every: 5 * 60 * 1000 } // 5 minutes
    });
  } catch (error) {
    console.error('Error scheduling session cleanup:', error);
  }
}, 5 * 60 * 1000);

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker gracefully');
  await worker.close();
  await jobQueue.close();
  await mongoose.connection.close();
  await workerRedis.quit();
  await queueRedis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker gracefully');
  await worker.close();
  await jobQueue.close();
  await mongoose.connection.close();
  await workerRedis.quit();
  await queueRedis.quit();
  process.exit(0);
});

const startWorker = async () => {
  try {
    await connectDB();
    console.log('🔧 Vite Deployment Worker started and listening for jobs...');
    console.log('📝 Handling jobs: create-deployment, cleanup-deployment, session-cleanup, deployment-health-check');
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
};

startWorker();