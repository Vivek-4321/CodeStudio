/**
 * File Type Definitions and Classifications
 * Extracted from IDE.jsx and fileUtils.js to provide centralized file handling utilities
 */

// File extensions mapped to their primary languages/types
export const FILE_EXTENSIONS = {
  // JavaScript & TypeScript
  js: 'javascript',
  jsx: 'javascriptreact',
  ts: 'typescript',
  tsx: 'typescriptreact',
  mjs: 'javascript',
  cjs: 'javascript',
  
  // Web Technologies
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  
  // Frameworks
  vue: 'vue',
  svelte: 'svelte',
  
  // Data Formats
  json: 'json',
  jsonc: 'jsonc',
  json5: 'json5',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  
  // Documentation
  md: 'markdown',
  markdown: 'markdown',
  mdx: 'mdx',
  txt: 'plaintext',
  
  // Programming Languages
  py: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  rb: 'ruby',
  rs: 'rust',
  go: 'go',
  kt: 'kotlin',
  swift: 'swift',
  dart: 'dart',
  scala: 'scala',
  
  // Functional Languages
  ex: 'elixir',
  exs: 'elixir',
  hs: 'haskell',
  clj: 'clojure',
  cljs: 'clojure',
  erl: 'erlang',
  
  // Scripting
  lua: 'lua',
  pl: 'perl',
  r: 'r',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  fish: 'shell',
  ps1: 'powershell',
  
  // Database
  sql: 'sql',
  sqlite: 'sql',
  
  // Config Files
  env: 'dotenv',
  ini: 'ini',
  conf: 'ini',
  config: 'ini',
  properties: 'properties',
  
  // Build Tools
  dockerfile: 'dockerfile',
  
  // Other
  graphql: 'graphql',
  gql: 'graphql',
  proto: 'proto',
};

// File type classifications
export const FILE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  BINARY: 'binary',
  ARCHIVE: 'archive',
  DOCUMENT: 'document',
  MEDIA: 'media',
  CONFIG: 'config',
  DATA: 'data',
  CODE: 'code',
};

// File category mappings
export const FILE_CATEGORIES = {
  // Programming Languages
  javascript: {
    extensions: ['js', 'jsx', 'mjs', 'cjs'],
    type: FILE_TYPES.CODE,
    color: '#f7df1e',
    icon: 'javascript'
  },
  typescript: {
    extensions: ['ts', 'tsx'],
    type: FILE_TYPES.CODE,
    color: '#3178c6',
    icon: 'typescript'
  },
  python: {
    extensions: ['py', 'pyw', 'pyc', 'pyo', 'pyd'],
    type: FILE_TYPES.CODE,
    color: '#3776ab',
    icon: 'python'
  },
  java: {
    extensions: ['java', 'class', 'jar'],
    type: FILE_TYPES.CODE,
    color: '#007396',
    icon: 'java'
  },
  cpp: {
    extensions: ['cpp', 'cxx', 'cc', 'c++', 'hpp', 'hxx', 'h++'],
    type: FILE_TYPES.CODE,
    color: '#00599c',
    icon: 'cplusplus'
  },
  c: {
    extensions: ['c', 'h'],
    type: FILE_TYPES.CODE,
    color: '#00599c',
    icon: 'c'
  },
  
  // Web Technologies
  html: {
    extensions: ['html', 'htm', 'xhtml'],
    type: FILE_TYPES.CODE,
    color: '#e34f26',
    icon: 'html5'
  },
  css: {
    extensions: ['css', 'scss', 'sass', 'less', 'styl'],
    type: FILE_TYPES.CODE,
    color: '#1572b6',
    icon: 'css3'
  },
  
  // Frameworks
  react: {
    extensions: ['jsx', 'tsx'],
    type: FILE_TYPES.CODE,
    color: '#61dafb',
    icon: 'react'
  },
  vue: {
    extensions: ['vue'],
    type: FILE_TYPES.CODE,
    color: '#4fc08d',
    icon: 'vue'
  },
  svelte: {
    extensions: ['svelte'],
    type: FILE_TYPES.CODE,
    color: '#ff3e00',
    icon: 'svelte'
  },
  
  // Data Formats
  json: {
    extensions: ['json', 'jsonc', 'json5'],
    type: FILE_TYPES.DATA,
    color: '#cbcb41',
    icon: 'json'
  },
  yaml: {
    extensions: ['yaml', 'yml'],
    type: FILE_TYPES.DATA,
    color: '#cc1018',
    icon: 'yaml'
  },
  xml: {
    extensions: ['xml', 'xsd', 'xsl', 'xslt'],
    type: FILE_TYPES.DATA,
    color: '#ff6600',
    icon: 'xml'
  },
  
  // Images
  image: {
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff', 'tif'],
    type: FILE_TYPES.IMAGE,
    color: '#a855f7',
    icon: 'image'
  },
  
  // Documents
  document: {
    extensions: ['md', 'markdown', 'mdx', 'txt', 'rtf'],
    type: FILE_TYPES.DOCUMENT,
    color: '#000000',
    icon: 'markdown'
  },
  
  // Archives
  archive: {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    type: FILE_TYPES.ARCHIVE,
    color: '#ffd43b',
    icon: 'archive'
  },
  
  // Config
  config: {
    extensions: ['env', 'ini', 'conf', 'config', 'properties', 'toml'],
    type: FILE_TYPES.CONFIG,
    color: '#6b7280',
    icon: 'gear'
  },
};

// MIME type mappings
export const MIME_TYPES = {
  // Text files
  'js': 'application/javascript',
  'jsx': 'application/javascript',
  'ts': 'application/typescript',
  'tsx': 'application/typescript',
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'scss': 'text/x-scss',
  'sass': 'text/x-sass',
  'less': 'text/x-less',
  'json': 'application/json',
  'xml': 'application/xml',
  'yaml': 'application/x-yaml',
  'yml': 'application/x-yaml',
  'md': 'text/markdown',
  'txt': 'text/plain',
  'py': 'text/x-python',
  'java': 'text/x-java-source',
  'c': 'text/x-c',
  'cpp': 'text/x-c++',
  'cs': 'text/x-csharp',
  'php': 'application/x-httpd-php',
  'rb': 'text/x-ruby',
  'rs': 'text/x-rust',
  'go': 'text/x-go',
  'sh': 'application/x-sh',
  'sql': 'application/sql',
  
  // Images
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'webp': 'image/webp',
  'ico': 'image/x-icon',
  'bmp': 'image/bmp',
  
  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  
  // Archives
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
};

// Monaco Editor language mappings
export const MONACO_LANGUAGES = {
  'javascript': 'javascript',
  'javascriptreact': 'javascript',
  'typescript': 'typescript',
  'typescriptreact': 'typescript',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'less': 'less',
  'json': 'json',
  'jsonc': 'json',
  'json5': 'json',
  'xml': 'xml',
  'yaml': 'yaml',
  'markdown': 'markdown',
  'mdx': 'markdown',
  'python': 'python',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'csharp': 'csharp',
  'php': 'php',
  'ruby': 'ruby',
  'rust': 'rust',
  'go': 'go',
  'kotlin': 'kotlin',
  'swift': 'swift',
  'dart': 'dart',
  'shell': 'shell',
  'powershell': 'powershell',
  'sql': 'sql',
  'dockerfile': 'dockerfile',
  'vue': 'html', // Vue files use HTML highlighting in Monaco
  'svelte': 'html', // Svelte files use HTML highlighting in Monaco
  'graphql': 'graphql',
  'plaintext': 'plaintext',
};

// Special file name patterns
export const SPECIAL_FILES = {
  'package.json': { type: 'package', icon: 'npm', color: '#cb3837' },
  'package-lock.json': { type: 'package', icon: 'npm', color: '#cb3837' },
  'yarn.lock': { type: 'package', icon: 'yarn', color: '#2c8ebb' },
  'pnpm-lock.yaml': { type: 'package', icon: 'pnpm', color: '#f69220' },
  'composer.json': { type: 'package', icon: 'composer', color: '#885630' },
  'Cargo.toml': { type: 'package', icon: 'rust', color: '#ce422b' },
  'Gemfile': { type: 'package', icon: 'ruby', color: '#cc342d' },
  'requirements.txt': { type: 'package', icon: 'python', color: '#3776ab' },
  'Pipfile': { type: 'package', icon: 'python', color: '#3776ab' },
  'go.mod': { type: 'package', icon: 'go', color: '#00add8' },
  'pom.xml': { type: 'package', icon: 'java', color: '#007396' },
  'build.gradle': { type: 'package', icon: 'gradle', color: '#02303a' },
  
  'dockerfile': { type: 'docker', icon: 'docker', color: '#2496ed' },
  'docker-compose.yml': { type: 'docker', icon: 'docker', color: '#2496ed' },
  'docker-compose.yaml': { type: 'docker', icon: 'docker', color: '#2496ed' },
  
  'webpack.config.js': { type: 'config', icon: 'webpack', color: '#8dd6f9' },
  'vite.config.js': { type: 'config', icon: 'vite', color: '#646cff' },
  'vite.config.ts': { type: 'config', icon: 'vite', color: '#646cff' },
  'rollup.config.js': { type: 'config', icon: 'rollup', color: '#ec3a37' },
  'parcel.config.js': { type: 'config', icon: 'parcel', color: '#e1a95f' },
  
  '.eslintrc.js': { type: 'config', icon: 'eslint', color: '#4b32c3' },
  '.eslintrc.json': { type: 'config', icon: 'eslint', color: '#4b32c3' },
  'eslint.config.js': { type: 'config', icon: 'eslint', color: '#4b32c3' },
  '.prettierrc': { type: 'config', icon: 'prettier', color: '#f7b93e' },
  'prettier.config.js': { type: 'config', icon: 'prettier', color: '#f7b93e' },
  
  '.gitignore': { type: 'git', icon: 'git', color: '#f05032' },
  '.gitattributes': { type: 'git', icon: 'git', color: '#f05032' },
  '.gitmodules': { type: 'git', icon: 'git', color: '#f05032' },
  
  'readme.md': { type: 'readme', icon: 'markdown', color: '#000000' },
  'README.md': { type: 'readme', icon: 'markdown', color: '#000000' },
  'README.txt': { type: 'readme', icon: 'readme', color: '#000000' },
  
  'tsconfig.json': { type: 'config', icon: 'typescript', color: '#3178c6' },
  'jsconfig.json': { type: 'config', icon: 'javascript', color: '#f7df1e' },
  
  '.env': { type: 'config', icon: 'gear', color: '#ecd53f' },
  '.env.local': { type: 'config', icon: 'gear', color: '#ecd53f' },
  '.env.development': { type: 'config', icon: 'gear', color: '#ecd53f' },
  '.env.production': { type: 'config', icon: 'gear', color: '#ecd53f' },
};

/**
 * Get language from file extension
 * @param {string} extension - File extension (without dot)
 * @returns {string} Language identifier
 */
export const getLanguageFromExtension = (extension) => {
  if (!extension) return 'plaintext';
  return FILE_EXTENSIONS[extension.toLowerCase()] || 'plaintext';
};

/**
 * Get Monaco Editor language from file name
 * @param {string} fileName - File name with extension
 * @returns {string} Monaco language identifier
 */
export const getMonacoLanguageFromFileName = (fileName) => {
  if (!fileName) return 'plaintext';
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  const language = getLanguageFromExtension(extension);
  return MONACO_LANGUAGES[language] || 'plaintext';
};

/**
 * Get MIME type from file extension
 * @param {string} extension - File extension (without dot)
 * @returns {string} MIME type
 */
export const getMimeType = (extension) => {
  if (!extension) return 'application/octet-stream';
  return MIME_TYPES[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Get file type classification
 * @param {string} fileName - File name with extension
 * @returns {string} File type classification
 */
export const getFileTypeClassification = (fileName) => {
  if (!fileName) return FILE_TYPES.BINARY;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  const name = fileName.toLowerCase();
  
  // Check special files first
  if (SPECIAL_FILES[name]) {
    const specialFile = SPECIAL_FILES[name];
    if (specialFile.type === 'package' || specialFile.type === 'config') {
      return FILE_TYPES.CONFIG;
    }
    if (specialFile.type === 'docker') {
      return FILE_TYPES.CONFIG;
    }
    if (specialFile.type === 'git') {
      return FILE_TYPES.CONFIG;
    }
    if (specialFile.type === 'readme') {
      return FILE_TYPES.DOCUMENT;
    }
  }
  
  // Check by extension
  for (const [category, info] of Object.entries(FILE_CATEGORIES)) {
    if (info.extensions.includes(extension)) {
      return info.type;
    }
  }
  
  // Default fallback
  const textExtensions = Object.keys(FILE_EXTENSIONS);
  if (textExtensions.includes(extension)) {
    return FILE_TYPES.TEXT;
  }
  
  return FILE_TYPES.BINARY;
};

/**
 * Check if file is a text file
 * @param {string} fileName - File name with extension
 * @returns {boolean} True if file is a text file
 */
export const isTextFile = (fileName) => {
  const type = getFileTypeClassification(fileName);
  return [FILE_TYPES.TEXT, FILE_TYPES.CODE, FILE_TYPES.DATA, FILE_TYPES.CONFIG, FILE_TYPES.DOCUMENT].includes(type);
};

/**
 * Check if file is an image
 * @param {string} fileName - File name with extension
 * @returns {boolean} True if file is an image
 */
export const isImageFile = (fileName) => {
  return getFileTypeClassification(fileName) === FILE_TYPES.IMAGE;
};

/**
 * Check if file is binary
 * @param {string} fileName - File name with extension
 * @returns {boolean} True if file is binary
 */
export const isBinaryFile = (fileName) => {
  const type = getFileTypeClassification(fileName);
  return [FILE_TYPES.BINARY, FILE_TYPES.ARCHIVE, FILE_TYPES.MEDIA].includes(type);
};

/**
 * Get file category information
 * @param {string} fileName - File name with extension
 * @returns {Object} File category information with color, icon, type
 */
export const getFileCategoryInfo = (fileName) => {
  if (!fileName) return { color: '#6b7280', icon: 'file', type: FILE_TYPES.BINARY };
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  const name = fileName.toLowerCase();
  
  // Check special files first
  if (SPECIAL_FILES[name]) {
    const specialFile = SPECIAL_FILES[name];
    return {
      color: specialFile.color,
      icon: specialFile.icon,
      type: getFileTypeClassification(fileName)
    };
  }
  
  // Check by extension
  for (const [category, info] of Object.entries(FILE_CATEGORIES)) {
    if (info.extensions.includes(extension)) {
      return {
        color: info.color,
        icon: info.icon,
        type: info.type
      };
    }
  }
  
  // Default fallback
  return { color: '#6b7280', icon: 'file', type: FILE_TYPES.BINARY };
};

/**
 * Get all supported extensions for a language
 * @param {string} language - Language identifier
 * @returns {string[]} Array of extensions
 */
export const getExtensionsForLanguage = (language) => {
  return Object.keys(FILE_EXTENSIONS).filter(ext => FILE_EXTENSIONS[ext] === language);
};

/**
 * Check if extension is supported
 * @param {string} extension - File extension (without dot)
 * @returns {boolean} True if extension is supported
 */
export const isSupportedExtension = (extension) => {
  return extension && FILE_EXTENSIONS.hasOwnProperty(extension.toLowerCase());
};