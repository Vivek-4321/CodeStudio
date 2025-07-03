import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const RenameModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  renameTarget = null 
}) => {
  const [newFileName, setNewFileName] = useState('');

  // Pre-populate the input with the current name when the modal opens
  useEffect(() => {
    if (isOpen && renameTarget) {
      setNewFileName(renameTarget.name || '');
    }
  }, [isOpen, renameTarget]);

  const handleClose = () => {
    setNewFileName('');
    onClose();
  };

  const handleConfirm = () => {
    if (newFileName.trim() && renameTarget) {
      onConfirm(newFileName.trim(), renameTarget);
      setNewFileName('');
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
          <h3>Rename {renameTarget?.isDirectory ? 'Folder' : 'File'}</h3>
          <button 
            className="modal-close"
            onClick={handleClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">New Name:</label>
            <input
              type="text"
              className="form-input"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
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
            disabled={!newFileName.trim()}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;