/**
 * Toggle section collapse state
 * @param {Object} collapsedSections - Current collapsed sections state
 * @param {string} section - Section identifier to toggle
 * @param {Function} setCollapsedSections - State setter function
 */
export const toggleSection = (collapsedSections, section, setCollapsedSections) => {
  setCollapsedSections({
    ...collapsedSections,
    [section]: !collapsedSections[section]
  });
};

/**
 * Toggle folder expansion state
 * @param {Set} expandedFolders - Set of expanded folder paths
 * @param {string} folderPath - Folder path to toggle
 * @param {Function} setExpandedFolders - State setter function
 */
export const toggleFolder = (expandedFolders, folderPath, setExpandedFolders) => {
  const newExpanded = new Set(expandedFolders);
  if (newExpanded.has(folderPath)) {
    newExpanded.delete(folderPath);
  } else {
    newExpanded.add(folderPath);
  }
  setExpandedFolders(newExpanded);
};

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Object} shortcuts - Shortcut configuration object
 */
export const handleKeyboardShortcuts = (event, shortcuts) => {
  const { ctrlKey, metaKey, key } = event;
  
  // Save shortcut (Ctrl/Cmd + S)
  if ((ctrlKey || metaKey) && key === 's') {
    event.preventDefault();
    if (shortcuts.save) {
      shortcuts.save();
    }
  }
  
  // Add more shortcuts as needed
  if ((ctrlKey || metaKey) && key === 'n') {
    event.preventDefault();
    if (shortcuts.newFile) {
      shortcuts.newFile();
    }
  }
  
  if ((ctrlKey || metaKey) && key === 'o') {
    event.preventDefault();
    if (shortcuts.openFile) {
      shortcuts.openFile();
    }
  }
};

/**
 * Handle outside click to close elements
 * @param {MouseEvent} event - Mouse event
 * @param {string} selector - CSS selector for elements to ignore
 * @param {Function} closeCallback - Function to call when clicking outside
 */
export const handleOutsideClick = (event, selector, closeCallback) => {
  if (!event.target.closest(selector)) {
    closeCallback();
  }
};

/**
 * Handle browser before unload event
 * @param {BeforeUnloadEvent} event - Before unload event
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @param {Array} openTabs - Array of open tabs
 * @param {string} message - Custom message to display
 */
export const handleBeforeUnload = (event, hasUnsavedChanges, openTabs = [], message = '') => {
  if (hasUnsavedChanges || openTabs.length > 0) {
    event.preventDefault();
    event.returnValue = message || 'You have unsaved changes. Are you sure you want to leave?';
    return event.returnValue;
  }
};

/**
 * Get responsive layout configuration
 * @param {number} windowWidth - Current window width
 * @param {number} windowHeight - Current window height
 * @returns {Object} Layout configuration object
 */
export const getResponsiveLayout = (windowWidth, windowHeight) => {
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    showSidebar: isDesktop,
    sidebarWidth: isMobile ? '100%' : isTablet ? '300px' : '350px',
    editorMinWidth: '300px',
    terminalHeight: isMobile ? '200px' : '250px'
  };
};

/**
 * Create context menu configuration
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} file - File object for context menu
 * @param {Array} actions - Available actions
 * @returns {Object} Context menu configuration
 */
export const createContextMenu = (x, y, file, actions = []) => {
  return {
    show: true,
    x,
    y,
    file,
    actions
  };
};

/**
 * Close context menu
 * @returns {Object} Closed context menu state
 */
export const closeContextMenu = () => {
  return {
    show: false,
    x: 0,
    y: 0,
    file: null,
    actions: []
  };
};