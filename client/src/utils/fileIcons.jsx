import React from 'react';

// Lucide React icons
import { 
  Play, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  ExternalLink,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  X,
  Circle,
  Package,
  FileCode,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Wifi,
  WifiOff,
  Monitor,
  Save,
  ArrowLeft,
  AlertTriangle,
  Info,
  Clock,
  Cloud,
  User
} from 'lucide-react';

// Using lucide-react icons as fallbacks for various file types
import { 
  FileCode2 as SiJavascript, 
  FileType as SiTypescript, 
  Atom as SiReact, 
  Layers as SiVuedotjs, 
  Zap as SiSvelte, 
  Code as SiHtml5, 
  Palette as SiCss3, 
  FileText as SiMarkdown,
  FileCode as SiPython,
  Cpu as SiCplusplus,
  Cog as SiRust,
  Zap as SiGo,
  Code2 as SiPhp,
  Gem as SiRuby,
  Zap as SiSwift,
  Coffee as SiKotlin,
  Code as SiDotnet,
  Zap as SiScala,
  Feather as SiDart,
  Zap as SiElixir,
  Braces as SiHaskell,
  Parentheses as SiClojure,
  Zap as SiErlang,
  Moon as SiLua,
  FileCode as SiPerl,
  BarChart as SiR,
  Terminal as SiShell,
  Terminal as SiPowershell,
  FileCode as SiYaml,
  FileCode as SiToml,
  FileCode as SiXml,
  Database as SiSqlite,
  Container as SiDocker,
  GitBranch as SiGit,
  Package as SiNpm,
  Package as SiYarn,
  Package2 as SiWebpack,
  Zap as SiVite,
  Package as SiRollup,
  CheckCircle as SiEslint,
  Sparkles as SiPrettier,
  Coffee as FaJava,
  Terminal as TerminalIcon
} from 'lucide-react';

// VSCode icons
import { 
  VscFile,
  VscFolder,
  VscJson,
  VscFileMedia,
  VscFilePdf,
  VscFileZip,
  VscGear,
  VscBook,
  VscDatabase
} from 'react-icons/vsc';

// Custom SVG Icon Component - requires techIcons to be passed in
export const createSVGIcon = (techIcons) => {
  return ({ iconKey, size = 16, className = "file-icon", style = {} }) => {
    const icon = techIcons[iconKey];
    if (!icon || !icon.svg) {
      return null; // Return null if we don't have this icon
    }
    
    // Clean and modify SVG
    const svgContent = icon.svg.replace(/<!--.*?-->/gs, '').trim();
    
    // Add width and height attributes, handling both existing and missing attributes
    let modifiedSVG = svgContent;
    
    // If the SVG doesn't have width/height, add them
    if (!modifiedSVG.includes('width=')) {
      modifiedSVG = modifiedSVG.replace('<svg', `<svg width="${size}"`);
    } else {
      modifiedSVG = modifiedSVG.replace(/width="[^"]*"/, `width="${size}"`);
    }
    
    if (!modifiedSVG.includes('height=')) {
      modifiedSVG = modifiedSVG.replace('<svg', `<svg height="${size}"`);
    } else {
      modifiedSVG = modifiedSVG.replace(/height="[^"]*"/, `height="${size}"`);
    }
    
    return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: modifiedSVG }} />;
  };
};

