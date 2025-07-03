// IDE Constants and Configuration
// Extracted from src/components/IDE.jsx

// ============================================================================
// API Configuration
// ============================================================================

export const API_BASE_URL = import.meta.env.VITE_GIT_API_BASE;

// ============================================================================
// Framework Definitions
// ============================================================================

export const FRAMEWORKS = [
  // React Ecosystem
  { 
    id: 'react', 
    name: 'React', 
    template: 'react',
    icon: '⚛️',
    description: 'A JavaScript library for building user interfaces',
    color: '#61dafb',
    category: 'Popular React-like'
  },
  { 
    id: 'react-ts', 
    name: 'React TypeScript', 
    template: 'react-ts',
    icon: '⚛️',
    description: 'React with TypeScript for type-safe development',
    color: '#61dafb',
    category: 'Popular React-like'
  },
  
  // Vue Ecosystem
  { 
    id: 'vue', 
    name: 'Vue.js', 
    template: 'vue',
    icon: '🟢',
    description: 'The Progressive JavaScript Framework',
    color: '#4fc08d',
    category: 'Vue Ecosystem'
  },
  { 
    id: 'vue-ts', 
    name: 'Vue TypeScript', 
    template: 'vue-ts',
    icon: '🟢',
    description: 'Vue.js with TypeScript support',
    color: '#4fc08d',
    category: 'Vue Ecosystem'
  },

  // Svelte Ecosystem
  { 
    id: 'svelte', 
    name: 'Svelte', 
    template: 'svelte',
    icon: '🧡',
    description: 'Cybernetically enhanced web apps',
    color: '#ff3e00',
    category: 'Svelte Ecosystem'
  },
  { 
    id: 'svelte-ts', 
    name: 'Svelte TypeScript', 
    template: 'svelte-ts',
    icon: '🧡',
    description: 'Svelte with TypeScript for enhanced development',
    color: '#ff3e00',
    category: 'Svelte Ecosystem'
  },

  // Lightweight Alternatives
  { 
    id: 'preact', 
    name: 'Preact', 
    template: 'preact',
    icon: '💜',
    description: 'Fast 3kB alternative to React with the same modern API',
    color: '#673ab8',
    category: 'Popular React-like'
  },
  { 
    id: 'preact-ts', 
    name: 'Preact TypeScript', 
    template: 'preact-ts',
    icon: '💜',
    description: 'Preact with TypeScript support',
    color: '#673ab8',
    category: 'Popular React-like'
  },

  // Modern Performance-focused
  { 
    id: 'solid', 
    name: 'Solid.js', 
    template: 'solid',
    icon: '🔷',
    description: 'Simple and performant reactivity for building user interfaces',
    color: '#2c4f7c',
    category: 'Modern Alternatives'
  },
  { 
    id: 'solid-ts', 
    name: 'Solid TypeScript', 
    template: 'solid-ts',
    icon: '🔷',
    description: 'Solid.js with TypeScript for type-safe reactive development',
    color: '#2c4f7c',
    category: 'Modern Alternatives'
  },

  // Web Components
  { 
    id: 'lit', 
    name: 'Lit', 
    template: 'lit',
    icon: '🔥',
    description: 'Simple. Fast. Web Components.',
    color: '#324fff',
    category: 'Web Components'
  },
  { 
    id: 'lit-ts', 
    name: 'Lit TypeScript', 
    template: 'lit-ts',
    icon: '🔥',
    description: 'Lit with TypeScript for type-safe web components',
    color: '#324fff',
    category: 'Web Components'
  },

  // Vanilla/Pure
  { 
    id: 'vanilla', 
    name: 'Vanilla JavaScript', 
    template: 'vanilla',
    icon: '🍦',
    description: 'Pure JavaScript with no framework dependencies',
    color: '#f7df1e',
    category: 'Vanilla/Pure'
  },
  { 
    id: 'vanilla-ts', 
    name: 'Vanilla TypeScript', 
    template: 'vanilla-ts',
    icon: '🍦',
    description: 'Pure TypeScript with no framework dependencies',
    color: '#3178c6',
    category: 'Vanilla/Pure'
  }
];

// ============================================================================
// Terminal Configuration
// ============================================================================

export const TERMINAL_CONFIG = {
  HISTORY_MAX_SIZE: 100000, // Max characters to keep in terminal history
  HISTORY_TRIM_RATIO: 0.8, // Ratio to trim when max size is exceeded
  IMPORTANT_LOG_PATTERNS: [
    'Local:',
    'Network:',
    'ready in',
    'dev server running',
    'started server',
    'Framework:',
    'Connected to'
  ]
};

// ============================================================================
// Loading and Animation Configuration
// ============================================================================

export const LOADING_CONFIG = {
  // Loading text arrays for different states
  DEPLOYMENT_STARTING_TEXTS: [
    'Starting deployment',
    'Initializing containers',
    'Setting up environment',
    'Loading dependencies',
    'Preparing workspace'
  ],
  
  DEFAULT_LOADING_TEXTS: [
    'Creating workspace',
    'Allocating space',
    'Setting up environment',
    'Initializing project',
    'Loading dependencies'
  ],
  
  // Animation timings
  TEXT_CHANGE_INTERVAL: 2000, // milliseconds
  DOTS_ANIMATION_INTERVAL: 500, // milliseconds
  IDE_INITIALIZATION_DURATION: 2500, // milliseconds
  DEPLOYMENT_READY_DELAY: 1000, // milliseconds
  AUTO_OPEN_FILE_DELAY: 500, // milliseconds
  FILE_SYSTEM_SYNC_DELAY: 1000 // milliseconds for container sync
};

// ============================================================================
// Skeleton Component Configuration
// ============================================================================

export const SKELETON_CONFIG = {
  FILE_TREE: {
    ITEM_COUNT: 10,
    PADDING_LEVELS: [32, 24, 16], // px values for different nesting levels
    NAME_WIDTHS: ['75%', '60%', '85%', '70%'] // Width variations for skeleton names
  },
  
  PACKAGES: {
    ITEM_COUNT: 6
  },
  
  EDITOR: {
    LINE_COUNT: 12,
    MIN_LINE_WIDTH: 30, // percentage
    MAX_LINE_WIDTH: 70 // percentage
  },
  
  TERMINAL: {
    SKELETON_LINE_WIDTHS: ['45%', '65%', '40%', '55%', '75%', '30%']
  }
};

// ============================================================================
// Default State Values
// ============================================================================

export const DEFAULT_STATE = {
  SERVER_STATUS: 'stopped',
  TERMINAL_STATUS: 'disconnected',
  SIDEBAR_ACTIVE_TAB: 'resources',
  
  STATUS_MESSAGE: {
    text: 'Ready',
    type: 'info'
  },
  
  EDITOR_CONTENT: '// Select a file to start editing\n// Choose a file from the explorer to begin',
  
  COLLAPSED_SECTIONS: {
    files: false,
    packages: false,
    server: false,
    logs: true
  },
  
  CONTEXT_MENU: {
    show: false,
    x: 0,
    y: 0,
    file: null
  },
  
  // Resource usage default values
  CPU_USAGE: 8,
  MEMORY_USAGE: 14,
  HISTORY_LENGTH: 20
};

// ============================================================================
// File Management Configuration
// ============================================================================

export const FILE_CONFIG = {
  MAIN_FILE_PRIORITY: [
    'src/App.jsx',
    'src/App.tsx', 
    'src/main.jsx',
    'src/main.tsx',
    'src/App.vue',
    'src/App.svelte',
    'App.jsx',
    'App.tsx',
    'main.jsx',
    'main.tsx',
    'index.html',
    'README.md',
    'package.json'
  ],
  
  LANGUAGE_MAP: {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    dockerfile: 'dockerfile'
  }
};

// ============================================================================
// Activity and Session Configuration
// ============================================================================

export const ACTIVITY_CONFIG = {
  INACTIVITY_WARNING_THRESHOLD: 30 * 60 * 1000, // 30 minutes in milliseconds
  ACTIVITY_CHECK_INTERVAL: 60000, // 1 minute in milliseconds
  
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart'
  ]
};

// ============================================================================
// Resource Usage Configuration
// ============================================================================

export const RESOURCE_CONFIG = {
  FETCH_INTERVAL: 3000, // milliseconds
  
  FALLBACK_RANGES: {
    CPU: { min: 5, max: 25, variance: 4 },
    MEMORY: { min: 8, max: 30, variance: 6 }
  },
  
  INITIAL_VALUES: {
    CPU_RANGE: { min: 5, max: 20 },
    MEMORY_RANGE: { min: 10, max: 30 }
  }
};

// ============================================================================
// Notification Configuration
// ============================================================================

export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 5000, // milliseconds
  ERROR_DURATION: 5000,
  SUCCESS_DURATION: 3000,
  WARNING_DURATION: 5000,
  
  TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  }
};

// ============================================================================
// Allotment (Pane) Configuration
// ============================================================================

export const PANE_CONFIG = {
  SIDEBAR: {
    MIN_SIZE: 200,
    MAX_SIZE: 500
  },
  
  MAIN_CONTENT: {
    MIN_SIZE: 150,
    MAX_SIZE: 600
  }
};

// ============================================================================
// Utility Functions for Constants
// ============================================================================

export const getFrameworkById = (id) => {
  return FRAMEWORKS.find(f => f.id === id) || FRAMEWORKS[0];
};

export const getLanguageByExtension = (extension) => {
  const ext = extension.toLowerCase();
  return FILE_CONFIG.LANGUAGE_MAP[ext] || 'plaintext';
};

export const isMainFile = (filePath) => {
  return FILE_CONFIG.MAIN_FILE_PRIORITY.includes(filePath);
};

export const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};