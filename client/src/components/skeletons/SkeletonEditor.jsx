import React from 'react';

/**
 * Skeleton loader for the code editor component
 * Displays a shimmer effect while the editor is loading
 */
const SkeletonEditor = () => (
  <div className="skeleton-editor">
    <div className="skeleton-editor-header">
      <div className="skeleton-editor-breadcrumb"></div>
      <div className="skeleton-editor-actions">
        <div className="skeleton-save-status"></div>
        <div className="skeleton-save-btn"></div>
      </div>
    </div>
    <div className="skeleton-editor-content">
      {[...Array(12)].map((_, index) => (
        <div key={index} className="skeleton-editor-line" style={{ 
          width: `${Math.random() * 40 + 30}%`,
        }}></div>
      ))}
    </div>
  </div>
);

export default SkeletonEditor;