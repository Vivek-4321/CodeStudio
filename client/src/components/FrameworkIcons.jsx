import React from 'react';

export const ReactIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <circle cx="12" cy="12" r="2"/>
    <path d="M20.2 9.3c.4 0 .8.1 1.2.2-.2-1.7-.8-3.2-1.8-4.4-1.5 1.1-3.3 1.9-5.1 2.3 1.3 1.7 2.2 3.6 2.7 5.5.9-.5 1.8-.8 3-.6zM3.8 9.3c1.2-.2 2.1.1 3 .6.5-1.9 1.4-3.8 2.7-5.5C7.7 3.9 5.9 3.1 4.4 2c-1 1.2-1.6 2.7-1.8 4.4.4-.1.8-.1 1.2-.1zm16.4 5.4c-1.2-.2-2.1.1-3 .6-.5 1.9-1.4 3.8-2.7 5.5 1.8.4 3.6 1.2 5.1 2.3 1-1.2 1.6-2.7 1.8-4.4-.4-.1-.8-.1-1.2 0zm-16.4 0c-.4.1-.8.1-1.2 0 .2 1.7.8 3.2 1.8 4.4 1.5-1.1 3.3-1.9 5.1-2.3-1.3-1.7-2.2-3.6-2.7-5.5-.9.5-1.8.8-3 .4z"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-60 12 12)"/>
  </svg>
);

export const VueIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 3.7L14.9 8.6h-5.8L12 3.7zM19.2 8.6L12 20.3L4.8 8.6H9.1L12 14L14.9 8.6h4.3zM0 8.6h4.8L12 20.3l7.2-11.7H24L12 24L0 8.6z"/>
  </svg>
);

export const SvelteIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M10.354 21.125a2.847 2.847 0 0 0 4.737-.406l.034-.094c.433-1.283.811-2.846.811-4.25a8.123 8.123 0 0 0-.464-2.8c-.248-.823-.585-1.554-1.038-2.24a8.698 8.698 0 0 0-1.542-1.75c-.543-.47-1.125-.9-1.748-1.287-.622-.388-1.276-.733-1.96-1.037-.684-.304-1.397-.57-2.134-.795-.737-.225-1.495-.41-2.268-.556a17.62 17.62 0 0 0-2.336-.219c-.797-.024-1.597-.005-2.395.057-.798.062-1.593.168-2.378.318-.785.15-1.56.345-2.315.582-.755.237-1.488.518-2.195.843-.707.325-1.386.695-2.032 1.11-.646.415-1.258.876-1.832 1.383-.574.507-1.108 1.059-1.6 1.652-.492.593-.939 1.228-1.339 1.9-.4.672-.753 1.38-1.056 2.119-.303.739-.556 1.506-.758 2.294-.202.788-.352 1.595-.45 2.407-.098.812-.143 1.631-.135 2.449.008.818.064 1.635.168 2.443.104.808.256 1.607.457 2.387.201.78.451 1.54.749 2.27.298.73.644 1.428 1.038 2.088.394.66.836 1.28 1.325 1.854.489.574 1.024 1.1 1.603 1.573.579.473 1.201.891 1.863 1.248.662.357 1.363.651 2.099.881.736.23 1.504.395 2.294.493.79.098 1.596.128 2.398.089.802-.039 1.596-.118 2.373-.237.777-.119 1.534-.278 2.264-.477.73-.199 1.43-.438 2.094-.717.664-.279 1.291-.598 1.874-.957.583-.359 1.12-.758 1.606-1.197.486-.439.92-.918 1.298-1.437.378-.519.698-1.077.959-1.671.261-.594.463-1.223.603-1.882.14-.659.218-1.345.233-2.041.015-.696.032-1.401.025-2.118-.007-.717-.043-1.446-.108-2.189-.065-.743-.159-1.5-.282-2.273-.123-.773-.275-1.561-.456-2.366a25.045 25.045 0 0 0-.628-2.487c-.221-.829-.471-1.668-.749-2.517-.278-.849-.585-1.709-.92-2.58-.335-.871-.699-1.752-1.09-2.644-.391-.892-.81-1.795-1.257-2.708-.447-.913-.921-1.838-1.423-2.772-.502-.934-1.031-1.877-1.588-2.829-.557-.952-1.142-1.913-1.755-2.882-.613-.969-1.254-1.946-1.922-2.931L10.354 21.125z"/>
  </svg>
);

export const SolidIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

export const QwikIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2L22 7v10l-10 5L2 17V7l10-5zm0 2.5L4.5 8.5v7L12 19.5l7.5-4v-7L12 4.5zm-3 6a3 3 0 1 1 6 0 3 3 0 0 1-6 0z"/>
    <path d="M12 8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="none" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

export const LitIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

export const PreactIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <circle cx="12" cy="12" r="2"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-60 12 12)"/>
  </svg>
);

export const VanillaIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <rect x="2" y="3" width="20" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 8l-4 4-4-4"/>
    <path d="M8 16h8"/>
  </svg>
);

export const getFrameworkIcon = (frameworkId, size = 24, className = "") => {
  const icons = {
    'react': ReactIcon,
    'react-ts': ReactIcon,
    'vue': VueIcon,
    'vue-ts': VueIcon,
    'svelte': SvelteIcon,
    'svelte-ts': SvelteIcon,
    'solid': SolidIcon,
    'solid-ts': SolidIcon,
    'qwik': QwikIcon,
    'qwik-ts': QwikIcon,
    'lit': LitIcon,
    'lit-ts': LitIcon,
    'preact': PreactIcon,
    'preact-ts': PreactIcon,
    'vanilla': VanillaIcon,
    'vanilla-ts': VanillaIcon,
  };

  const IconComponent = icons[frameworkId] || VanillaIcon;
  return <IconComponent size={size} className={className} />;
};