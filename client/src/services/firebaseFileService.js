import authService from './authService';

// Server-side Firebase File Service - Uses API endpoints instead of direct Firebase calls
class FirebaseFileService {
  constructor() {
    this.API_BASE_URL = import.meta.env.VITE_GIT_API_BASE + '/api';
  }

  async saveProject(userId, projectData) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          projectData
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save project');
      }

      return result;
    } catch (error) {
      console.error('Error saving project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async loadProject(userId, projectId) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects/${userId}/${projectId}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load project');
      }

      return result;
    } catch (error) {
      console.error('Error loading project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserProjects(userId) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects/${userId}`, {
        method: 'GET'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch user projects');
      }

      return result;
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteProject(userId, projectId) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects/${userId}/${projectId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete project');
      }

      return result;
    } catch (error) {
      console.error('Error deleting project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateProject(userId, projectId, projectData) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects/${userId}/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          projectData
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update project');
      }

      return result;
    } catch (error) {
      console.error('Error updating project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createFile(userId, projectId, filePath, content = '', isDirectory = false) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects/${userId}/${projectId}/files`, {
        method: 'POST',
        body: JSON.stringify({
          filePath,
          content,
          isDirectory
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create file');
      }

      return result;
    } catch (error) {
      console.error('Error creating file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async renameFile(userId, projectId, oldPath, newPath) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects/${userId}/${projectId}/files/rename`, {
        method: 'PUT',
        body: JSON.stringify({
          oldPath,
          newPath
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to rename file');
      }

      return result;
    } catch (error) {
      console.error('Error renaming file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async moveFile(userId, projectId, sourcePath, destinationPath) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects/${userId}/${projectId}/files/move`, {
        method: 'PUT',
        body: JSON.stringify({
          sourcePath,
          destinationPath
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to move file');
      }

      return result;
    } catch (error) {
      console.error('Error moving file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteFile(userId, projectId, filePath) {
    try {
      const response = await authService.apiCall(`${this.API_BASE_URL}/projects/${userId}/${projectId}/files`, {
        method: 'DELETE',
        body: JSON.stringify({
          filePath
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete file');
      }

      return result;
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new FirebaseFileService();