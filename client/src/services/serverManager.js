import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_GIT_API_BASE;

/**
 * Server Manager Service
 * Handles all server lifecycle operations, monitoring, and configuration
 * Extracted from IDE.jsx for better separation of concerns
 */
class ServerManager {
  constructor() {
    this.logStreamEventSource = null;
    this.statusCheckInterval = null;
    this.serverStatus = 'stopped';
    this.serverProcessInfo = '';
    this.serverLogs = '';
    this.isStartingServer = false;
    
    // Event listeners for status updates
    this.statusListeners = new Set();
    this.logListeners = new Set();
  }

  /**
   * Subscribe to server status changes
   * @param {Function} callback - Callback function to receive status updates
   */
  onStatusChange(callback) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Subscribe to server log updates
   * @param {Function} callback - Callback function to receive log updates
   */
  onLogUpdate(callback) {
    this.logListeners.add(callback);
    return () => this.logListeners.delete(callback);
  }

  /**
   * Notify all status listeners
   * @private
   */
  _notifyStatusListeners(status, processInfo = '') {
    this.serverStatus = status;
    this.serverProcessInfo = processInfo;
    this.statusListeners.forEach(callback => callback(status, processInfo));
  }

  /**
   * Notify all log listeners
   * @private
   */
  _notifyLogListeners(logs) {
    this.serverLogs = logs;
    this.logListeners.forEach(callback => callback(logs));
  }

