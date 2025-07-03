import React from 'react';

/**
 * Skeleton loader for the file tree component
 * Displays a shimmer effect while the file tree is loading
 */
const SkeletonFileTree = () => (
  <div className="skeleton-file-tree">
    {[...Array(10)].map((_, index) => (
      <div key={index} className="skeleton-file-item" style={{ 
        paddingLeft: `${index % 3 === 0 ? 32 : index % 2 === 0 ? 24 : 16}px` 
      }}>
        <div className="skeleton-file-content">
          <div className="skeleton-file-icon"></div>
          <div 
            className="skeleton-file-name" 
            style={{ 
              width: index % 4 === 0 ? '75%' : index % 3 === 0 ? '60%' : index % 2 === 0 ? '85%' : '70%' 
            }}
          ></div>
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonFileTree;