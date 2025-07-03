import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_GIT_API_BASE;

/**
 * Project Management Service
 * 
 * Handles comprehensive project operations including:
 * - Project-deployment integration
 * - Cloud saving from active deployments
 * - Project loading into deployments
 * - Project management workflows
 * 
 * Extracted from IDE.jsx for better separation of concerns
 */
class ProjectService {
  constructor() {
    this.isLoadingProjects = false;
    this.isCloudSaving = false;
    
    // Event listeners for project operations
    this.loadingListeners = new Set();
    this.savingListeners = new Set();
    this.operationListeners = new Set();
  }

  /**
   * Subscribe to project loading state changes
   * @param {Function} callback - Callback function to receive loading state updates
   */
  onLoadingStateChange(callback) {
    this.loadingListeners.add(callback);
    return () => this.loadingListeners.delete(callback);
  }

  /**
   * Subscribe to project saving state changes
   * @param {Function} callback - Callback function to receive saving state updates
   */
  onSavingStateChange(callback) {
    this.savingListeners.add(callback);
    return () => this.savingListeners.delete(callback);
  }

  /**
   * Subscribe to general project operation updates
   * @param {Function} callback - Callback function to receive operation updates
   */
  onOperationUpdate(callback) {
    this.operationListeners.add(callback);
    return () => this.operationListeners.delete(callback);
  }

  /**
   * Notify loading state listeners
   * @private
   */
  _notifyLoadingListeners(isLoading) {
    this.isLoadingProjects = isLoading;
    this.loadingListeners.forEach(callback => callback(isLoading));
  }

  /**
   * Notify saving state listeners
   * @private
   */
  _notifySavingListeners(isSaving) {
    this.isCloudSaving = isSaving;
    this.savingListeners.forEach(callback => callback(isSaving));
  }

  /**
   * Notify operation listeners
   * @private
   */
  _notifyOperationListeners(operation, status, message) {
    this.operationListeners.forEach(callback => callback({
      operation,
      status,
      message,
      timestamp: Date.now()
    }));
  }

  /**
   * Load a Firebase project and create/connect to deployment
   * @param {Object} project - Project object with id and metadata
   * @param {string} sessionId - Current session ID
   * @param {Object} projectContext - Project context with loadProject function
   * @param {Function} loadDeployments - Function to refresh deployments
   * @param {Function} selectDeployment - Function to select deployment
   * @param {Function} loadFileTree - Function to load file tree for deployment
   * @param {Function} setPreviewKey - Function to refresh preview
   * @param {Function} setShowProjectsModal - Function to close projects modal
   * @returns {Promise<Object>} Result object with success status and deployment info
   */
  async loadProjectAndDeploy(project, sessionId, {
    projectContext,
    loadDeployments,
    selectDeployment,
    loadFileTree,
    setPreviewKey,
    setShowProjectsModal
  }) {
    if (!project || !project.id) {
      const error = 'Invalid project data';
      this._notifyOperationListeners('loadProjectAndDeploy', 'error', error);
      return { success: false, error };
    }

    this._notifyLoadingListeners(true);
    this._notifyOperationListeners('loadProjectAndDeploy', 'started', `Loading project: ${project.name || project.id}`);

    try {
      // Load project from Firebase
      const result = await projectContext.loadProject(project.id);
      
      if (!result.success) {
        const error = `Failed to load project: ${result.error}`;
        this._notifyOperationListeners('loadProjectAndDeploy', 'error', error);
        return { success: false, error };
      }

      // Create new deployment with loaded project data
      const deployForm = {
        projectName: result.data.metadata.name,
        subdomain: '',
        framework: result.data.metadata.framework,
        sessionId,
        projectId: project.id
      };

      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployForm)
      });

      const deployResult = await response.json();
      
      if (!response.ok) {
        const error = `Failed to create deployment: ${deployResult.error}`;
        this._notifyOperationListeners('loadProjectAndDeploy', 'error', error);
        return { success: false, error };
      }

      // Handle existing vs new deployment scenarios
      if (deployResult.isExisting) {
        await this._handleExistingDeployment(deployResult, result, sessionId, {
          loadDeployments,
          selectDeployment,
          loadFileTree,
          setPreviewKey,
          setShowProjectsModal
        });
      } else {
        await this._handleNewDeployment(deployResult, result, sessionId, {
          loadDeployments,
          selectDeployment,
          loadFileTree,
          setPreviewKey,
          setShowProjectsModal
        });
      }

      this._notifyOperationListeners('loadProjectAndDeploy', 'success', 
        `Project "${result.data.metadata.name}" loaded successfully`);
      
      return { 
        success: true, 
        deployment: deployResult,
        project: result.data 
      };

    } catch (error) {
      const errorMessage = `Failed to load and deploy project: ${error.message}`;
      console.error('Error loading project and deploying:', error);
      this._notifyOperationListeners('loadProjectAndDeploy', 'error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this._notifyLoadingListeners(false);
    }
  }

  /**
   * Handle existing deployment scenario
   * @private
   */
  async _handleExistingDeployment(deployResult, projectResult, sessionId, handlers) {
    const { loadDeployments, selectDeployment, loadFileTree, setPreviewKey, setShowProjectsModal } = handlers;

    if (deployResult.wasRecreated) {
      // For recreated deployments, wait for file tree to load properly
      this._notifyOperationListeners('handleExistingDeployment', 'info', 
        'Loading files for recreated deployment... Please wait.');
      
      try {
        await loadDeployments();
        selectDeployment(deployResult.id);
        setShowProjectsModal(false);
        await loadFileTree(deployResult.id);
      } catch (error) {
        console.error('Error refreshing file tree for recreated deployment:', error);
        throw new Error('Failed to refresh file tree for recreated deployment');
      }
    } else {
      // For existing deployments, also load project files to ensure Firebase files are in container
      await loadDeployments();
      selectDeployment(deployResult.id);
      setShowProjectsModal(false);
      
      // Transfer Firebase files to existing deployment container
      this._notifyOperationListeners('handleExistingDeployment', 'info', 
        'Loading project files into existing deployment...');
      
      try {
        const loadResult = await this.loadProjectIntoDeployment(
          deployResult.id, 
          projectResult.data.files, 
          sessionId
        );
        
        if (loadResult.failedCount > 0) {
          this._notifyOperationListeners('handleExistingDeployment', 'warning', 
            `Project loaded with ${loadResult.failedCount} file errors. Check console for details.`);
          console.warn('Failed to load files:', loadResult.failedFiles);
        }
        
        // Refresh file tree and preview immediately after successful load
        setTimeout(async () => {
          try {
            await loadFileTree(deployResult.id);
            setPreviewKey(prev => prev + 1); // Force preview iframe refresh
            this._notifyOperationListeners('handleExistingDeployment', 'success', 
              `Project "${projectResult.data.metadata.name}" files are now visible in the explorer and preview!`);
          } catch (error) {
            console.error('Error refreshing file tree after project load:', error);
          }
        }, 2000);
      } catch (error) {
        console.error('Error loading project files into deployment:', error);
        throw new Error('Failed to load project files into deployment. Please try again.');
      }
    }
  }

  /**
   * Handle new deployment scenario
   * @private
   */
  async _handleNewDeployment(deployResult, projectResult, sessionId, handlers) {
    const { loadDeployments, selectDeployment, loadFileTree, setPreviewKey, setShowProjectsModal } = handlers;

    // Load project files into new deployment using kubectl
    try {
      const loadResult = await this.loadProjectIntoDeployment(
        deployResult.id, 
        projectResult.data.files, 
        sessionId
      );
      
      if (loadResult.failedCount > 0) {
        this._notifyOperationListeners('handleNewDeployment', 'warning', 
          `Project loaded with ${loadResult.failedCount} file errors. Check console for details.`);
        console.warn('Failed to load files:', loadResult.failedFiles);
      }
    } catch (error) {
      const errorMessage = `Failed to load project files: ${error.message}`;
      this._notifyOperationListeners('handleNewDeployment', 'error', errorMessage);
      throw new Error(errorMessage);
    }

    // Wait for file transfer to complete, then load deployments and show file tree
    this._notifyOperationListeners('handleNewDeployment', 'info', 
      'Loading project files from Firebase... Please wait.');
    
    setTimeout(async () => {
      try {
        // Now load deployments and select the deployment AFTER Firebase files are loaded
        await loadDeployments();
        selectDeployment(deployResult.id);
        setShowProjectsModal(false);
        
        await loadFileTree(deployResult.id);
        setPreviewKey(prev => prev + 1); // Force preview iframe refresh
        this._notifyOperationListeners('handleNewDeployment', 'success', 
          `Project "${projectResult.data.metadata.name}" files are now visible in the explorer and preview!`);
        
        // Additional refresh after a longer delay to catch any slow transfers
        setTimeout(async () => {
          try {
            await loadFileTree(deployResult.id);
            console.log('Final file tree refresh completed');
          } catch (error) {
            console.error('Error in final file tree refresh:', error);
          }
        }, 3000);
      } catch (error) {
        console.error('Error refreshing file tree after project load:', error);
      }
    }, 5000); // Wait 5 seconds for improved kubectl operations to complete
  }

  /**
   * Load project files into a deployment container
   * @param {string} deploymentId - Deployment ID
   * @param {Object} projectFiles - Project files to load
   * @param {string} sessionId - Session ID
   * @param {number} retries - Number of retries (default: 3)
   * @returns {Promise<Object>} Load result with success/failure counts
   */
  async loadProjectIntoDeployment(deploymentId, projectFiles, sessionId, retries = 3) {
    try {
      // First, check if the deployment is ready
      const deploymentResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}`);
      if (!deploymentResponse.ok) {
        throw new Error('Failed to get deployment status');
      }
      
      const deployment = await deploymentResponse.json();
      
      // If deployment is not ready, retry with delay
      if (deployment.status !== 'ready') {
        if (retries > 0) {
          console.log(`Deployment ${deploymentId} not ready (status: ${deployment.status}), retrying project load in 10 seconds...`);
          this._notifyOperationListeners('loadProjectIntoDeployment', 'info', 
            `Waiting for deployment to be ready before loading files... (${deployment.status})`);
          
          return new Promise((resolve) => {
            setTimeout(async () => {
              const result = await this.loadProjectIntoDeployment(deploymentId, projectFiles, sessionId, retries - 1);
              resolve(result);
            }, 10000);
          });
        } else {
          throw new Error(`Deployment not ready after multiple attempts (status: ${deployment.status})`);
        }
      }
      
      // Now load the project files into the deployment
      const loadResponse = await authService.apiCall(
        `${API_BASE_URL}/api/deployments/${deploymentId}/load-project`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            projectFiles,
            sessionId 
          })
        }
      );

      const loadResult = await loadResponse.json();
      
      if (!loadResponse.ok) {
        throw new Error(loadResult.error || 'Failed to load project files');
      }
      
      return loadResult;
    } catch (error) {
      console.error('Error loading project into deployment:', error);
      throw error;
    }
  }

  /**
   * Save current deployment state to cloud as a project
   * @param {Object} currentDeployment - Current deployment object
   * @param {Array} openTabs - Currently open tabs
   * @param {string} activeTab - Active tab path
   * @param {string} editorContent - Current editor content
   * @param {Array} fileTree - File tree structure
   * @param {string} sessionId - Session ID
   * @param {Function} getCurrentFramework - Function to get current framework info
   * @param {Object} projectContext - Project context with saveProject function
   * @param {Function} setUnsavedChanges - Function to set unsaved changes state
   * @returns {Promise<Object>} Save result with success status
   */
  async saveProjectToCloud(currentDeployment, {
    openTabs,
    activeTab,
    editorContent,
    fileTree,
    sessionId,
    getCurrentFramework,
    projectContext,
    setUnsavedChanges
  }) {
    if (!currentDeployment) {
      const error = 'No deployment available to save';
      this._notifyOperationListeners('saveProjectToCloud', 'error', error);
      return { success: false, error };
    }

    if (this.isCloudSaving) {
      const error = 'Save operation already in progress';
      this._notifyOperationListeners('saveProjectToCloud', 'warning', error);
      return { success: false, error };
    }

    this._notifySavingListeners(true);
    this._notifyOperationListeners('saveProjectToCloud', 'started', 
      `Saving project: ${currentDeployment.projectName}`);

    try {
      // Collect all files
      const files = {};
      
      // Get all open tabs content
      openTabs.forEach(tab => {
        if (tab.path === activeTab) {
          files[tab.path] = editorContent; // Use current editor content for active tab
        } else {
          files[tab.path] = tab.content;
        }
      });

      // Fetch other files from the file tree, excluding node_modules and other unnecessary files
      const fetchFilePromises = fileTree.flatMap(item => {
        const collectFiles = (node, path = '') => {
          const currentPath = path ? `${path}/${node.name}` : node.name;
          
          // Skip node_modules and other unnecessary directories/files
          if (this._shouldSkipFile(currentPath)) {
            return [];
          }
          
          if (node.type === 'file' && !files[currentPath]) {
            return [{ path: currentPath, name: node.name }];
          } else if (node.children) {
            return node.children.flatMap(child => collectFiles(child, currentPath));
          }
          return [];
        };
        return collectFiles(item);
      });

      // Fetch content for files not in tabs (excluding unnecessary files)
      for (const fileInfo of fetchFilePromises) {
        try {
          const response = await authService.apiCall(
            `${API_BASE_URL}/api/deployments/${currentDeployment.id}/file?path=${encodeURIComponent(fileInfo.path)}&sessionId=${sessionId}`
          );
          if (response.ok) {
            const data = await response.json();
            files[fileInfo.path] = data.content;
          }
        } catch (error) {
          console.warn(`Failed to fetch ${fileInfo.path}:`, error);
        }
      }

      const projectData = {
        files,
        metadata: {
          projectId: currentDeployment.id,
          name: currentDeployment.projectName,
          framework: currentDeployment.framework,
          description: `Saved from ${getCurrentFramework()?.name} project`,
          createdAt: currentDeployment.createdAt || Date.now(),
          url: currentDeployment.url
        }
      };

      const result = await projectContext.saveProject(projectData);
      
      if (result.success) {
        this._notifyOperationListeners('saveProjectToCloud', 'success', 'Project saved to cloud successfully!');
        setUnsavedChanges(false);
      } else {
        this._notifyOperationListeners('saveProjectToCloud', 'error', `Failed to save: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage = 'Failed to save project to cloud';
      console.error('Error saving project to cloud:', error);
      this._notifyOperationListeners('saveProjectToCloud', 'error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this._notifySavingListeners(false);
    }
  }

  /**
   * Check if a file should be skipped during project saving
   * @private
   * @param {string} filePath - File path to check
   * @returns {boolean} True if file should be skipped
   */
  _shouldSkipFile(filePath) {
    const skipPatterns = [
      'node_modules/',
      '/.git/',
      '/dist/',
      '/build/',
      '/.next/',
      '/.cache/',
      '.DS_Store',
      '.gitignore'
    ];

    return skipPatterns.some(pattern => 
      filePath.startsWith(pattern) || filePath.includes(pattern)
    );
  }

  /**
   * Handle loading user projects (triggers modal)
   * @param {Function} setShowProjectsModal - Function to show projects modal
   * @param {Object} projectContext - Project context with loadUserProjects function
   * @param {boolean} isAuthenticated - Authentication status
   * @returns {Promise<Object>} Load result
   */
  async handleLoadProjects(setShowProjectsModal, projectContext, isAuthenticated) {
    if (!isAuthenticated) {
      const error = 'Authentication required';
      this._notifyOperationListeners('handleLoadProjects', 'error', error);
      return { success: false, error };
    }

    this._notifyOperationListeners('handleLoadProjects', 'info', 'Loading user projects...');
    setShowProjectsModal(true);
    
    try {
      const result = await projectContext.loadUserProjects();
      if (result.success) {
        this._notifyOperationListeners('handleLoadProjects', 'success', 'Projects loaded successfully');
      } else {
        this._notifyOperationListeners('handleLoadProjects', 'error', `Failed to load projects: ${result.error}`);
      }
      return result;
    } catch (error) {
      const errorMessage = 'Failed to load projects';
      this._notifyOperationListeners('handleLoadProjects', 'error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get current project status and metadata
   * @param {Object} currentProject - Current project object
   * @param {Object} currentDeployment - Current deployment object
   * @returns {Object} Project status information
   */
  getProjectStatus(currentProject, currentDeployment) {
    const hasActiveProject = currentProject && currentProject.metadata && currentProject.metadata.projectId;
    const hasActiveDeployment = currentDeployment && currentDeployment.status === 'ready';
    
    return {
      hasActiveProject,
      hasActiveDeployment,
      projectId: hasActiveProject ? currentProject.metadata.projectId : null,
      projectName: hasActiveProject ? currentProject.metadata.name : null,
      deploymentId: hasActiveDeployment ? currentDeployment.id : null,
      deploymentName: hasActiveDeployment ? currentDeployment.projectName : null,
      canSaveToCloud: hasActiveDeployment && !this.isCloudSaving,
      canLoadProject: !this.isLoadingProjects,
      isLoadingProjects: this.isLoadingProjects,
      isCloudSaving: this.isCloudSaving
    };
  }

  /**
   * Clean up service resources
   */
  cleanup() {
    this.loadingListeners.clear();
    this.savingListeners.clear();
    this.operationListeners.clear();
  }
}

// Create and export a singleton instance
const projectService = new ProjectService();
export default projectService;