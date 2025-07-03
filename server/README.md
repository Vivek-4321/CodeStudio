# Enhanced Multi-Framework IDE Server with MongoDB & BullMQ

## Overview
This is a complete migration of the original 1883-line server.js to use MongoDB for persistence and BullMQ for background job processing, while maintaining ALL original API endpoints and functionality.

## Features
- **All Original Endpoints Preserved**: Exact same API endpoints as original server
- **MongoDB Integration**: Persistent storage for deployments, sessions, terminals, and dev server processes
- **BullMQ Background Jobs**: Kubernetes deployment operations, cleanup tasks, health checks
- **Multi-Framework Support**: 14 framework templates (React, Vue, Svelte, Lit, Vanilla, etc.)
- **Kubernetes Deployment**: Automated container deployment with kubectl
- **Session Management**: Enhanced session tracking with MongoDB persistence
- **Package Management**: npm install/uninstall operations via kubectl exec
- **Server Management**: Dev server start/stop/status/logs with real-time streaming
- **File Operations**: File tree listing, read/write operations
- **Health Monitoring**: Comprehensive health checks and statistics

## Supported Frameworks
### Popular React-like
- React (JavaScript & TypeScript)
- Preact (JavaScript & TypeScript)

### Vue Ecosystem  
- Vue.js (JavaScript & TypeScript)

### Svelte Ecosystem
- Svelte (JavaScript & TypeScript)

### Modern Alternatives
- Solid.js (JavaScript & TypeScript)

### Web Components
- Lit (JavaScript & TypeScript)

### Vanilla/Pure
- Vanilla (JavaScript & TypeScript)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Database Services
```bash
npm run db:up
```
This starts MongoDB (port 27018) and Redis (port 6379)

### 3. Start the Server
```bash
# Production
npm run server

# Development (with auto-restart)
npm run server:dev
```

### 4. Start the Worker (separate terminal)
```bash
# Production
npm run worker

# Development (with auto-restart)
npm run worker:dev
```

## API Endpoints (Identical to Original Server)

### Framework Information
- `GET /` - Server information and supported frameworks
- `GET /api/frameworks` - Detailed framework listing with categories

### Deployment Management
- `GET /api/deployments` - List all deployments with session activity
- `GET /api/deployments/:id` - Get specific deployment details
- `POST /api/deployments` - Create new Kubernetes deployment
- `DELETE /api/deployments/:id` - Delete deployment and cleanup resources

### Cleanup Operations
- `POST /api/cleanup` - Process cleanup requests with session management

### File Operations
- `GET /api/deployments/:id/files` - Get file tree for deployment
- `GET /api/deployments/:id/file?path=...` - Read specific file content
- `PUT /api/deployments/:id/file` - Save file content

### Package Management
- `GET /api/deployments/:id/packages` - Get package.json content
- `POST /api/deployments/:id/packages` - Install npm package
- `DELETE /api/deployments/:id/packages/:package` - Uninstall npm package

### Server Management  
- `GET /api/deployments/:id/server/status` - Check dev server status
- `POST /api/deployments/:id/server/start` - Start dev server
- `POST /api/deployments/:id/server/stop` - Stop dev server
- `GET /api/deployments/:id/server/logs` - Get server logs
- `GET /api/deployments/:id/server/logs/stream` - Stream logs via SSE

### Health Check
- `GET /health` - Comprehensive health status with MongoDB and framework statistics

## MongoDB Models

### Deployment
- Project information, framework details, status tracking
- URL generation, Docker image references

### Session
- Session activity tracking, WebSocket connection counts
- Automatic cleanup of inactive sessions

### Terminal
- Terminal session persistence, command history
- Multi-session support per deployment

### DevServerProcess
- Dev server status tracking, PID management
- Start/stop timestamps

### UsedSubdomain
- Subdomain reservation and conflict prevention

## Background Jobs (BullMQ)

### Deployment Jobs
- `create-deployment` - Post-deployment processing
- `cleanup-deployment` - Resource cleanup with delay
- `deployment-health-check` - Kubernetes readiness monitoring

### Maintenance Jobs
- `session-cleanup` - Automatic inactive session cleanup (every 5 min)

## Environment Variables
```bash
PORT=8000
MONGODB_URL=mongodb://localhost:27018/viteapp
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Database Access
- MongoDB: `localhost:27018`
- Mongo Express UI: `http://localhost:8081`
- Redis: `localhost:6379`

## Docker Registry
- Registry: `vivekvenugopal513071/vite-framework`
- Framework-specific images: `:react`, `:vue`, `:svelte`, etc.

## Kubernetes Requirements
- kubectl must be installed and configured
- Ingress controller for domain routing (*.koolify.site)
- Persistent volume support for 2Gi storage per deployment

## Migration Status
✅ **FULLY COMPLETED:**
- All API endpoints migrated with identical functionality
- MongoDB models and persistence layer
- BullMQ job processing and worker
- Framework configurations and Docker registry settings
- Package management and server management endpoints
- File operations and health monitoring
- Session tracking and cleanup automation
- Kubernetes deployment and cleanup operations
- **WebSocket terminal handler with full session persistence** (420+ lines)

### WebSocket Terminal Features
- **Terminal Persistence**: Sessions survive disconnections with history restoration
- **Multi-Session Support**: Multiple users can connect to the same deployment terminal
- **Command Detection**: Smart `npm run dev` conflict prevention
- **MongoDB Integration**: Terminal history and session tracking persisted
- **Auto-Reconnection**: Seamless reconnection with session state restoration
- **PTY Integration**: Full pseudo-terminal support via node-pty
- **Kubernetes Exec**: Direct terminal access to deployment containers
- **Real-time Sync**: Terminal output synchronized across all connected sessions

## Quick Start
```bash
# Install and start everything
npm install
npm run db:up
npm run server:dev &
npm run worker:dev &

# Test the server
curl http://localhost:8000/health
curl http://localhost:8000/api/frameworks
```

## Stopping Services
```bash
npm run db:down
```

## Migration Notes
This server maintains 100% compatibility with the original 1883-line server.js while adding:
- Database persistence instead of in-memory storage
- Background job processing for scalability  
- Enhanced session management
- Improved error handling and logging