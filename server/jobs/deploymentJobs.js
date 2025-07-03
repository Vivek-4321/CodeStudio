import Deployment from '../models/Deployment.js';
import Session from '../models/Session.js';
import Terminal from '../models/Terminal.js';
import DevServerProcess from '../models/DevServerProcess.js';
import UsedSubdomain from '../models/UsedSubdomain.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = promisify(exec);

// Docker Registry Configuration
const DOCKER_REGISTRY = 'vivekvenugopal513071';
const BASE_IMAGE_TAG = 'vite-framework';

// Enhanced Framework configurations
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
    icon: '🔶',
    name: 'Svelte',
    description: 'Svelte with JavaScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:svelte`,
    status: 'stable'
  },
  'svelte-ts': {
    template: 'svelte-ts',
    fileExtensions: ['.js', '.svelte', '.ts', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🔶',
    name: 'Svelte TypeScript',
    description: 'Svelte with TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:svelte-ts`,
    status: 'stable'
  },
  vanilla: {
    template: 'vanilla',
    fileExtensions: ['.js', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🍦',
    name: 'Vanilla JavaScript',
    description: 'Vanilla JavaScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:vanilla`,
    status: 'stable'
  },
  'vanilla-ts': {
    template: 'vanilla-ts',
    fileExtensions: ['.js', '.ts', '.css', '.html', '.json', '.md', '.svg'],
    devPort: 5173,
    icon: '🍦',
    name: 'Vanilla TypeScript',
    description: 'Vanilla TypeScript',
    dockerImage: `${DOCKER_REGISTRY}/${BASE_IMAGE_TAG}:vanilla-ts`,
    status: 'stable'
  }
};

// Utility functions
function getFrameworkConfig(framework) {
  return FRAMEWORKS[framework] || FRAMEWORKS.react;
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

async function isDeploymentReady(deploymentId) {
  try {
    const command = `kubectl get deployment/vite-deployment-${deploymentId} -o jsonpath='{.status.readyReplicas}'`;
    const { stdout } = await execPromise(command);
    return stdout.trim() === '1';
  } catch (error) {
    return false;
  }
}

async function waitForDeployment(deploymentId, timeout = 300000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await isDeploymentReady(deploymentId)) {
      // Additional check to ensure container is also ready
      const podName = await getPodName(deploymentId);
      if (podName && await isPodReady(podName)) {
        console.log(`✅ Deployment ${deploymentId} and pod ${podName} are both ready`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Additional safety wait
        return true;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`⚠️ Deployment ${deploymentId} did not become ready within ${timeout}ms`);
  return false;
}

async function waitForContainerReady(deploymentId, timeout = 180000) {
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
  
  console.log(`⚠️ Container for deployment ${deploymentId} did not become ready within ${timeout}ms`);
  return false;
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
    },
    svelte: {
      name: "vite-svelte-app",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        svelte: "^4.0.5"
      },
      devDependencies: {
        "@sveltejs/vite-plugin-svelte": "^2.4.2",
        vite: "^4.4.5"
      }
    },
    vanilla: {
      name: "vite-vanilla-app",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      devDependencies: {
        vite: "^4.4.5"
      }
    }
  };
  
  return packageJsonTemplates[framework] || packageJsonTemplates.react;
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
  </React.StrictMode>,
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
      }
    ]
  };
  
  return templates[framework] || templates.react;
}

