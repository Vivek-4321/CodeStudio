/**
 * Generate a unique session ID
 * @returns {string} Unique session identifier
 */
export const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Activity tracking utilities
 */
export class ActivityTracker {
  constructor() {
    this.lastActivity = Date.now();
    this.activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    this.activityCallbacks = new Set();
    this.intervalId = null;
  }

  /**
   * Update last activity timestamp
   */
  updateActivity = () => {
    this.lastActivity = Date.now();
    this.activityCallbacks.forEach(callback => callback(this.lastActivity));
  };

  /**
   * Start tracking user activity
   * @param {Function} onActivity - Callback function for activity updates
   * @param {number} checkInterval - Interval in milliseconds to check for inactivity
   */
  startTracking(onActivity, checkInterval = 60000) {
    this.activityCallbacks.add(onActivity);
    
    // Add event listeners
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.updateActivity);
    });

    // Set up periodic inactivity check
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - this.lastActivity;
      
      // Notify callbacks about inactivity
      this.activityCallbacks.forEach(callback => {
        if (callback.onInactivity) {
          callback.onInactivity(inactiveTime);
        }
      });
    }, checkInterval);
  }

  /**
   * Stop tracking user activity
   * @param {Function} onActivity - Callback function to remove
   */
  stopTracking(onActivity) {
    this.activityCallbacks.delete(onActivity);
    
    if (this.activityCallbacks.size === 0) {
      // Remove event listeners
      this.activityEvents.forEach(event => {
        document.removeEventListener(event, this.updateActivity);
      });

      // Clear interval
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  /**
   * Get time since last activity
   * @returns {number} Time in milliseconds since last activity
   */
  getInactiveTime() {
    return Date.now() - this.lastActivity;
  }

  /**
   * Check if user is inactive for specified duration
   * @param {number} threshold - Threshold in milliseconds
   * @returns {boolean} Whether user is inactive
   */
  isInactive(threshold) {
    return this.getInactiveTime() > threshold;
  }
}

/**
 * Session management utilities
 */
export const SessionManager = {
  /**
   * Save session data to localStorage
   * @param {string} sessionId - Session identifier
   * @param {Object} data - Session data to save
   */
  saveSession(sessionId, data) {
    try {
      const sessionData = {
        ...data,
        timestamp: Date.now(),
        sessionId
      };
      localStorage.setItem(`ide_session_${sessionId}`, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  },

  /**
   * Load session data from localStorage
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Session data or null if not found
   */
  loadSession(sessionId) {
    try {
      const sessionData = localStorage.getItem(`ide_session_${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.warn('Failed to load session data:', error);
      return null;
    }
  },

  /**
   * Clear session data
   * @param {string} sessionId - Session identifier
   */
  clearSession(sessionId) {
    try {
      localStorage.removeItem(`ide_session_${sessionId}`);
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  },

  /**
   * Get all session IDs
   * @returns {Array} Array of session IDs
   */
  getAllSessions() {
    try {
      const keys = Object.keys(localStorage);
      return keys
        .filter(key => key.startsWith('ide_session_'))
        .map(key => key.replace('ide_session_', ''));
    } catch (error) {
      console.warn('Failed to get session list:', error);
      return [];
    }
  },

  /**
   * Clean up old sessions (older than specified age)
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) { // Default: 24 hours
    const now = Date.now();
    const sessions = this.getAllSessions();
    
    sessions.forEach(sessionId => {
      const sessionData = this.loadSession(sessionId);
      if (sessionData && (now - sessionData.timestamp) > maxAge) {
        this.clearSession(sessionId);
      }
    });
  }
};

/**
 * Connection management utilities
 */
export const ConnectionManager = {
  /**
   * Create connection retry handler
   * @param {Function} connectFn - Function to call for connection
   * @param {Object} options - Retry options
   * @returns {Object} Connection manager instance
   */
  createRetryHandler(connectFn, options = {}) {
    const {
      maxAttempts = 5,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      onAttempt = () => {},
      onSuccess = () => {},
      onFailure = () => {}
    } = options;

    let attempts = 0;
    let isConnecting = false;
    let timeoutId = null;

    const connect = () => {
      if (isConnecting || attempts >= maxAttempts) {
        return Promise.reject(new Error('Max connection attempts reached'));
      }

      attempts++;
      isConnecting = true;
      onAttempt(attempts);

      return connectFn()
        .then(result => {
          attempts = 0;
          isConnecting = false;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          onSuccess(result);
          return result;
        })
        .catch(error => {
          isConnecting = false;
          
          if (attempts < maxAttempts) {
            const delay = Math.min(
              initialDelay * Math.pow(backoffFactor, attempts - 1),
              maxDelay
            );
            
            timeoutId = setTimeout(connect, delay);
          } else {
            onFailure(error);
          }
          
          throw error;
        });
    };

    return {
      connect,
      reset: () => {
        attempts = 0;
        isConnecting = false;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },
      getAttempts: () => attempts,
      isConnecting: () => isConnecting
    };
  }
};