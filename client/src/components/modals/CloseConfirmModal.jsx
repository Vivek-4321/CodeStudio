import { X, AlertTriangle } from 'lucide-react';

const CloseConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  unsavedChanges = false,
  currentDeployment = null
}) => {
  const handleClose = () => {
    onClose();
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Close IDE</h3>
          <button 
            className="modal-close"
            onClick={handleClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="close-confirm-content">
            <AlertTriangle size={24} className="warning-icon" />
            <div className="close-confirm-text">
              <p className="close-confirm-title">
                Are you sure you want to close the IDE?
              </p>
              <p className="close-confirm-subtitle">
                {unsavedChanges ? 'You have unsaved changes that will be lost.' : 'Your current session will be ended.'}
              </p>
            </div>
          </div>
          
          {/* Show deployment info */}
          {currentDeployment && (
            <div className="deployment-warning">
              <p className="deployment-warning-title">
                This will also delete the deployment: {currentDeployment.projectName}
              </p>
              <p className="deployment-warning-subtitle">
                The deployment and all its resources will be permanently removed
              </p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button 
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Stay
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleConfirm}
          >
            Close IDE
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseConfirmModal;