import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Editor from "@monaco-editor/react";
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import authService from '../services/authService';
import { techIcons } from './TechIcons';
import UserProfile from './UserProfile';

// Import extracted services
import fileOperations from '../services/fileOperations';
import serverManager from '../services/serverManager';
import projectService from '../services/projectService';

// Import extracted utilities
import { createGetFileIcon, createSVGIcon, getLanguage } from '../utils/fileIcons.jsx';
import { getMonacoLanguageFromFileName } from '../utils/fileDefinitions';

// Import extracted hooks
import { useTerminal } from '../hooks/useTerminal';
import { useResourceMonitor } from '../hooks/useResourceMonitor';

// Import extracted components
import {
  SkeletonFileTree,
  SkeletonPackages,
  SkeletonEditor,
  SkeletonPreview,
  SkeletonTerminal,
  SkeletonUsageResources,
  LoadingScreen
} from './skeletons';

import {
  CreateFileModal,
  RenameModal,
  ProjectsModal,
  CloseConfirmModal,
  ContextMenu,
  NotificationSystem,
  FRAMEWORKS
} from './modals';

// Import icons we still need directly in IDE
import { 
  Play, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  ExternalLink,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  X,
  Circle,
  Package,
  FileCode,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Wifi,
  WifiOff,
  Monitor,
  Save,
  ArrowLeft,
  AlertTriangle,
  Info,
  Clock,
  Cloud,
  User,
  Terminal as TerminalIcon
} from 'lucide-react';

import { Allotment } from "allotment";
import "allotment/dist/style.css";

import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';


const API_BASE_URL = 'https://git.aethercure.site';