  /**
   * Check server status for a deployment
   * @param {string} deploymentId - The deployment ID
   * @returns {Promise<Object>} Server status and process info
   */
  async checkServerStatus(deploymentId) {
    try {
      const response = await authService.apiCall(
        `${API_BASE_URL}/api/deployments/${deploymentId}/server/status`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to check server status: ${response.status}`);
      }
      
      const data = await response.json();
      const wasRunning = this.serverStatus === 'running';
      
      this._notifyStatusListeners(data.status, data.processInfo || '');
      
      // Log status changes for debugging
      if (!wasRunning && data.status === 'running') {
        console.log('🟢 Development server is now running');
      } else if (wasRunning && data.status === 'stopped') {
        console.log('🔴 Development server stopped');
      }
      
      return {
        status: data.status,
        processInfo: data.processInfo || '',
        wasRunning
      };
    } catch (error) {
      console.error('Error checking server status:', error);
      throw error;
    }
  }

  /**
   * Start the development server
   * @param {string} deploymentId - The deployment ID
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} Success status
   */
  async startServer(deploymentId, options = {}) {
    const { 
      checkReadyStatus = true,
      maxRetries = 20,
      retryInterval = 1000,
      onStatusUpdate = null
    } = options;

    try {
      // Check current status first
      await this.checkServerStatus(deploymentId);
      
      if (this.serverStatus === 'running') {
        console.log('⚠️ Server is already running');
        return true;
      }
      
      this.isStartingServer = true;
      if (onStatusUpdate) onStatusUpdate('Starting server...', 'info');

      const response = await authService.apiCall(
        `${API_BASE_URL}/api/deployments/${deploymentId}/server/start`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to start server: ${response.status}`);
      }

      if (onStatusUpdate) onStatusUpdate('Starting server...', 'info');
      
      // Wait for server to start with status checking
      if (checkReadyStatus) {
        const checkStatus = async () => {
          for (let i = 0; i < maxRetries; i++) {
            await new Promise(resolve => setTimeout(resolve, retryInterval));
            await this.checkServerStatus(deploymentId);
            await this.loadServerLogs(deploymentId);
            
            if (this.serverStatus === 'running') {
              if (onStatusUpdate) onStatusUpdate('Server started', 'success');
              this.isStartingServer = false;
              return true;
            }
          }
          
          if (onStatusUpdate) onStatusUpdate('Start may have failed', 'warning');
          this.isStartingServer = false;
          return false;
        };
        
        return await checkStatus();
      }
      
      this.isStartingServer = false;
      return true;
    } catch (error) {
      console.error('Error starting server:', error);
      this.isStartingServer = false;
      if (onStatusUpdate) onStatusUpdate('Start failed', 'error');
      throw error;
    }
  }

  /**
   * Stop the development server
   * @param {string} deploymentId - The deployment ID
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} Success status
   */
  async stopServer(deploymentId, options = {}) {
    const { onStatusUpdate = null } = options;

    try {
      const response = await authService.apiCall(
        `${API_BASE_URL}/api/deployments/${deploymentId}/server/stop`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to stop server: ${response.status}`);
      }
      
      if (onStatusUpdate) onStatusUpdate('Server stopped', 'success');
      await this.checkServerStatus(deploymentId);
      this._notifyLogListeners('Server stopped');
      
      return true;
    } catch (error) {
      console.error('Error stopping server:', error);
      if (onStatusUpdate) onStatusUpdate('Stop failed', 'error');
      throw error;
    }
  }

  /**
   * Restart the development server
   * @param {string} deploymentId - The deployment ID
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} Success status
   */
  async restartServer(deploymentId, options = {}) {
    const { restartDelay = 2000, onStatusUpdate = null } = options;

    try {
      if (onStatusUpdate) onStatusUpdate('Restarting server...', 'info');
      
      await this.stopServer(deploymentId, { onStatusUpdate });
      
      // Wait before starting
      await new Promise(resolve => setTimeout(resolve, restartDelay));
      
      return await this.startServer(deploymentId, { ...options, onStatusUpdate });
    } catch (error) {
      console.error('Error restarting server:', error);
      if (onStatusUpdate) onStatusUpdate('Restart failed', 'error');
      throw error;
    }
  }

  /**
   * Quick start development server with enhanced checks
   * @param {string} deploymentId - The deployment ID
   * @param {Object} deployment - Deployment object for status checking
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} Success status
   */
  async quickStartDevServer(deploymentId, deployment, options = {}) {
    const { 
      onStatusUpdate = null,
      terminalRef = null,
      socketRef = null,
      connectTerminalWithRetry = null
    } = options;

    try {
      if (!deployment || deployment.status !== 'ready') {
        if (onStatusUpdate) onStatusUpdate('Deployment not ready', 'warning');
        return false;
      }

      // Check current status first
      await this.checkServerStatus(deploymentId);

      if (this.serverStatus === 'running') {
        console.log('⚠️ Development server is already running! Check the preview panel.');
        
        // Notify terminal if available
        if (terminalRef?.current) {
          terminalRef.current.writeln('\x1b[33m⚠️  Dev server is already running!\x1b[0m');
          terminalRef.current.writeln('\x1b[36m💡 Check the preview panel to see your app\x1b[0m');
        }
        
        return true;
      }

      // Handle terminal connection if needed
      if (terminalRef && socketRef && connectTerminalWithRetry) {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          connectTerminalWithRetry();
          
          // Wait a bit and try to send command
          setTimeout(() => {
            if (terminalRef.current && socketRef.current?.readyState === WebSocket.OPEN) {
              const command = 'npm run dev\r';
              socketRef.current.send(JSON.stringify({
                type: 'input',
                data: command
              }));
              
              if (onStatusUpdate) {
                onStatusUpdate('Development server starting via terminal...', 'info');
              }
            }
          }, 1000);
        }
      }

      // Use regular start server method
      return await this.startServer(deploymentId, {
        ...options,
        onStatusUpdate
      });
    } catch (error) {
      console.error('Error in quick start dev server:', error);
      if (onStatusUpdate) onStatusUpdate('Quick start failed', 'error');
      throw error;
    }
  }

  /**
   * Load server logs for a deployment
   * @param {string} deploymentId - The deployment ID
   * @returns {Promise<string>} Server logs
   */
  async loadServerLogs(deploymentId) {
    try {
      const response = await authService.apiCall(
        `${API_BASE_URL}/api/deployments/${deploymentId}/server/logs`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to load server logs: ${response.status}`);
      }
      
      const data = await response.json();
      const logs = data.logs || 'No logs available';
      
      this._notifyLogListeners(logs);
      return logs;
    } catch (error) {
      console.error('Error loading server logs:', error);
      const errorLogs = 'Error loading logs';
      this._notifyLogListeners(errorLogs);
      throw error;
    }
  }

  /**
   * Start streaming server logs
   * @param {string} deploymentId - The deployment ID
   * @param {Object} options - Configuration options
   * @returns {EventSource} The event source for log streaming
   */
  startLogStreaming(deploymentId, options = {}) {
    const { onLogUpdate = null, onError = null } = options;

    // Close existing stream
    if (this.logStreamEventSource) {
      this.logStreamEventSource.close();
    }

    const token = authService.getToken();
    const streamUrl = `${API_BASE_URL}/api/deployments/${deploymentId}/server/logs/stream${
      token ? `?token=${encodeURIComponent(token)}` : ''
    }`;
    
    const eventSource = new EventSource(streamUrl);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'logs' && data.data) {
          this.serverLogs += data.data;
          this._notifyLogListeners(this.serverLogs);
          
          if (onLogUpdate) {
            onLogUpdate(data.data, this.serverLogs);
          }
        }
      } catch (error) {
        console.error('Error parsing log stream:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Log stream error:', error);
      eventSource.close();
      this.logStreamEventSource = null;
      
      if (onError) {
        onError(error);
      }
    };

    this.logStreamEventSource = eventSource;
    return eventSource;
  }

  /**
   * Stop log streaming
   */
  stopLogStreaming() {
    if (this.logStreamEventSource) {
      this.logStreamEventSource.close();
      this.logStreamEventSource = null;
    }
  }

  /**
   * Start periodic server status monitoring
   * @param {string} deploymentId - The deployment ID
   * @param {number} interval - Check interval in milliseconds (default: 30000)
   */
  startStatusMonitoring(deploymentId, interval = 30000) {
    this.stopStatusMonitoring();
    
    this.statusCheckInterval = setInterval(async () => {
      try {
        await this.checkServerStatus(deploymentId);
      } catch (error) {
        console.error('Error in status monitoring:', error);
      }
    }, interval);
  }

  /**
   * Stop periodic server status monitoring
   */
  stopStatusMonitoring() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  /**
   * Get current server configuration and health status
   * @param {string} deploymentId - The deployment ID
   * @returns {Promise<Object>} Server configuration and health info
   */
  async getServerHealth(deploymentId) {
    try {
      const [statusResult] = await Promise.all([
        this.checkServerStatus(deploymentId),
        this.loadServerLogs(deploymentId)
      ]);

      return {
        status: statusResult.status,
        processInfo: statusResult.processInfo,
        isHealthy: statusResult.status === 'running',
        uptime: this._calculateUptime(),
        lastCheck: new Date().toISOString(),
        logs: this.serverLogs
      };
    } catch (error) {
      console.error('Error getting server health:', error);
      return {
        status: 'unknown',
        processInfo: '',
        isHealthy: false,
        uptime: 0,
        lastCheck: new Date().toISOString(),
        logs: 'Error loading health information',
        error: error.message
      };
    }
  }

  /**
   * Calculate server uptime (simplified)
   * @private
   * @returns {number} Uptime in seconds
   */
  _calculateUptime() {
    // This is a simplified implementation
    // In a real scenario, you'd track when the server started
    return this.serverStatus === 'running' ? Date.now() : 0;
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this.stopLogStreaming();
    this.stopStatusMonitoring();
    this.statusListeners.clear();
    this.logListeners.clear();
  }

  /**
   * Get current server state snapshot
   * @returns {Object} Current server state
   */
  getState() {
    return {
      status: this.serverStatus,
      processInfo: this.serverProcessInfo,
      logs: this.serverLogs,
      isStarting: this.isStartingServer,
      hasLogStream: !!this.logStreamEventSource,
      hasStatusMonitoring: !!this.statusCheckInterval
    };
  }
}

// Create and export a singleton instance
const serverManager = new ServerManager();

export default serverManager;

// Also export the class for testing or multiple instances if needed
export { ServerManager };