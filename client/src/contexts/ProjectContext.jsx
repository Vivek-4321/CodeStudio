import React, { createContext, useContext, useState, useCallback } from 'react';
import firebaseFileService from '../services/firebaseFileService';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const saveProject = useCallback(async (projectData, options = {}) => {
    if (!isAuthenticated || !user) {
      setError('User must be authenticated to save projects');
      return { success: false, error: 'Authentication required' };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.saveProject(user.id, projectData);
      
      if (result.success) {
        setCurrentProject(result.data);
        if (options.refreshList) {
          await loadUserProjects();
        }
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to save project';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const loadProject = useCallback(async (projectId) => {
    if (!isAuthenticated || !user) {
      setError('User must be authenticated to load projects');
      return { success: false, error: 'Authentication required' };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.loadProject(user.id, projectId);
      
      if (result.success) {
        setCurrentProject(result.data);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to load project';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const loadUserProjects = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      return { success: false, error: 'Authentication required' };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.getUserProjects(user.id);
      
      if (result.success) {
        setProjects(result.data);
      } else {
        setError(result.error);
        setProjects([]);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to load projects';
      setError(errorMessage);
      setProjects([]);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const deleteProject = useCallback(async (projectId) => {
    if (!isAuthenticated || !user) {
      setError('User must be authenticated to delete projects');
      return { success: false, error: 'Authentication required' };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.deleteProject(user.id, projectId);
      
      if (result.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (currentProject && currentProject.metadata.projectId === projectId) {
          setCurrentProject(null);
        }
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to delete project';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, currentProject]);

  const updateProject = useCallback(async (projectId, projectData) => {
    if (!isAuthenticated || !user) {
      setError('User must be authenticated to update projects');
      return { success: false, error: 'Authentication required' };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.updateProject(user.id, projectId, projectData);
      
      if (result.success) {
        setCurrentProject(result.data);
        await loadUserProjects();
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to update project';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, loadUserProjects]);

  // File management operations
  const createFile = useCallback(async (filePath, content = '', isDirectory = false) => {
    if (!isAuthenticated || !user || !currentProject) {
      setError('User must be authenticated and have a project loaded');
      return { success: false, error: 'Authentication required' };
    }

    // Check if project has a valid projectId
    if (!currentProject.metadata || !currentProject.metadata.projectId) {
      const errorMsg = 'Current project is missing project ID. Please reload the project.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.createFile(
        user.id, 
        currentProject.metadata.projectId, 
        filePath, 
        content, 
        isDirectory
      );
      
      if (result.success) {
        // Reload the project to get updated file list
        await loadProject(currentProject.metadata.projectId);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to create file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, currentProject, loadProject]);

  const renameFile = useCallback(async (oldPath, newPath) => {
    if (!isAuthenticated || !user || !currentProject) {
      setError('User must be authenticated and have a project loaded');
      return { success: false, error: 'Authentication required' };
    }

    // Check if project has a valid projectId
    if (!currentProject.metadata || !currentProject.metadata.projectId) {
      const errorMsg = 'Current project is missing project ID. Please reload the project.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.renameFile(
        user.id, 
        currentProject.metadata.projectId, 
        oldPath, 
        newPath
      );
      
      if (result.success) {
        // Reload the project to get updated file list
        await loadProject(currentProject.metadata.projectId);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to rename file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, currentProject, loadProject]);

  const moveFile = useCallback(async (sourcePath, destinationPath) => {
    // Improved authentication check with detailed error messages
    if (!isAuthenticated) {
      const errorMsg = 'User is not authenticated';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    if (!user) {
      const errorMsg = 'User data is not available';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
    
    if (!currentProject) {
      const errorMsg = 'No active project loaded';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Check if project has a valid projectId
    if (!currentProject.metadata || !currentProject.metadata.projectId) {
      const errorMsg = 'Current project is missing project ID. Please reload the project.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.moveFile(
        user.id, 
        currentProject.metadata.projectId, 
        sourcePath, 
        destinationPath
      );
      
      if (result.success) {
        // Reload the project to get updated file list
        await loadProject(currentProject.metadata.projectId);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to move file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, currentProject, loadProject]);

  const deleteFile = useCallback(async (filePath) => {
    if (!isAuthenticated || !user || !currentProject) {
      setError('User must be authenticated and have a project loaded');
      return { success: false, error: 'Authentication required' };
    }

    // Check if project has a valid projectId
    if (!currentProject.metadata || !currentProject.metadata.projectId) {
      const errorMsg = 'Current project is missing project ID. Please reload the project.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setLoading(true);
    clearError();

    try {
      const result = await firebaseFileService.deleteFile(
        user.id, 
        currentProject.metadata.projectId, 
        filePath
      );
      
      if (result.success) {
        // Reload the project to get updated file list
        await loadProject(currentProject.metadata.projectId);
      } else {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to delete file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, currentProject, loadProject]);

  const value = {
    currentProject,
    projects,
    loading,
    error,
    saveProject,
    loadProject,
    loadUserProjects,
    deleteProject,
    updateProject,
    clearError,
    setCurrentProject,
    // File management operations
    createFile,
    renameFile,
    moveFile,
    deleteFile
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};