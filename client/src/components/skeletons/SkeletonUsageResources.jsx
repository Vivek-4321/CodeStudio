import React from 'react';

/**
 * Skeleton loader for the usage resources component
 * Displays CPU/Memory metric cards with shimmer effects
 */
const SkeletonUsageResources = () => (
  <div className="skeleton-usage-resources">
    <div className="skeleton-resource-header">
      <div className="skeleton-resource-badge">
        <div className="skeleton-mode-indicator"></div>
        <div className="skeleton-mode-specs"></div>
      </div>
    </div>
    <div className="skeleton-resource-metrics">
      <div className="skeleton-resource-metric-card">
        <div className="skeleton-metric-header">
          <div className="skeleton-metric-label"></div>
          <div className="skeleton-metric-percentage"></div>
        </div>
        <div className="skeleton-metric-graph">
          <div className="skeleton-usage-chart cpu-skeleton"></div>
        </div>
      </div>
      <div className="skeleton-resource-metric-card">
        <div className="skeleton-metric-header">
          <div className="skeleton-metric-label"></div>
          <div className="skeleton-metric-percentage"></div>
        </div>
        <div className="skeleton-metric-graph">
          <div className="skeleton-usage-chart memory-skeleton"></div>
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonUsageResources;