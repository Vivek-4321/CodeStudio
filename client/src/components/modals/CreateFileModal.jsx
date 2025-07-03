import React, { useState } from 'react';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

const CreateFileModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isDirectory = false,
  onToggleDirectory
}) => {
  const [fileName, setFileName] = useState('');

  const handleClose = () => {
    setFileName('');
    onClose();
  };

  const handleConfirm = () => {
    if (fileName.trim()) {
      onConfirm(fileName.trim());
      setFileName('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Create {isDirectory ? 'Folder' : 'File'}</h3>
          <button 
            className="modal-close"
            onClick={handleClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">{isDirectory ? 'Folder' : 'File'} Name:</label>
            <input
              type="text"
              className="form-input"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={isDirectory ? 'folder-name' : 'file-name.ext'}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button 
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!fileName.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

CreateFileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isDirectory: PropTypes.bool,
  onToggleDirectory: PropTypes.func
};

CreateFileModal.defaultProps = {
  isDirectory: false,
  onToggleDirectory: null
};

export default CreateFileModal;