import React from 'react';
import { File, Folder, FileCode, Trash2 } from 'lucide-react';

const ContextMenu = ({ 
  isOpen, 
  x, 
  y, 
  file = null,
  onClose,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete
}) => {
  const handleClose = () => {
    onClose();
  };

  const handleCreateFile = () => {
    onCreateFile();
    handleClose();
  };

  const handleCreateFolder = () => {
    onCreateFolder();
    handleClose();
  };

  const handleRename = () => {
    if (file && onRename) {
      onRename(file);
    }
    handleClose();
  };

  const handleDelete = () => {
    if (file && onDelete) {
      onDelete(file);
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="context-menu-overlay" 
        onClick={handleClose}
      />
      <div 
        className="context-menu"
        style={{ 
          left: x, 
          top: y 
        }}
      >
        <div 
          className="context-menu-item"
          onClick={handleCreateFile}
        >
          <File size={14} />
          New File
        </div>
        <div 
          className="context-menu-item"
          onClick={handleCreateFolder}
        >
          <Folder size={14} />
          New Folder
        </div>
        {file && (
          <>
            <hr className="context-menu-separator" />
            <div 
              className="context-menu-item"
              onClick={handleRename}
            >
              <FileCode size={14} />
              Rename
            </div>
            <div 
              className="context-menu-item context-menu-item-danger"
              onClick={handleDelete}
            >
              <Trash2 size={14} />
              Delete
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ContextMenu;