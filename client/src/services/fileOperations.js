import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_GIT_API_BASE;

/**
 * File Operations Service
 * 
 * This service handles all file CRUD operations for both deployment-based
 * and project-based file systems with intelligent fallback mechanisms.
 */

/**
 * Gets the current file system context based on available systems
 * @param {Object} currentDeployment - Current deployment object
 * @param {Object} currentProject - Current project object
 * @returns {Object} Context object with system availability flags
 */
export const getFileSystemContext = (currentDeployment, currentProject) => {
  const hasActiveDeployment = currentDeployment && currentDeployment.status === 'ready';
  const hasActiveProject = currentProject && currentProject.metadata && currentProject.metadata.projectId;
  
  return {
    hasActiveDeployment,
    hasActiveProject,
    preferDeployment: hasActiveDeployment && hasActiveProject,
    canUseDeployment: hasActiveDeployment,
    canUseProject: hasActiveProject
  };
};

/**
 * Creates a file in the deployment system
 * @param {string} deploymentId - The deployment ID
 * @param {string} filePath - Path where the file should be created
 * @param {string} content - File content (default: empty string)
 * @param {boolean} isDirectory - Whether to create a directory (default: false)
 * @returns {Promise<Object>} Result object with success status and optional error
 */
export const createFileInDeployment = async (deploymentId, filePath, content = '', isDirectory = false) => {
  if (!deploymentId) {
    return { success: false, error: 'Deployment not ready' };
  }

  try {
    const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content, isDirectory })
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to create file' };
    }
  } catch (error) {
    console.error('Error creating file in deployment:', error);
    return { success: false, error: 'Failed to create file' };
  }
};

/**
 * Deletes a file from the deployment system
 * @param {string} deploymentId - The deployment ID
 * @param {string} filePath - Path of the file to delete
 * @returns {Promise<Object>} Result object with success status and optional error
 */
export const deleteFileInDeployment = async (deploymentId, filePath) => {
  if (!deploymentId) {
    return { success: false, error: 'Deployment not ready' };
  }

  try {
    const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/file?path=${encodeURIComponent(filePath)}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to delete file' };
    }
  } catch (error) {
    console.error('Error deleting file in deployment:', error);
    return { success: false, error: 'Failed to delete file' };
  }
};

/**
 * Moves a file within the deployment system
 * @param {string} deploymentId - The deployment ID
 * @param {string} sourcePath - Current file path
 * @param {string} destinationPath - Destination directory path
 * @returns {Promise<Object>} Result object with success status and optional error
 */