// Get file icon based on extension - requires techIcons and SVGIcon component
export const createGetFileIcon = (techIcons) => {
  const SVGIcon = createSVGIcon(techIcons);
  
  return (fileName, isDirectory = false) => {
    if (isDirectory) {
      // Use custom folder icon if available, otherwise use VscFolder
      const customIcon = <SVGIcon iconKey="folder" className="file-icon folder-icon" style={{color: '#dcb67a'}} />;
      return customIcon || <VscFolder size={16} className="file-icon folder-icon" style={{color: '#dcb67a'}} />;
    }
    
    // Handle undefined or null fileName
    if (!fileName) {
      return <VscFile size={16} className="file-icon" />;
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const name = fileName.toLowerCase();
    
    // Special files first - use custom icons if available, otherwise fallback to original
    if (name === 'package.json' || name === 'package-lock.json') {
      const customIcon = <SVGIcon iconKey="npm" style={{color: '#cb3837'}} />;
      return customIcon || <SiNpm size={16} className="file-icon" style={{color: '#cb3837'}} />;
    }
    if (name === 'yarn.lock') {
      const customIcon = <SVGIcon iconKey="yarn" style={{color: '#2c8ebb'}} />;
      return customIcon || <SiYarn size={16} className="file-icon" style={{color: '#2c8ebb'}} />;
    }
    if (name === 'dockerfile' || name === 'docker-compose.yml' || name === 'docker-compose.yaml') {
      const customIcon = <SVGIcon iconKey="docker" style={{color: '#2496ed'}} />;
      return customIcon || <SiDocker size={16} className="file-icon" style={{color: '#2496ed'}} />;
    }
    if (name === 'webpack.config.js') {
      const customIcon = <SVGIcon iconKey="webpack" style={{color: '#8dd6f9'}} />;
      return customIcon || <SiWebpack size={16} className="file-icon" style={{color: '#8dd6f9'}} />;
    }
    if (name === 'vite.config.js' || name === 'vite.config.ts') {
      const customIcon = <SVGIcon iconKey="vite" style={{color: '#646cff'}} />;
      return customIcon || <SiVite size={16} className="file-icon" style={{color: '#646cff'}} />;
    }
    if (name === '.eslintrc.js' || name === '.eslintrc.json' || name === 'eslint.config.js') {
      const customIcon = <SVGIcon iconKey="eslint" style={{color: '#4b32c3'}} />;
      return customIcon || <SiEslint size={16} className="file-icon" style={{color: '#4b32c3'}} />;
    }
    if (name === '.prettierrc' || name === 'prettier.config.js') {
      const customIcon = <SVGIcon iconKey="prettier" style={{color: '#f7b93e'}} />;
      return customIcon || <SiPrettier size={16} className="file-icon" style={{color: '#f7b93e'}} />;
    }
    if (name === '.gitignore' || name === '.gitattributes') {
      const customIcon = <SVGIcon iconKey="git" style={{color: '#f05032'}} />;
      return customIcon || <SiGit size={16} className="file-icon" style={{color: '#f05032'}} />;
    }
    if (name === 'readme.md') {
      const customIcon = <SVGIcon iconKey="markdown" style={{color: '#000000'}} />;
      return customIcon || <VscBook size={16} className="file-icon" style={{color: '#42a5f5'}} />;
    }
    
    const iconMap = {
      // JavaScript & TypeScript - use custom if available
      js: () => {
        const customIcon = <SVGIcon iconKey="javascript" style={{color: '#f7df1e'}} />;
        return customIcon || <SiJavascript size={16} className="file-icon" style={{color: '#f7df1e'}} />;
      },
      jsx: () => {
        const customIcon = <SVGIcon iconKey="react" style={{color: '#61dafb'}} />;
        return customIcon || <SiReact size={16} className="file-icon" style={{color: '#61dafb'}} />;
      },
      ts: () => {
        const customIcon = <SVGIcon iconKey="typescript" style={{color: '#3178c6'}} />;
        return customIcon || <SiTypescript size={16} className="file-icon" style={{color: '#3178c6'}} />;
      },
      tsx: () => {
        const customIcon = <SVGIcon iconKey="react" style={{color: '#61dafb'}} />;
        return customIcon || <SiReact size={16} className="file-icon" style={{color: '#61dafb'}} />;
      },
      mjs: () => {
        const customIcon = <SVGIcon iconKey="javascript" style={{color: '#f7df1e'}} />;
        return customIcon || <SiJavascript size={16} className="file-icon" style={{color: '#f7df1e'}} />;
      },
      
      // Frameworks
      vue: () => {
        const customIcon = <SVGIcon iconKey="vue" style={{color: '#4fc08d'}} />;
        return customIcon || <SiVuedotjs size={16} className="file-icon" style={{color: '#4fc08d'}} />;
      },
      svelte: () => {
        const customIcon = <SVGIcon iconKey="svelte" style={{color: '#ff3e00'}} />;
        return customIcon || <SiSvelte size={16} className="file-icon" style={{color: '#ff3e00'}} />;
      },
      
      // Web Technologies
      html: () => {
        const customIcon = <SVGIcon iconKey="html5" style={{color: '#e34f26'}} />;
        return customIcon || <SiHtml5 size={16} className="file-icon" style={{color: '#e34f26'}} />;
      },
      htm: () => {
        const customIcon = <SVGIcon iconKey="html5" style={{color: '#e34f26'}} />;
        return customIcon || <SiHtml5 size={16} className="file-icon" style={{color: '#e34f26'}} />;
      },
      css: () => {
        const customIcon = <SVGIcon iconKey="css3" style={{color: '#1572b6'}} />;
        return customIcon || <SiCss3 size={16} className="file-icon" style={{color: '#1572b6'}} />;
      },
      scss: () => {
        const customIcon = <SVGIcon iconKey="sass" style={{color: '#cf649a'}} />;
        return customIcon || <SiCss3 size={16} className="file-icon" style={{color: '#cf649a'}} />;
      },
      sass: () => {
        const customIcon = <SVGIcon iconKey="sass" style={{color: '#cf649a'}} />;
        return customIcon || <SiCss3 size={16} className="file-icon" style={{color: '#cf649a'}} />;
      },
      less: <SiCss3 size={16} className="file-icon" style={{color: '#1d365d'}} />,
      
      // Data formats
      json: () => {
        const customIcon = <SVGIcon iconKey="json" style={{color: '#cbcb41'}} />;
        return customIcon || <VscJson size={16} className="file-icon" style={{color: '#cbcb41'}} />;
      },
      xml: <SiXml size={16} className="file-icon" style={{color: '#ff6600'}} />,
      yaml: () => {
        const customIcon = <SVGIcon iconKey="yaml" style={{color: '#cc1018'}} />;
        return customIcon || <SiYaml size={16} className="file-icon" style={{color: '#cc1018'}} />;
      },
      yml: () => {
        const customIcon = <SVGIcon iconKey="yaml" style={{color: '#cc1018'}} />;
        return customIcon || <SiYaml size={16} className="file-icon" style={{color: '#cc1018'}} />;
      },
      toml: <SiToml size={16} className="file-icon" style={{color: '#9c4221'}} />,
      
      // Documentation
      md: () => {
        const customIcon = <SVGIcon iconKey="markdown" style={{color: '#000000'}} />;
        return customIcon || <SiMarkdown size={16} className="file-icon" style={{color: '#000000'}} />;
      },
      markdown: () => {
        const customIcon = <SVGIcon iconKey="markdown" style={{color: '#000000'}} />;
        return customIcon || <SiMarkdown size={16} className="file-icon" style={{color: '#000000'}} />;
      },
      mdx: () => {
        const customIcon = <SVGIcon iconKey="markdown" style={{color: '#000000'}} />;
        return customIcon || <SiMarkdown size={16} className="file-icon" style={{color: '#000000'}} />;
      },
      
      // Programming Languages
      py: () => {
        const customIcon = <SVGIcon iconKey="python" style={{color: '#3776ab'}} />;
        return customIcon || <SiPython size={16} className="file-icon" style={{color: '#3776ab'}} />;
      },
      java: () => {
        const customIcon = <SVGIcon iconKey="java" style={{color: '#007396'}} />;
        return customIcon || <FaJava size={16} className="file-icon" style={{color: '#007396'}} />;
      },
      cpp: () => {
        const customIcon = <SVGIcon iconKey="cplusplus" style={{color: '#00599c'}} />;
        return customIcon || <SiCplusplus size={16} className="file-icon" style={{color: '#00599c'}} />;
      },
      'c++': () => {
        const customIcon = <SVGIcon iconKey="cplusplus" style={{color: '#00599c'}} />;
        return customIcon || <SiCplusplus size={16} className="file-icon" style={{color: '#00599c'}} />;
      },
      cc: () => {
        const customIcon = <SVGIcon iconKey="cplusplus" style={{color: '#00599c'}} />;
        return customIcon || <SiCplusplus size={16} className="file-icon" style={{color: '#00599c'}} />;
      },
      cxx: () => {
        const customIcon = <SVGIcon iconKey="cplusplus" style={{color: '#00599c'}} />;
        return customIcon || <SiCplusplus size={16} className="file-icon" style={{color: '#00599c'}} />;
      },
      c: () => {
        const customIcon = <SVGIcon iconKey="c" style={{color: '#00599c'}} />;
        return customIcon || <SiCplusplus size={16} className="file-icon" style={{color: '#00599c'}} />;
      },
      h: () => {
        const customIcon = <SVGIcon iconKey="c" style={{color: '#00599c'}} />;
        return customIcon || <SiCplusplus size={16} className="file-icon" style={{color: '#00599c'}} />;
      },
      rs: () => {
        const customIcon = <SVGIcon iconKey="rust" style={{color: '#ce422b'}} />;
        return customIcon || <SiRust size={16} className="file-icon" style={{color: '#ce422b'}} />;
      },
      go: () => {
        const customIcon = <SVGIcon iconKey="go" style={{color: '#00add8'}} />;
        return customIcon || <SiGo size={16} className="file-icon" style={{color: '#00add8'}} />;
      },
      php: () => {
        const customIcon = <SVGIcon iconKey="php" style={{color: '#777bb4'}} />;
        return customIcon || <SiPhp size={16} className="file-icon" style={{color: '#777bb4'}} />;
      },
      rb: () => {
        const customIcon = <SVGIcon iconKey="ruby" style={{color: '#cc342d'}} />;
        return customIcon || <SiRuby size={16} className="file-icon" style={{color: '#cc342d'}} />;
      },
      swift: () => {
        const customIcon = <SVGIcon iconKey="swift" style={{color: '#fa7343'}} />;
        return customIcon || <SiSwift size={16} className="file-icon" style={{color: '#fa7343'}} />;
      },
      kt: () => {
        const customIcon = <SVGIcon iconKey="kotlin" style={{color: '#7f52ff'}} />;
        return customIcon || <SiKotlin size={16} className="file-icon" style={{color: '#7f52ff'}} />;
      },
      cs: () => {
        const customIcon = <SVGIcon iconKey="csharp" style={{color: '#239120'}} />;
        return customIcon || <SiDotnet size={16} className="file-icon" style={{color: '#239120'}} />;
      },
      scala: <SiScala size={16} className="file-icon" style={{color: '#dc322f'}} />,
      dart: () => {
        const customIcon = <SVGIcon iconKey="dart" style={{color: '#0175c2'}} />;
        return customIcon || <SiDart size={16} className="file-icon" style={{color: '#0175c2'}} />;
      },
      
      // Functional Languages
      ex: () => {
        const customIcon = <SVGIcon iconKey="elixir" style={{color: '#4b275f'}} />;
        return customIcon || <SiElixir size={16} className="file-icon" style={{color: '#4b275f'}} />;
      },
      exs: () => {
        const customIcon = <SVGIcon iconKey="elixir" style={{color: '#4b275f'}} />;
        return customIcon || <SiElixir size={16} className="file-icon" style={{color: '#4b275f'}} />;
      },
      hs: () => {
        const customIcon = <SVGIcon iconKey="haskell" style={{color: '#5e5086'}} />;
        return customIcon || <SiHaskell size={16} className="file-icon" style={{color: '#5e5086'}} />;
      },
      clj: <SiClojure size={16} className="file-icon" style={{color: '#5881d8'}} />,
      cljs: <SiClojure size={16} className="file-icon" style={{color: '#5881d8'}} />,
      erl: <SiErlang size={16} className="file-icon" style={{color: '#a90533'}} />,
      
      // Scripting
      lua: <SiLua size={16} className="file-icon" style={{color: '#2c2d72'}} />,
      pl: <SiPerl size={16} className="file-icon" style={{color: '#39457e'}} />,
      r: <SiR size={16} className="file-icon" style={{color: '#276dc3'}} />,
      sh: () => {
        const customIcon = <SVGIcon iconKey="bash" style={{color: '#89e051'}} />;
        return customIcon || <SiShell size={16} className="file-icon" style={{color: '#89e051'}} />;
      },
      bash: () => {
        const customIcon = <SVGIcon iconKey="bash" style={{color: '#89e051'}} />;
        return customIcon || <SiShell size={16} className="file-icon" style={{color: '#89e051'}} />;
      },
      zsh: () => {
        const customIcon = <SVGIcon iconKey="bash" style={{color: '#89e051'}} />;
        return customIcon || <SiShell size={16} className="file-icon" style={{color: '#89e051'}} />;
      },
      fish: () => {
        const customIcon = <SVGIcon iconKey="bash" style={{color: '#89e051'}} />;
        return customIcon || <SiShell size={16} className="file-icon" style={{color: '#89e051'}} />;
      },
      ps1: () => {
        const customIcon = <SVGIcon iconKey="powershell" style={{color: '#012456'}} />;
        return customIcon || <SiPowershell size={16} className="file-icon" style={{color: '#012456'}} />;
      },
      
      // Database
      sql: () => {
        const customIcon = <SVGIcon iconKey="mysql" style={{color: '#336791'}} />;
        return customIcon || <VscDatabase size={16} className="file-icon" style={{color: '#336791'}} />;
      },
      sqlite: <SiSqlite size={16} className="file-icon" style={{color: '#003b57'}} />,
      
      // Images
      png: <VscFileMedia size={16} className="file-icon" style={{color: '#a855f7'}} />,
      jpg: <VscFileMedia size={16} className="file-icon" style={{color: '#a855f7'}} />,
      jpeg: <VscFileMedia size={16} className="file-icon" style={{color: '#a855f7'}} />,
      gif: <VscFileMedia size={16} className="file-icon" style={{color: '#a855f7'}} />,
      svg: <VscFileMedia size={16} className="file-icon" style={{color: '#ffb13b'}} />,
      webp: <VscFileMedia size={16} className="file-icon" style={{color: '#a855f7'}} />,
      ico: <VscFileMedia size={16} className="file-icon" style={{color: '#a855f7'}} />,
      
      // Documents
      pdf: <VscFilePdf size={16} className="file-icon" style={{color: '#e53e3e'}} />,
      doc: <VscBook size={16} className="file-icon" style={{color: '#2b579a'}} />,
      docx: <VscBook size={16} className="file-icon" style={{color: '#2b579a'}} />,
      txt: <VscFile size={16} className="file-icon" style={{color: '#6b7280'}} />,
      
      // Archives
      zip: <VscFileZip size={16} className="file-icon" style={{color: '#ffd43b'}} />,
      rar: <VscFileZip size={16} className="file-icon" style={{color: '#ffd43b'}} />,
      '7z': <VscFileZip size={16} className="file-icon" style={{color: '#ffd43b'}} />,
      tar: <VscFileZip size={16} className="file-icon" style={{color: '#ffd43b'}} />,
      gz: <VscFileZip size={16} className="file-icon" style={{color: '#ffd43b'}} />,
      
      // Config files
      env: <VscGear size={16} className="file-icon" style={{color: '#ecd53f'}} />,
      ini: <VscGear size={16} className="file-icon" style={{color: '#6b7280'}} />,
      conf: <VscGear size={16} className="file-icon" style={{color: '#6b7280'}} />,
      config: <VscGear size={16} className="file-icon" style={{color: '#6b7280'}} />,
      properties: <VscGear size={16} className="file-icon" style={{color: '#6b7280'}} />,
    };
    
    const iconResult = iconMap[ext];
    if (typeof iconResult === 'function') {
      return iconResult();
    }
    return iconResult || <VscFile size={16} className="file-icon" style={{color: '#6b7280'}} />;
  };
};

// Get language for Monaco based on file extension
export const getLanguage = (activeTab) => {
  if (!activeTab) return "plaintext";
  
  const extension = activeTab.split('.').pop().toLowerCase();
  
  const langMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    md: 'markdown',
    vue: 'vue',
    svelte: 'svelte'
  };
  
  return langMap[extension] || 'plaintext';
};

