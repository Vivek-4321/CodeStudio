# CodeStudio

<div align="center">
  <h3>Containerized Cloud IDE</h3>
  <p>A cloud-based development environment supporting popular frameworks with auto-scaling Docker containers</p>
  
  ![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
  ![React](https://img.shields.io/badge/react-19.x-61dafb.svg)
  ![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?&logo=mongodb&logoColor=white)
  ![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&logo=redis&logoColor=white)
  ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?&logo=docker&logoColor=white)
  ![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?&logo=kubernetes&logoColor=white)
  
  [Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Development](#-development)
</div>

---

## 🚀 Features

### 💻 **Multi-Framework Support**
- **14+ Framework Templates**: React, Vue, Svelte, Solid, Lit, Preact, Vanilla JS/TS
- **Language Support**: JavaScript, TypeScript, HTML, CSS, JSON, Markdown, and more
- **Smart Code Completion**: Monaco Editor with IntelliSense and syntax highlighting
- **Multi-Editor Support**: Both Monaco Editor and CodeMirror integration

### 🐳 **Containerized Development**
- **Auto-Scaling Containers**: Dynamic Docker container provisioning
- **Kubernetes Deployment**: Automated container orchestration and management
- **Isolated Environments**: Each project runs in its own container
- **Resource Monitoring**: Real-time CPU, memory, and storage tracking

### 🔧 **Development Tools**
- **Integrated Terminal**: Full-featured terminal with session persistence
- **Package Management**: npm install/uninstall with real-time updates
- **Dev Server Management**: Start/stop/monitor development servers
- **File System Access**: Complete file tree navigation and editing
- **Live Preview**: Real-time preview of running applications

### 🌐 **Cloud Integration**
- **Firebase Authentication**: Secure user authentication and session management
- **Real-time Collaboration**: WebSocket-based real-time updates
- **Cloud Storage**: Persistent file storage and project management
- **Session Recovery**: Automatic session restoration after disconnection

### 📊 **Monitoring & Management**
- **Health Monitoring**: Comprehensive system health checks
- **Usage Analytics**: Resource usage tracking and optimization
- **Background Jobs**: BullMQ-powered asynchronous task processing
- **Automatic Cleanup**: Smart resource cleanup and garbage collection

---

## 🏗️ Architecture

### **System Overview**

CodeStudio employs a **microservices architecture** with containerized development environments, designed for scalable cloud-based development.

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend<br/>Monaco Editor • CodeMirror]
        UI -->|HTTP + WebSocket| LB[Load Balancer]
    end
    
    subgraph "API Gateway"
        LB --> API[Express.js Server<br/>Port 8000]
        API --> AUTH[Firebase Auth<br/>JWT Tokens]
        API --> RATE[Rate Limiting<br/>Request Throttling]
    end
    
    subgraph "Application Layer"
        CTRL[Controllers<br/>Request Handlers]
        SERV[Services<br/>Business Logic]
        QUEUE[BullMQ Queue<br/>Background Jobs]
        WS[WebSocket Server<br/>Real-time Updates]
    end
    
    subgraph "Container Orchestration"
        K8S[Kubernetes Cluster<br/>Auto-scaling]
        DOCKER[Docker Registry<br/>Framework Images]
        DEPLOY[Deployment Controller<br/>Container Management]
    end
    
    subgraph "Data Layer"
        MONGO[(MongoDB<br/>Projects & Sessions)]
        REDIS[(Redis<br/>Queue & Cache)]
        STORAGE[(Cloud Storage<br/>Project Files)]
    end
    
    API --> CTRL
    CTRL --> SERV
    SERV --> QUEUE
    SERV --> WS
    SERV --> K8S
    K8S --> DOCKER
    DOCKER --> DEPLOY
    SERV --> MONGO
    QUEUE --> REDIS
    DEPLOY --> STORAGE
    
    classDef clientLayer fill:#e1f5fe
    classDef apiLayer fill:#f3e5f5
    classDef appLayer fill:#e8f5e8
    classDef containerLayer fill:#fff3e0
    classDef dataLayer fill:#ffebee
    
    class UI,LB clientLayer
    class API,AUTH,RATE apiLayer
    class CTRL,SERV,QUEUE,WS appLayer
    class K8S,DOCKER,DEPLOY containerLayer
    class MONGO,REDIS,STORAGE dataLayer
```

### **Technology Stack**

| **Component** | **Technology** | **Purpose** | **Key Features** |
|---------------|----------------|-------------|------------------|
| **Frontend** | React 19 + Vite | Modern development UI | Monaco Editor, CodeMirror, real-time updates |
| **Backend** | Node.js + Express | RESTful API server | Modular architecture, middleware pipeline |
| **Database** | MongoDB + Mongoose | Document storage | Flexible schema, session persistence |
| **Queue** | Redis + BullMQ | Background processing | Job queuing, retry logic, monitoring |
| **Container** | Docker + Kubernetes | Container orchestration | Auto-scaling, resource management |
| **Editor** | Monaco + CodeMirror | Code editing | Multi-language support, IntelliSense |
| **Terminal** | node-pty + xterm.js | Terminal emulation | Full PTY support, session persistence |
| **Auth** | Firebase Auth | User authentication | JWT tokens, session management |
| **Storage** | Firebase Storage | File persistence | Cloud storage, automatic backup |

### **Container Architecture**

#### **Framework Support**
```
React (JS/TS) • Vue (JS/TS) • Svelte (JS/TS) • Solid (JS/TS)
Lit (JS/TS) • Preact (JS/TS) • Vanilla (JS/TS)
```

#### **Container Lifecycle**
```
Create Request → Template Selection → Docker Build → 
Kubernetes Deploy → Resource Allocation → Development Ready
```

#### **Auto-scaling Logic**
```javascript
const scalingRules = {
  cpu: "Scale up when CPU > 70% for 5 minutes",
  memory: "Scale up when Memory > 80% for 3 minutes", 
  requests: "Scale up when active sessions > 10",
  cooldown: "5 minute cooldown between scaling events"
}
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ with npm
- Docker and Docker Compose
- Kubernetes cluster (local or cloud)
- MongoDB instance
- Redis instance

### **Installation**

#### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/CodeStudio.git
cd CodeStudio
```

#### **2. Install Dependencies**
```bash
# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

#### **3. Environment Configuration**

**Server Environment** (`server/.env`):
```bash
# Database Configuration
MONGODB_URL=mongodb://localhost:27018/codestudio

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Server Configuration
PORT=8000
NODE_ENV=development
```

**Client Environment** (`client/.env`):
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

#### **4. Start Services**

**Option A: Development Mode**
```bash
# Start database services
cd server && npm run db:up

# Start backend server
npm run server:dev

# Start worker process (in another terminal)
npm run worker:dev

# Start frontend client (in another terminal)
cd client && npm run dev
```

**Option B: Docker Compose**
```bash
# Start all services
docker-compose up --build

# Access applications
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

### **Quick Test**
```bash
# Test server health
curl http://localhost:8000/health

# Test client access
open http://localhost:5173
```

---

## 🛠️ Development

### **Project Structure**
```
CodeStudio/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/              # React Components
│   │   │   ├── IDE.jsx              # Main IDE Interface
│   │   │   ├── Dashboard.jsx        # Project Dashboard
│   │   │   ├── AuthModal.jsx        # Authentication
│   │   │   └── modals/              # Modal Components
│   │   ├── contexts/                # React Contexts
│   │   │   ├── AuthContext.jsx      # Authentication State
│   │   │   └── ProjectContext.jsx   # Project Management
│   │   ├── hooks/                   # Custom Hooks
│   │   │   ├── useTerminal.js       # Terminal Integration
│   │   │   └── useResourceMonitor.js # Resource Monitoring
│   │   ├── services/                # API Services
│   │   │   ├── authService.js       # Authentication
│   │   │   ├── fileOperations.js    # File Management
│   │   │   └── serverManager.js     # Server Operations
│   │   └── stores/                  # State Management
│   │       ├── authStore.js         # Auth State (Zustand)
│   │       └── projectStore.js      # Project State
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── config/                      # Configuration
│   │   ├── firebase.js              # Firebase Setup
│   │   └── db.js                    # Database Connection
│   ├── models/                      # Database Models
│   │   ├── Deployment.js            # Project Schema
│   │   ├── Session.js               # Session Schema
│   │   ├── Terminal.js              # Terminal Schema
│   │   └── User.js                  # User Schema
│   ├── routes/                      # API Routes
│   │   └── api.js                   # Main API Routes
│   ├── services/                    # Business Logic
│   │   └── firebaseFileService.js   # File Operations
│   ├── workers/                     # Background Workers
│   │   ├── worker.js                # Main Worker
│   │   └── deploymentJobs.js        # Deployment Jobs
│   ├── middleware/                  # Express Middleware
│   │   └── authMiddleware.js        # Authentication
│   └── server.js                    # Entry Point
│
├── docker-compose.yml               # Docker Configuration
└── README.md                        # Documentation
```

### **Development Commands**
```bash
# Client Development
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint

# Server Development
cd server
npm run server:dev   # Start with nodemon
npm run worker:dev   # Start worker with nodemon
npm run db:up        # Start MongoDB and Redis
npm run db:down      # Stop database services

# Database Operations
npm run db:seed      # Seed sample data
npm run db:reset     # Reset database
```

### **Adding New Frameworks**

#### **1. Create Framework Template**
```javascript
// Add to server/config/frameworks.js
const frameworks = {
  'my-framework': {
    name: 'My Framework',
    variants: ['javascript', 'typescript'],
    dockerImage: 'my-framework:latest',
    defaultPort: 3000,
    startCommand: 'npm run dev'
  }
};
```

#### **2. Add Framework Icon**
```javascript
// Add to client/src/components/TechIcons.js
export const techIcons = {
  'my-framework': {
    color: '#ff6b6b',
    svg: <svg>...</svg>
  }
};
```

#### **3. Update Framework Templates**
```bash
# Build and push Docker image
docker build -t my-framework:latest .
docker push my-framework:latest

# Add Kubernetes deployment template
kubectl apply -f k8s/my-framework-template.yaml
```

---

## 🚀 Deployment

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Scale services
docker-compose up --scale server=3 --scale worker=2
```

### **Kubernetes Deployment**
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -l app=codestudio

# View logs
kubectl logs -f deployment/codestudio-server
```

### **Environment Variables**
```bash
# Required for production
NODE_ENV=production
MONGODB_URL=mongodb://mongo:27017/codestudio
REDIS_HOST=redis
REDIS_PORT=6379
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Start development: `npm run dev`
5. Make your changes
6. Run tests: `npm test`
7. Commit changes: `git commit -m 'Add amazing feature'`
8. Push to branch: `git push origin feature/amazing-feature`
9. Submit a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- [CodeMirror](https://codemirror.net/) - Versatile text editor
- [Docker](https://www.docker.com/) - Containerization platform
- [Kubernetes](https://kubernetes.io/) - Container orchestration
- [React](https://reactjs.org/) - Frontend framework
- [Node.js](https://nodejs.org/) - JavaScript runtime

---

<div align="center">
  <h3>💻 CodeStudio - Containerized Cloud IDE</h3>
  <p>Built for developers, by developers</p>
</div>