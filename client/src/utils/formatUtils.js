/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted byte string
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format timestamp to human readable string
 * @param {number} timestamp - Timestamp in milliseconds
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export const formatTime = (timestamp, options = {}) => {
  const {
    includeTime = true,
    includeDate = true,
    relative = false,
    format = 'short'
  } = options;
  
  const date = new Date(timestamp);
  const now = new Date();
  
  if (relative) {
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    // Fall back to formatted date for older items
  }
  
  let formatted = '';
  
  if (includeDate) {
    if (format === 'short') {
      formatted += date.toLocaleDateString();
    } else {
      formatted += date.toDateString();
    }
  }
  
  if (includeTime) {
    if (formatted) formatted += ' ';
    if (format === 'short') {
      formatted += date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      formatted += date.toLocaleTimeString();
    }
  }
  
  return formatted;
};

/**
 * Format duration in milliseconds to human readable string
 * @param {number} duration - Duration in milliseconds
 * @param {Object} options - Formatting options
 * @returns {string} Formatted duration string
 */
export const formatDuration = (duration, options = {}) => {
  const { precision = 'auto', showMs = false } = options;
  
  const ms = duration % 1000;
  const seconds = Math.floor(duration / 1000) % 60;
  const minutes = Math.floor(duration / (1000 * 60)) % 60;
  const hours = Math.floor(duration / (1000 * 60 * 60));
  
  let parts = [];
  
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  if (showMs && ms > 0) parts.push(`${ms}ms`);
  
  if (precision === 'auto') {
    return parts.slice(0, 2).join(' ');
  }
  
  return parts.slice(0, precision).join(' ');
};

/**
 * Format percentage with appropriate precision
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (isNaN(value)) return '0%';
  return `${Math.min(100, Math.max(0, value)).toFixed(decimals)}%`;
};

/**
 * Format number with appropriate units (K, M, B)
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, decimals = 1) => {
  if (num < 1000) return num.toString();
  
  const units = ['', 'K', 'M', 'B', 'T'];
  const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
  const unit = units[Math.min(unitIndex, units.length - 1)];
  const value = num / Math.pow(1000, unitIndex);
  
  return `${value.toFixed(decimals)}${unit}`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Format file path for display
 * @param {string} path - File path
 * @param {number} maxLength - Maximum display length
 * @returns {string} Formatted path
 */
export const formatPath = (path, maxLength = 50) => {
  if (!path || path.length <= maxLength) return path;
  
  const parts = path.split('/');
  if (parts.length <= 2) return truncateText(path, maxLength);
  
  // Try to keep filename and one parent directory
  const filename = parts[parts.length - 1];
  const parent = parts[parts.length - 2];
  const abbreviated = `.../${parent}/${filename}`;
  
  if (abbreviated.length <= maxLength) return abbreviated;
  return truncateText(path, maxLength);
};

/**
 * Format command or terminal output
 * @param {string} text - Text to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted text
 */
export const formatTerminalOutput = (text, options = {}) => {
  const { 
    maxLines = 1000, 
    removeAnsiCodes = true, 
    preserveWhitespace = true 
  } = options;
  
  let formatted = text;
  
  // Remove ANSI escape codes if requested
  if (removeAnsiCodes) {
    // eslint-disable-next-line no-control-regex
    formatted = formatted.replace(/\x1b\[[0-9;]*m/g, '');
  }
  
  // Limit number of lines
  if (maxLines > 0) {
    const lines = formatted.split('\n');
    if (lines.length > maxLines) {
      formatted = lines.slice(-maxLines).join('\n');
    }
  }
  
  // Preserve whitespace if requested
  if (!preserveWhitespace) {
    formatted = formatted.trim();
  }
  
  return formatted;
};

/**
 * Format code for display with syntax highlighting hints
 * @param {string} code - Code to format
 * @param {string} language - Programming language
 * @returns {Object} Formatted code information
 */
export const formatCode = (code, language = 'javascript') => {
  return {
    code: code.trim(),
    language: language.toLowerCase(),
    lineCount: code.split('\n').length,
    characterCount: code.length,
    wordCount: code.split(/\s+/).filter(word => word.length > 0).length
  };
};