// File type detection helper
export const getFileType = (fileName) => {
  if (!fileName) return 'unknown';
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  const name = fileName.toLowerCase();
  
  // Special files
  if (name === 'package.json' || name === 'package-lock.json') return 'package';
  if (name === 'yarn.lock') return 'package';
  if (name === 'dockerfile' || name === 'docker-compose.yml' || name === 'docker-compose.yaml') return 'docker';
  if (name.startsWith('.git')) return 'git';
  if (name.startsWith('.eslint') || name === 'eslint.config.js') return 'config';
  if (name.startsWith('.prettier')) return 'config';
  if (name === 'vite.config.js' || name === 'vite.config.ts') return 'config';
  if (name === 'webpack.config.js') return 'config';
  
  // File type categories
  const typeMap = {
    // Code files
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    vue: 'vue',
    svelte: 'svelte',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    'c++': 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'c',
    h: 'header',
    rs: 'rust',
    go: 'go',
    php: 'php',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    cs: 'csharp',
    scala: 'scala',
    dart: 'dart',
    
    // Web files
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    
    // Data files
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    
    // Documentation
    md: 'markdown',
    markdown: 'markdown',
    mdx: 'markdown',
    txt: 'text',
    
    // Scripts
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ps1: 'powershell',
    
    // Functional languages
    ex: 'elixir',
    exs: 'elixir',
    hs: 'haskell',
    clj: 'clojure',
    cljs: 'clojure',
    erl: 'erlang',
    lua: 'lua',
    pl: 'perl',
    r: 'r',
    
    // Database
    sql: 'sql',
    sqlite: 'sqlite',
    
    // Images
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    svg: 'image',
    webp: 'image',
    ico: 'image',
    
    // Documents
    pdf: 'document',
    doc: 'document',
    docx: 'document',
    
    // Archives
    zip: 'archive',
    rar: 'archive',
    '7z': 'archive',
    tar: 'archive',
    gz: 'archive',
    
    // Config
    env: 'config',
    ini: 'config',
    conf: 'config',
    config: 'config',
    properties: 'config'
  };
  
  return typeMap[ext] || 'unknown';
};

// Export icon components for direct use
export {
  // Lucide React icons
  Play, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  ExternalLink,
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  X,
  Circle,
  Package,
  FileCode,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Wifi,
  WifiOff,
  Monitor,
  Save,
  ArrowLeft,
  AlertTriangle,
  Info,
  Clock,
  Cloud,
  User,
  // VSCode icons
  VscFile,
  VscFolder,
  VscJson,
  VscFileMedia,
  VscFilePdf,
  VscFileZip,
  VscGear,
  VscBook,
  VscDatabase
};