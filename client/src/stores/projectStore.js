import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import firebaseFileService from '../services/firebaseFileService';
import { useAuthStore } from './authStore';

export const useProjectStore = create(
  devtools(
    (set, get) => ({
      currentProject: null,
      projects: [],
      loading: false,
      error: null,

      clearError: () => {
        set({ error: null });
      },

      saveProject: async (projectData, options = {}) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (!isAuthenticated || !user) {
          set({ error: 'User must be authenticated to save projects' });
          return { success: false, error: 'Authentication required' };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.saveProject(user.id, projectData);
          
          if (result.success) {
            set({ currentProject: result.data });
            if (options.refreshList) {
              await get().loadUserProjects();
            }
          } else {
            set({ error: result.error });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to save project';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      loadProject: async (projectId) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (!isAuthenticated || !user) {
          set({ error: 'User must be authenticated to load projects' });
          return { success: false, error: 'Authentication required' };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.loadProject(user.id, projectId);
          
          if (result.success) {
            set({ currentProject: result.data });
          } else {
            set({ error: result.error });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to load project';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      loadUserProjects: async () => {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (!isAuthenticated || !user) {
          set({ projects: [] });
          return { success: false, error: 'Authentication required' };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.getUserProjects(user.id);
          
          if (result.success) {
            set({ projects: result.data });
          } else {
            set({ error: result.error, projects: [] });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to load projects';
          set({ error: errorMessage, projects: [] });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      deleteProject: async (projectId) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        const { currentProject } = get();
        
        if (!isAuthenticated || !user) {
          set({ error: 'User must be authenticated to delete projects' });
          return { success: false, error: 'Authentication required' };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.deleteProject(user.id, projectId);
          
          if (result.success) {
            set(state => ({
              projects: state.projects.filter(p => p.id !== projectId),
              currentProject: currentProject && currentProject.metadata.projectId === projectId ? null : currentProject
            }));
          } else {
            set({ error: result.error });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to delete project';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      updateProject: async (projectId, projectData) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (!isAuthenticated || !user) {
          set({ error: 'User must be authenticated to update projects' });
          return { success: false, error: 'Authentication required' };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.updateProject(user.id, projectId, projectData);
          
          if (result.success) {
            set({ currentProject: result.data });
            await get().loadUserProjects();
          } else {
            set({ error: result.error });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to update project';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      createFile: async (filePath, content = '', isDirectory = false) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        const { currentProject } = get();
        
        if (!isAuthenticated || !user || !currentProject) {
          set({ error: 'User must be authenticated and have a project loaded' });
          return { success: false, error: 'Authentication required' };
        }

        if (!currentProject.metadata || !currentProject.metadata.projectId) {
          const errorMsg = 'Current project is missing project ID. Please reload the project.';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.createFile(
            user.id, 
            currentProject.metadata.projectId, 
            filePath, 
            content, 
            isDirectory
          );
          
          if (result.success) {
            await get().loadProject(currentProject.metadata.projectId);
          } else {
            set({ error: result.error });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to create file';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      renameFile: async (oldPath, newPath) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        const { currentProject } = get();
        
        if (!isAuthenticated || !user || !currentProject) {
          set({ error: 'User must be authenticated and have a project loaded' });
          return { success: false, error: 'Authentication required' };
        }

        if (!currentProject.metadata || !currentProject.metadata.projectId) {
          const errorMsg = 'Current project is missing project ID. Please reload the project.';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.renameFile(
            user.id, 
            currentProject.metadata.projectId, 
            oldPath, 
            newPath
          );
          
          if (result.success) {
            await get().loadProject(currentProject.metadata.projectId);
          } else {
            set({ error: result.error });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to rename file';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      moveFile: async (sourcePath, destinationPath) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        const { currentProject } = get();
        
        if (!isAuthenticated) {
          const errorMsg = 'User is not authenticated';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }
        
        if (!user) {
          const errorMsg = 'User data is not available';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }
        
        if (!currentProject) {
          const errorMsg = 'No active project loaded';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }

        if (!currentProject.metadata || !currentProject.metadata.projectId) {
          const errorMsg = 'Current project is missing project ID. Please reload the project.';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.moveFile(
            user.id, 
            currentProject.metadata.projectId, 
            sourcePath, 
            destinationPath
          );
          
          if (result.success) {
            await get().loadProject(currentProject.metadata.projectId);
          } else {
            set({ error: result.error });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to move file';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      deleteFile: async (filePath) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        const { currentProject } = get();
        
        if (!isAuthenticated || !user || !currentProject) {
          set({ error: 'User must be authenticated and have a project loaded' });
          return { success: false, error: 'Authentication required' };
        }

        if (!currentProject.metadata || !currentProject.metadata.projectId) {
          const errorMsg = 'Current project is missing project ID. Please reload the project.';
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
        }

        set({ loading: true, error: null });

        try {
          const result = await firebaseFileService.deleteFile(
            user.id, 
            currentProject.metadata.projectId, 
            filePath
          );
          
          if (result.success) {
            await get().loadProject(currentProject.metadata.projectId);
          } else {
            set({ error: result.error });
          }
          
          return result;
        } catch (error) {
          const errorMessage = 'Failed to delete file';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ loading: false });
        }
      },

      setCurrentProject: (project) => {
        set({ currentProject: project });
      }
    }),
    {
      name: 'project-store'
    }
  )
);