export const moveFileInDeployment = async (deploymentId, sourcePath, destinationPath) => {
  if (!deploymentId) {
    return { success: false, error: 'Deployment not ready' };
  }

  try {
    // Create the destination path (combining destination folder with source filename)
    const fileName = sourcePath.split('/').pop();
    const newPath = `${destinationPath}/${fileName}`;

    // Read the source file content first
    const readResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/file?path=${encodeURIComponent(sourcePath)}`);
    
    if (!readResponse.ok) {
      return { success: false, error: 'Failed to read source file' };
    }

    const data = await readResponse.json();
    const sourceContent = data.content;

    // Create the file at the new location
    const createResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: newPath, content: sourceContent })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      return { success: false, error: errorData.error || 'Failed to create file at new location' };
    }

    // Check if source file still exists before trying to delete it
    const checkResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/file?path=${encodeURIComponent(sourcePath)}`);
    
    if (checkResponse.ok) {
      // Source file exists, proceed with deletion
      const deleteResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/file?path=${encodeURIComponent(sourcePath)}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.ok) {
        // Get detailed error information
        const deleteError = await deleteResponse.json().catch(() => ({ error: 'Unknown delete error' }));
        const errorMessage = deleteError.error || 'Failed to delete source file after move';
        
        console.error('Delete source file failed:', errorMessage);
        
        // If delete fails, we should clean up the created file to prevent duplicates
        try {
          const cleanupResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/file?path=${encodeURIComponent(newPath)}`, {
            method: 'DELETE'
          });
          if (!cleanupResponse.ok) {
            console.warn('Failed to cleanup destination file after delete failure');
          }
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError);
        }

        return { 
          success: false, 
          error: `File copied to destination but failed to remove from source: ${errorMessage}` 
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error moving file in deployment:', error);
    return { success: false, error: 'Failed to move file' };
  }
};

/**
 * Creates a file using unified approach with intelligent fallback
 * @param {Object} context - File system context
 * @param {Function} createFileInProject - Project-based file creation function
 * @param {string} deploymentId - The deployment ID
 * @param {string} filePath - Path where the file should be created
 * @param {string} content - File content (default: empty string)
 * @param {boolean} isDirectory - Whether to create a directory (default: false)
 * @returns {Promise<Object>} Result object with success status and optional error
 */
export const createFileUnified = async (context, createFileInProject, deploymentId, filePath, content = '', isDirectory = false) => {
  // If we have both systems available, prefer deployment for real-time feedback
  if (context.canUseDeployment) {
    const deployResult = await createFileInDeployment(deploymentId, filePath, content, isDirectory);
    
    // If deployment succeeds and we have a project, also save to Firebase for persistence
    if (deployResult.success && context.canUseProject) {
      try {
        await createFileInProject(filePath, content, isDirectory);
        // File synchronized to both deployment and project storage
      } catch (error) {
        console.warn('File created in deployment but failed to sync to project:', error);
        // Return success with warning since deployment succeeded
        return { 
          success: true, 
          warning: 'File created in deployment but not saved to project. Changes may be lost on restart.' 
        };
      }
    }
    
    return deployResult;
  }
  
  // Fallback to Firebase project storage
  if (context.canUseProject) {
    try {
      const result = await createFileInProject(filePath, content, isDirectory);
      if (result.success) {
        // File saved to project storage
      }
      return result;
    } catch (error) {
      console.error('Error creating file in project:', error);
      return { success: false, error: 'Failed to create file in project' };
    }
  }
  
  // No file system available
  return { success: false, error: 'No file system available' };
};

/**
 * Moves a file using unified approach with intelligent fallback
 * @param {Object} context - File system context
 * @param {Function} moveFileInProject - Project-based file move function
 * @param {string} deploymentId - The deployment ID
 * @param {string} sourcePath - Current file path
 * @param {string} destinationPath - Destination directory path
 * @returns {Promise<Object>} Result object with success status and optional error
 */
export const moveFileUnified = async (context, moveFileInProject, deploymentId, sourcePath, destinationPath) => {
  const fileName = sourcePath.split('/').pop();
  const newPath = `${destinationPath}/${fileName}`;
  
  // If we have both systems available, prefer deployment for real-time feedback
  if (context.canUseDeployment) {
    const deployResult = await moveFileInDeployment(deploymentId, sourcePath, destinationPath);
    
    // If deployment succeeds and we have a project, also update Firebase for persistence
    if (deployResult.success && context.canUseProject) {
      try {
        await moveFileInProject(sourcePath, newPath);
        // File move synchronized to both systems
      } catch (error) {
        console.warn('File moved in deployment but failed to sync to project:', error);
        return { 
          success: true, 
          warning: 'File moved in deployment but not synchronized to project. Changes may be lost on restart.' 
        };
      }
    }
    
    return deployResult;
  }
  
  // Fallback to Firebase project storage
  if (context.canUseProject) {
    try {
      const result = await moveFileInProject(sourcePath, newPath);
      if (result.success) {
        // File moved in project storage
      }
      return result;
    } catch (error) {
      console.error('Error moving file in project:', error);
      return { success: false, error: 'Failed to move file in project' };
    }
  }
  
  // No file system available
  return { success: false, error: 'No file system available' };
};

/**
 * Deletes a file using unified approach with confirmation
 * @param {string} deploymentId - The deployment ID
 * @param {string} filePath - Path of the file to delete
 * @param {boolean} skipConfirmation - Skip confirmation dialog (default: false)
 * @returns {Promise<Object>} Result object with success status and optional error
 */
export const handleDeleteFileUnified = async (deploymentId, filePath, skipConfirmation = false) => {
  if (!skipConfirmation && !window.confirm('Are you sure you want to delete this file?')) {
    return { success: false, cancelled: true };
  }

  const result = await deleteFileInDeployment(deploymentId, filePath);
  
  if (result.success) {
    // File deleted successfully
    return { success: true };
  }
  
  return result;
};

/**
 * Loads the file tree from deployment
 * @param {string} deploymentId - The deployment ID
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<Object>} Result object with files data or error
 */
export const loadFileTree = async (deploymentId, retries = 3) => {
  try {
    // First, check if the deployment is ready
    const deploymentResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}`);
    if (!deploymentResponse.ok) {
      throw new Error('Failed to get deployment status');
    }
    
    const deployment = await deploymentResponse.json();
    
    // Wait for deployment to be ready if it's not yet
    if (deployment.status !== 'ready') {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return loadFileTree(deploymentId, retries - 1);
      } else {
        throw new Error(`Deployment not ready after multiple attempts (status: ${deployment.status})`);
      }
    }
    
    // Now load the file tree
    const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/files`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to load files');
    }
    const files = await response.json();
    
    return { success: true, files };
  } catch (error) {
    console.error('Error loading file tree:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reads file content from deployment
 * @param {string} deploymentId - The deployment ID
 * @param {string} filePath - Path of the file to read
 * @param {string} sessionId - Optional session ID
 * @returns {Promise<Object>} Result object with file content or error
 */
export const readFileFromDeployment = async (deploymentId, filePath, sessionId = null) => {
  try {
    const url = sessionId 
      ? `${API_BASE_URL}/api/deployments/${deploymentId}/file?path=${encodeURIComponent(filePath)}&sessionId=${sessionId}`
      : `${API_BASE_URL}/api/deployments/${deploymentId}/file?path=${encodeURIComponent(filePath)}`;
      
    const response = await authService.apiCall(url);
    
    if (!response.ok) {
      throw new Error('Failed to read file');
    }
    
    const data = await response.json();
    return { success: true, content: data.content };
  } catch (error) {
    console.error('Error reading file from deployment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Saves file content to deployment
 * @param {string} deploymentId - The deployment ID
 * @param {string} filePath - Path of the file to save
 * @param {string} content - File content to save
 * @returns {Promise<Object>} Result object with success status and optional error
 */
export const saveFileToDeployment = async (deploymentId, filePath, content) => {
  if (!deploymentId) {
    return { success: false, error: 'Deployment not ready' };
  }

  try {
    const response = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}/file`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content })
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to save file' };
    }
  } catch (error) {
    console.error('Error saving file to deployment:', error);
    return { success: false, error: 'Failed to save file' };
  }
};

