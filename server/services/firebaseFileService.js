import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { storage, db } from '../config/firebase.js';

class FirebaseFileService {
  constructor() {
    this.PROJECTS_COLLECTION = 'user_projects';
  }

  async saveProject(userId, projectData) {
    try {
      const { files, metadata } = projectData;
      const projectId = metadata.projectId || `project_${Date.now()}`;
      
      const projectRef = doc(db, this.PROJECTS_COLLECTION, `${userId}_${projectId}`);
      
      // Filter out node_modules and other unnecessary files
      const filteredFiles = Object.entries(files).filter(([filePath]) => {
        return !filePath.startsWith('node_modules/') && 
               !filePath.includes('/.git/') &&
               !filePath.includes('/dist/') &&
               !filePath.includes('/build/') &&
               !filePath.includes('/.next/') &&
               !filePath.includes('/.cache/');
      });
      
      const fileUploadPromises = filteredFiles.map(async ([filePath, content]) => {
        const fileRef = ref(storage, `projects/${userId}/${projectId}/${filePath}`);
        const fileBlob = new Blob([content], { type: 'text/plain' });
        await uploadBytes(fileRef, fileBlob);
        return {
          path: filePath,
          size: content.length,
          lastModified: Date.now()
        };
      });

      const uploadedFiles = await Promise.all(fileUploadPromises);
      
      const projectDocument = {
        userId,
        projectId,
        name: metadata.name || 'Untitled Project',
        description: metadata.description || '',
        framework: metadata.framework || 'unknown',
        files: uploadedFiles,
        createdAt: metadata.createdAt || Date.now(),
        updatedAt: Date.now(),
        totalFiles: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
      };

      await setDoc(projectRef, projectDocument);
      
      return {
        success: true,
        projectId,
        message: 'Project saved successfully',
        data: projectDocument
      };
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
      const projectRef = doc(db, this.PROJECTS_COLLECTION, `${userId}_${projectId}`);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return {
          success: false,
          error: 'Project not found'
        };
      }

      const projectData = projectDoc.data();
      const files = {};
      
      const fileDownloadPromises = projectData.files.map(async (fileInfo) => {
        const fileRef = ref(storage, `projects/${userId}/${projectId}/${fileInfo.path}`);
        const downloadURL = await getDownloadURL(fileRef);
        const response = await fetch(downloadURL);
        const content = await response.text();
        files[fileInfo.path] = content;
      });

      await Promise.all(fileDownloadPromises);
      
      return {
        success: true,
        data: {
          metadata: {
            projectId: projectData.projectId,
            name: projectData.name,
            description: projectData.description,
            framework: projectData.framework,
            createdAt: projectData.createdAt,
            updatedAt: projectData.updatedAt
          },
          files
        }
      };
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
      const projectsQuery = query(
        collection(db, this.PROJECTS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(projectsQuery);
      const projects = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: data.projectId,
          name: data.name,
          description: data.description,
          framework: data.framework,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          totalFiles: data.totalFiles,
          totalSize: data.totalSize
        });
      });
      
      return {
        success: true,
        data: projects.sort((a, b) => b.updatedAt - a.updatedAt)
      };
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
      const projectRef = doc(db, this.PROJECTS_COLLECTION, `${userId}_${projectId}`);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return {
          success: false,
          error: 'Project not found'
        };
      }

      const projectData = projectDoc.data();
      const storageRef = ref(storage, `projects/${userId}/${projectId}`);
      
      try {
        const filesList = await listAll(storageRef);
        const deletePromises = filesList.items.map(item => deleteObject(item));
        await Promise.all(deletePromises);
      } catch (storageError) {
        console.warn('Error deleting files from storage:', storageError);
      }

      await deleteDoc(projectRef);
      
      return {
        success: true,
        message: 'Project deleted successfully'
      };
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
      const projectRef = doc(db, this.PROJECTS_COLLECTION, `${userId}_${projectId}`);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return await this.saveProject(userId, { ...projectData, metadata: { ...projectData.metadata, projectId } });
      }

      const { files, metadata } = projectData;
      
      const existingData = projectDoc.data();
      const storageRef = ref(storage, `projects/${userId}/${projectId}`);
      
      try {
        const filesList = await listAll(storageRef);
        const deletePromises = filesList.items.map(item => deleteObject(item));
        await Promise.all(deletePromises);
      } catch (storageError) {
        console.warn('Error clearing old files:', storageError);
      }

      // Filter out node_modules and other unnecessary files
      const filteredFiles = Object.entries(files).filter(([filePath]) => {
        return !filePath.startsWith('node_modules/') && 
               !filePath.includes('/.git/') &&
               !filePath.includes('/dist/') &&
               !filePath.includes('/build/') &&
               !filePath.includes('/.next/') &&
               !filePath.includes('/.cache/');
      });

      const fileUploadPromises = filteredFiles.map(async ([filePath, content]) => {
        const fileRef = ref(storage, `projects/${userId}/${projectId}/${filePath}`);
        const fileBlob = new Blob([content], { type: 'text/plain' });
        await uploadBytes(fileRef, fileBlob);
        return {
          path: filePath,
          size: content.length,
          lastModified: Date.now()
        };
      });

      const uploadedFiles = await Promise.all(fileUploadPromises);
      
      const updateData = {
        name: metadata.name || existingData.name,
        description: metadata.description || existingData.description,
        framework: metadata.framework || existingData.framework,
        files: uploadedFiles,
        updatedAt: Date.now(),
        totalFiles: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0)
      };

      await updateDoc(projectRef, updateData);
      
      return {
        success: true,
        message: 'Project updated successfully',
        data: { ...existingData, ...updateData }
      };
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
      const projectRef = doc(db, this.PROJECTS_COLLECTION, `${userId}_${projectId}`);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return {
          success: false,
          error: 'Project not found'
        };
      }

      const projectData = projectDoc.data();
      
      // Check if file already exists
      const existingFile = projectData.files.find(file => file.path === filePath);
      if (existingFile) {
        return {
          success: false,
          error: 'File already exists'
        };
      }

      if (!isDirectory) {
        // Create file in Firebase Storage
        const fileRef = ref(storage, `projects/${userId}/${projectId}/${filePath}`);
        const fileBlob = new Blob([content], { type: 'text/plain' });
        await uploadBytes(fileRef, fileBlob);
      }

      // Update project document
      const newFile = {
        path: filePath,
        size: isDirectory ? 0 : content.length,
        lastModified: Date.now(),
        isDirectory
      };

      const updatedFiles = [...projectData.files, newFile];
      
      await updateDoc(projectRef, {
        files: updatedFiles,
        updatedAt: Date.now(),
        totalFiles: updatedFiles.length,
        totalSize: updatedFiles.reduce((sum, file) => sum + (file.size || 0), 0)
      });

      return {
        success: true,
        message: `${isDirectory ? 'Folder' : 'File'} created successfully`,
        data: newFile
      };
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
      const projectRef = doc(db, this.PROJECTS_COLLECTION, `${userId}_${projectId}`);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return {
          success: false,
          error: 'Project not found'
        };
      }

      const projectData = projectDoc.data();
      
      // Find the file to rename
      const fileIndex = projectData.files.findIndex(file => file.path === oldPath);
      if (fileIndex === -1) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      const fileToRename = projectData.files[fileIndex];
      
      // Check if new path already exists
      const existingFile = projectData.files.find(file => file.path === newPath);
      if (existingFile) {
        return {
          success: false,
          error: 'A file with that name already exists'
        };
      }

      if (!fileToRename.isDirectory) {
        // Move file in Firebase Storage
        const oldFileRef = ref(storage, `projects/${userId}/${projectId}/${oldPath}`);
        const newFileRef = ref(storage, `projects/${userId}/${projectId}/${newPath}`);
        
        // Download old file content
        const downloadURL = await getDownloadURL(oldFileRef);
        const response = await fetch(downloadURL);
        const content = await response.text();
        
        // Upload to new location
        const fileBlob = new Blob([content], { type: 'text/plain' });
        await uploadBytes(newFileRef, fileBlob);
        
        // Delete old file
        await deleteObject(oldFileRef);
      }

      // Update project document
      const updatedFiles = [...projectData.files];
      updatedFiles[fileIndex] = {
        ...fileToRename,
        path: newPath,
        lastModified: Date.now()
      };

      // Update any child files if this is a directory
      if (fileToRename.isDirectory) {
        for (let i = 0; i < updatedFiles.length; i++) {
          if (updatedFiles[i].path.startsWith(oldPath + '/')) {
            const oldFilePath = updatedFiles[i].path;
            const newFilePath = oldFilePath.replace(oldPath, newPath);
            
            if (!updatedFiles[i].isDirectory) {
              // Move child file in storage
              const oldChildRef = ref(storage, `projects/${userId}/${projectId}/${oldFilePath}`);
              const newChildRef = ref(storage, `projects/${userId}/${projectId}/${newFilePath}`);
              
              const downloadURL = await getDownloadURL(oldChildRef);
              const response = await fetch(downloadURL);
              const content = await response.text();
              
              const fileBlob = new Blob([content], { type: 'text/plain' });
              await uploadBytes(newChildRef, fileBlob);
              await deleteObject(oldChildRef);
            }
            
            updatedFiles[i] = {
              ...updatedFiles[i],
              path: newFilePath,
              lastModified: Date.now()
            };
          }
        }
      }
      
      await updateDoc(projectRef, {
        files: updatedFiles,
        updatedAt: Date.now()
      });

      return {
        success: true,
        message: 'File renamed successfully'
      };
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
      const projectRef = doc(db, this.PROJECTS_COLLECTION, `${userId}_${projectId}`);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return {
          success: false,
          error: 'Project not found'
        };
      }

      const projectData = projectDoc.data();
      
      // Find the file to move
      const fileIndex = projectData.files.findIndex(file => file.path === sourcePath);
      if (fileIndex === -1) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      const fileToMove = projectData.files[fileIndex];
      const fileName = sourcePath.split('/').pop();
      const newPath = destinationPath.endsWith('/') ? destinationPath + fileName : destinationPath + '/' + fileName;
      
      // Check if destination already exists
      const existingFile = projectData.files.find(file => file.path === newPath);
      if (existingFile) {
        return {
          success: false,
          error: 'A file with that name already exists at the destination'
        };
      }

      if (!fileToMove.isDirectory) {
        // Move file in Firebase Storage
        const oldFileRef = ref(storage, `projects/${userId}/${projectId}/${sourcePath}`);
        const newFileRef = ref(storage, `projects/${userId}/${projectId}/${newPath}`);
        
        // Download old file content
        const downloadURL = await getDownloadURL(oldFileRef);
        const response = await fetch(downloadURL);
        const content = await response.text();
        
        // Upload to new location
        const fileBlob = new Blob([content], { type: 'text/plain' });
        await uploadBytes(newFileRef, fileBlob);
        
        // Delete old file
        await deleteObject(oldFileRef);
      }

      // Update project document
      const updatedFiles = [...projectData.files];
      updatedFiles[fileIndex] = {
        ...fileToMove,
        path: newPath,
        lastModified: Date.now()
      };

      // Update any child files if this is a directory
      if (fileToMove.isDirectory) {
        for (let i = 0; i < updatedFiles.length; i++) {
          if (updatedFiles[i].path.startsWith(sourcePath + '/')) {
            const oldFilePath = updatedFiles[i].path;
            const relativePath = oldFilePath.substring(sourcePath.length + 1);
            const newFilePath = newPath + '/' + relativePath;
            
            if (!updatedFiles[i].isDirectory) {
              // Move child file in storage
              const oldChildRef = ref(storage, `projects/${userId}/${projectId}/${oldFilePath}`);
              const newChildRef = ref(storage, `projects/${userId}/${projectId}/${newFilePath}`);
              
              const downloadURL = await getDownloadURL(oldChildRef);
              const response = await fetch(downloadURL);
              const content = await response.text();
              
              const fileBlob = new Blob([content], { type: 'text/plain' });
              await uploadBytes(newChildRef, fileBlob);
              await deleteObject(oldChildRef);
            }
            
            updatedFiles[i] = {
              ...updatedFiles[i],
              path: newFilePath,
              lastModified: Date.now()
            };
          }
        }
      }
      
      await updateDoc(projectRef, {
        files: updatedFiles,
        updatedAt: Date.now()
      });

      return {
        success: true,
        message: 'File moved successfully'
      };
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
      const projectRef = doc(db, this.PROJECTS_COLLECTION, `${userId}_${projectId}`);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        return {
          success: false,
          error: 'Project not found'
        };
      }

      const projectData = projectDoc.data();
      
      // Find the file to delete
      const fileToDelete = projectData.files.find(file => file.path === filePath);
      if (!fileToDelete) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      // Delete from Firebase Storage (if not directory)
      if (!fileToDelete.isDirectory) {
        const fileRef = ref(storage, `projects/${userId}/${projectId}/${filePath}`);
        try {
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn('Error deleting file from storage:', storageError);
        }
      }

      // Remove file and any child files from project document
      const updatedFiles = projectData.files.filter(file => {
        if (file.path === filePath) return false;
        if (fileToDelete.isDirectory && file.path.startsWith(filePath + '/')) {
          // Delete child files from storage
          if (!file.isDirectory) {
            const childFileRef = ref(storage, `projects/${userId}/${projectId}/${file.path}`);
            deleteObject(childFileRef).catch(err => console.warn('Error deleting child file:', err));
          }
          return false;
        }
        return true;
      });
      
      await updateDoc(projectRef, {
        files: updatedFiles,
        updatedAt: Date.now(),
        totalFiles: updatedFiles.length,
        totalSize: updatedFiles.reduce((sum, file) => sum + (file.size || 0), 0)
      });

      return {
        success: true,
        message: 'File deleted successfully'
      };
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