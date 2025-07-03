import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

// Terminal history manager class
class TerminalHistoryManager {
  constructor() {
    this.history = '';
    this.maxSize = 100000; // Max characters to keep
  }

  append(data) {
    this.history += data;
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize * 0.8);
    }
  }

  getHistory() {
    return this.history;
  }

  clear() {
    this.history = '';
  }

  preserveImportantLines() {
    // Keep important lines like server startup messages
    const lines = this.history.split('\n');
    const importantLines = lines.filter(line => 
      line.includes('Local:') || 
      line.includes('Network:') || 
      line.includes('ready in') ||
      line.includes('dev server running') ||
      line.includes('started server') ||
      line.includes('Framework:') ||
      line.includes('Connected to')
    );
    return importantLines.join('\n');
  }
}

export const useTerminal = ({ 
  currentDeployment, 
  serverStatus, 
  updateActivity,
  addNotification // Optional notification callback
}) => {
  // Terminal connection state
  const [terminalStatus, setTerminalStatus] = useState('disconnected');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isLoadingTerminal, setIsLoadingTerminal] = useState(false);

  // Refs for terminal management
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const socketRef = useRef(null);
  const terminalHistoryRef = useRef(new TerminalHistoryManager());
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const autoConnectTimeoutRef = useRef(null);
  const connectionThrottleRef = useRef(null);
  const lastConnectionAttemptRef = useRef(0);

  // Initialize terminal with persistence
  useEffect(() => {
    if (terminalRef.current && !terminalInstanceRef.current) {
      const terminal = new Terminal({
        theme: {
          background: '#000000',
          foreground: '#d4d4d4',
          cursor: '#ffffff',
          selection: '#264f78',
          black: '#000000',
          red: '#f44747',
          green: '#4fc1ff',
          yellow: '#ffcc02',
          blue: '#0078d4',
          magenta: '#bc3fbc',
          cyan: '#0bc3ac',
          white: '#cccccc',
        },
        fontSize: 13,
        fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "SF Mono", Monaco, Consolas, monospace',
        fontWeight: 400,
        cursorBlink: true,
        convertEol: true,
        scrollback: 1000,
        cols: 80,
        rows: 15
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      
      terminal.open(terminalRef.current);
      
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          console.log('Terminal fit failed:', e);
        }
      }, 100);

      // Terminal ready - show prompt
      terminal.write('\x1b[32m$\x1b[0m ');

      terminalInstanceRef.current = terminal;
      fitAddonRef.current = fitAddon;

      terminal.onData(data => {
        if (updateActivity) updateActivity();
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && terminalStatus === 'connected') {
          socketRef.current.send(JSON.stringify({
            type: 'input',
            data: data
          }));
        }
      });

      terminal.onResize(size => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && terminalStatus === 'connected') {
          socketRef.current.send(JSON.stringify({
            type: 'resize',
            cols: size.cols,
            rows: size.rows
          }));
        }
      });
    }

    return () => {
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
        terminalInstanceRef.current = null;
      }
    };
  }, [terminalStatus, updateActivity]);

  // Terminal connection with retry logic
  const connectTerminalWithRetry = useCallback(() => {
    if (!currentDeployment || currentDeployment.status !== 'ready') {
      console.log('Cannot connect terminal: deployment not ready');
      return;
    }

    const now = Date.now();
    
    if (connectionThrottleRef.current && (now - lastConnectionAttemptRef.current) < 2000) {
      console.log('Connection throttled - waiting for cooldown');
      return;
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
      console.log('Connection already in progress');
      return;
    }
    
    if (isReconnecting) {
      console.log('Connection already in progress');
      return;
    }

    lastConnectionAttemptRef.current = now;
    connectionThrottleRef.current = true;

    setIsLoadingTerminal(true); // Start showing skeleton
    setIsReconnecting(true);
    setTerminalStatus('connecting');

    const socket = new WebSocket(`wss://git.aethercure.site/terminal/${currentDeployment.id}`);
    socketRef.current = socket;

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    socket.onopen = () => {
      setTerminalStatus('connected');
      setIsReconnecting(false);
      setIsLoadingTerminal(false); // Hide skeleton
      setConnectionAttempts(0);
      connectionThrottleRef.current = false;
      
      if (terminalInstanceRef.current) {
        // Restore important history if this is a reconnection
        const preservedHistory = terminalHistoryRef.current.preserveImportantLines();
        if (preservedHistory && connectionAttempts > 0) {
          terminalInstanceRef.current.writeln('\x1b[90m' + preservedHistory + '\x1b[0m');
        }
        
        const size = { 
          cols: terminalInstanceRef.current.cols, 
          rows: terminalInstanceRef.current.rows 
        };
        socket.send(JSON.stringify({
          type: 'resize',
          cols: size.cols,
          rows: size.rows
        }));
      }

      // Setup heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, 30000); // Send heartbeat every 30 seconds

      if (addNotification) {
        addNotification('Terminal connected', 'success', 3000);
      }
    };

    socket.onmessage = (event) => {
      if (!terminalInstanceRef.current) return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'output' && data.data) {
          terminalInstanceRef.current.write(data.data);
          terminalHistoryRef.current.append(data.data);
        } else if (data.type === 'error' && data.data) {
          const errorMsg = '\x1b[1;31m' + data.data + '\x1b[0m';
          terminalInstanceRef.current.write(errorMsg);
          terminalHistoryRef.current.append(errorMsg);
        }
      } catch (e) {
        if (event.data) {
          terminalInstanceRef.current.write(event.data);
          terminalHistoryRef.current.append(event.data);
        }
      }
    };

    socket.onclose = (event) => {
      setTerminalStatus('disconnected');
      setIsReconnecting(false);
      setIsLoadingTerminal(false); // Hide skeleton on close
      connectionThrottleRef.current = false;
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      // Connection lost - keep terminal clean

      // Don't auto-reconnect if it was a clean close or if we're not active
      if (event.code !== 1000 && event.code !== 1001 && currentDeployment) {
        setConnectionAttempts(prev => {
          const attempts = prev + 1;
          
          if (attempts < 5) {
            const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff, max 30s
            if (addNotification) {
              addNotification(`Reconnecting in ${delay/1000}s... (attempt ${attempts}/5)`, 'warning', delay);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (currentDeployment && !connectionThrottleRef.current) {
                connectTerminalWithRetry();
              }
            }, delay);
          } else {
            if (addNotification) {
              addNotification('Terminal connection failed. Click connect to retry.', 'error', 0);
            }
          }
          
          return attempts;
        });
      }
    };

    socket.onerror = (error) => {
      console.error('Terminal WebSocket error:', error);
      setTerminalStatus('disconnected');
      setIsReconnecting(false);
      setIsLoadingTerminal(false); // Hide skeleton on error
      connectionThrottleRef.current = false;
    };
  }, [currentDeployment, connectionAttempts, addNotification]);

  // Auto-connect terminal when deployment is ready with loading state
  useEffect(() => {
    // Clear any existing auto-connect timeout
    if (autoConnectTimeoutRef.current) {
      clearTimeout(autoConnectTimeoutRef.current);
      autoConnectTimeoutRef.current = null;
    }
    
    if (currentDeployment && 
        currentDeployment.status === 'ready' && 
        terminalStatus === 'disconnected' && 
        !isReconnecting &&
        !connectionThrottleRef.current) {
      
      // Show skeleton while auto-connecting
      setIsLoadingTerminal(true);
      
      // Auto-connect after a short delay
      autoConnectTimeoutRef.current = setTimeout(() => {
        if (!connectionThrottleRef.current && terminalStatus === 'disconnected') {
          connectTerminalWithRetry();
        }
      }, 2000); // Increased delay to 2 seconds
    }
    
    return () => {
      if (autoConnectTimeoutRef.current) {
        clearTimeout(autoConnectTimeoutRef.current);
        autoConnectTimeoutRef.current = null;
      }
    };
  }, [currentDeployment?.status, terminalStatus, isReconnecting, connectTerminalWithRetry]);

  // Disconnect terminal function
  const disconnectTerminal = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000); // Clean close
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (autoConnectTimeoutRef.current) {
      clearTimeout(autoConnectTimeoutRef.current);
      autoConnectTimeoutRef.current = null;
    }
    
    // Reset all connection state
    setConnectionAttempts(0);
    setIsReconnecting(false);
    setIsLoadingTerminal(false);
    setTerminalStatus('disconnected');
    connectionThrottleRef.current = false;
    lastConnectionAttemptRef.current = 0;
  }, []);

  // Reset terminal connection completely
  const resetTerminalConnection = useCallback(() => {
    disconnectTerminal();
    // Wait a moment before allowing reconnection
    setTimeout(() => {
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.writeln('\x1b[33m🔄 Connection reset\x1b[0m');
      }
    }, 500);
  }, [disconnectTerminal]);

  // Clear terminal function
  const clearTerminal = useCallback(() => {
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.clear();
      terminalHistoryRef.current.clear();
      
      if (terminalStatus === 'connected') {
        terminalInstanceRef.current.write('\x1b[32m$\x1b[0m ');
      } else {
        terminalInstanceRef.current.write('\x1b[32m$\x1b[0m ');
      }
    }
  }, [terminalStatus, serverStatus]);

  // Fit terminal to container size
  const fitTerminal = useCallback(() => {
    if (fitAddonRef.current) {
      try {
        fitAddonRef.current.fit();
      } catch (e) {
        console.log('Terminal fit failed:', e);
      }
    }
  }, []);

  // Get terminal status icon helper
  const getTerminalStatusIcon = useCallback(() => {
    if (isReconnecting) return 'loading';
    switch (terminalStatus) {
      case 'connected': return 'connected';
      case 'connecting': return 'connecting';
      case 'disconnected': return 'disconnected';
      default: return 'disconnected';
    }
  }, [terminalStatus, isReconnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all timeouts and intervals
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (autoConnectTimeoutRef.current) {
        clearTimeout(autoConnectTimeoutRef.current);
      }
      
      // Close WebSocket connection
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Dispose terminal instance
      if (terminalInstanceRef.current) {
        terminalInstanceRef.current.dispose();
      }
    };
  }, []);

  return {
    // State
    terminalStatus,
    isReconnecting,
    connectionAttempts,
    isLoadingTerminal,
    
    // Refs (for terminal container)
    terminalRef,
    terminalInstanceRef,
    
    // Functions
    connectTerminalWithRetry,
    disconnectTerminal,
    resetTerminalConnection,
    clearTerminal,
    fitTerminal,
    getTerminalStatusIcon,
    
    // History manager access
    getTerminalHistory: () => terminalHistoryRef.current.getHistory(),
    clearTerminalHistory: () => terminalHistoryRef.current.clear(),
  };
};

export default useTerminal;