import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';

const API_BASE_URL = 'https://git.aethercure.site';

/**
 * Custom React hook for monitoring resource usage (CPU and memory)
 * Provides real-time resource monitoring with automatic fetching intervals,
 * fallback data handling, and chart data preparation
 * 
 * @param {Object} currentDeployment - The current deployment object
 * @param {number} interval - Polling interval in milliseconds (default: 3000)
 * @returns {Object} Resource monitoring state and controls
 */
export const useResourceMonitor = (currentDeployment, interval = 3000) => {
  // Resource usage state
  const [cpuUsage, setCpuUsage] = useState(8);
  const [memoryUsage, setMemoryUsage] = useState(14);
  
  // Historical data for charts (20 data points)
  const [cpuHistory, setCpuHistory] = useState(
    Array(20).fill(0).map(() => Math.random() * 15 + 5)
  );
  const [memoryHistory, setMemoryHistory] = useState(
    Array(20).fill(0).map(() => Math.random() * 20 + 10)
  );
  
  // Loading and error states
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(true);
  const [resourceError, setResourceError] = useState(null);
  const [hasLoadedForReadyDeployment, setHasLoadedForReadyDeployment] = useState(false);
  
  // Monitoring controls
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Refs for cleanup
  const intervalRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  /**
   * Generates fallback/simulated resource data
   * @returns {Object} Simulated CPU and memory usage
   */
  const generateFallbackData = useCallback(() => {
    return {
      cpu: Math.max(5, Math.min(25, cpuUsage + (Math.random() - 0.5) * 4)),
      memory: Math.max(8, Math.min(30, memoryUsage + (Math.random() - 0.5) * 6)),
      cpuHistoryPoint: Math.random() * 15 + 5,
      memoryHistoryPoint: Math.random() * 20 + 10
    };
  }, [cpuUsage, memoryUsage]);

  /**
   * Validates resource data from API response
   * @param {Object} data - Resource data from API
   * @returns {boolean} Whether the data is valid
   */
  const validateResourceData = useCallback((data) => {
    return (
      data &&
      typeof data.cpu === 'number' &&
      typeof data.memory === 'number' &&
      data.cpu >= 0 &&
      data.memory >= 0 &&
      data.cpu <= 100 &&
      data.memory <= 100
    );
  }, []);

  /**
   * Updates resource usage state with new data
   * @param {Object} data - Resource usage data
   * @param {boolean} isRealData - Whether the data is from API or fallback
   */
  const updateResourceState = useCallback((data, isRealData = true) => {
    const { cpu, memory, cpuHistoryPoint, memoryHistoryPoint } = data;
    
    // Update current values
    setCpuUsage(cpu);
    setMemoryUsage(memory);
    
    // Update history with new values (keep last 19 points, add new one)
    setCpuHistory(prev => [...prev.slice(1), cpuHistoryPoint || cpu]);
    setMemoryHistory(prev => [...prev.slice(1), memoryHistoryPoint || memory]);
    
    // Update fallback status
    setIsUsingFallbackData(!isRealData);
    setResourceError(null);
  }, []);

  /**
   * Fetches resource usage data from the API
   */
  const fetchResourceUsage = useCallback(async () => {
    try {
      // Only show loading skeleton on initial load, not on periodic refreshes
      if (isInitialLoadRef.current) {
        setIsLoadingResources(true);
      }
      
      const deploymentId = currentDeployment?.id;
      const endpoint = deploymentId 
        ? `${API_BASE_URL}/api/resource-usage/${deploymentId}`
        : `${API_BASE_URL}/api/resource-usage`;
      
      const response = await authService.apiCall(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        
        if (validateResourceData(data)) {
          // Check if this is real data or fallback from server
          const isRealData = !data.error;
          
          updateResourceState({
            cpu: data.cpu,
            memory: data.memory
          }, isRealData);
        } else {
          throw new Error('Invalid resource data received from API');
        }
      } else {
        throw new Error(`API request failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching resource usage:', error);
      setResourceError(error.message);
      
      // Fallback to simulated data on error
      const fallbackData = generateFallbackData();
      updateResourceState(fallbackData, false);
    } finally {
      // Always turn off loading state after first fetch
      if (isInitialLoadRef.current) {
        setIsLoadingResources(false);
        isInitialLoadRef.current = false;
        // Mark that we've loaded data for this ready deployment
        if (currentDeployment && currentDeployment.status === 'ready') {
          setHasLoadedForReadyDeployment(true);
        }
      }
    }
  }, [currentDeployment, validateResourceData, updateResourceState, generateFallbackData]);

  /**
   * Starts resource monitoring with specified interval
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsMonitoring(true);
    // Only show skeleton if deployment is not ready or we haven't loaded data for ready deployment yet
    if (!currentDeployment || 
        currentDeployment.status !== 'ready' || 
        !hasLoadedForReadyDeployment) {
      isInitialLoadRef.current = true;
    }
    
    // Fetch immediately
    fetchResourceUsage();
    
    // Then fetch at specified intervals
    intervalRef.current = setInterval(fetchResourceUsage, interval);
  }, [fetchResourceUsage, interval, currentDeployment, hasLoadedForReadyDeployment]);

  /**
   * Stops resource monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  /**
   * Manually refreshes resource data
   */
  const refreshResourceData = useCallback(() => {
    fetchResourceUsage();
  }, [fetchResourceUsage]);

  /**
   * Resets resource monitoring state to defaults
   */
  const resetResourceState = useCallback(() => {
    setCpuUsage(8);
    setMemoryUsage(14);
    setCpuHistory(Array(20).fill(0).map(() => Math.random() * 15 + 5));
    setMemoryHistory(Array(20).fill(0).map(() => Math.random() * 20 + 10));
    setIsUsingFallbackData(true);
    setResourceError(null);
    setIsLoadingResources(false);
    setHasLoadedForReadyDeployment(false);
    isInitialLoadRef.current = true;
  }, []);

  /**
   * Formats resource data for chart visualization
   * @param {Array} history - Historical data array
   * @param {number} scale - Scale factor for visualization
   * @returns {string} SVG polygon points string
   */
  const formatChartData = useCallback((history, scale = 1.2) => {
    return history
      .map((value, index) => `${index * 7.5},${30 - (value * scale)}`)
      .join(' ');
  }, []);

  /**
   * Gets formatted chart data for CPU usage
   */
  const getCpuChartData = useCallback(() => {
    return {
      polygonPoints: `0,30 ${formatChartData(cpuHistory, 1.5)} 142.5,30`,
      linePoints: formatChartData(cpuHistory, 1.5)
    };
  }, [cpuHistory, formatChartData]);

  /**
   * Gets formatted chart data for memory usage
   */
  const getMemoryChartData = useCallback(() => {
    return {
      polygonPoints: `0,30 ${formatChartData(memoryHistory, 1.2)} 142.5,30`,
      linePoints: formatChartData(memoryHistory, 1.2)
    };
  }, [memoryHistory, formatChartData]);

  /**
   * Gets current resource statistics summary
   */
  const getResourceStats = useCallback(() => {
    const cpuAvg = cpuHistory.reduce((sum, val) => sum + val, 0) / cpuHistory.length;
    const memoryAvg = memoryHistory.reduce((sum, val) => sum + val, 0) / memoryHistory.length;
    
    return {
      current: {
        cpu: Math.floor(cpuUsage),
        memory: Math.floor(memoryUsage)
      },
      average: {
        cpu: Math.floor(cpuAvg),
        memory: Math.floor(memoryAvg)
      },
      peak: {
        cpu: Math.floor(Math.max(...cpuHistory)),
        memory: Math.floor(Math.max(...memoryHistory))
      }
    };
  }, [cpuUsage, memoryUsage, cpuHistory, memoryHistory]);

  // Automatic monitoring based on deployment changes
  useEffect(() => {
    if (currentDeployment) {
      startMonitoring();
    } else {
      stopMonitoring();
      resetResourceState();
    }

    // Cleanup on unmount or dependency change
    return () => {
      stopMonitoring();
    };
  }, [currentDeployment?.id, startMonitoring, stopMonitoring, resetResourceState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // Current resource usage data
    cpuUsage: Math.floor(cpuUsage),
    memoryUsage: Math.floor(memoryUsage),
    
    // Historical data for charts
    cpuHistory,
    memoryHistory,
    
    // Loading and error states
    isLoadingResources,
    isUsingFallbackData,
    resourceError,
    hasLoadedForReadyDeployment,
    
    // Monitoring state
    isMonitoring,
    
    // Chart data helpers
    getCpuChartData,
    getMemoryChartData,
    formatChartData,
    
    // Resource statistics
    getResourceStats,
    
    // Control functions
    startMonitoring,
    stopMonitoring,
    refreshResourceData,
    resetResourceState
  };
};

export default useResourceMonitor;