// Enhanced Multi-Framework IDE Server with MongoDB, BullMQ & Terminal Persistence
import express from 'express';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import WebSocket from 'ws';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import pty from 'node-pty';
import os from 'os';
import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Import MongoDB models
import Deployment from './models/Deployment.js';
import Session from './models/Session.js';
import Terminal from './models/Terminal.js';
import DevServerProcess from './models/DevServerProcess.js';
import UsedSubdomain from './models/UsedSubdomain.js';
import User from './models/User.js';

// Import auth middleware and API routes
import { authenticate, optionalAuth, authorizeRole } from './middleware/authMiddleware.js';
import apiRoutes from './routes/api.js';
import firebaseFileService from './services/firebaseFileService.js';

const execPromise = promisify(exec);
const app = express();
const PORT = process.env.PORT || 8000;

// Docker Registry Configuration
const DOCKER_REGISTRY = 'vivekvenugopal513071';
const BASE_IMAGE_TAG = 'vite-framework';

// Redis and BullMQ setup
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

export const jobQueue = new Queue('vite-deployment-queue', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Enhanced Framework configurations (EXACT SAME AS ORIGINAL)
const FRAMEWORKS = {
  // JavaScript Frameworks
  react: {
    template: 'react',
    fileExtensions: ['.js', '.jsx', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '⚛️',
    name: 'React',
    description: 'React with JavaScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:react`,
    status: 'stable'
  },
  'react-ts': {
    template: 'react-ts',
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '⚛️',
    name: 'React TypeScript',
    description: 'React with TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:react-ts`,
    status: 'stable'
  },
  vue: {
    template: 'vue',
    fileExtensions: ['.js', '.vue', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🟢',
    name: 'Vue.js',
    description: 'Vue.js with JavaScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:vue`,
    status: 'stable'
  },
  'vue-ts': {
    template: 'vue-ts',
    fileExtensions: ['.js', '.vue', '.ts', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🟢',
    name: 'Vue TypeScript',
    description: 'Vue.js with TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:vue-ts`,
    status: 'stable'
  },
  svelte: {
    template: 'svelte',
    fileExtensions: ['.js', '.svelte', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🧡',
    name: 'Svelte',
    description: 'Svelte with JavaScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:svelte`,
    status: 'stable'
  },
  'svelte-ts': {
    template: 'svelte-ts',
    fileExtensions: ['.js', '.svelte', '.ts', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🧡',
    name: 'Svelte TypeScript',
    description: 'Svelte with TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:svelte-ts`,
    status: 'stable'
  },
  // Lightweight/Alternative Frameworks
  preact: {
    template: 'preact',
    fileExtensions: ['.js', '.jsx', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '💜',
    name: 'Preact',
    description: 'Fast 3kB alternative to React',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:preact`,
    status: 'stable'
  },
  'preact-ts': {
    template: 'preact-ts',
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '💜',
    name: 'Preact TypeScript',
    description: 'Preact with TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:preact-ts`,
    status: 'stable'
  },
  solid: {
    template: 'solid',
    fileExtensions: ['.js', '.jsx', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🔷',
    name: 'Solid.js',
    description: 'Simple and performant reactivity',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:solid`,
    status: 'stable'
  },
  'solid-ts': {
    template: 'solid-ts',
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🔷',
    name: 'Solid TypeScript',
    description: 'Solid.js with TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:solid-ts`,
    status: 'stable'
  },
  // Web Components
  lit: {
    template: 'lit',
    fileExtensions: ['.js', '.ts', '.css', '.html', '.json', '.md'],
    devPort: 5173,
    icon: '🔥',
    name: 'Lit',
    description: 'Simple. Fast. Web Components.',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:lit`,
    status: 'stable'
  },
  'lit-ts': {
    template: 'lit-ts',
    fileExtensions: ['.js', '.ts', '.css', '.html', '.json', '.md'],
    devPort: 5173,
    icon: '🔥',
    name: 'Lit TypeScript',
    description: 'Lit with TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:lit-ts`,
    status: 'stable'
  },
  // Vanilla/Pure
  vanilla: {
    template: 'vanilla',
    fileExtensions: ['.js', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🍦',
    name: 'Vanilla',
    description: 'Pure JavaScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:vanilla`,
    status: 'stable'
  },
  'vanilla-ts': {
    template: 'vanilla-ts',
    fileExtensions: ['.js', '.ts', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🍦',
    name: 'Vanilla TypeScript',
    description: 'Pure TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:vanilla-ts`,
    status: 'stable'
  }
};

// Framework categories for better organization
const FRAMEWORK_CATEGORIES = {
  'Popular React-like': ['react', 'react-ts', 'preact', 'preact-ts'],
  'Vue Ecosystem': ['vue', 'vue-ts'],
  'Svelte Ecosystem': ['svelte', 'svelte-ts'],
  'Modern Alternatives': ['solid', 'solid-ts'],
  'Web Components': ['lit', 'lit-ts'],
  'Vanilla/Pure': ['vanilla', 'vanilla-ts']
};

// In-memory maps for WebSocket connections and active terminals (non-persistent data)
let terminals = new Map(); // deploymentId -> { terminal, lastActivity, sessionIds }

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGODB_URL || 'mongodb://localhost:27018/viteapp';
    await mongoose.connect(mongoURL);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
app.use(cors());

// Mount API routes
app.use('/api', apiRoutes);

// Cleanup intervals
setInterval(() => {
  cleanupInactiveSessions();
}, 5 * 60 * 1000);

setInterval(() => {
  cleanupUnusedDeployments();
}, 10 * 60 * 1000);

setInterval(() => {
  cleanupDuplicateDeployments();
}, 15 * 60 * 1000); // Clean duplicates every 15 minutes

// Utility functions
function generateRandomId() {
  return crypto.randomBytes(4).toString('hex');
}

function isValidSubdomain(subdomain) {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  return subdomainRegex.test(subdomain);
}

function getFrameworkConfig(framework) {
  return FRAMEWORKS[framework] || FRAMEWORKS.react;
}

// Update vite.config.js to use the current deployment ID for HMR host
function updateViteConfigForDeployment(configContent, deploymentId) {
  try {
    // Check if the config already has HMR configuration
    const hasHmrConfig = configContent.includes('hmr:');
    const hasServerConfig = configContent.includes('server:');
    
    if (hasHmrConfig) {
      // Replace existing HMR host with current deployment ID
      const hmrHostRegex = /host:\s*['"`]([^'"`]*\.koolify\.site)['"`]/g;
      const newContent = configContent.replace(hmrHostRegex, `host: '${deploymentId}.koolify.site'`);
      
      if (newContent !== configContent) {
        console.log(`✅ Updated existing HMR host to ${deploymentId}.koolify.site`);
        return newContent;
      }
    }
    
    if (hasServerConfig && !hasHmrConfig) {
      // Add HMR config to existing server config
      const serverConfigRegex = /(server:\s*{[^}]*)(}\s*)/;
      const match = configContent.match(serverConfigRegex);
      
      if (match) {
        const beforeClosing = match[1];
        const afterClosing = match[2];
        
        // Check if server config already has content
        const hasServerContent = beforeClosing.trim().length > 'server: {'.length;
        const separator = hasServerContent ? ',\n    ' : '\n    ';
        
        const hmrConfig = `${separator}hmr: {
      host: '${deploymentId}.koolify.site',
      protocol: 'wss'
    }`;
        
        const newContent = configContent.replace(
          serverConfigRegex,
          beforeClosing + hmrConfig + '\n  ' + afterClosing
        );
        
        console.log(`✅ Added HMR config to existing server config for ${deploymentId}.koolify.site`);
        return newContent;
      }
    }
    
    if (!hasServerConfig) {
      // Add entire server config with HMR
      const pluginsRegex = /(plugins:\s*\[[^\]]*\])/;
      const match = configContent.match(pluginsRegex);
      
      if (match) {
        const serverConfig = `,
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: '${deploymentId}.koolify.site',
      protocol: 'wss'
    }
  }`;
        
        const newContent = configContent.replace(
          pluginsRegex,
          match[1] + serverConfig
        );
        
        console.log(`✅ Added complete server config with HMR for ${deploymentId}.koolify.site`);
        return newContent;
      }
    }
    
    console.log(`⚠️ Could not update vite.config.js - unexpected format. Using original content.`);
    return configContent;
    
  } catch (error) {
    console.error(`❌ Error updating vite.config.js:`, error.message);
    return configContent;
  }
}

// Enhanced session management with MongoDB
async function registerSession(sessionId, deploymentId) {
  try {
    await Session.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        deploymentId,
        lastActivity: new Date(),
        websockets: 0,
        isActive: true
      },
      { 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );
    
    console.log(`📝 Session registered: ${sessionId} for deployment: ${deploymentId}`);
  } catch (error) {
    console.error('Error registering session:', error);
  }
}

async function updateSessionActivity(sessionId) {
  try {
    await Session.findOneAndUpdate(
      { sessionId },
      { lastActivity: new Date() }
    );
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
}

async function addWebSocketToSession(sessionId, ws) {
  try {
    await Session.findOneAndUpdate(
      { sessionId },
      { $inc: { websockets: 1 } }
    );
  } catch (error) {
    console.error('Error adding websocket to session:', error);
  }
}

async function removeWebSocketFromSession(sessionId, ws) {
  try {
    await Session.findOneAndUpdate(
      { sessionId },
      { $inc: { websockets: -1 } }
    );
  } catch (error) {
    console.error('Error removing websocket from session:', error);
  }
}

// Cleanup functions with MongoDB
async function cleanupInactiveSessions() {
  const inactiveThreshold = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes
  
  try {
    const inactiveSessions = await Session.find({
      lastActivity: { $lt: inactiveThreshold },
      isActive: true
    });
    
    for (const session of inactiveSessions) {
      console.log(`🧹 Cleaning up inactive session: ${session.sessionId}`);
      
      // Mark session as inactive
      await Session.findByIdAndUpdate(session._id, { isActive: false });
    }
  } catch (error) {
    console.error('Error cleaning up inactive sessions:', error);
  }
}

// Cleanup duplicate deployments
async function cleanupDuplicateDeployments() {
  try {
    console.log('🧹 Checking for duplicate deployments...');
    
    // Find all deployments grouped by userId, projectName, and framework
    const duplicates = await Deployment.aggregate([
      {
        $group: {
          _id: {
            userId: '$userId',
            projectName: '$projectName',
            framework: '$framework'
          },
          deployments: { $push: { id: '$id', _id: '$_id', createdAt: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    for (const duplicate of duplicates) {
      console.log(`🔍 Found ${duplicate.count} duplicate deployments for ${duplicate._id.projectName} (${duplicate._id.framework})`);
      
      // Keep the most recent one, delete the rest
      const sorted = duplicate.deployments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);
      
      for (const deployment of toDelete) {
        console.log(`🗑️ Removing duplicate deployment: ${deployment.id}`);
        
        try {
          // Clean up Kubernetes resources
          await deleteViteDeployment(deployment.id);
          
          // Remove from database
          await Deployment.findByIdAndDelete(deployment._id);
          await UsedSubdomain.findOneAndDelete({ deploymentId: deployment.id });
          await Terminal.findOneAndDelete({ deploymentId: deployment.id });
          await DevServerProcess.findOneAndDelete({ deploymentId: deployment.id });
          
          // Clean up in-memory terminal connections
          if (terminals.has(deployment.id)) {
            const terminalData = terminals.get(deployment.id);
            if (terminalData.terminal && terminalData.terminal.kill) {
              terminalData.terminal.kill();
            }
            terminals.delete(deployment.id);
          }
        } catch (error) {
          console.error(`Error cleaning duplicate deployment ${deployment.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up duplicate deployments:', error);
  }
}

async function cleanupUnusedDeployments() {
  const unusedThreshold = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
  
  try {
    const deployments = await Deployment.find({
      createdAt: { $lt: unusedThreshold }
    });
    
    for (const deployment of deployments) {
      const hasActiveSessions = await Session.exists({
        deploymentId: deployment.id,
        isActive: true
      });
      
      if (!hasActiveSessions) {
        console.log(`🗑️ Auto-cleaning unused deployment: ${deployment.id} (${deployment.projectName})`);
        
        try {
          await deleteViteDeployment(deployment.id);
          
          // Remove from database
          await Deployment.findByIdAndDelete(deployment._id);
          await UsedSubdomain.findOneAndDelete({ deploymentId: deployment.id });
          await Terminal.findOneAndDelete({ deploymentId: deployment.id });
          await DevServerProcess.findOneAndDelete({ deploymentId: deployment.id });
          
          // Clean up in-memory terminal connections
          if (terminals.has(deployment.id)) {
            const terminalData = terminals.get(deployment.id);
            if (terminalData.terminal && terminalData.terminal.kill) {
              terminalData.terminal.kill();
            }
            terminals.delete(deployment.id);
          }
          
        } catch (error) {
          console.error(`Error auto-cleaning deployment ${deployment.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up unused deployments:', error);
  }
}

// Helper function to check if error is due to missing deployment
function isDeploymentNotFoundError(error) {
  return error.message && (
    error.message.includes('not found') ||
    error.message.includes('NotFound') ||
    error.message.includes('array index out of bounds')
  );
}

// Helper function to check if Kubernetes deployment exists
async function checkKubernetesDeploymentExists(deploymentId) {
  try {
    const kubeCheckCommand = `kubectl get deployment vite-deployment-${deploymentId} -o name`;
    await execPromise(kubeCheckCommand);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to handle deployment state mismatch
async function handleDeploymentStateMismatch(deployment, res) {
  const deploymentId = deployment.id;
  const userId = deployment.userId;
  
  console.log(`🔧 Handling state mismatch for deployment ${deploymentId}`);
  
  try {
    // Queue recreation of the Kubernetes deployment
    const frameworkConfig = getFrameworkConfig(deployment.framework);
    
    // Queue deployment creation job
    await jobQueue.add('create-deployment', {
      deploymentId: deploymentId,
      projectName: deployment.projectName,
      framework: deployment.framework,
      frameworkConfig: frameworkConfig,
      resourceSize: deployment.resourceSize || 'medium'
    });
    
    // Update deployment status to starting
    await Deployment.findByIdAndUpdate(deployment._id, { 
      status: 'starting',
      frameworkName: frameworkConfig.name,
      frameworkIcon: frameworkConfig.icon,
      frameworkDescription: frameworkConfig.description,
      dockerImage: frameworkConfig.dockerImage,
      frameworkStatus: frameworkConfig.status
    });
    
    console.log(`✅ Queued recreation of Kubernetes deployment for ${deploymentId}`);
    
    // If we reach here, deployment recreation has been queued
    return res.status(200).json({ 
      message: 'Deployment recreation has been queued and will be processed shortly.',
      deploymentStatus: 'starting'
    });
    
  } catch (recreateError) {
    console.error(`❌ Failed to recreate deployment ${deploymentId}:`, recreateError);
    
    // Clean up orphaned database record
    await Deployment.findByIdAndDelete(deployment._id);
    await UsedSubdomain.findOneAndDelete({ deploymentId });
    await Terminal.findOneAndDelete({ deploymentId });
    await DevServerProcess.findOneAndDelete({ deploymentId });
    
    console.log(`🧹 Cleaned up orphaned deployment record ${deploymentId}`);
    
    return res.status(410).json({ 
      error: 'Deployment no longer exists and could not be restored. Please create a new deployment.',
      deploymentStatus: 'deleted',
      message: 'The deployment was removed due to infrastructure issues.'
    });
  }
}

// Retry utility function
async function retryOperation(operation, maxRetries = 5, delay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${i + 1}/${maxRetries} failed:`, error.message);
      
      // Don't retry if the deployment doesn't exist
      if (isDeploymentNotFoundError(error)) {
        console.log('Deployment not found, aborting retry attempts');
        throw error;
      }
      
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }
}

// Kubernetes utility functions
async function isDeploymentReady(deploymentId) {
  try {
    const command = `kubectl get deployment/vite-deployment-${deploymentId} -o jsonpath='{.status.readyReplicas}'`;
    const { stdout } = await execPromise(command);
    return stdout.trim() === '1';
  } catch (error) {
    return false;
  }
}

async function getPodName(deploymentId) {
  try {
    const command = `kubectl get pods -l app=vite-deployment-${deploymentId} -o jsonpath='{.items[0].metadata.name}'`;
    const { stdout } = await execPromise(command);
    return stdout.trim();
  } catch (error) {
    console.error(`Error getting pod name for ${deploymentId}:`, error);
    return null;
  }
}

async function isPodReady(podName) {
  try {
    const command = `kubectl get pod ${podName} -o jsonpath='{.status.containerStatuses[?(@.name=="vite-server")].ready}'`;
    const { stdout } = await execPromise(command);
    return stdout.trim() === 'true';
  } catch (error) {
    return false;
  }
}

// Enhanced container readiness check function
async function waitForContainerReady(deploymentId, timeout = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      // Test if we can execute a simple command in the container
      const testCommand = `kubectl exec deployment/vite-deployment-${deploymentId} -c vite-server -- echo "ready"`;
      const { stdout } = await execPromise(testCommand);
      
      if (stdout.trim() === 'ready') {
        console.log(`✅ Container vite-server is ready for deployment ${deploymentId}`);
        return true;
      }
    } catch (error) {
      // Container not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Container readiness timeout');
}

async function checkKubectl() {
  try {
    await execPromise('kubectl version --client');
    return true;
  } catch (error) {
    return false;
  }
}

// API Routes (EXACT SAME ENDPOINTS AS ORIGINAL)

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Enhanced Multi-Framework IDE Server with MongoDB & BullMQ (v3.0)', 
    supportedFrameworks: Object.keys(FRAMEWORKS),
    frameworkCategories: FRAMEWORK_CATEGORIES,
    totalFrameworks: Object.keys(FRAMEWORKS).length,
    dockerRegistry: DOCKER_REGISTRY,
    baseImageTag: BASE_IMAGE_TAG,
    version: '3.0.0',
    features: [
      'MongoDB database persistence',
      'BullMQ background job processing',
      'Terminal persistence with auto-reconnection',
      'Session-based cleanup',
      'Enhanced connection management',
      'Server state synchronization',
      'Real-time notifications'
    ],
    endpoints: {
      deployments: '/api/deployments',
      frameworks: '/api/frameworks',
      cleanup: '/api/cleanup',
      health: '/health'
    }
  });
});

// Get all available frameworks with details
app.get('/api/frameworks', (req, res) => {
  const frameworksWithCategories = Object.keys(FRAMEWORK_CATEGORIES).map(category => ({
    category,
    frameworks: FRAMEWORK_CATEGORIES[category].map(fw => ({
      id: fw,
      ...FRAMEWORKS[fw]
    }))
  }));
  
  res.json({
    total: Object.keys(FRAMEWORKS).length,
    dockerRegistry: DOCKER_REGISTRY,
    baseImageTag: BASE_IMAGE_TAG,
    categories: frameworksWithCategories,
    allFrameworks: Object.keys(FRAMEWORKS).map(fw => ({
      id: fw,
      ...FRAMEWORKS[fw]
    }))
  });
});

// Get all deployments with MongoDB (user-specific)
app.get('/api/deployments', authenticate, async (req, res) => {
  try {
    const deployments = await Deployment.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    
    // Include session activity info
    const deploymentsWithActivity = await Promise.all(deployments.map(async (deployment) => {
      const activeSessions = await Session.find({
        deploymentId: deployment.id,
        isActive: true
      });
      
      const activeSessionsList = activeSessions.map(session => ({
        sessionId: session.sessionId.slice(-6),
        lastActivity: session.lastActivity,
        websockets: session.websockets
      }));
      
      return {
        ...deployment.toObject(),
        activeSessions: activeSessionsList,
        isActive: activeSessionsList.length > 0
      };
    }));
    
    res.json(deploymentsWithActivity);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

// Get deployment by ID (user-specific)
app.get('/api/deployments/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    res.json(deployment);
  } catch (error) {
    console.error('Error fetching deployment:', error);
    res.status(500).json({ error: 'Failed to fetch deployment' });
  }
});

// Enhanced deployment creation with MongoDB and duplicate prevention
app.post('/api/deployments', authenticate, async (req, res) => {
  let finalSubdomain = null;
  
  try {
    if (!(await checkKubectl())) {
      return res.status(500).json({ error: 'kubectl is not installed or not in PATH' });
    }
    
    const { projectName, subdomain, framework = 'react', sessionId, projectId, resourceSize = 'medium' } = req.body;
    
    if (!projectName || typeof projectName !== 'string') {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    if (!FRAMEWORKS[framework]) {
      return res.status(400).json({ 
        error: `Unsupported framework: ${framework}. Supported frameworks: ${Object.keys(FRAMEWORKS).join(', ')}`,
        availableFrameworks: Object.keys(FRAMEWORKS),
        suggestion: 'Use GET /api/frameworks to see all available options'
      });
    }
    
    const cleanProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Check for existing deployment with same project name and framework by this user
    const existingDeployment = await Deployment.findOne({
      userId: req.user.userId,
      projectName: cleanProjectName,
      framework: framework
    });
    
    if (existingDeployment) {
      console.log(`🔄 Found existing deployment for ${cleanProjectName} with ${framework}: ${existingDeployment.id}`);
      
      // Update projectId if provided in request
      if (projectId && existingDeployment.projectId !== projectId) {
        console.log(`🔄 Updating existing deployment ${existingDeployment.id} with projectId: ${projectId}`);
        await Deployment.findByIdAndUpdate(existingDeployment._id, { projectId: projectId });
        existingDeployment.projectId = projectId;
      }
      
      // Verify that the Kubernetes deployment actually exists
      try {
        const kubeCheckCommand = `kubectl get deployment vite-deployment-${existingDeployment.id} -o name`;
        await execPromise(kubeCheckCommand);
        
        // Kubernetes deployment exists, return the existing deployment
        console.log(`✅ Kubernetes deployment verified for ${existingDeployment.id}`);
        return res.status(200).json({
          id: existingDeployment.id,
          projectName: existingDeployment.projectName,
          framework: existingDeployment.framework,
          frameworkName: existingDeployment.frameworkName,
          frameworkIcon: existingDeployment.frameworkIcon,
          frameworkDescription: existingDeployment.frameworkDescription,
          dockerImage: existingDeployment.dockerImage,
          frameworkStatus: existingDeployment.frameworkStatus,
          url: existingDeployment.url,
          status: existingDeployment.status,
          message: `Using existing ${existingDeployment.frameworkName} deployment`,
          isExisting: true
        });
      } catch (kubeError) {
        // Kubernetes deployment doesn't exist, but database record does
        console.log(`❌ Kubernetes deployment missing for ${existingDeployment.id}, recreating...`);
        
        try {
          // Queue recreation of the Kubernetes deployment
          const frameworkConfig = getFrameworkConfig(framework);
          
          // Queue deployment creation job
          await jobQueue.add('create-deployment', {
            deploymentId: existingDeployment.id,
            projectName: cleanProjectName,
            framework: framework,
            frameworkConfig: frameworkConfig,
            resourceSize: existingDeployment.resourceSize || 'medium'
          });
          
          // Update deployment status to starting and projectId if provided
          const updateData = { 
            status: 'starting',
            frameworkName: frameworkConfig.name,
            frameworkIcon: frameworkConfig.icon,
            frameworkDescription: frameworkConfig.description,
            dockerImage: frameworkConfig.dockerImage,
            frameworkStatus: frameworkConfig.status
          };
          
          if (projectId) {
            updateData.projectId = projectId;
          }
          
          await Deployment.findByIdAndUpdate(existingDeployment._id, updateData);
          
          console.log(`✅ Queued recreation of Kubernetes deployment for ${existingDeployment.id}`);
          
          const recreationResponse = {
            id: existingDeployment.id,
            projectName: existingDeployment.projectName,
            framework: existingDeployment.framework,
            frameworkName: frameworkConfig.name,
            frameworkIcon: frameworkConfig.icon,
            frameworkDescription: frameworkConfig.description,
            dockerImage: frameworkConfig.dockerImage,
            frameworkStatus: frameworkConfig.status,
            url: existingDeployment.url,
            status: 'starting',
            message: `Recreated missing ${frameworkConfig.name} deployment`,
            isExisting: true,
            wasRecreated: true
          };
          
          if (projectId) {
            recreationResponse.projectId = projectId;
          }
          
          return res.status(200).json(recreationResponse);
          
        } catch (recreateError) {
          console.error(`❌ Failed to recreate deployment ${existingDeployment.id}:`, recreateError);
          
          // Clean up the orphaned database record and fall through to create new deployment
          await Deployment.findByIdAndDelete(existingDeployment._id);
          await UsedSubdomain.findOneAndDelete({ deploymentId: existingDeployment.id });
          await Terminal.findOneAndDelete({ deploymentId: existingDeployment.id });
          await DevServerProcess.findOneAndDelete({ deploymentId: existingDeployment.id });
          
          console.log(`🧹 Cleaned up orphaned deployment record ${existingDeployment.id}, creating new deployment`);
        }
      }
    }
    
    if (subdomain && subdomain.trim()) {
      const cleanSubdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      if (!isValidSubdomain(cleanSubdomain)) {
        return res.status(400).json({ error: 'Invalid subdomain format' });
      }
      
      const existingSubdomain = await UsedSubdomain.findOne({ subdomain: cleanSubdomain });
      if (existingSubdomain) {
        return res.status(400).json({ error: 'Subdomain already taken' });
      }
      finalSubdomain = cleanSubdomain;
    } else {
      // Generate a unique subdomain that doesn't conflict
      do {
        finalSubdomain = generateRandomId();
      } while (await UsedSubdomain.findOne({ subdomain: finalSubdomain }));
    }
    
    const frameworkConfig = getFrameworkConfig(framework);
    
    // Create deployment in MongoDB
    const deployment = new Deployment({
      id: finalSubdomain,
      userId: req.user.userId,
      projectName: cleanProjectName,
      subdomain: finalSubdomain,
      framework: framework,
      frameworkName: frameworkConfig.name,
      frameworkIcon: frameworkConfig.icon,
      frameworkDescription: frameworkConfig.description,
      dockerImage: frameworkConfig.dockerImage,
      frameworkStatus: frameworkConfig.status,
      url: `${finalSubdomain}.koolify.site`,
      status: 'starting',
      sessionId: sessionId || 'unknown',
      projectId: projectId,
      resourceSize: resourceSize
    });
    
    await deployment.save();
    
    // Register used subdomain
    const usedSubdomain = new UsedSubdomain({
      subdomain: finalSubdomain,
      deploymentId: finalSubdomain,
      isActive: true
    });
    await usedSubdomain.save();
    
    // Register session if provided
    if (sessionId) {
      await registerSession(sessionId, finalSubdomain);
    }
    
    // Initialize dev server status
    const devServerProcess = new DevServerProcess({
      deploymentId: finalSubdomain,
      status: 'stopped'
    });
    await devServerProcess.save();
    
    // Queue deployment creation job
    await jobQueue.add('create-deployment', {
      deploymentId: finalSubdomain,
      projectName: cleanProjectName,
      framework,
      frameworkConfig,
      resourceSize
    });
    
    console.log(`🚀 Queued ${frameworkConfig.name} deployment for project: ${cleanProjectName}`);
    console.log(`🐳 Using pre-built image: ${frameworkConfig.dockerImage}`);
    console.log(`📝 Deployment ${finalSubdomain} will be processed by worker queue`);
    
    res.status(201).json({
      id: finalSubdomain,
      projectName: cleanProjectName,
      framework: framework,
      frameworkName: frameworkConfig.name,
      frameworkIcon: frameworkConfig.icon,
      frameworkDescription: frameworkConfig.description,
      dockerImage: frameworkConfig.dockerImage,
      frameworkStatus: frameworkConfig.status,
      url: deployment.url,
      status: 'starting',
      message: `${frameworkConfig.name} dev server deployment created successfully. It will be ready in 30-60 seconds!`
    });
    
  } catch (error) {
    console.error('Error creating deployment:', error);
    
    if (finalSubdomain) {
      await Deployment.findOneAndUpdate(
        { id: finalSubdomain },
        { status: 'error' }
      );
    }
    
    res.status(500).json({ 
      error: 'Failed to create deployment', 
      details: error.message 
    });
  }
});

// Enhanced cleanup endpoint with MongoDB and duplicate cleanup
app.post('/api/cleanup', async (req, res) => {
  try {
    const { deploymentId, sessionId, action } = req.body;
    
    console.log(`🧹 Cleanup request: ${action} for deployment: ${deploymentId}, session: ${sessionId}`);
    
    if (action === 'cleanup' && deploymentId && sessionId) {
      const session = await Session.findOne({ sessionId, deploymentId });
      if (session) {
        // Mark session as inactive
        await Session.findByIdAndUpdate(session._id, { isActive: false });
        
        // Check if deployment has other active sessions
        const hasOtherSessions = await Session.exists({
          deploymentId,
          isActive: true
        });
        
        if (!hasOtherSessions) {
          console.log(`🗑️ No active sessions for deployment ${deploymentId}, scheduling cleanup...`);
          
          // Queue cleanup job
          await jobQueue.add('cleanup-deployment', {
            deploymentId,
            delay: 60000 // 1 minute delay
          });
        }
      }
    } else if (action === 'duplicates') {
      // Manual duplicate cleanup
      await cleanupDuplicateDeployments();
      res.json({ message: 'Duplicate cleanup completed' });
      return;
    }
    
    res.json({ message: 'Cleanup processed' });
    
  } catch (error) {
    console.error('Error processing cleanup:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Delete deployment (manual) with MongoDB
app.delete('/api/deployments/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Manual delete request for deployment: ${id}`);
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    // Update deployment status to 'deleting' to reflect the current state in UI
    await Deployment.findOneAndUpdate(
      { id, userId: req.user.userId },
      { status: 'deleting' }
    );
    console.log(`📝 Updated deployment ${id} status to 'deleting'`);
    
    // Clean up all sessions for this deployment
    await Session.updateMany(
      { deploymentId: id },
      { isActive: false }
    );
    
    // Clean up in-memory terminal connections
    if (terminals.has(id)) {
      const terminalData = terminals.get(id);
      if (terminalData.terminal && terminalData.terminal.kill) {
        terminalData.terminal.kill();
      }
      terminals.delete(id);
    }
    
    // Delete Kubernetes resources
    await deleteViteDeployment(id);
    
    // Remove from database
    await Deployment.findByIdAndDelete(deployment._id);
    await UsedSubdomain.findOneAndDelete({ deploymentId: id });
    await Terminal.findOneAndDelete({ deploymentId: id });
    await DevServerProcess.findOneAndDelete({ deploymentId: id });
    
    console.log(`✅ Manually deleted deployment: ${id}`);
    
    res.json({ message: 'Deployment deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting deployment:', error);
    res.status(500).json({ error: 'Failed to delete deployment' });
  }
});

// File operations with MongoDB session tracking
app.get('/api/deployments/:id/files', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    // If deployment has a projectId, load files from Firebase instead of scanning container
    if (deployment.projectId) {
      try {
        console.log(`📁 Loading files from Firebase for deployment ${id} (project: ${deployment.projectId})`);
        const projectResult = await firebaseFileService.loadProject(deployment.userId, deployment.projectId);
        
        if (!projectResult.success) {
          console.error(`❌ Failed to load Firebase project ${deployment.projectId}:`, projectResult.error);
          // Fall back to container scanning if Firebase fails
        } else {
          // Convert Firebase files to the format expected by the frontend
          const files = Object.keys(projectResult.data.files).map(filePath => {
            const parts = filePath.split('/');
            return {
              name: parts[parts.length - 1],
              path: filePath,
              type: 'file'
            };
          }).filter(file => {
            // Filter out unwanted files
            return !file.path.startsWith('node_modules/') && 
                   !file.path.includes('/.git/') &&
                   !file.path.includes('/dist/') &&
                   !file.path.includes('/build/') &&
                   !file.path.includes('/.next/') &&
                   !file.path.includes('/.cache/') &&
                   !file.path.includes('.DS_Store') &&
                   !file.name.startsWith('.');
          });
          
          const tree = buildFileTree(files);
          console.log(`✅ Loaded ${files.length} files from Firebase for deployment ${id}`);
          console.log(`🔍 FIREBASE DEBUG: Files loaded from Firebase:`, files.map(f => `${f.path} (${f.name})`).slice(0, 10));
          if (files.length > 10) {
            console.log(`... and ${files.length - 10} more files`);
          }
          return res.json(tree);
        }
      } catch (firebaseError) {
        console.error(`❌ Firebase error for deployment ${id}:`, firebaseError);
        // Fall back to container scanning if Firebase fails
      }
    }
    
    // Check if Kubernetes deployment exists (fallback method)
    const kubeExists = await checkKubernetesDeploymentExists(id);
    if (!kubeExists) {
      console.log(`⚠️ Kubernetes deployment missing for files request: ${id}`);
      return await handleDeploymentStateMismatch(deployment, res);
    }
    
    console.log(`📂 Falling back to container scanning for deployment ${id}`);
    
    const operation = async () => {
      // First check if the deployment still exists
      const kubeCheckCommand = `kubectl get deployment vite-deployment-${id} -o name`;
      try {
        await execPromise(kubeCheckCommand);
      } catch (checkError) {
        console.log(`⚠️ Deployment vite-deployment-${id} not found during file scan`);
        throw new Error(`Deployment not found: vite-deployment-${id}`);
      }
      
      // Use find with BusyBox compatible commands
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c 'find /app/${id} \\( -type f -o -type d \\) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" -not -path "*/.next/*" -not -path "*/.cache/*" -not -name ".*" | while read path; do if [ -d "$path" ]; then echo "$path:d"; else echo "$path:f"; fi; done' | head -200`;
      const { stdout } = await execPromise(command);
      
      if (!stdout || stdout.trim() === '') {
        console.log(`⚠️ Empty output from container scan for deployment ${id}`);
        throw new Error(`No files found in container for deployment ${id}`);
      }
      
      return stdout;
    };
    
    let stdout;
    try {
      stdout = await retryOperation(operation, 3, 1000);
      console.log(`🔍 CONTAINER SCAN DEBUG: Raw kubectl output:`, stdout.substring(0, 500));
    } catch (scanError) {
      console.error(`❌ Container scan failed for deployment ${id}:`, scanError.message);
      
      // Check if this is an empty container (no files loaded yet)
      if (scanError.message.includes('No files found in container')) {
        console.log(`📁 Container is empty for deployment ${id} - returning empty file tree`);
        return res.json({
          type: 'directory',
          name: 'root',
          children: [],
          empty: true,
          message: 'No project files loaded yet. Please load a project or create files to get started.'
        });
      }
      
      // For other errors, handle as deployment state mismatch
      const deployment = await Deployment.findOne({ id, userId: req.user.userId });
      if (deployment) {
        return await handleDeploymentStateMismatch(deployment, res);
      }
      return res.status(500).json({ error: 'Failed to scan container files. Deployment may have been deleted.' });
    }
    
    const rawItems = stdout.trim().split('\n').filter(f => f && !f.endsWith(`/app/${id}:d`));
    console.log(`🔍 CONTAINER SCAN DEBUG: Filtered raw items count:`, rawItems.length);
    
    const items = rawItems.map(line => {
      const [itemPath, typeChar] = line.split(':');
      const relativePath = itemPath.replace(`/app/${id}/`, '');
      const parts = relativePath.split('/');
      const name = parts[parts.length - 1];
      
      return {
        name: name,
        path: relativePath,
        type: typeChar === 'd' ? 'directory' : 'file'
      };
    });
    
    console.log(`🔍 CONTAINER SCAN DEBUG: Mapped items count:`, items.length);
    console.log(`🔍 CONTAINER SCAN DEBUG: First 10 mapped items:`, items.slice(0, 10));
    
    const filteredItems = items.filter(item => {
      // Basic filtering to ensure no unwanted items
      const shouldInclude = !item.path.startsWith('node_modules/') && 
             !item.path.includes('/.git/') &&
             !item.path.includes('/dist/') &&
             !item.path.includes('/build/') &&
             !item.path.includes('/.next/') &&
             !item.path.includes('/.cache/') &&
             !item.path.includes('.DS_Store') &&
             !item.name.startsWith('.') &&
             item.path !== '' &&
             item.name !== '';
      
      if (!shouldInclude) {
        console.log(`🔍 CONTAINER SCAN DEBUG: Filtered out item:`, item);
      }
      
      return shouldInclude;
    });
    
    console.log(`🔍 CONTAINER SCAN DEBUG: Final filtered items count:`, filteredItems.length);
    console.log(`🔍 CONTAINER SCAN DEBUG: Final filtered items:`, filteredItems.slice(0, 10));
    
    const tree = buildFileTree(filteredItems);
    res.json(tree);
    
  } catch (error) {
    console.error('Error listing files:', error);
    if (isDeploymentNotFoundError(error)) {
      const deployment = await Deployment.findOne({ id, userId: req.user.userId });
      if (deployment) {
        return await handleDeploymentStateMismatch(deployment, res);
      }
    }
    res.status(500).json({ error: 'Failed to list files. Deployment may not be ready.' });
  }
});

app.get('/api/deployments/:id/file', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { path, sessionId } = req.query;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    // If deployment has a projectId, load file from Firebase instead of container
    if (deployment.projectId) {
      try {
        console.log(`📄 Loading file ${path} from Firebase for deployment ${id} (project: ${deployment.projectId})`);
        const projectResult = await firebaseFileService.loadProject(deployment.userId, deployment.projectId);
        
        if (projectResult.success && projectResult.data.files[path]) {
          const content = projectResult.data.files[path];
          console.log(`✅ Successfully loaded file ${path} from Firebase (${content.length} chars)`);
          return res.json({ content });
        } else {
          console.log(`⚠️ File ${path} not found in Firebase project ${deployment.projectId}, falling back to container`);
          // Fall back to container reading if file not found in Firebase
        }
      } catch (firebaseError) {
        console.error(`❌ Firebase error loading file ${path} for deployment ${id}:`, firebaseError);
        // Fall back to container reading if Firebase fails
      }
    }
    
    // Fall back to container reading
    console.log(`📂 Reading file ${path} from container for deployment ${id}`);
    const operation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- cat "/app/${id}/${path}"`;
      const { stdout } = await execPromise(command);
      return stdout;
    };
    
    const content = await retryOperation(operation, 3, 1000);
    res.json({ content });
    
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.put('/api/deployments/:id/file', authenticate, async (req, res) => {
  const { id } = req.params;
  const { path, content, sessionId, isDirectory = false } = req.body;
  
  try {
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const operation = async () => {
      if (isDirectory) {
        // Create directory
        const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- mkdir -p '/app/${id}/${path}'`;
        await execPromise(command);
      } else {
        // Create file - first ensure parent directory exists
        const parentDir = path.substring(0, path.lastIndexOf('/'));
        if (parentDir) {
          const mkdirCommand = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- mkdir -p '/app/${id}/${parentDir}'`;
          await execPromise(mkdirCommand);
        }
        
        const encodedContent = Buffer.from(content || '').toString('base64');
        const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "echo '${encodedContent}' | base64 -d > '/app/${id}/${path}'"`;
        await execPromise(command);
      }
    };
    
    await retryOperation(operation, 3, 1000);
    res.json({ message: `${isDirectory ? 'Folder' : 'File'} saved successfully` });
    
  } catch (error) {
    console.error(`Error saving ${isDirectory ? 'folder' : 'file'}:`, error);
    res.status(500).json({ error: `Failed to save ${isDirectory ? 'folder' : 'file'}` });
  }
});

app.delete('/api/deployments/:id/file', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { path } = req.query;
    const { sessionId } = req.body;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    // If deployment has a projectId, delete file from Firebase as well
    if (deployment.projectId) {
      try {
        console.log(`🗑️ Deleting file ${path} from Firebase for deployment ${id} (project: ${deployment.projectId})`);
        const result = await firebaseFileService.deleteFile(deployment.userId, deployment.projectId, path);
        
        if (result.success) {
          console.log(`✅ Successfully deleted file ${path} from Firebase`);
        } else {
          console.log(`⚠️ Failed to delete file ${path} from Firebase, continuing with container deletion`);
        }
      } catch (firebaseError) {
        console.error(`❌ Firebase error deleting file ${path} for deployment ${id}:`, firebaseError);
        // Continue with container deletion even if Firebase fails
      }
    }
    
    // Delete file from container
    console.log(`🗑️ Deleting file ${path} from container for deployment ${id}`);
    const operation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- rm -f "/app/${id}/${path}"`;
      await execPromise(command);
    };
    
    await retryOperation(operation, 3, 1000);
    res.json({ message: 'File deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Load Firebase project files into deployment using kubectl - Enhanced with robust file transfer
app.post('/api/deployments/:id/load-project', authenticate, async (req, res) => {
  // Using already imported modules from top of file
  
  try {
    const { id } = req.params;
    const { projectFiles, sessionId } = req.body;
    
    console.log(`🔍 LOAD-PROJECT DEBUG: Starting load-project for deployment ${id}`);
    console.log(`🔍 LOAD-PROJECT DEBUG: Request body keys:`, Object.keys(req.body));
    console.log(`🔍 LOAD-PROJECT DEBUG: ProjectFiles type:`, typeof projectFiles);
    console.log(`🔍 LOAD-PROJECT DEBUG: ProjectFiles is object:`, projectFiles && typeof projectFiles === 'object');
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      console.log(`❌ LOAD-PROJECT ERROR: Deployment ${id} not found for user ${req.user.userId}`);
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    console.log(`🔍 LOAD-PROJECT DEBUG: Found deployment ${id}, status: ${deployment.status}`);
    
    if (deployment.status !== 'ready') {
      console.log(`❌ LOAD-PROJECT ERROR: Deployment ${id} not ready, status: ${deployment.status}`);
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    // Check if Kubernetes deployment exists before attempting file operations
    const kubeExists = await checkKubernetesDeploymentExists(id);
    if (!kubeExists) {
      console.log(`⚠️ Kubernetes deployment missing for load-project request: ${id}`);
      return await handleDeploymentStateMismatch(deployment, res);
    }
    
    // Get the actual pod name instead of using deployment name
    const podName = await getPodName(id);
    if (!podName) {
      console.log(`❌ LOAD-PROJECT ERROR: Could not get pod name for deployment ${id}`);
      return res.status(500).json({ error: 'Pod not found' });
    }
    console.log(`🔍 LOAD-PROJECT DEBUG: Using pod name: ${podName}`);
    
    if (!projectFiles || typeof projectFiles !== 'object') {
      console.log(`❌ LOAD-PROJECT ERROR: Invalid project files for deployment ${id}:`, {
        projectFiles: projectFiles ? 'exists' : 'missing',
        type: typeof projectFiles,
        isObject: projectFiles && typeof projectFiles === 'object'
      });
      return res.status(400).json({ error: 'Project files are required' });
    }
    
    const fileEntries = Object.entries(projectFiles);
    let successCount = 0;
    let failedFiles = [];
    const tempDir = `/tmp/project-transfer-${id}-${Date.now()}`;
    
    console.log(`🔍 LOAD-PROJECT DEBUG: Received ${fileEntries.length} files for deployment ${id}`);
    console.log(`🔍 LOAD-PROJECT DEBUG: Files to transfer:`, fileEntries.map(([path, content]) => `${path} (${content.length} bytes)`).slice(0, 5));
    if (fileEntries.length > 5) {
      console.log(`... and ${fileEntries.length - 5} more files`);
    }
    
    try {
      // Create temporary directory for file staging
      await fs.mkdir(tempDir, { recursive: true });
      
      // First, clear the existing project directory intelligently to avoid node_modules issues
      console.log(`Clearing existing project directory for deployment ${id}`);
      
      // Smart clearing strategy: preserve node_modules if it exists and is healthy
      const smartClearCommand = `kubectl exec ${podName} -c vite-server -- sh -c "
        cd /app/${id} 2>/dev/null || { mkdir -p /app/${id}; exit 0; }
        
        # Check if node_modules exists and is not corrupted
        if [ -d node_modules ] && [ -f node_modules/.bin/vite ] 2>/dev/null; then
          echo 'Preserving healthy node_modules directory'
          # Remove everything except node_modules
          find . -mindepth 1 -maxdepth 1 ! -name 'node_modules' -exec rm -rf {} + 2>/dev/null || true
        else
          echo 'Clearing all files including node_modules'
          # Use more robust removal method
          find . -mindepth 1 -delete 2>/dev/null || {
            # Fallback: remove items one by one
            for item in .*  *; do
              if [ \"\$item\" != '.' ] && [ \"\$item\" != '..' ]; then
                rm -rf \"\$item\" 2>/dev/null || true
              fi
            done
          }
        fi
        
        # Ensure the directory exists and is accessible
        mkdir -p /app/${id}
        chmod 755 /app/${id}
      "`;
      
      console.log(`🗑️ KUBECTL DEBUG: Executing smart clear command`);
      try {
        await execPromise(smartClearCommand);
        console.log(`✅ Successfully cleared project directory for deployment ${id}`);
      } catch (clearError) {
        console.warn(`❌ Warning: Could not clear existing directory:`, clearError.message);
        
        // Fallback: try basic directory recreation
        try {
          console.log(`🔄 Attempting fallback directory recreation for deployment ${id}`);
          const fallbackCommand = `kubectl exec ${podName} -c vite-server -- sh -c "mkdir -p /app/${id} && chmod 755 /app/${id}"`;
          await execPromise(fallbackCommand);
          console.log(`✅ Fallback directory recreation successful for deployment ${id}`);
        } catch (fallbackError) {
          console.error(`❌ Critical: Could not ensure directory exists for deployment ${id}:`, fallbackError.message);
        }
      }
      
      // Group files by directory to avoid race conditions
      const directoryMap = new Map();
      fileEntries.forEach(([filePath, content]) => {
        const dirPath = path.dirname(filePath);
        if (!directoryMap.has(dirPath)) {
          directoryMap.set(dirPath, []);
        }
        directoryMap.get(dirPath).push([filePath, content]);
      });
      
      // Create all directories first with improved error handling
      const uniqueDirs = Array.from(directoryMap.keys()).filter(dir => dir !== '.');
      if (uniqueDirs.length > 0) {
        console.log(`Creating ${uniqueDirs.length} directories...`);
        
        // First, verify container is still accessible
        try {
          await execPromise(`kubectl exec ${podName} -c vite-server -- echo "container-check"`);
          console.log(`✅ Container vite-server is ready for deployment ${id}`);
        } catch (containerError) {
          console.error(`❌ Container not accessible for deployment ${id}:`, containerError.message);
          throw new Error(`Container not accessible: ${containerError.message}`);
        }
        
        for (const dirPath of uniqueDirs) {
          const safeDirPath = dirPath.replace(/'/g, "'\"'\"'");
          const mkdirCommand = `kubectl exec ${podName} -c vite-server -- mkdir -p '/app/${id}/${safeDirPath}'`;
          
          try {
            await retryOperation(async () => {
              await execPromise(mkdirCommand);
            }, 2, 1000);
            
          } catch (error) {
            console.warn(`Warning: Failed to create directory ${dirPath}:`, error.message);
            
            // If it's a container connection error, check container status
            if (error.message.includes('container not found') || error.message.includes('unable to upgrade connection')) {
              console.error(`❌ Container connection lost for deployment ${id}. This may require container restart.`);
              throw new Error(`Container connection lost: ${error.message}`);
            }
          }
        }
      }
      
      // Process files in smaller batches with improved error handling
      const batchSize = 3; // Reduced batch size for more reliable transfers
      for (let i = 0; i < fileEntries.length; i += batchSize) {
        const batch = fileEntries.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(fileEntries.length / batchSize)} (${batch.length} files)`);
        
        const batchPromises = batch.map(async ([filePath, content]) => {
          try {
            const safeFilePath = filePath.replace(/'/g, "'\"'\"'");
            const tempFilePath = path.join(tempDir, `file-${crypto.createHash('md5').update(filePath).digest('hex')}.tmp`);
            
            // Special handling for vite.config.js to update deployment ID
            let processedContent = content;
            if (filePath === 'vite.config.js' || filePath.endsWith('/vite.config.js')) {
              console.log(`🔧 Processing vite.config.js for deployment ${id} - updating HMR host`);
              processedContent = updateViteConfigForDeployment(content, id);
            }
            
            // Write to temporary file first
            await fs.writeFile(tempFilePath, processedContent, 'utf8');
            
            // Use kubectl cp for reliable file transfer
            const copyCommand = `kubectl cp '${tempFilePath}' '${podName}:/app/${id}/${safeFilePath}' -c vite-server`;
            console.log(`🔄 KUBECTL DEBUG: Executing copy command: ${copyCommand}`);
            console.log(`📁 KUBECTL DEBUG: File path: ${filePath}, Content size: ${content.length} bytes`);
            
            await retryOperation(async () => {
              await execPromise(copyCommand);
              
              // Verify file was written correctly by checking size
              console.log(`🔍 KUBECTL DEBUG: Verifying file existence and size for: ${filePath}`);
              const verifyCommand = `kubectl exec ${podName} -c vite-server -- test -f '/app/${id}/${safeFilePath}' && echo "exists"`;
              const result = await execPromise(verifyCommand);
              console.log(`✅ KUBECTL DEBUG: Verify command result: ${result.stdout.trim()}`);
              
              // Additional verification - check file size
              const sizeCommand = `kubectl exec ${podName} -c vite-server -- wc -c '/app/${id}/${safeFilePath}' 2>/dev/null || echo "size-check-failed"`;
              const sizeResult = await execPromise(sizeCommand);
              console.log(`📏 KUBECTL DEBUG: File size check: ${sizeResult.stdout.trim()} (expected: ${content.length} bytes)`);
              
              if (!result.stdout.includes('exists')) {
                throw new Error('File verification failed');
              }
            }, 3, 2000);
            
            // Clean up temp file
            await fs.unlink(tempFilePath).catch(() => {});
            successCount++;
            
          } catch (error) {
            console.error(`Failed to load file ${filePath}:`, error.message);
            failedFiles.push({ 
              path: filePath, 
              error: error.message,
              size: content.length 
            });
          }
        });
        
        await Promise.all(batchPromises);
        
        // Small delay between batches to avoid overwhelming kubectl
        if (i + batchSize < fileEntries.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Verify the transfer and set proper permissions
      console.log(`Setting permissions for project files...`);
      
      // First, let's list all files that were copied to verify they exist
      console.log(`🔍 KUBECTL DEBUG: Listing all files in container after transfer...`);
      const listCommand = `kubectl exec ${podName} -c vite-server -- find /app/${id} -type f | head -20`;
      try {
        const listResult = await execPromise(listCommand);
        console.log(`📁 KUBECTL DEBUG: Files found in container:`);
        console.log(listResult.stdout);
      } catch (listError) {
        console.error(`❌ KUBECTL DEBUG: Failed to list files:`, listError.message);
      }
      
      const permissionsCommand = `kubectl exec ${podName} -c vite-server -- sh -c "find /app/${id} -type f -exec chmod 644 {} + && find /app/${id} -type d -exec chmod 755 {} + && find /app/${id}/node_modules -type f -path '*/bin/*' -exec chmod +x {} + 2>/dev/null || true && find /app/${id}/node_modules -type f -name 'esbuild' -exec chmod +x {} + 2>/dev/null || true && find /app/${id}/node_modules -type f -name '*.js' -path '*/bin/*' -exec chmod +x {} + 2>/dev/null || true && chown -R node:node /app/${id}"`;  
      console.log(`🔧 KUBECTL DEBUG: Setting permissions with command: ${permissionsCommand}`);
      try {
        await execPromise(permissionsCommand);
        console.log(`✅ KUBECTL DEBUG: Permissions set successfully (including node_modules binaries)`);
        
        // Final verification - count total files and show sample content
        const finalCountCommand = `kubectl exec ${podName} -c vite-server -- find /app/${id} -type f | wc -l`;
        const countResult = await execPromise(finalCountCommand);
        console.log(`📊 KUBECTL DEBUG: Final file count in container: ${countResult.stdout.trim()} files`);
        
        // Show a sample file content to verify text transfer worked
        const sampleFileCommand = `kubectl exec ${podName} -c vite-server -- find /app/${id} -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | head -1`;
        try {
          const sampleFile = await execPromise(sampleFileCommand);
          if (sampleFile.stdout.trim()) {
            const contentCommand = `kubectl exec ${podName} -c vite-server -- head -10 "${sampleFile.stdout.trim()}"`;
            const content = await execPromise(contentCommand);
            console.log(`📄 KUBECTL DEBUG: Sample file content from ${sampleFile.stdout.trim()}:`);
            console.log(content.stdout);
          }
        } catch (sampleError) {
          console.log(`ℹ️ KUBECTL DEBUG: Could not show sample file content:`, sampleError.message);
        }
        
      } catch (permError) {
        console.warn(`Warning: Could not set permissions:`, permError.message);
      }
      
    } finally {
      // Clean up temporary directory
      await fs.rmdir(tempDir, { recursive: true }).catch(err => {
        console.warn('Failed to clean up temp directory:', err.message);
      });
    }
    
    const response = {
      message: successCount === fileEntries.length 
        ? `All ${successCount} project files loaded successfully` 
        : `Project partially loaded: ${successCount}/${fileEntries.length} files`,
      totalFiles: fileEntries.length,
      successCount,
      failedCount: failedFiles.length,
      failedFiles: failedFiles.map(f => typeof f === 'string' ? f : f.path),
      failedDetails: failedFiles.filter(f => typeof f === 'object')
    };
    
    if (failedFiles.length > 0) {
      console.error(`Failed to load ${failedFiles.length} files:`, failedFiles);
      if (failedFiles.length === fileEntries.length) {
        return res.status(500).json({ 
          error: 'Failed to load any project files',
          details: response 
        });
      }
      response.warning = `${failedFiles.length} files failed to load - check failedDetails for more info`;
    }
    
    console.log(`Project load completed: ${successCount}/${fileEntries.length} files transferred successfully`);
    
    // Restart dev server to pick up the newly loaded files
    if (successCount > 0) {
      try {
        console.log(`🔄 Restarting dev server to load new files for deployment ${id}`);
        
        // Stop existing dev server process more carefully to avoid breaking terminal connections
        // Use more specific patterns and avoid killing shell processes
        const killCommand = `kubectl exec ${podName} -c vite-server -- sh -c "
          # Kill npm run dev processes specifically
          pgrep -f 'npm.*run.*dev' | xargs -r kill -TERM 2>/dev/null || true
          # Kill vite dev server processes (but not other vite processes)
          pgrep -f 'vite.*--host.*--port' | xargs -r kill -TERM 2>/dev/null || true
          # Give processes time to terminate gracefully
          sleep 1
          # Force kill if still running
          pgrep -f 'npm.*run.*dev' | xargs -r kill -KILL 2>/dev/null || true
          pgrep -f 'vite.*--host.*--port' | xargs -r kill -KILL 2>/dev/null || true
        "`;
        try {
          await execPromise(killCommand);
          console.log(`🛑 Gracefully stopped existing dev server for deployment ${id}`);
        } catch (killError) {
          console.log(`⚠️ Failed to stop dev server for deployment ${id}:`, killError.message);
        }
        
        // Wait a moment for process to stop
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if package.json was loaded and install dependencies if needed
        const packageJsonLoaded = fileEntries.some(([filePath]) => filePath === 'package.json');
        if (packageJsonLoaded) {
          try {
            console.log(`📦 Installing dependencies for deployment ${id} since package.json was updated`);
            
            // Use retry logic for npm install to handle transient issues
            await retryOperation(async () => {
              const installCommand = `kubectl exec ${podName} -c vite-server -- sh -c "cd /app/${id} && npm install"`;
              await execPromise(installCommand, { timeout: 120000 }); // 2 minute timeout
            }, 2, 5000);
            
            console.log(`✅ Dependencies installed successfully for deployment ${id}`);
            response.dependenciesInstalled = true;
          } catch (installError) {
            console.warn(`⚠️ Failed to install dependencies for deployment ${id}:`, installError.message);
            response.dependenciesInstalled = false;
            response.installError = installError.message;
            
            // If container connection is lost, don't try to start dev server
            if (installError.message.includes('container not found') || 
                installError.message.includes('unable to upgrade connection')) {
              console.error(`❌ Container connection lost during npm install for deployment ${id}`);
              throw new Error(`Container connection lost during npm install: ${installError.message}`);
            }
          }
        }
        
        // Verify container is still accessible before starting dev server
        try {
          await execPromise(`kubectl exec ${podName} -c vite-server -- echo "pre-start-check"`);
        } catch (preStartError) {
          console.error(`❌ Container not accessible before starting dev server for deployment ${id}:`, preStartError.message);
          throw new Error(`Container not accessible: ${preStartError.message}`);
        }
        
        // Start fresh dev server with the new files
        const startCommand = `kubectl exec ${podName} -c vite-server -- sh -c "cd /app/${id} && nohup npm run dev > /tmp/vite-dev.log 2>&1 & echo $!"`;
        const { stdout } = await retryOperation(async () => {
          return await execPromise(startCommand);
        }, 2, 3000);
        const pid = stdout.trim();
        
        console.log(`🚀 Started dev server for deployment ${id} with PID: ${pid}`);
        
        // Update dev server process in MongoDB
        await DevServerProcess.findOneAndUpdate(
          { deploymentId: id },
          { 
            status: 'starting', 
            pid,
            startedAt: new Date(),
            lastCommand: 'npm run dev'
          },
          { upsert: true }
        );
        
        response.devServerRestarted = true;
        response.devServerPid = pid;
        response.message += ` - Dev server restarted to load new files`;
        
      } catch (devServerError) {
        console.warn(`⚠️ Failed to restart dev server for deployment ${id}:`, devServerError.message);
        response.devServerRestarted = false;
        response.devServerError = devServerError.message;
        response.message += ` - Warning: Dev server restart failed, you may need to manually restart it`;
      }
    }
    
    res.json(response);
    
  } catch (error) {
    console.error(`❌ LOAD-PROJECT EXCEPTION: Error loading project files for deployment ${req.params.id}:`, error);
    console.error(`❌ LOAD-PROJECT EXCEPTION: Stack trace:`, error.stack);
    res.status(500).json({ 
      error: 'Failed to load project files',
      details: error.message 
    });
  }
});

// Helper function for file tree
function buildFileTree(items) {
  const tree = [];
  
  // Sort items to ensure directories are processed before files
  const sortedItems = items.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.path.localeCompare(b.path);
  });
  
  sortedItems.forEach(item => {
    const parts = item.path.split('/');
    let currentLevel = tree;
    let currentPath = '';
    
    // Navigate to the correct level in the tree
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      currentPath += (currentPath ? '/' : '') + part;
      
      let dir = currentLevel.find(treeItem => treeItem.name === part && treeItem.type === 'directory');
      if (!dir) {
        dir = {
          name: part,
          type: 'directory',
          children: []
        };
        currentLevel.push(dir);
      }
      currentLevel = dir.children;
    }
    
    // Add the current item
    const existingItem = currentLevel.find(treeItem => treeItem.name === item.name);
    if (!existingItem) {
      if (item.type === 'directory') {
        currentLevel.push({
          name: item.name,
          type: 'directory',
          children: []
        });
      } else {
        currentLevel.push({
          name: item.name,
          type: 'file',
          path: item.path
        });
      }
    }
  });
  
  return tree;
}

// Initialize container with template files
async function initializeContainerFiles(deploymentId, framework) {
  try {
    const frameworkConfig = getFrameworkConfig(framework);
    console.log(`📁 Initializing ${frameworkConfig.name} template files for deployment ${deploymentId}`);
    
    // Check if pod is ready
    const podName = await getPodName(deploymentId);
    if (!podName) {
      throw new Error(`Pod not found for deployment ${deploymentId}`);
    }
    
    // Create basic template files based on framework
    const templateFiles = getFrameworkTemplateFiles(framework);
    
    for (const file of templateFiles) {
      const encodedContent = Buffer.from(file.content).toString('base64');
      const command = `kubectl exec ${podName} -c vite-server -- sh -c "mkdir -p \\$(dirname '/app/${file.path}') && echo '${encodedContent}' | base64 -d > '/app/${file.path}'"`;
      try {
        await execPromise(command);
        console.log(`📄 Created template file: ${file.path}`);
      } catch (fileError) {
        console.error(`⚠️ Failed to create template file ${file.path}:`, fileError.message);
      }
    }
    
    // Create package.json if it doesn't exist
    const packageJsonCommand = `kubectl exec ${podName} -c vite-server -- test -f /app/package.json`;
    try {
      await execPromise(packageJsonCommand);
    } catch {
      // package.json doesn't exist, create it
      const packageJson = getFrameworkPackageJson(framework);
      const packageJsonContent = JSON.stringify(packageJson, null, 2);
      const encodedPackageJson = Buffer.from(packageJsonContent).toString('base64');
      const createPackageCommand = `kubectl exec ${podName} -c vite-server -- sh -c "echo '${encodedPackageJson}' | base64 -d > '/app/package.json'"`;
      await execPromise(createPackageCommand);
      console.log(`📦 Created package.json for ${frameworkConfig.name}`);
    }
    
  } catch (error) {
    console.error(`❌ Failed to initialize template files for deployment ${deploymentId}:`, error.message);
    throw error;
  }
}

// Get template files for framework
function getFrameworkTemplateFiles(framework) {
  const templates = {
    react: [
      {
        path: 'src/App.jsx',
        content: `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello React!</h1>
        <p>Start editing to see changes live.</p>
      </header>
    </div>
  )
}

export default App`
      },
      {
        path: 'src/main.jsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
      },
      {
        path: 'src/App.css',
        content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}`
      },
      {
        path: 'src/index.css',
        content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#root {
  min-height: 100vh;
}`
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
      },
      {
        path: 'vite.config.js',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})`
      }
    ],
    vue: [
      {
        path: 'src/App.vue',
        content: `<template>
  <div id="app">
    <h1>Hello Vue!</h1>
    <p>Start editing to see changes live.</p>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`
      },
      {
        path: 'src/main.js',
        content: `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`
      },
      {
        path: 'vite.config.js',
        content: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})`
      }
    ]
  };
  
  return templates[framework] || templates.react;
}

// Get package.json for framework
function getFrameworkPackageJson(framework) {
  const packageJsonTemplates = {
    react: {
      name: "vite-react-app",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0"
      },
      devDependencies: {
        "@types/react": "^18.2.15",
        "@types/react-dom": "^18.2.7",
        "@vitejs/plugin-react": "^4.0.3",
        vite: "^4.4.5"
      }
    },
    vue: {
      name: "vite-vue-app",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        vue: "^3.3.4"
      },
      devDependencies: {
        "@vitejs/plugin-vue": "^4.2.3",
        vite: "^4.4.5"
      }
    }
  };
  
  return packageJsonTemplates[framework] || packageJsonTemplates.react;
}


async function deleteViteDeployment(deploymentId) {
  try {
    console.log(`🗑️ Deleting Kubernetes resources for deployment ${deploymentId}`);
    await execPromise(
      `kubectl delete deployment,service,ingress,pvc -l app=vite-deployment-${deploymentId} --ignore-not-found=true`
    );
    console.log(`✅ Deleted Kubernetes resources for deployment ${deploymentId}`);
  } catch (error) {
    console.error(`❌ Error deleting Kubernetes resources for ${deploymentId}:`, error);
  }
}

// Package management with MongoDB session tracking
app.get('/api/deployments/:id/packages', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const { sessionId } = req.query;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    // Check if Kubernetes deployment exists
    const kubeExists = await checkKubernetesDeploymentExists(id);
    if (!kubeExists) {
      console.log(`⚠️ Kubernetes deployment missing for packages request: ${id}`);
      return await handleDeploymentStateMismatch(deployment, res);
    }
    
    // Ensure container is ready before executing commands
    try {
      await waitForContainerReady(id, 30000); // 30 second timeout for quicker response
    } catch (containerError) {
      console.log(`⚠️ Container not ready for packages request: ${id}`);
      return await handleDeploymentStateMismatch(deployment, res);
    }
    
    const operation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- cat "/app/${id}/package.json"`;
      const { stdout } = await execPromise(command);
      return JSON.parse(stdout);
    };
    
    const packageJson = await retryOperation(operation, 3, 1000);
    res.json(packageJson);
    
  } catch (error) {
    console.error('Error reading package.json:', error);
    
    // Check if package.json doesn't exist (container is empty)
    if (error.message.includes('No such file or directory') || error.message.includes('cat: /app/')) {
      console.log(`📦 No package.json found for deployment ${id} - returning empty packages`);
      return res.json({ 
        name: '',
        version: '0.0.0',
        dependencies: {},
        devDependencies: {},
        empty: true,
        message: 'No package.json found. Load a project or create one to see packages.'
      });
    }
    
    if (isDeploymentNotFoundError(error)) {
      const deployment = await Deployment.findOne({ id, userId: req.user.userId });
      if (deployment) {
        return await handleDeploymentStateMismatch(deployment, res);
      }
    }
    res.status(500).json({ error: 'Failed to read packages' });
  }
});

app.post('/api/deployments/:id/packages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { package: packageName, sessionId } = req.body;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    const operation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "cd /app/${id} && npm install ${packageName}"`;
      await execPromise(command, { timeout: 60000 });
    };
    
    await retryOperation(operation, 2, 2000);
    res.json({ message: 'Package installed successfully' });
    
  } catch (error) {
    console.error('Error installing package:', error);
    res.status(500).json({ error: 'Failed to install package' });
  }
});

app.delete('/api/deployments/:id/packages/:package', authenticate, async (req, res) => {
  try {
    const { id, package: packageName } = req.params;
    const { sessionId } = req.query;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    const operation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "cd /app/${id} && npm uninstall ${packageName}"`;
      await execPromise(command, { timeout: 30000 });
    };
    
    await retryOperation(operation, 2, 2000);
    res.json({ message: 'Package uninstalled successfully' });
    
  } catch (error) {
    console.error('Error uninstalling package:', error);
    res.status(500).json({ error: 'Failed to uninstall package' });
  }
});

// Enhanced server management with MongoDB
app.get('/api/deployments/:id/server/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.json({ status: 'deployment_not_ready' });
    }
    
    // Check if Kubernetes deployment exists
    const kubeExists = await checkKubernetesDeploymentExists(id);
    if (!kubeExists) {
      console.log(`⚠️ Kubernetes deployment missing for server status request: ${id}`);
      return await handleDeploymentStateMismatch(deployment, res);
    }
    
    const operation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "ps aux | grep -E '(vite|npm run dev)' | grep -v grep || true"`;
      const { stdout } = await execPromise(command);
      
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        const viteLine = lines.find(line => line.includes('vite') && !line.includes('grep'));
        if (viteLine) {
          const parts = viteLine.trim().split(/\s+/);
          const pid = parts[1];
          return { status: 'running', pid, processInfo: viteLine.substring(0, 100) };
        }
      }
      
      return { status: 'stopped', pid: null, processInfo: null };
    };
    
    try {
      const result = await retryOperation(operation, 2, 1000);
      
      // Update dev server process status in MongoDB
      await DevServerProcess.findOneAndUpdate(
        { deploymentId: id },
        result,
        { upsert: true }
      );
      
      res.json(result);
    } catch (error) {
      if (isDeploymentNotFoundError(error)) {
        return await handleDeploymentStateMismatch(deployment, res);
      }
      res.json({ status: 'stopped', pid: null, processInfo: null });
    }
    
  } catch (error) {
    console.error('Error checking server status:', error);
    res.status(500).json({ error: 'Failed to check server status' });
  }
});

app.post('/api/deployments/:id/server/start', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    // First check if already running
    const statusCheck = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "ps aux | grep -E '(vite|npm run dev)' | grep -v grep || true"`;
      const { stdout } = await execPromise(command);
      return stdout.trim() !== '';
    };
    
    const isRunning = await retryOperation(statusCheck, 2, 1000);
    if (isRunning) {
      return res.json({ message: 'Dev server is already running', status: 'running' });
    }
    
    const operation = async () => {
      // Kill any existing processes first
      const killCommand = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "pkill -f 'npm run dev' || pkill -f 'vite' || true"`;
      await execPromise(killCommand);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start fresh dev server
      const startCommand = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "cd /app/${id} && nohup npm run dev > /tmp/vite-dev.log 2>&1 & echo $!"`;
      const { stdout } = await execPromise(startCommand);
      return stdout.trim();
    };
    
    const pid = await retryOperation(operation, 2, 1000);
    
    // Update dev server process in MongoDB
    await DevServerProcess.findOneAndUpdate(
      { deploymentId: id },
      { 
        status: 'starting', 
        pid,
        lastStarted: new Date()
      },
      { upsert: true }
    );
    
    const frameworkConfig = getFrameworkConfig(deployment.framework);
    res.json({ 
      message: `${frameworkConfig.name} dev server started`, 
      pid, 
      status: 'starting',
      framework: deployment.framework,
      dockerImage: frameworkConfig.dockerImage
    });
    
  } catch (error) {
    console.error('Error starting server:', error);
    res.status(500).json({ error: 'Failed to start server' });
  }
});

app.post('/api/deployments/:id/server/stop', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    const operation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "pkill -f 'npm run dev' || pkill -f 'vite' || true"`;
      await execPromise(command);
    };
    
    await retryOperation(operation, 2, 1000);
    
    // Update dev server process in MongoDB
    await DevServerProcess.findOneAndUpdate(
      { deploymentId: id },
      { 
        status: 'stopped', 
        pid: null,
        lastStopped: new Date()
      },
      { upsert: true }
    );
    
    res.json({ message: 'Server stopped' });
    
  } catch (error) {
    console.error('Error stopping server:', error);
    res.status(500).json({ error: 'Failed to stop server' });
  }
});

// Enhanced server logs endpoint
app.get('/api/deployments/:id/server/logs', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    
    const { lines = 50, sessionId } = req.query;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    // Check if Kubernetes deployment exists
    const kubeExists = await checkKubernetesDeploymentExists(id);
    if (!kubeExists) {
      console.log(`⚠️ Kubernetes deployment missing for logs request: ${id}`);
      return await handleDeploymentStateMismatch(deployment, res);
    }
    
    const operation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "if [ -f /tmp/vite-dev.log ]; then tail -n ${lines} /tmp/vite-dev.log; else echo 'No logs available yet. Start the dev server to see logs.'; fi"`;
      const { stdout } = await execPromise(command);
      return stdout;
    };
    
    const logs = await retryOperation(operation, 2, 1000);
    
    const statusOperation = async () => {
      const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "ps aux | grep -E '(vite|npm run dev)' | grep -v grep || echo 'No dev server process found'"`;
      const { stdout } = await execPromise(command);
      return stdout;
    };
    
    const processInfo = await retryOperation(statusOperation, 2, 1000);
    
    res.json({ 
      logs: logs || 'No logs available yet', 
      processInfo: processInfo || 'No process info',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting server logs:', error);
    if (isDeploymentNotFoundError(error)) {
      const deployment = await Deployment.findOne({ id, userId: req.user.userId });
      if (deployment) {
        return await handleDeploymentStateMismatch(deployment, res);
      }
    }
    res.status(500).json({ error: 'Failed to get server logs' });
  }
});

// Real-time logs streaming via Server-Sent Events
app.get('/api/deployments/:id/server/logs/stream', authenticate, async (req, res) => {
  
  const { id } = req.params;
  try {
    
    const { sessionId } = req.query;
    
    if (sessionId) {
      await updateSessionActivity(sessionId);
    }
    
    const deployment = await Deployment.findOne({ id, userId: req.user.userId });
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    if (deployment.status !== 'ready') {
      return res.status(400).json({ error: 'Deployment not ready' });
    }
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    let intervalId;
    let lastLogSize = 0;
    
    const streamLogs = async () => {
      try {
        const command = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "if [ -f /tmp/vite-dev.log ]; then wc -c /tmp/vite-dev.log | cut -d' ' -f1; else echo 0; fi"`;
        const { stdout } = await execPromise(command);
        const currentSize = parseInt(stdout.trim());
        
        if (currentSize > lastLogSize) {
          const tailCommand = `kubectl exec deployment/vite-deployment-${id} -c vite-server -- sh -c "tail -c +${lastLogSize + 1} /tmp/vite-dev.log"`;
          const { stdout: newLogs } = await execPromise(tailCommand);
          
          if (newLogs.trim()) {
            res.write(`data: ${JSON.stringify({ 
              type: 'logs', 
              data: newLogs,
              timestamp: new Date().toISOString()
            })}\n\n`);
            
            // Update session activity when streaming logs
            if (sessionId) {
              await updateSessionActivity(sessionId);
            }
          }
          
          lastLogSize = currentSize;
        }
      } catch (error) {
        console.error('Error streaming logs:', error);
      }
    };
    
    // Send initial logs
    streamLogs();
    
    // Stream updates every 2 seconds
    intervalId = setInterval(streamLogs, 2000);
    
    // Cleanup on disconnect
    req.on('close', () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });
    
  } catch (error) {
    console.error('Error setting up log stream:', error);
    res.status(500).json({ error: 'Failed to set up log stream' });
  }
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const deployments = await Deployment.find();
    const sessions = await Session.find({ isActive: true });
    const usedSubdomains = await UsedSubdomain.countDocuments({ isActive: true });
    
    const frameworkStats = deployments.reduce((acc, dep) => {
      const config = getFrameworkConfig(dep.framework);
      acc[dep.framework] = {
        count: (acc[dep.framework]?.count || 0) + 1,
        name: config.name,
        icon: config.icon,
        dockerImage: config.dockerImage,
        status: config.status
      };
      return acc;
    }, {});

    const sessionStats = {
      total: sessions.length,
      byDeployment: {}
    };

    for (const session of sessions) {
      if (!sessionStats.byDeployment[session.deploymentId]) {
        sessionStats.byDeployment[session.deploymentId] = 0;
      }
      sessionStats.byDeployment[session.deploymentId]++;
    }

    res.json({ 
      status: 'healthy', 
      version: '3.0.0-mongodb-bullmq',
      deployments: deployments.length,
      supportedFrameworks: Object.keys(FRAMEWORKS).length,
      dockerRegistry: DOCKER_REGISTRY,
      baseImageTag: BASE_IMAGE_TAG,
      frameworkCategories: FRAMEWORK_CATEGORIES,
      frameworkStats,
      sessionStats,
      terminalStats: {
        active: terminals.size,
        details: Array.from(terminals.entries()).map(([deploymentId, data]) => ({
          deploymentId,
          activeSessions: data.sessionIds.size,
          lastActivity: data.lastActivity,
          historySize: data.history ? data.history.length : 0
        }))
      },
      usedSubdomains,
      features: [
        'MongoDB database persistence',
        'BullMQ background job processing',
        'Terminal persistence with session tracking',
        'Auto-reconnection with history restoration',
        'Enhanced session-based cleanup',
        'Real-time activity monitoring',
        'Server state synchronization',
        'WebSocket connection management'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Helper function for safe terminal writing
const safeTerminalWrite = (terminal, data) => {
  try {
    if (terminal && !terminal.killed) {
      terminal.write(data);
      return true;
    }
  } catch (error) {
    console.error('Terminal write error:', error.message);
  }
  return false;
};

// Enhanced WebSocket terminal handler with MongoDB session tracking and persistence
wss.on('connection', (ws, req) => {
  const urlParts = req.url.split('/');
  const deploymentId = urlParts[urlParts.length - 1];
  const sessionId = urlParts[urlParts.length - 2] || 'unknown';
  
  console.log(`🖥️ Terminal connection request for deployment: ${deploymentId}, session: ${sessionId}`);
  
  let terminal = null;
  let isConnected = true;
  let terminalHistory = '';
  
  // Validate deployment and session
  const validateAndConnect = async () => {
    try {
      const deployment = await Deployment.findOne({ id: deploymentId });
      if (!deployment) {
        ws.send(JSON.stringify({
          type: 'error',
          data: 'Deployment not found\r\n'
        }));
        ws.close();
        return false;
      }
      
      if (deployment.status !== 'ready') {
        ws.send(JSON.stringify({
          type: 'error',
          data: 'Deployment not ready for terminal access\r\n'
        }));
        ws.close();
        return false;
      }
      
      // Check if Kubernetes deployment exists
      const kubeExists = await checkKubernetesDeploymentExists(deploymentId);
      if (!kubeExists) {
        console.log(`⚠️ Kubernetes deployment missing for terminal request: ${deploymentId}`);
        ws.send(JSON.stringify({
          type: 'error',
          data: 'Deployment infrastructure is missing. Please refresh and try again.\r\n'
        }));
        ws.close();
        return false;
      }
      
      // Register websocket with session in MongoDB
      if (sessionId !== 'unknown') {
        await updateSessionActivity(sessionId);
        await addWebSocketToSession(sessionId, ws);
      }
      
      const frameworkConfig = getFrameworkConfig(deployment.framework);
      console.log(`🖥️ Terminal connection for ${frameworkConfig.name} deployment: ${deploymentId}`);
      
      return { deployment, frameworkConfig };
    } catch (error) {
      console.error('Error validating deployment:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: 'Failed to validate deployment\r\n'
      }));
      ws.close();
      return false;
    }
  };
  
  // Initialize terminal connection
  const initializeTerminal = async () => {
    const validation = await validateAndConnect();
    if (!validation) return;
    
    const { deployment, frameworkConfig } = validation;
    
    // Check if there's an existing terminal for this deployment
    const existingTerminal = terminals.get(deploymentId);
    let terminalRecord = await Terminal.findOne({ deploymentId });
    
    // Get the pod name first
    const podName = await getPodName(deploymentId);
    if (!podName) {
      ws.send(JSON.stringify({
        type: 'error',
        data: 'Could not find pod for deployment\r\n'
      }));
      ws.close();
      return;
    }
    
    // Check if pod is ready
    const podReady = await isPodReady(podName);
    if (!podReady) {
      ws.send(JSON.stringify({
        type: 'error',
        data: 'Pod is not ready yet. Please try again in a few seconds.\r\n'
      }));
      ws.close();
      return;
    }
    
    // Additional container readiness check
    try {
      await waitForContainerReady(deploymentId, 10000); // 10 second timeout for terminal
    } catch (containerError) {
      console.log(`⚠️ Container not ready for terminal connection: ${deploymentId}`);
      ws.send(JSON.stringify({
        type: 'error',
        data: 'Container is not ready for terminal access. Please try again in a few seconds.\r\n'
      }));
      ws.close();
      return;
    }
    
    try {
      // If there's an existing terminal, reuse it
      if (existingTerminal && existingTerminal.terminal && !existingTerminal.terminal.killed) {
        console.log(`🔄 Reusing existing terminal for deployment: ${deploymentId}`);
        terminal = existingTerminal.terminal;
        
        // Send existing terminal history if available
        if (terminalRecord && terminalRecord.history) {
          ws.send(JSON.stringify({
            type: 'output',
            data: '\x1b[33m🔄 Reconnected! Restoring session...\x1b[0m\r\n'
          }));
          
          // Send important parts of history (last 20 lines)
          const historyLines = terminalRecord.history.split('\n').slice(-20).join('\n');
          if (historyLines.trim()) {
            ws.send(JSON.stringify({
              type: 'output',
              data: '\x1b[90m' + historyLines + '\x1b[0m\r\n'
            }));
          }
        }
        
        ws.send(JSON.stringify({
          type: 'output',
          data: '\x1b[32m✅ Terminal reconnected\x1b[0m\r\n'
        }));
        
        // Update the terminal data in memory and MongoDB
        terminals.set(deploymentId, {
          ...existingTerminal,
          lastActivity: Date.now(),
          sessionIds: existingTerminal.sessionIds.add(sessionId),
          history: terminalRecord ? terminalRecord.history : existingTerminal.history
        });
        
        if (terminalRecord) {
          await Terminal.findByIdAndUpdate(terminalRecord._id, {
            lastActivity: new Date(),
            $addToSet: { sessionIds: sessionId }
          });
        }
      } else {
        // Create new terminal
        console.log(`🆕 Creating new terminal for deployment: ${deploymentId}`);
        
        const args = [
          'exec',
          '-i',
          '-t',
          podName,
          '-c', 'vite-server',
          '--',
          '/bin/sh'
        ];
        
        terminal = pty.spawn('kubectl', args, {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: process.cwd(),
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor'
          }
        });
        
        // Store terminal with session tracking in memory
        terminals.set(deploymentId, {
          terminal,
          lastActivity: Date.now(),
          sessionIds: new Set([sessionId]),
          history: ''
        });
        
        // Store terminal record in MongoDB
        if (terminalRecord) {
          await Terminal.findByIdAndUpdate(terminalRecord._id, {
            lastActivity: new Date(),
            $addToSet: { sessionIds: sessionId },
            isActive: true
          });
        } else {
          terminalRecord = new Terminal({
            deploymentId,
            lastActivity: new Date(),
            sessionIds: [sessionId],
            history: '',
            isActive: true
          });
          await terminalRecord.save();
        }
        
        // Send initial commands after connection
        setTimeout(() => {
          if (terminal && isConnected) {
            safeTerminalWrite(terminal, `cd /app/${deploymentId}\r`);
            safeTerminalWrite(terminal, 'clear\r');
            safeTerminalWrite(terminal, `echo -e "\\033[1;32m${frameworkConfig.icon} Connected to ${frameworkConfig.name} deployment: ${deployment.projectName}\\033[0m"\r`);
            safeTerminalWrite(terminal, `echo -e "\\033[36m📁 Working directory: /app/${deploymentId}\\033[0m"\r`);
            safeTerminalWrite(terminal, `echo -e "\\033[90m📝 Framework: ${frameworkConfig.description}\\033[0m"\r`);
            safeTerminalWrite(terminal, `echo -e "\\033[35m🐳 Docker image: ${frameworkConfig.dockerImage}\\033[0m"\r`);
            safeTerminalWrite(terminal, `echo -e "\\033[92m✅ Status: ${frameworkConfig.status}\\033[0m"\r`);
            safeTerminalWrite(terminal, `echo -e "\\033[33m💡 Try: npm run dev, npm install, ls, cat package.json\\033[0m"\r`);
            safeTerminalWrite(terminal, `echo -e "\\033[35m🔥 To start ${frameworkConfig.name} dev server: npm run dev\\033[0m"\r`);
            safeTerminalWrite(terminal, `echo -e "\\033[90m────────────────────────────────────────\\033[0m"\r`);
          }
        }, 500);
      }
      
      // Handle terminal output
      const onData = async (data) => {
        if (ws.readyState === WebSocket.OPEN && isConnected) {
          ws.send(JSON.stringify({
            type: 'output',
            data: data
          }));
          
          // Store history in memory and MongoDB (keep last 10000 chars)
          const terminalData = terminals.get(deploymentId);
          if (terminalData) {
            terminalData.history += data;
            if (terminalData.history.length > 10000) {
              terminalData.history = terminalData.history.slice(-8000);
            }
            terminalData.lastActivity = Date.now();
            
            // Update MongoDB record periodically (every 100 chars to avoid excessive writes)
            if (terminalData.history.length % 100 === 0) {
              await Terminal.findOneAndUpdate(
                { deploymentId },
                { 
                  history: terminalData.history,
                  lastActivity: new Date()
                }
              );
            }
          }
          
          // Update session activity
          if (sessionId !== 'unknown') {
            await updateSessionActivity(sessionId);
          }
        }
      };
      
      // Handle terminal exit
      const onExit = async (code, signal) => {
        console.log(`🔚 Terminal exited for deployment: ${deploymentId} (code: ${code}, signal: ${signal})`);
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'output',
            data: `\r\n\x1b[1;33mTerminal session ended (code: ${code})\x1b[0m\r\n`
          }));
        }
        
        // Remove this session from the terminal
        const terminalData = terminals.get(deploymentId);
        if (terminalData) {
          terminalData.sessionIds.delete(sessionId);
          
          // Update MongoDB
          await Terminal.findOneAndUpdate(
            { deploymentId },
            { 
              $pull: { sessionIds: sessionId },
              lastActivity: new Date()
            }
          );
          
          // If no more sessions, clean up terminal after delay
          if (terminalData.sessionIds.size === 0) {
            setTimeout(async () => {
              const currentTerminalData = terminals.get(deploymentId);
              if (currentTerminalData && currentTerminalData.sessionIds.size === 0) {
                console.log(`🧹 Cleaning up unused terminal for deployment: ${deploymentId}`);
                terminals.delete(deploymentId);
                await Terminal.findOneAndUpdate(
                  { deploymentId },
                  { isActive: false }
                );
              }
            }, 300000); // 5 minutes
          }
        }
        
        isConnected = false;
        ws.close();
      };
      
      // Only add listeners if this is a new terminal
      if (!existingTerminal || existingTerminal.terminal !== terminal) {
        terminal.onData(onData);
        terminal.onExit(onExit);
      } else {
        // For existing terminals, we need to manually handle the data
        terminal.onData(onData);
      }
      
    } catch (error) {
      console.error('Error creating/reusing terminal:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: `Failed to create terminal: ${error.message}\r\n`
      }));
      ws.close();
      return;
    }
  };
  
  // Initialize terminal connection
  initializeTerminal().catch((error) => {
    console.error('Error initializing terminal:', error);
    ws.send(JSON.stringify({
      type: 'error',
      data: `Failed to initialize terminal: ${error.message}\r\n`
    }));
    ws.close();
  });
  
  // Handle WebSocket messages with enhanced command detection
  ws.on('message', async (message) => {
    if (!isConnected || !terminal) return;
    
    // Check if terminal is still alive and valid
    if (terminal.killed) {
      console.log(`⚠️ Terminal for ${deploymentId} was killed, attempting to reconnect...`);
      // Try to reinitialize the terminal
      await initializeTerminal();
      return;
    }
    
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'input') {
        const input = data.data;
        
        // Update session activity on input
        if (sessionId !== 'unknown') {
          await updateSessionActivity(sessionId);
        }
        
        // Enhanced npm run dev detection with server status check
        if (input.includes('npm run dev') && input.includes('\r')) {
          const podName = await getPodName(deploymentId);
          if (podName) {
            try {
              const checkCommand = `kubectl exec ${podName} -c vite-server -- sh -c "ps aux | grep -E '(vite|npm run dev)' | grep -v grep || true"`;
              const { stdout } = await execPromise(checkCommand);
              
              if (stdout.trim()) {
                safeTerminalWrite(terminal, '\r\n\x1b[1;33m⚠️  Dev server is already running!\x1b[0m\r\n');
                safeTerminalWrite(terminal, '\x1b[36m💡 Use the "Server Logs" panel to see output\x1b[0m\r\n');
                safeTerminalWrite(terminal, '\x1b[36m💡 Or use the preview panel to see your app\x1b[0m\r\n');
                safeTerminalWrite(terminal, '\x1b[36m💡 To stop: Ctrl+C, then run npm run dev again\x1b[0m\r\n');
                safeTerminalWrite(terminal, '\x1b[90m────────────────────────────────────────\x1b[0m\r\n');
                return;
              }
            } catch (error) {
              console.error('Error checking dev server status:', error);
            }
          }
          
          // Send the command normally if no conflicts
          safeTerminalWrite(terminal, input);
        } else {
          // Send input directly to PTY for non-dev commands
          safeTerminalWrite(terminal, input);
        }
      } else if (data.type === 'resize') {
        // Handle terminal resize with error handling
        try {
          if (terminal && !terminal.killed) {
            terminal.resize(data.cols, data.rows);
            console.log(`Resized terminal for ${deploymentId}: ${data.cols}x${data.rows}`);
            
            // Update terminal config in MongoDB
            await Terminal.findOneAndUpdate(
              { deploymentId },
              { 
                'terminalConfig.cols': data.cols,
                'terminalConfig.rows': data.rows
              }
            );
          } else {
            console.log(`⚠️ Cannot resize terminal for ${deploymentId}: terminal is not available`);
          }
        } catch (resizeError) {
          console.error(`❌ Terminal resize error for ${deploymentId}:`, resizeError.message);
          // Don't close the connection for resize errors, just log them
        }
      } else if (data.type === 'heartbeat') {
        // Handle heartbeat for connection keepalive
        if (sessionId !== 'unknown') {
          await updateSessionActivity(sessionId);
        }
      }
    } catch (e) {
      console.error('Error parsing WebSocket message:', e);
    }
  });
  
  // Handle WebSocket close
  ws.on('close', async () => {
    console.log(`🔌 Terminal disconnected for deployment: ${deploymentId}, session: ${sessionId}`);
    isConnected = false;
    
    // Remove websocket from session in MongoDB
    if (sessionId !== 'unknown') {
      await removeWebSocketFromSession(sessionId, ws);
    }
    
    // Remove this session from terminal tracking
    const terminalData = terminals.get(deploymentId);
    if (terminalData) {
      terminalData.sessionIds.delete(sessionId);
      
      // Update MongoDB
      await Terminal.findOneAndUpdate(
        { deploymentId },
        { 
          $pull: { sessionIds: sessionId },
          lastActivity: new Date()
        }
      );
      
      // Don't kill terminal immediately - keep it alive for reconnections
      console.log(`📊 Terminal for ${deploymentId} now has ${terminalData.sessionIds.size} active sessions`);
    }
  });
  
  // Handle WebSocket error
  ws.on('error', async (error) => {
    console.error(`WebSocket error for deployment ${deploymentId}, session ${sessionId}:`, error);
    isConnected = false;
    
    if (sessionId !== 'unknown') {
      await removeWebSocketFromSession(sessionId, ws);
    }
    
    const terminalData = terminals.get(deploymentId);
    if (terminalData) {
      terminalData.sessionIds.delete(sessionId);
      await Terminal.findOneAndUpdate(
        { deploymentId },
        { 
          $pull: { sessionIds: sessionId },
          lastActivity: new Date()
        }
      );
    }
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, async () => {
      console.log(`🚀 Enhanced Multi-Framework IDE Server v3.0 running on port ${PORT}`);
      console.log(`🐳 Using pre-built Docker images from: ${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:*`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API: http://localhost:${PORT}/api/deployments`);
      console.log(`📋 Frameworks: http://localhost:${PORT}/api/frameworks`);
      console.log(`🧹 Cleanup: http://localhost:${PORT}/api/cleanup`);
      
      // Check kubectl availability
      if (await checkKubectl()) {
        console.log(`✅ kubectl is available and ready`);
      } else {
        console.log(`❌ WARNING: kubectl is not available. Please install kubectl and ensure it's in your PATH.`);
      }
      
      console.log(`\n💡 Starting automatic cleanup tasks...`);
      console.log(`   🧹 Session cleanup: every 5 minutes`);
      console.log(`   🗑️ Deployment cleanup: every 10 minutes`);
      console.log(`   🔄 Duplicate cleanup: every 15 minutes`);
      
      // Run initial duplicate cleanup on startup
      setTimeout(() => {
        cleanupDuplicateDeployments();
      }, 5000); // Wait 5 seconds after startup
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Server shutdown');
    }
  });
  
  terminals.forEach((terminalData, id) => {
    if (terminalData.terminal && terminalData.terminal.kill) {
      terminalData.terminal.kill();
    }
  });
  terminals.clear();
  
  await mongoose.connection.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Server shutdown');
    }
  });
  
  terminals.forEach((terminalData, id) => {
    if (terminalData.terminal && terminalData.terminal.kill) {
      terminalData.terminal.kill();
    }
  });
  terminals.clear();
  
  await mongoose.connection.close();
  await redis.quit();
  process.exit(0);
});

startServer();

export { FRAMEWORKS, FRAMEWORK_CATEGORIES, terminals, getFrameworkConfig, retryOperation, getPodName, isPodReady, checkKubectl, updateSessionActivity, addWebSocketToSession, removeWebSocketFromSession };
