import React from 'react';

/**
 * Skeleton loader for the preview component
 * Displays a shimmer effect while the preview is loading
 */
const SkeletonPreview = () => (
  <div className="skeleton-preview">
    <div className="skeleton-preview-header">
      <div className="skeleton-preview-title"></div>
      <div className="skeleton-preview-controls"></div>
    </div>
    <div className="skeleton-preview-content">
      <div className="skeleton-preview-placeholder">
        <div className="skeleton-preview-icon"></div>
        <div className="skeleton-preview-lines">
          <div className="skeleton-preview-line"></div>
          <div className="skeleton-preview-line short"></div>
        </div>
        <div className="skeleton-preview-button"></div>
      </div>
    </div>
  </div>
);

export default SkeletonPreview;