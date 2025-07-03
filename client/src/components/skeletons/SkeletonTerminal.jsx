import React from 'react';

/**
 * Skeleton loader for the terminal component
 * Displays a realistic terminal loading appearance with shimmer effects
 */
const SkeletonTerminal = () => (
  <div className="skeleton-terminal">
    <div className="skeleton-terminal-header">
      <div className="skeleton-terminal-title">
        <div className="skeleton-terminal-icon"></div>
        <div className="skeleton-terminal-text"></div>
        <div className="skeleton-connection-status"></div>
      </div>
      <div className="skeleton-terminal-controls">
        <div className="skeleton-terminal-btn"></div>
        <div className="skeleton-terminal-btn"></div>
        <div className="skeleton-terminal-btn"></div>
      </div>
    </div>
    <div className="skeleton-terminal-content">
      <div className="skeleton-terminal-lines">
        {/* Initial system messages */}
        <div className="skeleton-terminal-line welcome">
          <div className="skeleton-terminal-prompt"></div>
          <div className="skeleton-terminal-command" style={{ width: '45%' }}></div>
        </div>
        <div className="skeleton-terminal-line">
          <div className="skeleton-terminal-output" style={{ width: '65%' }}></div>
        </div>
        <div className="skeleton-terminal-line">
          <div className="skeleton-terminal-output" style={{ width: '40%' }}></div>
        </div>
        
        {/* Empty lines for spacing */}
        <div className="skeleton-terminal-line empty"></div>
        
        {/* More system output */}
        <div className="skeleton-terminal-line">
          <div className="skeleton-terminal-output" style={{ width: '55%' }}></div>
        </div>
        <div className="skeleton-terminal-line">
          <div className="skeleton-terminal-output" style={{ width: '75%' }}></div>
        </div>
        <div className="skeleton-terminal-line">
          <div className="skeleton-terminal-output" style={{ width: '30%' }}></div>
        </div>
        
        {/* Current prompt line with blinking cursor */}
        <div className="skeleton-terminal-line current">
          <div className="skeleton-terminal-prompt active"></div>
          <div className="skeleton-terminal-cursor"></div>
        </div>
      </div>
    </div>
  </div>
);

export default SkeletonTerminal;