/**
 * Batch file operations for loading project files into deployment
 * @param {string} deploymentId - The deployment ID
 * @param {Object} projectFiles - Object containing file paths and contents
 * @param {string} sessionId - Session ID for tracking
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<Object>} Result object with success status and optional error
 */
export const loadProjectIntoDeployment = async (deploymentId, projectFiles, sessionId, retries = 3) => {
  try {
    // First, check if the deployment is ready
    const deploymentResponse = await authService.apiCall(`${API_BASE_URL}/api/deployments/${deploymentId}`);
    if (!deploymentResponse.ok) {
      throw new Error('Failed to get deployment status');
    }
    
    const deployment = await deploymentResponse.json();
    
    // Wait for deployment to be ready if it's not yet
    if (deployment.status !== 'ready') {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return loadProjectIntoDeployment(deploymentId, projectFiles, sessionId, retries - 1);
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
    
    if (!loadResponse.ok) {
      const errorData = await loadResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to load project into deployment');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error loading project into deployment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * File system utilities
 */
export const fileUtils = {
  /**
   * Get file extension from path
   * @param {string} filePath - File path
   * @returns {string} File extension
   */
  getFileExtension: (filePath) => {
    return filePath.split('.').pop().toLowerCase();
  },

  /**
   * Get filename from path
   * @param {string} filePath - File path
   * @returns {string} Filename
   */
  getFileName: (filePath) => {
    return filePath.split('/').pop();
  },

  /**
   * Get directory path from file path
   * @param {string} filePath - File path
   * @returns {string} Directory path
   */
  getDirectoryPath: (filePath) => {
    const parts = filePath.split('/');
    parts.pop();
    return parts.join('/');
  },

  /**
   * Check if path is a directory based on naming convention
   * @param {string} path - File path
   * @returns {boolean} True if likely a directory
   */
  isLikelyDirectory: (path) => {
    return !path.includes('.') || path.endsWith('/');
  },

  /**
   * Sanitize file path
   * @param {string} path - File path to sanitize
   * @returns {string} Sanitized path
   */
  sanitizePath: (path) => {
    return path.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
  }
};

export default {
  getFileSystemContext,
  createFileInDeployment,
  deleteFileInDeployment,
  moveFileInDeployment,
  createFileUnified,
  moveFileUnified,
  handleDeleteFileUnified,
  loadFileTree,
  readFileFromDeployment,
  saveFileToDeployment,
  loadProjectIntoDeployment,
  fileUtils
};