function IDE() {
  // Router hooks
  const { framework: frameworkId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get framework data from URL params and location state
  const selectedFramework = location.state || FRAMEWORKS.find(f => f.id === frameworkId) || FRAMEWORKS[0];
  
  // Initialize file icon utilities with techIcons
  const getFileIcon = createGetFileIcon(techIcons);
  
  // Notification state (will be managed by NotificationSystem component)
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, timestamp: Date.now() };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const { user, isAuthenticated, authService: auth } = useAuth();
  const { 
    saveProject, 
    loadProject, 
    loadUserProjects, 
    currentProject, 
    projects, 
    loading, 
    error,
    renameFile,
    createFile: createFileInProject,
    moveFile: moveFileInProject,
    deleteFile: deleteFileInProject
  } = useProject();

  // Main deployment state
  const [deployments, setDeployments] = useState([]);
  const [currentDeployment, setCurrentDeployment] = useState(null);

  // Activity tracking for extracted hooks
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Derive server status from current deployment
  const serverStatus = currentDeployment ? serverManager.getState().status : 'stopped';

  // Initialize extracted hooks with proper destructuring
  const {
    terminalStatus,
    isReconnecting,
    connectionAttempts,
    isLoadingTerminal,
    terminalRef,
    terminalInstanceRef,
    connectTerminalWithRetry,
    disconnectTerminal,
    resetTerminalConnection,
    clearTerminal,
    fitTerminal,
    getTerminalStatusIcon,
    getTerminalHistory,
    clearTerminalHistory
  } = useTerminal({
    currentDeployment,
    serverStatus,
    updateActivity,
    addNotification
  });

  const {
    cpuUsage,
    memoryUsage,
    cpuHistory,
    memoryHistory,
    isLoadingResources,
    isUsingFallbackData,
    resourceError,
    hasLoadedForReadyDeployment,
    isMonitoring,
    getCpuChartData,
    getMemoryChartData,
    formatChartData,
    getResourceStats,
    startMonitoring,
    stopMonitoring,
    refreshResourceData,
    resetResourceState
  } = useResourceMonitor(currentDeployment, 3000);

  // Additional state variables not covered by hooks
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Editor and files state
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [packages, setPackages] = useState({});
  const [editorContent, setEditorContent] = useState('// Select a file to start editing\n// Choose a file from the explorer to begin');
  const [packageInput, setPackageInput] = useState('');

  // UI state
  const [statusMessage, setStatusMessage] = useState({ text: 'Ready', type: 'info' });
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [routeInput, setRouteInput] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    files: false,
    packages: false,
    server: false
  });

  // File management state
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, file: null });
  const [draggedFile, setDraggedFile] = useState(null);
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);
  const [isDirectory, setIsDirectory] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionId] = useState(() => Date.now().toString(36) + Math.random().toString(36).substr(2));
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const [sidebarActiveTab, setSidebarActiveTab] = useState('resources');

  // Loading states for different sections
  const [isLoadingFileTree, setIsLoadingFileTree] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isLoadingEditor, setIsLoadingEditor] = useState(false);
  const [isInitializingIDE, setIsInitializingIDE] = useState(true);

  // Sync fileTree with currentProject.files when project changes
  useEffect(() => {
    if (currentProject && currentProject.files) {
      setFileTree(currentProject.files);
    } else if (!currentDeployment) {
      // Clear fileTree if no project and no deployment
      setFileTree([]);
    }
  }, [currentProject, currentDeployment]);


  // IDE initialization - show loading screen until IDE is ready or deployment is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializingIDE(false);
    }, 10500); // Minimum loading screen duration

    return () => clearTimeout(timer);
  }, []); // Empty dependency array - runs once on mount

  // Hide loading screen when deployment becomes ready
  useEffect(() => {
    if (currentDeployment && currentDeployment.status === 'ready') {
      const timer = setTimeout(() => {
        setIsInitializingIDE(false);
        
        // Auto-open main file if no files are currently open
        if (openTabs.length === 0 && fileTree.length > 0) {
          setTimeout(async () => {
            try {
              await autoOpenMainFile();
            } catch (error) {
              console.error('Error auto-opening file on deployment ready:', error);
            }
          }, 500); // Additional delay to ensure file tree is loaded
        }
      }, 1000); // Short delay to show transition
      return () => clearTimeout(timer);
    }
  }, [currentDeployment?.status, openTabs.length, fileTree.length]);

  // Project service state synchronization
  useEffect(() => {
    const unsubscribeLoading = projectService.onLoadingStateChange(setIsLoadingProjects);
    const unsubscribeSaving = projectService.onSavingStateChange(setIsCloudSaving);
    
    return () => {
      unsubscribeLoading();
      unsubscribeSaving();
    };
  }, []);

  // Unified file management system

  // Deployment-based file creation (existing)

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    // Check if any file system is available
    const context = fileOperations.getFileSystemContext(currentDeployment, currentProject);
    if (!context.canUseDeployment && !context.canUseProject) {
      // addNotification('No file system available. Please load a project or start a deployment first.', 'error', 7000);
      setShowCreateFileModal(false);
      setNewFileName('');
      setIsDirectory(false);
      setContextMenu({ show: false, x: 0, y: 0, file: null });
      return;
    }

    const filePath = contextMenu.file && contextMenu.file.isDirectory 
      ? `${contextMenu.file.path}/${newFileName}`
      : newFileName;

    const result = await fileOperations.createFileUnified(context, createFileInProject, currentDeployment?.id, filePath, '', isDirectory);
    
    if (result.success) {
      // addNotification(`${isDirectory ? 'Folder' : 'File'} created successfully`, 'success');
      
      // Refresh the appropriate file system
      if (context.canUseDeployment && currentDeployment && currentDeployment.id) {
        try {
          // Add a small delay to ensure container filesystem sync
          setTimeout(async () => {
            try {
              await loadFileTree(currentDeployment.id);
            } catch (error) {
              console.error('Error refreshing deployment file tree after create:', error);
              // addNotification('File created but deployment file tree may not be updated. Please refresh manually.', 'warning', 3000);
            }
          }, 1000); // 1 second delay for container sync
        } catch (error) {
          console.error('Error setting up file tree refresh:', error);
        }
      }
      
      // If using project storage, the ProjectContext will handle the refresh automatically
    } else {
      // addNotification(result.error, 'error');
    }

    setShowCreateFileModal(false);
    setNewFileName('');
    setIsDirectory(false);
    setContextMenu({ show: false, x: 0, y: 0, file: null });
  };

  const handleRenameFile = async () => {
    if (!newFileName.trim() || !renameTarget) return;

    const directory = renameTarget.path.substring(0, renameTarget.path.lastIndexOf('/'));
    const newPath = directory ? `${directory}/${newFileName}` : newFileName;

    const result = await renameFile(renameTarget.path, newPath);
    
    if (result.success) {
      // addNotification('File renamed successfully', 'success');
      
      // Update active tab if the renamed file is open
      if (activeTab && activeTab.path === renameTarget.path) {
        setActiveTab({ ...activeTab, path: newPath, name: newFileName });
        setOpenTabs(prev => prev.map(tab => 
          tab.path === renameTarget.path ? { ...tab, path: newPath, name: newFileName } : tab
        ));
      }
      
      // Refresh the file tree to reflect the changes
      if (currentDeployment && currentDeployment.id) {
        try {
          // Add a small delay to ensure container filesystem sync
          setTimeout(async () => {
            try {
              await loadFileTree(currentDeployment.id);
            } catch (error) {
              console.error('Error refreshing file tree after rename:', error);
              // addNotification('File renamed but file tree may not be updated. Please refresh manually.', 'warning', 3000);
            }
          }, 1000); // 1 second delay for container sync
        } catch (error) {
          console.error('Error setting up file tree refresh:', error);
        }
      }
    } else {
      // addNotification(result.error, 'error');
    }

    setShowRenameModal(false);
    setNewFileName('');
    setRenameTarget(null);
  };

  const handleDeleteFile = async (filePath) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    const result = await fileOperations.handleDeleteFileUnified(currentDeployment?.id, filePath);
    
    if (result.success) {
      // addNotification('File deleted successfully', 'success');
      
      // Close tab if deleted file is open
      if (activeTab && activeTab.path === filePath) {
        setActiveTab(null);
        setOpenTabs(prev => prev.filter(tab => tab.path !== filePath));
      } else {
        setOpenTabs(prev => prev.filter(tab => tab.path !== filePath));
      }
      
      // Refresh the file tree to reflect the changes
      if (currentDeployment && currentDeployment.id) {
        try {
          // Add a small delay to ensure container filesystem sync
          setTimeout(async () => {
            try {
              await loadFileTree(currentDeployment.id);
            } catch (error) {
              console.error('Error refreshing file tree after delete:', error);
              // addNotification('File deleted but file tree may not be updated. Please refresh manually.', 'warning', 3000);
            }
          }, 1000); // 1 second delay for container sync
        } catch (error) {
          console.error('Error setting up file tree refresh:', error);
        }
      }
    } else {
      // addNotification(result.error, 'error');
    }

    setContextMenu({ show: false, x: 0, y: 0, file: null });
  };

  const handleDragStart = (e, file) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Unified file move using extracted service
  const moveFileUnified = async (sourcePath, destinationPath) => {
    const context = fileOperations.getFileSystemContext(currentDeployment, currentProject);
    
    // Use extracted file operations service
    const result = await fileOperations.moveFileUnified(
      context, 
      moveFileInProject, 
      currentDeployment?.id, 
      sourcePath, 
      destinationPath
    );
    
    return result;
  };

  const handleDrop = async (e, targetFile) => {
    e.preventDefault();
    
    // Check if any file system is available
    const context = fileOperations.getFileSystemContext(currentDeployment, currentProject);
    if (!context.canUseDeployment && !context.canUseProject) {
      // addNotification('No file system available. Please load a project or start a deployment first.', 'error', 7000);
      setDraggedFile(null);
      return;
    }
    
    if (!draggedFile) {
      // addNotification('No file selected for drag operation', 'error');
      return;
    }

    // Allow dropping to root if targetFile is null (root area)
    if (targetFile && !targetFile.isDirectory) {
      // addNotification('Files can only be dropped into folders', 'error');
      return;
    }

    // Prevent dropping a file/folder into itself
    if (targetFile && draggedFile.path === targetFile.path) {
      // addNotification('Cannot move a folder into itself', 'error');
      setDraggedFile(null);
      return;
    }

    // For root drop, use empty string as destination
    const destinationPath = targetFile ? targetFile.path : '';
    const fileName = draggedFile.path.split('/').pop();
    const originalPath = draggedFile.path;
    
    // Store original file tree for rollback
    const originalFileTree = [...fileTree];
    
    // Helper function to move file in local file tree state
    const moveFileInTreeOptimistically = (tree, sourcePath, destinationPath) => {
      const newTree = [...tree];
      let draggedFileData = null;
      
      // Find and remove the dragged file from its current location
      const removeFromTree = (nodes, path) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].path === path) {
            draggedFileData = { ...nodes[i] };
            nodes.splice(i, 1);
            return true;
          }
          if (nodes[i].children && removeFromTree(nodes[i].children, path)) {
            return true;
          }
        }
        return false;
      };
      
      // Add file to destination
      const addToTree = (nodes, targetPath, fileData) => {
        if (targetPath === '') {
          // Root level
          nodes.push(fileData);
          return true;
        }
        
        for (let node of nodes) {
          if (node.path === targetPath && node.isDirectory) {
            if (!node.children) node.children = [];
            const newPath = `${targetPath}/${fileData.name}`;
            fileData.path = newPath;
            node.children.push(fileData);
            return true;
          }
          if (node.children && addToTree(node.children, targetPath, fileData)) {
            return true;
          }
        }
        return false;
      };
      
      if (removeFromTree(newTree, sourcePath) && draggedFileData) {
        addToTree(newTree, destinationPath, draggedFileData);
      }
      
      return newTree;
    };
    
    // Perform optimistic update in local state only
    const optimisticFileTree = moveFileInTreeOptimistically(fileTree, originalPath, destinationPath);
    setFileTree(optimisticFileTree);
    
    // Perform actual move operation
    const result = await moveFileUnified(originalPath, destinationPath);
    
    if (result.success) {
      // addNotification('File moved successfully', 'success');
      if (result.warning) {
        // addNotification(result.warning, 'warning', 5000);
      }
      
      // Reload file tree from server to get authoritative state
      if (context.canUseDeployment && currentDeployment && currentDeployment.id) {
        try {
          // Add a small delay to ensure container filesystem sync
          setTimeout(async () => {
            try {
              await loadFileTree(currentDeployment.id);
            } catch (error) {
              console.error('Error reloading file tree after successful move:', error);
            }
          }, 1000); // 1 second delay for container sync
        } catch (error) {
          console.error('Error setting up file tree refresh:', error);
        }
      } else if (context.canUseProject) {
        // ProjectContext will handle the update via its moveFile method
        // which automatically reloads the project after successful move
      }
    } else {
      // addNotification(result.error, 'error');
      
      // Rollback: Restore original file tree
      setFileTree(originalFileTree);
    }

    setDraggedFile(null);
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, file: null });
  };

  // Refs (terminalRef and terminalInstanceRef now come from useTerminal hook)
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const activityIntervalRef = useRef(null);
  const connectionThrottleRef = useRef(null);

  // Activity tracking (updateActivity already defined above from useTerminal hook)

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    activityIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      
      // If inactive for more than 30 minutes, show warning
      if (inactiveTime > 30 * 60 * 1000 && currentDeployment) {
        // addNotification('You\'ve been inactive for 30 minutes. Your deployment may be cleaned up soon.', 'warning', 10000);
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [lastActivity, currentDeployment]); // addNotification dependency commented out

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (currentDeployment && (unsavedChanges || serverStatus === 'running')) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes or a running server. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    const handleUnload = async () => {
      if (currentDeployment) {
        // Send beacon to cleanup deployment
        const cleanupData = new FormData();
        cleanupData.append('deploymentId', currentDeployment.id);
        cleanupData.append('sessionId', sessionId);
        cleanupData.append('action', 'cleanup');
        if (authService.getToken()) {
          cleanupData.append('token', authService.getToken());
        }
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`${API_BASE_URL}/api/cleanup`, cleanupData);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [currentDeployment, unsavedChanges, serverStatus, sessionId]);

  // Custom SVG Icon Component - only for icons we have in TechIcons.js
  const SVGIcon = ({ iconKey, size = 16, className = "file-icon", style = {} }) => {
    const icon = techIcons[iconKey];
    if (!icon || !icon.svg) {
      return null; // Return null if we don't have this icon
    }
    
    // Clean and modify SVG
    const svgContent = icon.svg.replace(/<!--.*?-->/gs, '').trim();
    
    // Add width and height attributes, handling both existing and missing attributes
    let modifiedSVG = svgContent;
    
    // If the SVG doesn't have width/height, add them
    if (!modifiedSVG.includes('width=')) {
      modifiedSVG = modifiedSVG.replace('<svg', `<svg width="${size}"`);
    } else {
      modifiedSVG = modifiedSVG.replace(/width="[^"]*"/, `width="${size}"`);
    }
    
    if (!modifiedSVG.includes('height=')) {
      modifiedSVG = modifiedSVG.replace('<svg', `<svg height="${size}"`);
    } else {
      modifiedSVG = modifiedSVG.replace(/height="[^"]*"/, `height="${size}"`);
    }
    
    return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: modifiedSVG }} />;
  };

  // getFileIcon function is now provided by the extracted fileIcons utility

  // Get language for Monaco based on file extension
  const getLanguage = () => {
    if (!activeTab) return "plaintext";
    
    const extension = activeTab.split('.').pop().toLowerCase();
    
    const langMap = {
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
      md: 'markdown',
      vue: 'vue',
      svelte: 'svelte'
    };
    
    return langMap[extension] || 'plaintext';
  };

  // Monaco editor configuration
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Define VS Code dark theme
    monaco.editor.defineTheme('vscode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#666666',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#0a0a0a',
        'editorCursor.foreground': '#ffffff',
      }
    });
    
    monaco.editor.setTheme('vscode-dark');
    
    // Enable word wrap
    editor.updateOptions({
      wordWrap: 'on',
      wordWrapColumn: 80,
      fontLigatures: true
    });
  };

  // Save project to Firebase
  // Load Firebase project and create deployment (using projectService)
  const loadProjectAndDeploy = async (project) => {
    const result = await projectService.loadProjectAndDeploy(project, sessionId, {
      projectContext: { loadProject },
      loadDeployments,
      selectDeployment,
      loadFileTree,
      setPreviewKey,
      setShowProjectsModal
    });
    
    if (!result.success) {
      // Handle error if needed
      console.error('Failed to load project and deploy:', result.error);
    }
  };

  // Load user's Firebase projects (using projectService)
  const handleLoadProjects = async () => {
    await projectService.handleLoadProjects(setShowProjectsModal, { loadUserProjects }, isAuthenticated);
  };

  // Save project to cloud (using projectService)
  const saveProjectToCloud = async () => {
    const result = await projectService.saveProjectToCloud(currentDeployment, {
      openTabs,
      activeTab,
      editorContent,
      fileTree,
      sessionId,
      getCurrentFramework,
      projectContext: { saveProject },
      setUnsavedChanges
    });
    
    if (!result.success) {
      // Handle error if needed
      console.error('Failed to save project to cloud:', result.error);
    }
  };

  // Initialize terminal with persistence
  useEffect(() => {
    if (terminalRef.current && !terminalInstanceRef.current) {
      const terminal = new Terminal({
        theme: {
          background: '#000000',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          selection: '#264f78',
          black: '#000000',
          red: '#f44747',
          green: '#4fc1ff',
          yellow: '#ffcc02',
          blue: '#0078d4',
          magenta: '#bc3fbc',
          cyan: '#0bc3ac',
          white: '#cccccc',
        },
        fontSize: 13,
        fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "SF Mono", Monaco, Consolas, monospace',
        fontWeight: 400,
        cursorBlink: true,
        convertEol: true,
        scrollback: 1000,
        cols: 80,
        rows: 15
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      
      terminal.open(terminalRef.current);
      
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.log('Terminal fit failed:', e);
        }
      }, 100);

      // Terminal ready - show prompt
      terminal.write('\x1b[32m$\x1b[0m ');

      terminalInstanceRef.current = terminal;
      fitAddonRef.current = fitAddon;

      terminal.onData(data => {
        updateActivity();
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && terminalStatus === 'connected') {
          socketRef.current.send(JSON.stringify({
            type: 'input',
            data: data
          }));
        }
      });

      terminal.onResize(size => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && terminalStatus === 'connected') {
          socketRef.current.send(JSON.stringify({
            type: 'resize',
            cols: size.cols,
            rows: size.rows
          }));
        }
      });
    }

    return () => {
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }
    };
  }, [terminalStatus, updateActivity]);

  // Auto-connect terminal when deployment is ready with loading state
  const autoConnectTimeoutRef = useRef(null);
  
  useEffect(() => {
    // Clear any existing auto-connect timeout
    if (autoConnectTimeoutRef.current) {
      clearTimeout(autoConnectTimeoutRef.current);
      autoConnectTimeoutRef.current = null;
    }
    
    if (currentDeployment && 
        currentDeployment.status === 'ready' && 
        terminalStatus === 'disconnected' && 
        !isReconnecting &&
        !connectionThrottleRef.current) {
      
      // Show skeleton while auto-connecting (managed by useTerminal hook)
      
      // Auto-connect after a short delay
      autoConnectTimeoutRef.current = setTimeout(() => {
        if (!connectionThrottleRef.current && terminalStatus === 'disconnected') {
          connectTerminalWithRetry();
        }
      }, 2000); // Increased delay to 2 seconds
    }
    
    return () => {
      if (autoConnectTimeoutRef.current) {
        clearTimeout(autoConnectTimeoutRef.current);
        autoConnectTimeoutRef.current = null;
      }
    };
  }, [currentDeployment?.status, terminalStatus, isReconnecting]); // Removed connectTerminalWithRetry dependency

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        setTimeout(() => {
          try {
            fitAddonRef.current.fit();
          } catch (e) {
            console.log('Terminal resize error:', e);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load deployments with deduplication
  const loadDeployments = useCallback(async () => {
    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments`);
      const data = await response.json();
      
      // Deduplicate deployments by id, keeping the most recent one
      const uniqueDeployments = data.reduce((acc, deployment) => {
        const existing = acc.find(d => d.id === deployment.id);
        if (!existing) {
          acc.push(deployment);
        } else {
          // Keep the one with the most recent createdAt
          const existingIndex = acc.findIndex(d => d.id === deployment.id);
          if (new Date(deployment.createdAt) > new Date(existing.createdAt)) {
            acc[existingIndex] = deployment;
          }
        }
        return acc;
      }, []);
      
      setDeployments(uniqueDeployments);
      
      // Auto-select if only one deployment and none selected, but avoid infinite loops
      if (uniqueDeployments.length === 1 && !currentDeployment) {
        const deployment = uniqueDeployments[0];
        if (deployment.status === 'ready') {
          selectDeployment(deployment.id);
        }
      }
    } catch (error) {
      console.error('Error loading deployments:', error);
      setStatus('Error loading deployments', 'error');
    }
  }, [currentDeployment]);

  // Status setter with notifications
  const setStatus = (text, type = 'info') => {
    setStatusMessage({ text, type });
    
    if (type === 'error') {
      // addNotification(text, type, 5000);
    } else if (type === 'success') {
      // addNotification(text, type, 3000);
    }
    
    if (type !== 'info') {
      setTimeout(() => setStatusMessage({ text: 'Ready', type: 'info' }), 5000);
    }
  };

  // Enhanced server status checking
  const checkServerStatus = async (deploymentId) => {
    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId || currentDeployment?.id}/server/status`);
      if (!response.ok) return;
      const data = await response.json();
      
      const wasRunning = serverStatus === 'running';
      // Update server manager state instead of non-existent React state
      serverManager.serverStatus = data.status;
      serverManager.serverProcessInfo = data.processInfo || '';
      
      // Notify on status changes
      if (!wasRunning && data.status === 'running') {
        // addNotification('Development server is now running!', 'success', 5000);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln('\x1b[32m✅ Dev server detected as running\x1b[0m');
        }
      } else if (wasRunning && data.status === 'stopped') {
        // addNotification('Development server stopped', 'warning', 3000);
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.writeln('\x1b[31m🛑 Dev server stopped\x1b[0m');
        }
      }
      
    } catch (error) {
      console.error('Error checking server status:', error);
    }
  };

  // Initial load and cleanup
  useEffect(() => {
    loadDeployments();
    
    const interval = setInterval(() => {
      if (currentDeployment && currentDeployment.status !== 'ready') {
        refreshDeployment();
      } else if (currentDeployment && currentDeployment.status === 'ready') {
        checkServerStatus();
        
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [currentDeployment, serverStatus]);

  // Handle auto-creating deployment from existing project
  useEffect(() => {
    if (selectedFramework?.autoCreateFromProject) {
      // Automatically create new deployment and load project files
      // addNotification(`Creating deployment for ${selectedFramework.autoCreateFromProject.name}...`, 'info', 3000);
      loadProjectAndDeploy(selectedFramework.autoCreateFromProject);
    }
  }, [selectedFramework]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle framework selection and project loading from dashboard
  useEffect(() => {
    if (selectedFramework) {
      // Check if a project was created from dashboard
      if (selectedFramework.createdProject && selectedFramework.deploymentId) {
        console.log('IDE: Received framework from dashboard:', selectedFramework);
        console.log('IDE: Looking for deployment ID:', selectedFramework.deploymentId);
        console.log('IDE: Current deployments:', deployments);
        
        // Load the newly created deployment
        // addNotification(`Loading ${selectedFramework.projectName}...`, 'info', 3000);
        loadDeployments().then(() => {
          // Try to select the deployment, with retry if not found
          const trySelectDeployment = (attempts = 0) => {
            console.log(`IDE: Attempt ${attempts + 1} to find deployment ${selectedFramework.deploymentId}`);
            const deployment = deployments.find(d => d.id === selectedFramework.deploymentId);
            console.log('IDE: Found deployment:', deployment);
            
            if (deployment) {
              console.log('IDE: Selecting deployment:', selectedFramework.deploymentId);
              selectDeployment(selectedFramework.deploymentId);
              // addNotification(`Successfully loaded ${selectedFramework.projectName}`, 'success', 3000);
            } else if (attempts < 3) {
              console.log(`IDE: Deployment not found, retrying in 1 second (attempt ${attempts + 1}/3)`);
              // Retry after a short delay
              setTimeout(() => {
                loadDeployments().then(() => trySelectDeployment(attempts + 1));
              }, 1000);
            } else {
              console.log('IDE: Failed to find deployment after 3 attempts');
              // addNotification(`Could not find deployment ${selectedFramework.projectName}`, 'error', 5000);
            }
          };
          trySelectDeployment();
        });
      }
      // Check if we need to load a specific project (create new deployment)
      else if (selectedFramework.loadProject) {
        loadProjectAndDeploy(selectedFramework.loadProject);
      } 
      // Check if we need to show the projects modal
      else if (selectedFramework.showProjectsModal) {
        setShowProjectsModal(true);
      }
      // Don't show create modal if auto-creating from existing project
      else if (selectedFramework.autoCreateFromProject) {
        // Auto-creation is handled by the previous useEffect
        return;
      }
      // New projects should be created from dashboard
      // No need to show modal here anymore
    }
  }, [selectedFramework, deployments.length]);

  // Auto-open main file for better UX
  const autoOpenMainFile = async () => {
    if (!fileTree || fileTree.length === 0 || openTabs.length > 0) {
      return; // Don't auto-open if file tree is empty or files are already open
    }

    // Priority order of files to open
    const mainFiles = [
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
    ];

    // Find the first available main file
    for (const mainFile of mainFiles) {
      const foundFile = fileTree.find(file => file.path === mainFile);
      if (foundFile && !foundFile.isDirectory) {
        try {
          console.log('Auto-opening main file:', mainFile);
          await openFile(mainFile);
          return;
        } catch (error) {
          console.error('Error auto-opening file:', mainFile, error);
        }
      }
    }

    // If no main files found, open the first non-directory file
    const firstFile = fileTree.find(file => !file.isDirectory);
    if (firstFile) {
      try {
        console.log('Auto-opening first available file:', firstFile.path);
        await openFile(firstFile.path);
      } catch (error) {
        console.error('Error auto-opening first file:', firstFile.path, error);
      }
    }
  };

  // Rest of the component methods remain the same but with enhanced error handling and notifications
  const selectDeployment = async (deploymentId) => {
    resetTerminalConnection(); // Use reset instead of disconnect for cleaner state
    
    if (!deploymentId) {
      setCurrentDeployment(null);
      return;
    }

    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}`);
      const deployment = await response.json();
      setCurrentDeployment(deployment);
      
      setStatus(`Connected to ${deployment.projectName}`, 'success');
      clearTerminalHistory(); // Clear history for new deployment
      
      if (deployment.status === 'ready') {
        await loadFileTree(deploymentId);
        await loadPackages(deploymentId);
        await checkServerStatus(deploymentId);
        await loadServerLogs(deploymentId);
        
        // Additional file tree refresh after a short delay to catch any recently loaded files
        setTimeout(async () => {
          try {
            await loadFileTree(deploymentId);
            console.log('File tree refreshed for deployment:', deploymentId);
            
            // Auto-open a main file for better UX
            await autoOpenMainFile();
          } catch (error) {
            console.error('Error in delayed file tree refresh:', error);
          }
        }, 2000);
        
        const statusResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/server/status`);
        const statusData = await statusResponse.json();
        if (statusData.status === 'running') {
          startLogStreaming(deploymentId);
        }
      } else {
        setStatus('Deployment starting...', 'warning');
        setFileTree([]);
        setPackages({});
        setServerLogs('');
      }
      
      // Terminal will auto-connect via useEffect when deployment is ready
    } catch (error) {
      console.error('Error selecting deployment:', error);
      setStatus('Connection failed', 'error');
      resetTerminalConnection(); // Reset on error too
    }
  };

  const refreshDeployment = async () => {
    if (!currentDeployment) return;

    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${currentDeployment.id}`);
      const deployment = await response.json();
      setCurrentDeployment(deployment);
      
      if (deployment.status === 'ready') {
        await loadFileTree(deployment.id);
        await loadPackages(deployment.id);
        await checkServerStatus(deployment.id);
        await loadServerLogs(deployment.id);
        setStatus(`${deployment.projectName} ready`, 'success');
        
        // Auto-open main file if no files are currently open
        if (openTabs.length === 0) {
          setTimeout(async () => {
            await autoOpenMainFile();
          }, 1000);
        }
      } else {
        setStatus(`Status: ${deployment.status}`, 'info');
      }
      
      await loadDeployments();
    } catch (error) {
      console.error('Error refreshing deployment:', error);
      setStatus('Refresh failed', 'error');
    }
  };

  // Load project into deployment (using projectService)

  const loadFileTree = async (deploymentId, retries = 3) => {
    setIsLoadingFileTree(true);
    try {
      const result = await fileOperations.loadFileTree(deploymentId, retries);
      
      if (result.success) {
        console.log('Raw API response files:', result.files);
        // Transform files if they don't have the expected structure
        const transformedFiles = transformFileTreeData(result.files);
        console.log('Transformed files:', transformedFiles);
        setFileTree(transformedFiles);
        // addNotification('File explorer loaded successfully!', 'success', 2000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFileTree([]);
      // addNotification(`Failed to load files: ${error.message}`, 'error', 5000);
    } finally {
      setIsLoadingFileTree(false);
    }
  };
  
  // Helper function to transform file tree data to expected format
  const transformFileTreeData = (files) => {
    if (!Array.isArray(files)) {
      console.warn('Files is not an array:', files);
      return [];
    }
    
    return files.map(file => {
      // Handle different possible API response structures
      const transformedFile = {
        name: file.name || file.filename || file.file || 'Unnamed',
        path: file.path || file.fullPath || file.name || file.filename,
        type: file.type || (file.isDirectory ? 'directory' : 'file'),
        children: file.children ? transformFileTreeData(file.children) : undefined
      };
      
      console.log('Transforming file:', file, '->', transformedFile);
      return transformedFile;
    });
  };

  const loadPackages = async (deploymentId) => {
    setIsLoadingPackages(true);
    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/packages`);
      if (!response.ok) throw new Error('Failed to load packages');
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
      setPackages({});
    } finally {
      setIsLoadingPackages(false);
    }
  };


  const openFile = async (filePath) => {
  if (!currentDeployment || currentDeployment.status !== 'ready') {
    setStatus('Deployment not ready', 'warning');
    return;
  }

  setIsLoadingEditor(true);
  
  // Set placeholder content immediately
  setEditorContent('');
  
  try {
    const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${currentDeployment.id}/file?path=${encodeURIComponent(filePath)}`);
    if (!response.ok) throw new Error('Failed to read file');
    const data = await response.json();
    
    const existingTab = openTabs.find(tab => tab.path === filePath);
    if (!existingTab) {
      setOpenTabs([...openTabs, {
        path: filePath,
        name: filePath.split('/').pop(),
        content: data.content,
        modified: false
      }]);
    }
    
    setActiveTab(filePath);
    
    // Small delay to show the skeleton loading
    setTimeout(() => {
      setEditorContent(data.content);
      setIsLoadingEditor(false);
    }, 300);
    
  } catch (error) {
    console.error('Error opening file:', error);
    setStatus(`Failed to open ${filePath}`, 'error');
    setIsLoadingEditor(false);
  }
};

  const saveCurrentFile = async () => {
    if (!activeTab || !currentDeployment || currentDeployment.status !== 'ready') {
      setStatus('Cannot save: deployment not ready', 'warning');
      return;
    }

    try {
      const result = await fileOperations.saveFileToDeployment(currentDeployment.id, activeTab, editorContent);
      
      if (result.success) {
        setOpenTabs(openTabs.map(tab => 
          tab.path === activeTab ? { ...tab, content: editorContent, modified: false } : tab
        ));
        setStatus('Saved', 'success');
        setUnsavedChanges(false);
        
        if (activeTab.endsWith('.jsx') || activeTab.endsWith('.tsx') || activeTab.endsWith('.vue') || activeTab.endsWith('.svelte') || activeTab.endsWith('.css')) {
          setTimeout(() => {
            if (serverStatus === 'running') {
              setStatus('File saved - preview will update', 'success');
            }
          }, 500);
        }
      } else {
        setStatus(`Save failed: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      setStatus('Save failed', 'error');
    }
  };

  const handleEditorChange = (content) => {
    setEditorContent(content);
    setUnsavedChanges(true);
    updateActivity();
    
    if (activeTab) {
      setOpenTabs(openTabs.map(tab =>
        tab.path === activeTab ? { ...tab, modified: tab.content !== content } : tab
      ));
    }
  };

  const switchToTab = (filePath) => {
    const tab = openTabs.find(t => t.path === filePath);
    if (tab) {
      setActiveTab(filePath);
      setEditorContent(tab.content);
    }
  };

  const closeTab = (filePath, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(tab => tab.path !== filePath);
    setOpenTabs(newTabs);
    
    if (activeTab === filePath) {
      if (newTabs.length > 0) {
        switchToTab(newTabs[0].path);
      } else {
        setActiveTab(null);
        setEditorContent('// Select a file to start editing\n// Choose a file from the explorer to begin');
      }
    }
  };

  // disconnectTerminal function is now provided by useTerminal hook
  
  // resetTerminalConnection function is now provided by useTerminal hook

  // clearTerminal function is now provided by useTerminal hook

  // Enhanced server management with duplicate prevention
  const startServer = async () => {
    if (!currentDeployment || currentDeployment.status !== 'ready') return;
    
    // Check current status first
    await checkServerStatus(currentDeployment.id);
    
    if (serverStatus === 'running') {
      // addNotification('Development server is already running!', 'info', 3000);
      return;
    }
    
    setIsStartingServer(true);

    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${currentDeployment.id}/server/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setStatus('Starting server...', 'info');
        
        const checkStatus = async () => {
          for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await checkServerStatus(currentDeployment.id);
            await loadServerLogs(currentDeployment.id);
            
            if (serverStatus === 'running') {
              setStatus('Server started', 'success');
              setIsStartingServer(false);
              return;
            }
          }
          setStatus('Start may have failed', 'warning');
          setIsStartingServer(false);
        };
        
        checkStatus();
      } else {
        setStatus('Start failed', 'error');
        setIsStartingServer(false);
      }
    } catch (error) {
      console.error('Error starting server:', error);
      setStatus('Start failed', 'error');
      setIsStartingServer(false);
    }
  };

  const stopServer = async () => {
    if (!currentDeployment || currentDeployment.status !== 'ready') return;

    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${currentDeployment.id}/server/stop`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setStatus('Server stopped', 'success');
        await checkServerStatus(currentDeployment.id);
        setServerLogs('Server stopped');
      } else {
        setStatus('Stop failed', 'error');
      }
    } catch (error) {
      console.error('Error stopping server:', error);
      setStatus('Stop failed', 'error');
    }
  };

  const restartServer = async () => {
    await stopServer();
    setTimeout(() => startServer(), 2000);
  };

  // Enhanced dev server start with duplicate detection
  const quickStartDevServer = async () => {
    if (!currentDeployment || currentDeployment.status !== 'ready') {
      setStatus('Deployment not ready', 'warning');
      return;
    }

    // Check current status first
    await checkServerStatus(currentDeployment.id);

    if (serverStatus === 'running') {
      // addNotification('Development server is already running! Check the preview panel.', 'info', 5000);
      if (terminalInstanceRef.current && terminalStatus === 'connected') {
        terminalInstanceRef.current.writeln('\x1b[33m⚠️  Dev server is already running!\x1b[0m');
        terminalInstanceRef.current.writeln('\x1b[36m💡 Check the preview panel to see your app\x1b[0m');
      }
      return;
    }

    if (terminalStatus === 'disconnected') {
      connectTerminalWithRetry();
      setTimeout(() => {
        if (terminalInstanceRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
          const command = 'npm run dev\r';
          socketRef.current.send(JSON.stringify({
            type: 'input',
            data: command
          }));
          setStatus('Starting via terminal...', 'info');
        }
      }, 1000);
    } else if (terminalInstanceRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
      const command = 'npm run dev\r';
      socketRef.current.send(JSON.stringify({
        type: 'input',
        data: command
      }));
      setStatus('Starting via terminal...', 'info');
    }
  };

  // Rest of your existing methods (installPackage, uninstallPackage, etc.) remain the same
  const installPackage = async () => {
    if (!packageInput.trim() || !currentDeployment || currentDeployment.status !== 'ready') return;

    try {
      setStatus('Installing...', 'info');
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${currentDeployment.id}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: packageInput })
      });
      
      if (response.ok) {
        setStatus(`${packageInput} installed`, 'success');
        setPackageInput('');
        await loadPackages(currentDeployment.id);
      } else {
        setStatus('Install failed', 'error');
      }
    } catch (error) {
      console.error('Error installing package:', error);
      setStatus('Install failed', 'error');
    }
  };

  const uninstallPackage = async (packageName) => {
    if (!currentDeployment || currentDeployment.status !== 'ready') return;

    try {
      setStatus('Removing...', 'info');
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${currentDeployment.id}/packages/${packageName}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setStatus(`${packageName} removed`, 'success');
        await loadPackages(currentDeployment.id);
      } else {
        setStatus('Remove failed', 'error');
      }
    } catch (error) {
      console.error('Error uninstalling package:', error);
      setStatus('Remove failed', 'error');
    }
  };

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
    setStatus('Preview refreshed', 'info');
  };

  const openPreviewInNewTab = () => {
    if (currentDeployment && currentDeployment.status === 'ready') {
      const url = routeInput ? `https://${currentDeployment.url}${routeInput.startsWith('/') ? routeInput : '/' + routeInput}` : `https://${currentDeployment.url}`;
      window.open(url, '_blank');
    }
  };

  const navigateToRoute = () => {
    if (routeInput.trim()) {
      setPreviewKey(prev => prev + 1);
      setStatus(`Navigated to ${routeInput}`, 'info');
    }
  };

  const handleRouteInputChange = (e) => {
    setRouteInput(e.target.value);
  };

  const handleRouteKeyDown = (e) => {
    if (e.key === 'Enter') {
      navigateToRoute();
    }
  };


  const deleteCurrentDeployment = async () => {
    if (!currentDeployment) return;

    if (!window.confirm(`Delete "${currentDeployment.projectName}"?`)) {
      return;
    }

    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${currentDeployment.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setStatus('Deployment deleted', 'success');
        setCurrentDeployment(null);
        setOpenTabs([]);
        setActiveTab(null);
        setEditorContent('// Select a file to start editing\n// Choose a file from the explorer to begin');
        disconnectTerminal();
        clearTerminalHistory();
        await loadDeployments();
      } else {
        setStatus('Delete failed', 'error');
      }
    } catch (error) {
      console.error('Error deleting deployment:', error);
      setStatus('Delete failed', 'error');
    }
  };

  const toggleSection = (section) => {
    setCollapsedSections({
      ...collapsedSections,
      [section]: !collapsedSections[section]
    });
  };

  const toggleFolder = (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (files, level = 0, parentPath = '') => {
    return files.map((file, index) => {
      const fullPath = parentPath ? `${parentPath}/${file.name}` : file.name;
      const isExpanded = expandedFolders.has(fullPath);
      const fileData = {
        name: file.name,
        path: file.path || fullPath,
        isDirectory: file.type === 'directory'
      };
      
      return (
        <div key={`${file.name}-${index}`}>
          <div 
            className={`file-item ${file.type === 'directory' ? 'file-directory' : 'file-file'} ${draggedFile?.path === fileData.path ? 'dragging' : ''}`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
            draggable
            onDragStart={(e) => handleDragStart(e, fileData)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, fileData)}
            onContextMenu={(e) => handleContextMenu(e, fileData)}
            onClick={() => {
              if (file.type === 'directory') {
                toggleFolder(fullPath);
              } else {
                openFile(file.path);
              }
            }}
          >
            <div className="file-item-content">
              {file.type === 'directory' && (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              )}
              {getFileIcon(file.name, file.type === 'directory')}
              <span className="file-name">{file.name || 'Unnamed'}</span>
            </div>
          </div>
          {file.children && isExpanded && (
            <div 
              className="folder-content-drop-zone"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                handleDrop(e, fileData);
              }}
            >
              {renderFileTree(file.children, level + 1, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, editorContent]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.show && !e.target.closest('.context-menu')) {
        closeContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu.show]);

  // Browser close confirmation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges || openTabs.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges, openTabs.length]);

  const getCurrentFramework = () => {
    if (!currentDeployment) return selectedFramework || null;
    return FRAMEWORKS.find(f => f.id === currentDeployment.framework) || FRAMEWORKS[0];
  };

  const getStatusIcon = () => {
    switch (serverStatus) {
      case 'running': return <CheckCircle size={14} className="status-icon running" />;
      case 'starting': return <Loader size={14} className="status-icon starting animate-spin" />;
      case 'stopped': return <XCircle size={14} className="status-icon stopped" />;
      default: return <AlertCircle size={14} className="status-icon unknown" />;
    }
  };

  // getTerminalStatusIcon function is now provided by useTerminal hook

  const isCurrentFileModified = () => {
    const currentTab = openTabs.find(tab => tab.path === activeTab);
    return currentTab?.modified || false;
  };

  // Show loading screen until IDE is fully initialized
  if (isInitializingIDE) {
    return <LoadingScreen currentDeployment={currentDeployment} />;
  }

  return (
    <main className="ide-container" aria-label="Development Environment">
      {/* Notification System */}
      <section className="notifications-container" aria-live="polite" aria-label="Notifications">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification notification-${notification.type}`}
            onClick={() => removeNotification(notification.id)}
          >
            <div className="notification-content">
              {notification.type === 'error' && <XCircle size={16} />}
              {notification.type === 'warning' && <AlertTriangle size={16} />}
              {notification.type === 'success' && <CheckCircle size={16} />}
              {notification.type === 'info' && <Info size={16} />}
              <span>{notification.message}</span>
            </div>
            <button className="notification-close">
              <X size={14} />
            </button>
          </div>
        ))}
      </section>

      {/* Header */}
      <header className="header">
        <div className="logo">
          <button 
            className="back-btn"
            onClick={() => setShowCloseConfirmModal(true)}
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <Zap size={20} className="logo-icon" />
          <span className="logo-text">Dev Studio</span>
        </div>
        <div className="header-controls">
          <select 
            className="deployment-select" 
            value={currentDeployment?.id || ''} 
            onChange={(e) => selectDeployment(e.target.value)}
          >
            <option value="" disabled>Select Project</option>
            {deployments
              .filter(deployment => deployment.status !== 'deleting')
              .map(deployment => {
                const framework = FRAMEWORKS.find(f => f.id === deployment.framework) || FRAMEWORKS[0];
                return (
                  <option key={deployment.id} value={deployment.id}>
                    {framework.icon} {deployment.projectName} • {deployment.status}
                  </option>
                );
              })}
          </select>
          <button 
            className="header-btn header-btn-library" 
            onClick={handleLoadProjects}
            disabled={!isAuthenticated}
            title="Load saved projects"
          >
            <FolderOpen size={16} />
            My Projects
          </button>
          <button className="header-btn" onClick={refreshDeployment}>
            <RefreshCw size={16} />
          </button>
          <button 
            className="header-btn header-btn-cloud" 
            onClick={saveProjectToCloud}
            disabled={!currentDeployment || !isAuthenticated || isCloudSaving}
            title="Save project to cloud"
          >
            {isCloudSaving ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Cloud size={16} />
            )}
            {isCloudSaving ? 'Saving...' : 'Save'}
          </button>
          <button className="header-btn header-btn-danger" onClick={deleteCurrentDeployment}>
            <Trash2 size={16} />
          </button>
          <button 
            className={`header-btn ${!isPreviewVisible ? 'header-btn-active' : ''}`}
            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
          >
            {isPreviewVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            {isPreviewVisible ? 'Hide' : 'Show'}
          </button>
          
          {/* Auth Section */}
          <div className="auth-section">
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <button className="header-btn header-btn-signin">
                <User size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="main-content">
        <Allotment defaultSizes={[280, 800, 400]} minSize={200}>
          {/* Sidebar */}
          <Allotment.Pane minSize={200} maxSize={500}>
            <aside className="sidebar" aria-label="File Explorer and Project Tools">
              <Allotment vertical defaultSizes={[80, 40]} minSize={150}>
                {/* File Explorer - Always Visible */}
                <Allotment.Pane minSize={200}>
                  <div className="sidebar-content">
                <section className="sidebar-section explorer-section">
                    <div className="section-header">
                      <div className="section-title">
                        <Folder size={16} />
                        Explorer
                        {(() => {
                          const context = fileOperations.getFileSystemContext(currentDeployment, currentProject);
                          if (context.canUseDeployment && context.canUseProject) {
                            return <span className="fs-status fs-both" title="Using both deployment and project storage">📁⚡</span>;
                          } else if (context.canUseDeployment) {
                            return <span className="fs-status fs-deployment" title="Using deployment storage only">⚡</span>;
                          } else if (context.canUseProject) {
                            return <span className="fs-status fs-project" title="Using project storage only">📁</span>;
                          } else {
                            return <span className="fs-status fs-none" title="No file system available">❌</span>;
                          }
                        })()}
                      </div>
                      <div className="section-actions">
                        <button 
                          className="action-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDirectory(false);
                            setShowCreateFileModal(true);
                          }}
                          title="New File"
                        >
                          <File size={14} />
                        </button>
                        <button 
                          className="action-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDirectory(true);
                            setShowCreateFileModal(true);
                          }}
                          title="New Folder"
                        >
                          <Folder size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="section-content">
                      {isLoadingFileTree || !currentDeployment || currentDeployment.status !== 'ready' ? (
                        <SkeletonFileTree />
                      ) : (
                        <div 
                          className="file-tree"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, null)}
                        >
                          {fileTree.length > 0 ? renderFileTree(fileTree) : (
                            <div className="empty-state">
                              <File size={32} className="empty-icon" />
                              <span>No files found</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                </section>
                  </div>
                </Allotment.Pane>
                
                {/* Bottom Tabs Section - Now draggable */}
                <Allotment.Pane minSize={150} maxSize={600}>
                  <div className="sidebar-bottom-tabs">
                  {/* Tab Navigation */}
                  <div className="bottom-tabs-nav">
                    <button 
                      className={`bottom-tab ${sidebarActiveTab === 'dependencies' ? 'active' : ''}`}
                      onClick={() => setSidebarActiveTab('dependencies')}
                    >
                      <Package size={16} />
                      Dependencies
                    </button>
                    <button 
                      className={`bottom-tab ${sidebarActiveTab === 'resources' ? 'active' : ''}`}
                      onClick={() => setSidebarActiveTab('resources')}
                    >
                      <Monitor size={16} />
                      Usage
                    </button>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="bottom-tabs-content">
                    {sidebarActiveTab === 'dependencies' && (
                      <section className="sidebar-section">
                    <div className="section-content">
                      <div className="package-controls">
                        <div className="package-input-group">
                          <input 
                            type="text" 
                            className="package-input" 
                            placeholder="package-name"
                            value={packageInput}
                            onChange={(e) => setPackageInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && installPackage()}
                          />
                          <button className="package-install-btn" onClick={installPackage}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      {isLoadingPackages || !currentDeployment || currentDeployment.status !== 'ready' ? (
                        <SkeletonPackages />
                      ) : (
                        <div className="packages-list">
                          {Object.entries(packages.dependencies || {}).map(([name, version]) => (
                            <div key={name} className="package-item">
                              <div className="package-info">
                                <div className="package-name">{name}</div>
                                <div className="package-version">{version}</div>
                              </div>
                              <button 
                                className="package-remove-btn" 
                                onClick={() => uninstallPackage(name)}
                                title="Remove package"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          {Object.keys(packages.dependencies || {}).length === 0 && (
                            <div className="empty-state">
                              <Package size={32} className="empty-icon" />
                              <span>No dependencies</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                      </section>
                    )}

                    {sidebarActiveTab === 'resources' && (
                      <section className="sidebar-section">
                        <div className="section-content">
                          {!currentDeployment || currentDeployment.status !== 'ready' || (isLoadingResources && !hasLoadedForReadyDeployment) ? (
                            <SkeletonUsageResources />
                          ) : (
                            <>
                              {/* <div className="resource-dropdown-header">
                                <div className="resource-mode-badge">
                                  <span className={`mode-indicator mode-${currentDeployment.resourceSize || 'medium'}`}>
                                    {(currentDeployment.resourceSize || 'medium').toUpperCase()}
                                  </span>
                                  <span className="mode-specs">
                                    {currentDeployment.resourceSize === 'small' && '512MB • 0.5 cores'}
                                    {(currentDeployment.resourceSize === 'medium' || !currentDeployment.resourceSize) && '1.5GB • 1.0 cores'}
                                    {currentDeployment.resourceSize === 'large' && '3GB • 2.0 cores'}
                                  </span>
                                  {isUsingFallbackData && (
                                    <div className="fallback-indicator" title="Showing simulated data - kubectl not available">
                                      <div className="fallback-dot"></div>
                                      <span className="fallback-text">Simulated</span>
                                    </div>
                                  )}
                                </div>
                              </div> */}
                              
                              <div className="resource-metrics">
                                <div className="resource-metric-card">
                                  <div className="metric-content">
                                    <div className="metric-info">
                                      <span className="metric-label">CPU usage</span>
                                      <span className="metric-percentage">{Math.floor(cpuUsage)}%</span>
                                    </div>
                                    <div className="metric-graph">
                                      <svg viewBox="0 0 150 30" className="usage-chart cpu-chart">
                                        <defs>
                                          <linearGradient id="cpuChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.4"/>
                                            <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0"/>
                                          </linearGradient>
                                        </defs>
                                        <polygon
                                          points={`0,30 ${cpuHistory.map((value, index) => `${index * 7.5},${30 - (value * 1.2)}`).join(' ')} 142.5,30`}
                                          fill="url(#cpuChartGradient)"
                                          className="chart-area"
                                        />
                                        <polyline
                                          points={cpuHistory.map((value, index) => `${index * 7.5},${30 - (value * 1.2)}`).join(' ')}
                                          fill="none"
                                          stroke="rgb(147, 51, 234)"
                                          strokeWidth="1.5"
                                          className="chart-line"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="resource-metric-card">
                                  <div className="metric-content">
                                    <div className="metric-info">
                                      <span className="metric-label">Memory usage</span>
                                      <span className="metric-percentage">{Math.floor(memoryUsage)}%</span>
                                    </div>
                                    <div className="metric-graph">
                                      <svg viewBox="0 0 150 30" className="usage-chart memory-chart">
                                        <defs>
                                          <linearGradient id="memoryChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4"/>
                                            <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0"/>
                                          </linearGradient>
                                        </defs>
                                        <polygon
                                          points={`0,30 ${memoryHistory.map((value, index) => `${index * 7.5},${30 - (value * 1.2)}`).join(' ')} 142.5,30`}
                                          fill="url(#memoryChartGradient)"
                                          className="chart-area"
                                        />
                                        <polyline
                                          points={memoryHistory.map((value, index) => `${index * 7.5},${30 - (value * 1.2)}`).join(' ')}
                                          fill="none"
                                          stroke="rgb(59, 130, 246)"
                                          strokeWidth="1.5"
                                          className="chart-line"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                  </div>
                </Allotment.Pane>
              </Allotment>
            </aside>
          </Allotment.Pane>

          {/* Editor Panel */}
          <Allotment.Pane minSize={300}>
            <Allotment vertical defaultSizes={[70, 30]} minSize={100}>
              {/* Editor */}
              <Allotment.Pane minSize={200}>
                <div className="editor-panel">
                  {/* Tab Bar */}
                  <div className="tab-bar">
                    {openTabs.map(tab => (
                      <div 
                        key={tab.path} 
                        className={`tab ${tab.path === activeTab ? 'active' : ''}`}
                        onClick={() => switchToTab(tab.path)}
                      >
                        {getFileIcon(tab.name)}
                        <span className="tab-name">{tab.name}</span>
                        {tab.modified && <Circle size={6} className="modified-indicator" />}
                        <button 
                          className="tab-close" 
                          onClick={(e) => closeTab(tab.path, e)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Editor Header */}
                  {activeTab && (
                    <div className="editor-header">
                      <span className="file-path">
                        {activeTab}
                      </span>
                      <div className="editor-actions">
                        <span className={`save-status ${!isCurrentFileModified() ? 'saved' : 'unsaved'}`}>
                          {!isCurrentFileModified() ? 'Saved' : 'Unsaved'}
                        </span>
                        <button 
                          className="save-icon-button" 
                          onClick={saveCurrentFile}
                          disabled={!isCurrentFileModified() || !activeTab}
                          title="Save (Ctrl+S)"
                        >
                          <Save size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Monaco Editor */}
                  <div className="editor-container">
                    {isLoadingEditor || !currentDeployment || currentDeployment.status !== 'ready' || !activeTab ? (
                      <SkeletonEditor />
                    ) : (
                      <Editor
                        height="100%"
                        language={getLanguage()}
                        value={editorContent}
                        onChange={handleEditorChange}
                        theme="vscode-dark"
                        onMount={handleEditorDidMount}
                        options={{
                          automaticLayout: true,
                          fontSize: 14,
                          fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, Consolas, monospace",
                          fontLigatures: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: true,
                          wordWrap: "on",
                          lineNumbers: "on",
                          folding: true,
                          tabSize: 2,
                        }}
                      />
                    )}
                  </div>
                </div>
              </Allotment.Pane>

              {/* Terminal with Enhanced Status */}
              <Allotment.Pane minSize={100}>
  {isLoadingTerminal || 
   terminalStatus === 'connecting' || 
   (isReconnecting && terminalStatus === 'disconnected') || 
   (!currentDeployment || currentDeployment.status !== 'ready') ? (
    <SkeletonTerminal />
  ) : (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-title">
          <TerminalIcon size={16} />
          Terminal
          <div className={`connection-status ${terminalStatus}`}>
            {getTerminalStatusIcon()}
            {isReconnecting ? 'Reconnecting...' : terminalStatus}
            {connectionAttempts > 0 && !isReconnecting && (
              <span className="retry-count">({connectionAttempts}/5)</span>
            )}
          </div>
        </div>
        <div className="terminal-controls">
          <button 
            className="terminal-btn"
            onClick={() => {
              if (connectionAttempts > 2) {
                resetTerminalConnection();
                setTimeout(connectTerminalWithRetry, 1000);
              } else {
                connectTerminalWithRetry();
              }
            }}
            disabled={terminalStatus === 'connected' || isReconnecting}
          >
            {isReconnecting ? 'Connecting...' : connectionAttempts > 2 ? 'Reset & Connect' : 'Connect'}
          </button>
          <button className="terminal-btn" onClick={clearTerminal}>
            Clear
          </button>
          <button 
            className="terminal-btn" 
            onClick={disconnectTerminal}
            disabled={terminalStatus === 'disconnected'}
          >
            Disconnect
          </button>
        </div>
      </div>
      <div className="terminal-content">
        <div ref={terminalRef} className="terminal-element" />
      </div>
    </div>
  )}
</Allotment.Pane>
            </Allotment>
          </Allotment.Pane>

          {/* Preview Panel */}
          {isPreviewVisible && (
            <Allotment.Pane minSize={300}>
              <div className="preview-panel">
                <div className="preview-header">
                  <div className="preview-title">
                    <Monitor size={16} />
                    Preview
                  </div>
                  <div className="preview-route-input">
                    <input
                      type="text"
                      placeholder="/route (e.g., /home, /about)"
                      value={routeInput}
                      onChange={handleRouteInputChange}
                      onKeyDown={handleRouteKeyDown}
                      className="route-input"
                    />
                  </div>
                  <div className="preview-controls">
                    <button 
                      className="preview-btn" 
                      onClick={refreshPreview}
                      title="Refresh"
                    >
                      <RefreshCw size={14} />
                    </button>
                    <button 
                      className="preview-btn" 
                      onClick={openPreviewInNewTab}
                      title="Open in new tab"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
                <div className="preview-content">
                  {currentDeployment && currentDeployment.status === 'ready' && serverStatus === 'running' ? (
                    <iframe 
                      key={previewKey}
                      className="preview-iframe"
                      src={routeInput ? `https://${currentDeployment.url}${routeInput.startsWith('/') ? routeInput : '/' + routeInput}` : `https://${currentDeployment.url}`}
                      title="Preview"
                    />
                  ) : currentDeployment && currentDeployment.status !== 'ready' ? (
                    <SkeletonPreview />
                  ) : (
                    <div className="preview-placeholder">
                      <Monitor size={48} className="placeholder-icon" />
                      <div className="placeholder-text">
                        {!currentDeployment 
                          ? 'Select a project to preview'
                          : currentDeployment.status !== 'ready'
                          ? 'Project is starting...'
                          : serverStatus !== 'running'
                          ? 'Start the development server'
                          : 'Loading preview...'
                        }
                      </div>
                      {currentDeployment && currentDeployment.status === 'ready' && serverStatus !== 'running' && (
                        <button 
                          className="placeholder-btn" 
                          onClick={quickStartDevServer}
                        >
                          <Play size={16} />
                          Start {getCurrentFramework()?.name} Server
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Allotment.Pane>
          )}
        </Allotment>
      </div>

      {/* Enhanced Status Bar */}
      <div className={`status-bar status-${statusMessage.type}`}>
        <div className="status-left">
          <span className="status-text">{statusMessage.text}</span>
          {currentDeployment && (
            <span className="deployment-info">
              {getCurrentFramework()?.icon} {currentDeployment.projectName}
            </span>
          )}
          {terminalStatus === 'connected' && (
            <span className="terminal-status">
              <Wifi size={12} />
              Terminal Connected
            </span>
          )}
          {unsavedChanges && (
            <span className="unsaved-indicator">
              <Circle size={8} />
              Unsaved Changes
            </span>
          )}
        </div>
        <div className="status-right">
          {activeTab && (
            <span className="active-file">
              {getFileIcon(activeTab.split('/').pop())}
              {activeTab} • {getLanguage()}
            </span>
          )}
          <span className="session-info">
            <Clock size={12} />
            Session: {sessionId.slice(-6)}
          </span>
        </div>
      </div>


      <ProjectsModal
        isOpen={showProjectsModal}
        onClose={() => setShowProjectsModal(false)}
        projects={projects}
        loading={loading}
        error={error}
        isLoadingProjects={isLoadingProjects}
        onLoadProject={loadProjectAndDeploy}
        onDeleteProject={(projectId) => {
          deleteProject(projectId).then(result => {
            if (result.success) {
              // addNotification('Project deleted successfully', 'success', 3000);
            } else {
              // addNotification(`Failed to delete: ${result.error}`, 'error', 5000);
            }
          });
        }}
        onRetry={loadUserProjects}
        currentDeployment={currentDeployment}
        loadFileTree={loadFileTree}
      />


      <ContextMenu
        isOpen={contextMenu.show}
        x={contextMenu.x}
        y={contextMenu.y}
        file={contextMenu.file}
        onClose={closeContextMenu}
        onCreateFile={() => {
          setShowCreateFileModal(true);
          setIsDirectory(false);
        }}
        onCreateFolder={() => {
          setShowCreateFileModal(true);
          setIsDirectory(true);
        }}
        onRename={(file) => {
          setRenameTarget(file);
          setNewFileName(file.name);
          setShowRenameModal(true);
        }}
        onDelete={(file) => {
          handleDeleteFile(file.path);
        }}
      />

      <CreateFileModal
        isOpen={showCreateFileModal}
        onClose={() => {
          setShowCreateFileModal(false);
          setNewFileName('');
          setIsDirectory(false);
        }}
        onConfirm={(fileName) => {
          setNewFileName(fileName);
          handleCreateFile();
        }}
        isDirectory={isDirectory}
      />

      <RenameModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setNewFileName('');
          setRenameTarget(null);
        }}
        onConfirm={(newName, target) => {
          setNewFileName(newName);
          handleRenameFile();
        }}
        renameTarget={renameTarget}
      />

      <CloseConfirmModal
        isOpen={showCloseConfirmModal}
        onClose={() => {
          setShowCloseConfirmModal(false);
        }}
        onConfirm={async () => {
          setShowCloseConfirmModal(false);
          
          // Create a function to handle navigation with proper error handling and logging
          const handleNavigation = () => {
            try {
              console.log('🧭 Attempting navigation to dashboard...');
              navigate('/');
              console.log('✅ Navigation initiated successfully');
            } catch (error) {
              console.error('❌ Navigation failed:', error);
              // Fallback navigation using window.location
              try {
                window.location.href = '/';
                console.log('✅ Fallback navigation using window.location');
              } catch (fallbackError) {
                console.error('❌ Fallback navigation also failed:', fallbackError);
              }
            }
          };

          // If no deployment to delete, navigate immediately
          if (!currentDeployment) {
            console.log('📝 No deployment to delete, navigating immediately');
            handleNavigation();
            return;
          }

          // Create a timeout promise for the deployment deletion
          const deleteDeployment = async () => {
            console.log(`🗑️ Deleting deployment ${currentDeployment.id} on exit...`);
            const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${currentDeployment.id}`, {
              method: 'DELETE'
            });
            
            if (response.ok) {
              console.log(`✅ Successfully deleted deployment ${currentDeployment.id}`);
            } else {
              console.error(`❌ Failed to delete deployment ${currentDeployment.id}`);
              throw new Error(`Delete request failed with status: ${response.status}`);
            }
          };

          // Create a timeout promise that rejects after 5 seconds
          const timeout = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Deployment deletion timed out after 5 seconds'));
            }, 5000);
          });

          // Use Promise.race to prevent hanging, but don't block navigation
          console.log('🚀 Starting deployment deletion with timeout...');
          
          // Start the deletion process but don't await it
          Promise.race([deleteDeployment(), timeout])
            .then(() => {
              console.log('🎉 Deployment deletion completed successfully');
            })
            .catch((error) => {
              console.warn('⚠️ Deployment deletion failed or timed out, but continuing with navigation:', error.message);
            });

          // Always navigate immediately regardless of deletion outcome
          // This ensures the user is never blocked from leaving the IDE
          console.log('🚀 Proceeding with navigation (not waiting for deployment deletion)');
          handleNavigation();
        }}
        unsavedChanges={unsavedChanges}
        currentDeployment={currentDeployment}
      />

      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={(notificationId) => {
          setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }}
      />

      <style jsx>{`
        .notifications-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notification {
          background: rgba(30, 30, 30, 0.95);
          border: 1px solid;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 300px;
          max-width: 400px;
          backdrop-filter: blur(10px);
          animation: slideIn 0.3s ease-out;
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification:hover {
          transform: translateX(-5px);
        }

        .notification-success {
          border-color: #22c55e;
          color: #22c55e;
        }

        .notification-error {
          border-color: #ef4444;
          color: #ef4444;
        }

        .notification-warning {
          border-color: #f59e0b;
          color: #f59e0b;
        }

        .notification-info {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0.7;
          margin-left: auto;
        }

        .header-btn-cloud {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: white;
          border: none;
        }

        .header-btn-cloud:hover {
          background: linear-gradient(135deg, #2563eb, #4f46e5);
        }

        .header-btn-cloud:disabled {
          background: #374151;
          color: #6b7280;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .retry-count {
          font-size: 10px;
          opacity: 0.7;
        }

        .terminal-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          opacity: 0.8;
        }

        .unsaved-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #f59e0b;
        }

        .session-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          opacity: 0.6;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Context Menu */
        .context-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 1000;
        }

        .context-menu {
          position: fixed;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 6px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 1001;
          min-width: 160px;
          padding: 4px 0;
        }

        .context-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          color: #d1d5db;
          transition: background-color 0.15s ease;
        }

        .context-menu-item:hover {
          background: #374151;
        }

        .context-menu-item-danger {
          color: #ef4444;
        }

        .context-menu-item-danger:hover {
          background: #7f1d1d;
        }

        .context-menu-separator {
          margin: 4px 0;
          border: none;
          border-top: 1px solid #374151;
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          max-height: 90vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #374151;
        }

        .modal-header h3 {
          margin: 0;
          color: #f9fafb;
          font-size: 16px;
          font-weight: 600;
        }

        .modal-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.15s ease;
        }

        .modal-close:hover {
          background: #374151;
          color: #f9fafb;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: #d1d5db;
          font-size: 14px;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 6px;
          color: #f9fafb;
          font-size: 14px;
          transition: border-color 0.15s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .modal-footer {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #374151;
          justify-content: flex-end;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary {
          background: #374151;
          color: #d1d5db;
          border: 1px solid #4b5563;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
        }

        .btn-primary:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        .btn-primary:disabled {
          background: #374151;
          color: #6b7280;
          border-color: #4b5563;
          cursor: not-allowed;
        }

        /* Drag and Drop */
        .file-item.dragging {
          opacity: 0.5;
        }

        .file-item[draggable="true"] {
          cursor: move;
        }

        .file-item.drag-over {
          background: rgba(59, 130, 246, 0.1);
          border-left: 3px solid #3b82f6;
        }

        /* Fallback indicator for resource usage */
        .fallback-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          padding: 4px 8px;
          background: rgba(255, 193, 7, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(255, 193, 7, 0.3);
        }

        .fallback-dot {
          width: 8px;
          height: 8px;
          background: #FFC107;
          border-radius: 50%;
          animation: fallbackPulse 2s infinite;
        }

        .fallback-text {
          font-size: 11px;
          color: #FFC107;
          font-weight: 500;
        }

        @keyframes fallbackPulse {
          0% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.6;
            transform: scale(0.8);
          }
        }
      `}</style>
    </main>
  );
}

export default IDE;