// Kubernetes deployment function
async function createViteDeployment(deploymentId, projectName, framework = 'react', resourceSize = 'medium') {
  try {
    const frameworkConfig = getFrameworkConfig(framework);
    
    // Resource configuration mapping
    const resourceConfigs = {
      small: {
        limits: { memory: "512Mi", cpu: "500m" },
        requests: { memory: "256Mi", cpu: "250m" }
      },
      medium: {
        limits: { memory: "1.5Gi", cpu: "1000m" },
        requests: { memory: "768Mi", cpu: "500m" }
      },
      large: {
        limits: { memory: "3Gi", cpu: "2000m" },
        requests: { memory: "1.5Gi", cpu: "1000m" }
      }
    };
    
    const resourceConfig = resourceConfigs[resourceSize] || resourceConfigs.medium;
    console.log(`🔧 Creating Kubernetes resources for ${frameworkConfig.name} deployment ${deploymentId} with ${resourceSize} resources`);
    
    const yamlTemplate = `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: vite-deployment-pvc-${deploymentId}
  namespace: default
  labels:
    app: vite-deployment-${deploymentId}
    framework: ${framework}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vite-deployment-${deploymentId}
  namespace: default
  labels:
    app: vite-deployment-${deploymentId}
    framework: ${framework}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vite-deployment-${deploymentId}
  template:
    metadata:
      labels:
        app: vite-deployment-${deploymentId}
        framework: ${framework}
    spec:
      containers:
        - name: vite-server
          image: ${frameworkConfig.dockerImage}
          ports:
            - containerPort: 5173
          volumeMounts:
            - name: app-volume
              mountPath: /app
          env:
            - name: PROJECT_NAME
              value: "${projectName}"
            - name: DEPLOYMENT_ID
              value: "${deploymentId}"
            - name: FRAMEWORK
              value: "${framework}"
            - name: NODE_ENV
              value: "development"
          resources:
            limits:
              memory: "${resourceConfig.limits.memory}"
              cpu: "${resourceConfig.limits.cpu}"
            requests:
              memory: "${resourceConfig.requests.memory}"
              cpu: "${resourceConfig.requests.cpu}"
      volumes:
        - name: app-volume
          persistentVolumeClaim:
            claimName: vite-deployment-pvc-${deploymentId}

---
apiVersion: v1
kind: Service
metadata:
  name: vite-deployment-service-${deploymentId}
  namespace: default
  labels:
    app: vite-deployment-${deploymentId}
    framework: ${framework}
spec:
  selector:
    app: vite-deployment-${deploymentId}
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5173
      name: http
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vite-deployment-ingress-${deploymentId}
  namespace: default
  labels:
    app: vite-deployment-${deploymentId}
    framework: ${framework}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: "${deploymentId}.koolify.site"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: vite-deployment-service-${deploymentId}
            port:
              number: 80`;
    
    const yamlPath = path.join(process.cwd(), `temp-deployment-${deploymentId}.yaml`);
    await fs.writeFile(yamlPath, yamlTemplate);
    
    await execPromise(`kubectl apply -f ${yamlPath}`);
    await fs.unlink(yamlPath);
    
    console.log(`✅ Kubernetes resources created for deployment ${deploymentId}`);
    
  } catch (error) {
    console.error(`❌ Error creating Kubernetes resources:`, error);
    throw error;
  }
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

export const processCreateDeployment = async (job) => {
  const { deploymentId, projectName, framework, frameworkConfig, resourceSize = 'medium' } = job.data;
  
  try {
    console.log(`Processing deployment creation job for: ${deploymentId}`);
    console.log(`   Framework: ${frameworkConfig.name}`);
    console.log(`   Project: ${projectName}`);
    console.log(`   Docker Image: ${frameworkConfig.dockerImage}`);
    
    // Update deployment status to 'starting'
    await Deployment.findOneAndUpdate(
      { id: deploymentId },
      { 
        status: 'starting',
        frameworkName: frameworkConfig.name,
        frameworkIcon: frameworkConfig.icon,
        frameworkDescription: frameworkConfig.description,
        dockerImage: frameworkConfig.dockerImage,
        frameworkStatus: frameworkConfig.status
      }
    );
    
    // Create the actual Kubernetes deployment
    await createViteDeployment(deploymentId, projectName, framework, resourceSize);
    
    console.log(`✅ ${frameworkConfig.name} deployment created: ${deploymentId}.koolify.site`);
    
    // Wait for deployment to be ready
    const deploymentReady = await waitForDeployment(deploymentId);
    if (!deploymentReady) {
      throw new Error(`Deployment ${deploymentId} failed to become ready`);
    }
    
    // Additional container readiness check
    const containerReady = await waitForContainerReady(deploymentId);
    if (!containerReady) {
      throw new Error(`Container for deployment ${deploymentId} failed to become ready`);
    }
    
    // Update deployment status to ready
    await Deployment.findOneAndUpdate(
      { id: deploymentId },
      { status: 'ready' }
    );
    
    console.log(`✅ ${frameworkConfig.name} deployment ${deploymentId} is now ready! Status updated in database.`);
    
    // Initialize container with template files
    try {
      await initializeContainerFiles(deploymentId, framework);
      console.log(`📁 Template files initialized for deployment ${deploymentId}`);
    } catch (initError) {
      console.error(`⚠️ Failed to initialize template files for ${deploymentId}:`, initError.message);
      // Don't fail the entire deployment for template file issues
    }

    return { 
      success: true, 
      message: 'Deployment created and ready',
      deploymentId,
      framework,
      url: `https://${deploymentId}.koolify.site`
    };
  } catch (error) {
    console.error('Error processing deployment creation job:', error);
    
    // Update deployment status to error
    try {
      await Deployment.findOneAndUpdate(
        { id: deploymentId },
        { status: 'error' }
      );
    } catch (updateError) {
      console.error('Failed to update deployment status to error:', updateError);
    }
    
    throw error;
  }
};

export const processCleanupDeployment = async (job) => {
  const { deploymentId } = job.data;
  
  try {
    console.log(`Processing cleanup job for deployment: ${deploymentId}`);
    
    // Check if deployment still has active sessions
    const hasActiveSessions = await Session.exists({
      deploymentId,
      isActive: true
    });
    
    if (hasActiveSessions) {
      console.log(`⏭️ Skipping cleanup for ${deploymentId} - has active sessions`);
      return { 
        success: true, 
        message: 'Cleanup skipped - active sessions found' 
      };
    }
    
    // Update deployment status to 'deleting' before cleanup
    await Deployment.findOneAndUpdate(
      { id: deploymentId },
      { status: 'deleting' }
    );
    console.log(`📝 Updated deployment ${deploymentId} status to 'deleting'`);
    
    // Proceed with cleanup
    await deleteViteDeployment(deploymentId);
    
    // Remove from database
    await Deployment.findOneAndDelete({ id: deploymentId });
    await UsedSubdomain.findOneAndDelete({ deploymentId });
    await Terminal.findOneAndDelete({ deploymentId });
    await DevServerProcess.findOneAndDelete({ deploymentId });
    
    console.log(`✅ Cleaned up deployment: ${deploymentId}`);

    return { 
      success: true, 
      message: 'Deployment cleanup completed',
      deploymentId 
    };
  } catch (error) {
    console.error('Error processing cleanup job:', error);
    throw error;
  }
};

export const processSessionCleanup = async (job) => {
  try {
    console.log('Processing session cleanup job');
    
    const inactiveThreshold = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes
    
    const inactiveSessions = await Session.find({
      lastActivity: { $lt: inactiveThreshold },
      isActive: true
    });
    
    let cleanedCount = 0;
    for (const session of inactiveSessions) {
      await Session.findByIdAndUpdate(session._id, { isActive: false });
      cleanedCount++;
    }
    
    console.log(`✅ Cleaned up ${cleanedCount} inactive sessions`);

    return { 
      success: true, 
      message: `Cleaned up ${cleanedCount} inactive sessions` 
    };
  } catch (error) {
    console.error('Error processing session cleanup job:', error);
    throw error;
  }
};

export const processDeploymentHealthCheck = async (job) => {
  const { deploymentId } = job.data;
  
  try {
    console.log(`Processing health check for deployment: ${deploymentId}`);
    
    const deployment = await Deployment.findOne({ id: deploymentId });
    if (!deployment) {
      console.log(`❌ Deployment ${deploymentId} not found`);
      return { success: false, message: 'Deployment not found' };
    }
    
    // Check if Kubernetes deployment is ready
    const isReady = await isDeploymentReady(deploymentId);
    
    if (isReady && deployment.status !== 'ready') {
      await Deployment.findOneAndUpdate(
        { id: deploymentId },
        { status: 'ready' }
      );
      console.log(`✅ Deployment ${deploymentId} is now ready`);
    } else if (!isReady && deployment.status === 'ready') {
      await Deployment.findOneAndUpdate(
        { id: deploymentId },
        { status: 'error' }
      );
      console.log(`❌ Deployment ${deploymentId} is no longer ready`);
    }

    return { 
      success: true, 
      message: 'Health check completed',
      deploymentId,
      isReady 
    };
  } catch (error) {
    console.error('Error processing health check job:', error);
    throw error;
  }
};


async function deleteViteDeployment(deploymentId) {
  try {
    console.log(`🗑️ Deleting Kubernetes resources for deployment ${deploymentId}`);
    await execPromise(
      `kubectl delete deployment,service,ingress,pvc -l app=vite-deployment-${deploymentId} --ignore-not-found=true`
    );
    console.log(`✅ Deleted Kubernetes resources for deployment ${deploymentId}`);
  } catch (error) {
    console.error(`❌ Error deleting Kubernetes resources for ${deploymentId}:`, error);
    throw error;
  }
}