import React from 'react';
import { 
  X, 
  Loader, 
  AlertCircle, 
  Cloud, 
  Play, 
  Trash2, 
  FileCode, 
  Clock 
} from 'lucide-react';
import { FRAMEWORKS } from './constants';

const ProjectsModal = ({ 
  isOpen, 
  onClose, 
  projects = [],
  loading = false,
  error = null,
  isLoadingProjects = false,
  onLoadProject,
  onDeleteProject,
  onRetry,
  currentDeployment = null,
  loadFileTree
}) => {
  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      handleClose();
    }
  };

  const handleLoadProject = async (project) => {
    if (onLoadProject) {
      await onLoadProject(project);
      // Additional file tree refresh after project loading completes
      setTimeout(async () => {
        if (currentDeployment && loadFileTree) {
          try {
            await loadFileTree(currentDeployment.id);
          } catch (error) {
            console.error('Error in final file tree refresh:', error);
          }
        }
      }, 5000); // Wait 5 seconds for all operations to complete
    }
  };

  const handleDeleteProject = (project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      if (onDeleteProject) {
        onDeleteProject(project.id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal projects-modal">
        <div className="modal-header">
          <h3>My Saved Projects</h3>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <Loader size={24} className="animate-spin" />
              <p>Loading your projects...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={24} />
              <p>Error: {error}</p>
              <button className="btn btn-secondary" onClick={onRetry}>
                Try Again
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <Cloud size={48} />
              <h4>No Saved Projects</h4>
              <p>You haven't saved any projects to Firebase yet.</p>
              <p>Create a project and click "Save" to get started!</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <div className="project-icon">
                      {FRAMEWORKS.find(f => f.id === project.framework)?.icon || '📁'}
                    </div>
                    <div className="project-info">
                      <h4 className="project-name">{project.name}</h4>
                      <p className="project-framework">
                        {FRAMEWORKS.find(f => f.id === project.framework)?.name || project.framework}
                      </p>
                    </div>
                  </div>
                  
                  <div className="project-meta">
                    <div className="project-stats">
                      <span className="stat">
                        <FileCode size={14} />
                        {project.totalFiles} files
                      </span>
                      <span className="stat">
                        <Clock size={14} />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {project.description && (
                      <p className="project-description">{project.description}</p>
                    )}
                  </div>

                  <div className="project-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleLoadProject(project)}
                      disabled={isLoadingProjects}
                    >
                      {isLoadingProjects ? (
                        <>
                          <Loader size={14} className="animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          Load & Deploy
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleDeleteProject(project)}
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsModal;