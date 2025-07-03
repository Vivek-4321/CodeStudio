import React from 'react';

/**
 * Skeleton loader for the packages component
 * Displays a shimmer effect while packages are loading
 */
const SkeletonPackages = () => (
  <div className="skeleton-packages">
    {[...Array(6)].map((_, index) => (
      <div key={index} className="skeleton-package-item">
        <div className="skeleton-package-content">
          <div className="skeleton-package-name"></div>
          <div className="skeleton-package-version"></div>
        </div>
        <div className="skeleton-package-action"></div>
      </div>
    ))}
  </div>
);

export default SkeletonPackages;