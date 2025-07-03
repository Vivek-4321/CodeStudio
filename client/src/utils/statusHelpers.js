import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

/**
 * Get status icon based on server status
 * @param {string} serverStatus - Current server status ('running', 'starting', 'stopped')
 * @returns {JSX.Element} Status icon component
 */
export const getStatusIcon = (serverStatus) => {
  switch (serverStatus) {
    case 'running': 
      return <CheckCircle size={14} className="status-icon running" />;
    case 'starting': 
      return <Loader size={14} className="status-icon starting animate-spin" />;
    case 'stopped': 
      return <XCircle size={14} className="status-icon stopped" />;
    default: 
      return <AlertCircle size={14} className="status-icon unknown" />;
  }
};

/**
 * Get terminal status icon based on connection status
 * @param {string} terminalStatus - Terminal connection status
 * @param {boolean} isReconnecting - Whether terminal is reconnecting
 * @returns {JSX.Element} Terminal status icon component
 */
export const getTerminalStatusIcon = (terminalStatus, isReconnecting = false) => {
  if (isReconnecting) return <Loader size={12} className="animate-spin" />;
  
  switch (terminalStatus) {
    case 'connected': 
      return <Wifi size={12} className="text-green-400" />;
    case 'connecting': 
      return <Loader size={12} className="animate-spin text-yellow-400" />;
    default: 
      return <WifiOff size={12} className="text-red-400" />;
  }
};

/**
 * Get current framework information
 * @param {Object} currentDeployment - Current deployment object
 * @param {Object} selectedFramework - Selected framework fallback
 * @param {Array} frameworks - Available frameworks array
 * @returns {Object|null} Framework object or null
 */
export const getCurrentFramework = (currentDeployment, selectedFramework, frameworks) => {
  if (!currentDeployment) return selectedFramework || null;
  return frameworks.find(f => f.id === currentDeployment.framework) || frameworks[0];
};

/**
 * Check if current file is modified
 * @param {Array} openTabs - Array of open tabs
 * @param {string} activeTab - Current active tab identifier
 * @returns {boolean} Whether current file is modified
 */
export const isCurrentFileModified = (openTabs, activeTab) => {
  const currentTab = openTabs.find(tab => tab.path === activeTab);
  return currentTab?.modified || false;
};

/**
 * Get status message with appropriate styling
 * @param {string} message - Status message text
 * @param {string} type - Message type ('info', 'error', 'warning', 'success')
 * @returns {Object} Status message object
 */
export const createStatusMessage = (message, type = 'info') => {
  return {
    text: message,
    type,
    timestamp: Date.now()
  };
};