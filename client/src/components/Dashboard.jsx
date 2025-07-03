import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Code2, 
  Sparkles, 
  User, 
  FileCode, 
  Clock, 
  Trash2, 
  Loader, 
  Cloud, 
  FolderOpen, 
  X,
  Rocket,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import { ProjectsModal } from './modals';
import authService from '../services/authService';
import './Dashboard.css';

const API_BASE_URL = 'https://git.aethercure.site';

// Import the TechIcons file to get SVG icons
const createSVGFromTechIcons = (iconKey, size = 24) => {
  const iconMap = {
    'react': {
      color: '#61dafb',
      svg: (
        <svg viewBox="0 0 128 128" width={size} height={size}>
          <g fill="#61DAFB">
            <circle cx="64" cy="64" r="11.4"/>
            <path d="M107.3 45.2c-2.2-.8-4.5-1.6-6.9-2.3.6-2.4 1.1-4.8 1.5-7.1 2.1-13.2-.2-22.5-6.6-26.1-1.9-1.1-4-1.6-6.4-1.6-7 0-15.9 5.2-24.9 13.9-9-8.7-17.9-13.9-24.9-13.9-2.4 0-4.5.5-6.4 1.6-6.4 3.7-8.7 13-6.6 26.1.4 2.3.9 4.7 1.5 7.1-2.4.7-4.7 1.4-6.9 2.3C8.2 50 1.4 56.6 1.4 64s6.9 14 19.3 18.8c2.2.8 4.5 1.6 6.9 2.3-.6 2.4-1.1 4.8-1.5 7.1-2.1 13.2.2 22.5 6.6 26.1 1.9 1.1 4 1.6 6.4 1.6 7.1 0 16-5.2 24.9-13.9 9 8.7 17.9 13.9 24.9 13.9 2.4 0 4.5-.5 6.4-1.6 6.4-3.7 8.7-13 6.6-26.1-.4-2.3-.9-4.7-1.5-7.1 2.4-.7 4.7-1.4 6.9-2.3 12.5-4.8 19.3-11.4 19.3-18.8s-6.8-14-19.3-18.8zM92.5 14.7c4.1 2.4 5.5 9.8 3.8 20.3-.3 2.1-.8 4.3-1.4 6.6-5.2-1.2-10.7-2-16.5-2.5-3.4-4.8-6.9-9.1-10.4-13 7.4-7.3 14.9-12.3 21-12.3 1.3 0 2.5.3 3.5.9zM81.3 74c-1.8 3.2-3.9 6.4-6.1 9.6-3.7.3-7.4.4-11.2.4-3.9 0-7.6-.1-11.2-.4-2.2-3.2-4.2-6.4-6-9.6-1.9-3.3-3.7-6.7-5.3-10 1.6-3.3 3.4-6.7 5.3-10 1.8-3.2 3.9-6.4 6.1-9.6 3.7-.3 7.4-.4 11.2-.4 3.9 0 7.6.1 11.2.4 2.2 3.2 4.2 6.4 6 9.6 1.9 3.3 3.7 6.7 5.3 10-1.7 3.3-3.4 6.6-5.3 10zm8.3-3.3c1.5 3.5 2.7 6.9 3.8 10.3-3.4.8-7 1.4-10.8 1.9 1.2-1.9 2.5-3.9 3.6-6 1.2-2.1 2.3-4.2 3.4-6.2zM64 97.8c-2.4-2.6-4.7-5.4-6.9-8.3 2.3.1 4.6.2 6.9.2 2.3 0 4.6-.1 6.9-.2-2.2 2.9-4.5 5.7-6.9 8.3zm-18.6-15c-3.8-.5-7.4-1.1-10.8-1.9 1.1-3.3 2.3-6.8 3.8-10.3 1.1 2 2.2 4.1 3.4 6.1 1.2 2.2 2.4 4.1 3.6 6.1zm-7-25.5c-1.5-3.5-2.7-6.9-3.8-10.3 3.4-.8 7-1.4 10.8-1.9-1.2 1.9-2.5 3.9-3.6 6-1.2 2.1-2.3 4.2-3.4 6.2zM64 30.2c2.4 2.6 4.7 5.4 6.9 8.3-2.3-.1-4.6-.2-6.9-.2-2.3 0-4.6.1-6.9.2 2.2-2.9 4.5-5.7 6.9-8.3zm22.2 21l-3.6-6c3.8.5 7.4 1.1 10.8 1.9-1.1 3.3-2.3 6.8-3.8 10.3-1.1-2.1-2.2-4.2-3.4-6.2zM31.7 35c-1.7-10.5-.3-17.9 3.8-20.3 1-.6 2.2-.9 3.5-.9 6 0 13.5 4.9 21 12.3-3.5 3.8-7 8.2-10.4 13-5.8.5-11.3 1.4-16.5 2.5-.6-2.3-1-4.5-1.4-6.6zM7 64c0-4.7 5.7-9.7 15.7-13.4 2-.8 4.2-1.5 6.4-2.1 1.6 5 3.6 10.3 6 15.6-2.4 5.3-4.5 10.5-6 15.5C15.3 75.6 7 69.6 7 64zm28.5 49.3c-4.1-2.4-5.5-9.8-3.8-20.3.3-2.1.8-4.3 1.4-6.6 5.2 1.2 10.7 2 16.5 2.5 3.4 4.8 6.9 9.1 10.4 13-7.4 7.3-14.9 12.3-21 12.3-1.3 0-2.5-.3-3.5-.9zM96.3 93c1.7 10.5.3 17.9-3.8 20.3-1 .6-2.2.9-3.5.9-6 0-13.5-4.9-21-12.3 3.5-3.8 7-8.2 10.4-13 5.8-.5 11.3-1.4 16.5-2.5.6 2.3 1 4.5 1.4 6.6zm9-15.6c-2 .8-4.2 1.5-6.4 2.1-1.6-5-3.6-10.3-6-15.6 2.4-5.3 4.5-10.5 6-15.5 13.8 4 22.1 10 22.1 15.6 0 4.7-5.8 9.7-15.7 13.4z"/>
          </g>
        </svg>
      )
    },
    'vue': {
      color: '#4fc08d',
      svg: (
        <svg viewBox="0 0 128 128" width={size} height={size}>
          <path d="M0 8.934l49.854.158 14.167 24.47 14.432-24.47L128 8.935l-63.834 110.14zm126.98.637l-24.36.02-38.476 66.053L25.691 9.592.942 9.572l63.211 107.89zm-25.149-.008l-22.745.168-15.053 24.647L49.216 9.73l-22.794-.168 37.731 64.476zm-75.834-.17l23.002.009m-23.002-.01l23.002.01" fill="none"/>
          <path d="M25.997 9.393l23.002.009L64.035 34.36 79.018 9.404 102 9.398 64.15 75.053z" fill="#35495e"/>
          <path d="M.91 9.569l25.067-.172 38.15 65.659L101.98 9.401l25.11.026-62.966 108.06z" fill="#41b883"/>
        </svg>
      )
    },
    'svelte': {
      color: '#ff3e00', 
      svg: (
        <svg viewBox="0 0 128 128" width={size} height={size}>
          <path d="M 110.43093,16.935847 C 98.552474,-0.076153 75.089104,-5.118154 58.130818,5.695846 l -29.793,19.000001 c -4.030441,2.529 -7.488786,5.871 -10.15468,9.814 -2.665895,3.943 -4.479469,8.399 -5.325138,13.083 a 25.478172,30.64 0 0 0 -0.572094,6.396 c 0.0183,5.831 1.446866,11.571 4.163485,16.729995 -2.546986,3.87201 -4.285721,8.22 -5.110602,12.78201 a 25.347621,30.483 0 0 0 0.345086,14.41199 c 1.072679,4.732998 3.078336,9.203998 5.900559,13.151998 11.877618,17.011 35.393374,22.053 52.299272,11.24 l 29.762238,-19.001 c 4.027946,-2.532 7.482126,-5.877998 10.141386,-9.824998 2.65841,-3.947 4.46282,-8.40699 5.29686,-13.093 0.3825,-2.107 0.57458,-4.244 0.5721,-6.386 -0.007,-5.81999 -1.41778,-11.550995 -4.11194,-16.708995 2.54616,-3.869 4.28489,-8.213 5.11143,-12.771 0.36921,-2.109 0.55713,-4.245 0.56212,-6.386 0.002,-7.595 -2.37152,-15 -6.78697,-21.178 z" fill="#ff3e00"/>
          <path d="m 55.218941,112.66204 a 28.463375,34.23 0 0 1 -5.953776,0.76 c -3.820895,0.001 -7.585244,-0.925 -10.970416,-2.7 -3.384341,-1.774 -6.288887,-4.343 -8.464177,-7.487 -2.655917,-3.716 -4.082827,-8.171 -4.080332,-12.74 a 15.657767,18.83 0 0 1 0.332613,-3.833 15.424937,18.55 0 0 1 0.719276,-2.782 l 0.562116,-1.708 1.51921,1.156 c 3.528195,2.591 7.470493,4.564 11.658097,5.834 l 1.104275,0.333 -0.103941,1.104 v 0.573 c -0.0025,1.381 0.427408,2.73 1.228174,3.854 0.646933,0.958 1.51838,1.744 2.537839,2.288 a 8.2621121,9.936 0 0 0 3.311997,0.837 8.2513022,9.923 0 0 0 1.79029,-0.229 7.2717563,8.745 0 0 0 1.832699,-0.802 l 29.760566,-19.094 c 0.892236,-0.566 1.627311,-1.349 2.135377,-2.276 0.507236,-0.927 0.771662,-1.968 0.768337,-3.026 -0.0084,-1.381 -0.449027,-2.725 -1.259773,-3.844 -0.656912,-0.946 -1.533347,-1.718 -2.553637,-2.252 a 8.3128357,9.997 0 0 0 -3.307008,-0.81 8.246313,9.917 0 0 0 -1.79029,0.23 6.9383115,8.344 0 0 0 -1.821058,0.801 l -11.346268,7.25 a 24.375558,29.314 0 0 1 -6.04774,2.656 c -1.945787,0.502 -3.945624,0.758 -5.954608,0.76 -3.820063,0 -7.582749,-0.926 -10.967089,-2.698 -3.384341,-1.772 -6.289718,-4.338 -8.467502,-7.478 -2.652591,-3.718 -4.079502,-8.172 -4.080334,-12.74 0.0016,-1.285 0.113089,-2.567 0.332615,-3.833 0.509728,-2.816 1.597374,-5.495 3.196411,-7.867 1.598207,-2.373 3.67205,-4.387 6.089317,-5.914 l 29.792168,-18.99 c 1.869286,-1.19 3.908205,-2.09 6.04774,-2.667 1.945787,-0.499 3.945625,-0.75 5.953776,-0.75 3.82921,-0.01 7.603538,0.91 10.999519,2.681 3.395981,1.77 6.311338,4.34 8.497439,7.486 2.636787,3.727 4.045417,8.184 4.028777,12.75 a 15.748404,18.939 0 0 1 -0.33344,3.844 15.407475,18.529 0 0 1 -0.71845,2.781 l -0.56211,1.708 -1.519216,-1.114 c -3.525699,-2.595 -7.468833,-4.568 -11.658096,-5.834 l -1.104275,-0.343 0.103941,-1.105 v -0.572 c 0,-1.385 -0.429072,-2.735 -1.228174,-3.865 -0.65608,-0.945 -1.530022,-1.716 -2.549481,-2.25 a 8.3086779,9.992 0 0 0 -3.301186,-0.813 8.2213671,9.887 0 0 0 -1.768671,0.271 6.8185708,8.2 0 0 0 -1.831867,0.802 l -29.792165,18.99 a 5.8797701,7.071 0 0 0 -1.836857,1.79 4.7505482,5.713 0 0 0 -0.962914,2.377 5.0365955,6.057 0 0 0 -0.135541,1.104 c -8.31e-4,1.378 0.42824,2.722 1.228174,3.844 0.655248,0.945 1.530021,1.717 2.548649,2.25 a 8.2986996,9.98 0 0 0 3.301186,0.812 8.2471446,9.918 0 0 0 1.79029,-0.23 6.9433007,8.35 0 0 0 1.832699,-0.801 l 11.367057,-7.292 a 24.218399,29.125 0 0 1 6.04774,-2.656 28.52574,34.305 0 0 1 5.953776,-0.76 c 3.821727,0 7.586076,0.925 10.972078,2.697 3.386003,1.772 6.293877,4.339 8.473325,7.48 2.652591,3.717 4.079498,8.171 4.080338,12.74 0.003,1.299 -0.11226,2.596 -0.34343,3.874 -0.506403,2.817 -1.594046,5.497 -3.192254,7.87 -1.599037,2.372 -3.673715,4.385 -6.093476,5.911 l -29.739779,18.99 a 24.308205,29.233 0 0 1 -6.057719,2.667 z" fill="#ffffff"/>
        </svg>
      )
    },
    'preact': {
      color: '#673ab8',
      svg: (
        <svg viewBox="0 0 32 32" width={size} height={size}>
          <path fill="#673ab8" d="M16 2l12.12 7v14L16 30 3.88 23V9z"/>
          <ellipse fill="none" stroke="#ffffff" cx="16" cy="16" rx="10.72" ry="4.1" transform="rotate(-37.5 16.007 15.996)"/>
          <ellipse fill="none" stroke="#ffffff" cx="16" cy="16" rx="4.1" ry="10.72" transform="rotate(-52.5 15.998 15.994)"/>
          <circle fill="#ffffff" cx="16" cy="16" r="1.86"/>
        </svg>
      )
    },
    'javascript': {
      color: '#f7df1e',
      svg: (
        <svg viewBox="0 0 128 128" width={size} height={size}>
          <path fill="#F0DB4F" d="M1.408 1.408h125.184v125.185H1.408z"/>
          <path fill="#323330" d="M116.347 96.736c-.917-5.711-4.641-10.508-15.672-14.981-3.832-1.761-8.104-3.022-9.377-5.926-.452-1.69-.512-2.642-.226-3.665.821-3.32 4.784-4.355 7.925-3.403 2.023.678 3.938 2.237 5.093 4.724 5.402-3.498 5.391-3.475 9.163-5.879-1.381-2.141-2.118-3.129-3.022-4.045-3.249-3.629-7.676-5.498-14.756-5.355l-3.688.477c-3.534.893-6.902 2.748-8.877 5.235-5.926 6.724-4.236 18.492 2.975 23.335 7.104 5.332 17.54 6.545 18.873 11.531 1.297 6.104-4.486 8.08-10.234 7.378-4.236-.881-6.592-3.034-9.139-6.949-4.688 2.713-4.688 2.713-9.508 5.485 1.143 2.499 2.344 3.63 4.26 5.795 9.068 9.198 31.76 8.746 35.83-5.176.165-.478 1.261-3.666.38-8.581zM69.462 58.943H57.753l-.048 30.272c0 6.438.333 12.34-.714 14.149-1.713 3.558-6.152 3.117-8.175 2.427-2.059-1.012-3.106-2.451-4.319-4.485-.333-.584-.583-1.036-.667-1.071l-9.52 5.83c1.583 3.249 3.915 6.069 6.902 7.901 4.462 2.678 10.459 3.499 16.731 2.059 4.082-1.189 7.604-3.652 9.448-7.401 2.666-4.915 2.094-10.864 2.07-17.444.06-10.735.001-21.468.001-32.237z"/>
        </svg>
      )
    },
    'typescript': {
      color: '#3178c6',
      svg: (
        <svg viewBox="0 0 128 128" width={size} height={size}>
          <path fill="#fff" d="M22.67 47h99.67v73.67H22.67z"/>
          <path fill="#007acc" d="M1.5 63.91v62.5h125v-125H1.5zm100.73-5a15.56 15.56 0 017.82 4.5 20.58 20.58 0 013 4c0 .16-5.4 3.81-8.69 5.85-.12.08-.6-.44-1.13-1.23a7.09 7.09 0 00-5.87-3.53c-3.79-.26-6.23 1.73-6.21 5a4.58 4.58 0 00.54 2.34c.83 1.73 2.38 2.76 7.24 4.86 8.95 3.85 12.78 6.39 15.16 10 2.66 4 3.25 10.46 1.45 15.24-2 5.2-6.9 8.73-13.83 9.9a38.32 38.32 0 01-9.52-.1 23 23 0 01-12.72-6.63c-1.15-1.27-3.39-4.58-3.25-4.82a9.34 9.34 0 011.15-.73L82 101l3.59-2.08.75 1.11a16.78 16.78 0 004.74 4.54c4 2.1 9.46 1.81 12.16-.62a5.43 5.43 0 00.69-6.92c-1-1.39-3-2.56-8.59-5-6.45-2.78-9.23-4.5-11.77-7.24a16.48 16.48 0 01-3.43-6.25 25 25 0 01-.22-8c1.33-6.23 6-10.58 12.82-11.87a31.66 31.66 0 019.49.26zm-29.34 5.24v5.12H56.66v46.23H45.15V69.26H28.88v-5a49.19 49.19 0 01.12-5.17C29.08 59 39 59 51 59h21.83z"/>
        </svg>
      )
    },
    'lit': {
      color: '#324fff',
      svg: (
        <svg viewBox="0 0 768 960" width={size} height={size}>
          <path d="M192 576l96-288 432 432-144 240-192-192h-96" fill="#00e8ff"/>
          <path d="M384 768V384l192-192v384m-480 0h96l96 192-96 192L0 768z" fill="#283198"/>
          <path d="M192 576V192L384 0v384m192 576V576l192-192v384M0 768V384l192 192" fill="#324fff"/>
          <path d="M192 960V576l192 192" fill="#0ff"/>
        </svg>
      )
    }
  };

  return iconMap[iconKey]?.svg || iconMap['javascript'].svg;
};

// Framework icons as React components (using TechIcons)
const FrameworkIcon = ({ framework, size = 24 }) => {
  return createSVGFromTechIcons(framework, size);
};

const FRAMEWORKS = [
  // React Ecosystem
  { 
    id: 'react', 
    name: 'React', 
    template: 'react',
    iconKey: 'react',
    description: 'A JavaScript library for building user interfaces',
    color: '#61dafb',
    category: 'Popular React-like',
    badge: 'Popular'
  },
  { 
    id: 'react-ts', 
    name: 'React TS', 
    template: 'react-ts',
    iconKey: 'react',
    description: 'React with TypeScript for type-safe development',
    color: '#61dafb',
    category: 'Popular React-like',
    badge: 'Recommended'
  },
  
  // Vue Ecosystem
  { 
    id: 'vue', 
    name: 'Vue.js', 
    template: 'vue',
    iconKey: 'vue',
    description: 'The Progressive JavaScript Framework',
    color: '#4fc08d',
    category: 'Vue Ecosystem'
  },
  { 
    id: 'vue-ts', 
    name: 'Vue TS', 
    template: 'vue-ts',
    iconKey: 'vue',
    description: 'Vue.js with TypeScript support',
    color: '#4fc08d',
    category: 'Vue Ecosystem'
  },

  // Svelte Ecosystem
  { 
    id: 'svelte', 
    name: 'Svelte', 
    template: 'svelte',
    iconKey: 'svelte',
    description: 'Cybernetically enhanced web apps',
    color: '#ff3e00',
    category: 'Modern Alternatives',
    badge: 'Fast'
  },
  { 
    id: 'svelte-ts', 
    name: 'Svelte TS', 
    template: 'svelte-ts',
    iconKey: 'svelte',
    description: 'Svelte with TypeScript support',
    color: '#ff3e00',
    category: 'Modern Alternatives'
  },

  // Lightweight Alternatives
  { 
    id: 'preact', 
    name: 'Preact', 
    template: 'preact',
    iconKey: 'preact',
    description: 'Fast 3kB alternative to React',
    color: '#673ab8',
    category: 'Popular React-like',
    badge: 'Lightweight'
  },
  { 
    id: 'preact-ts', 
    name: 'Preact TS', 
    template: 'preact-ts',
    iconKey: 'preact',
    description: 'Preact with TypeScript support',
    color: '#673ab8',
    category: 'Popular React-like'
  },

  // Modern Performance-focused
  { 
    id: 'solid', 
    name: 'Solid.js', 
    template: 'solid',
    iconKey: 'javascript',
    description: 'Simple and performant reactivity',
    color: '#2c4f7c',
    category: 'Modern Alternatives',
    badge: 'Performance'
  },
  { 
    id: 'solid-ts', 
    name: 'Solid TS', 
    template: 'solid-ts',
    iconKey: 'typescript',
    description: 'Solid.js with TypeScript',
    color: '#3178c6',
    category: 'Modern Alternatives'
  },

  // Web Components
  { 
    id: 'lit', 
    name: 'Lit', 
    template: 'lit',
    iconKey: 'lit',
    description: 'Simple. Fast. Web Components.',
    color: '#324fff',
    category: 'Web Components'
  },
  { 
    id: 'lit-ts', 
    name: 'Lit TS', 
    template: 'lit-ts',
    iconKey: 'lit',
    description: 'Lit with TypeScript support',
    color: '#324fff',
    category: 'Web Components'
  },

  // Vanilla/Pure
  { 
    id: 'vanilla', 
    name: 'Vanilla JS', 
    template: 'vanilla',
    iconKey: 'javascript',
    description: 'Pure JavaScript with no framework',
    color: '#f7df1e',
    category: 'Vanilla/Pure'
  },
  { 
    id: 'vanilla-ts', 
    name: 'Vanilla TS', 
    template: 'vanilla-ts',
    iconKey: 'typescript',
    description: 'Pure TypeScript with no framework',
    color: '#3178c6',
    category: 'Vanilla/Pure'
  }
];

// Skeleton Loading Components
const ProjectCardSkeleton = () => (
  <article className="flowing-card project-card-skeleton" aria-label="Loading project card skeleton">
    <header className="skeleton-project-header">
      <div className="skeleton skeleton-avatar"></div>
      <div className="skeleton-project-info">
        <div className="skeleton skeleton-text skeleton-name"></div>
        <div className="skeleton skeleton-text skeleton-framework"></div>
      </div>
    </header>
    
    <div className="skeleton-project-meta">
      <div className="skeleton-project-stats">
        <div className="skeleton skeleton-stat"></div>
        <div className="skeleton skeleton-stat"></div>
      </div>
    </div>

    <footer className="skeleton-project-actions">
      <div className="skeleton skeleton-button skeleton-button-primary"></div>
      <div className="skeleton skeleton-button skeleton-button-icon"></div>
    </footer>
  </article>
);

const FrameworkCardSkeleton = () => (
  <article className="flowing-card framework-card-skeleton" aria-label="Loading framework card skeleton">
    <header className="skeleton-framework-header">
      <div className="skeleton-framework-icon"></div>
      <div className="skeleton-framework-badge"></div>
    </header>
    
    <div className="skeleton-framework-info">
      <div className="skeleton skeleton-text skeleton-framework-name"></div>
      <div className="skeleton skeleton-text skeleton-framework-desc"></div>
    </div>
  </article>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const { projects, loadUserProjects, deleteProject, loading: projectsLoading } = useProject();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredFramework, setHoveredFramework] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  
  // Create project modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    projectName: '',
    subdomain: '',
    framework: 'react',
    resourceSize: 'medium'
  });

  const categories = ['All', ...new Set(FRAMEWORKS.map(f => f.category))];

  const filteredFrameworks = selectedCategory === 'All' 
    ? FRAMEWORKS 
    : FRAMEWORKS.filter(f => f.category === selectedCategory);

  const handleFrameworkSelect = (framework) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setSelectedFramework(framework);
    setCreateForm({ ...createForm, framework: framework.id });
    setShowCreateModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  // Create project function
  const createProject = async () => {
    if (!createForm.projectName || !createForm.framework) return;
    
    setIsCreating(true);

    try {
      const response = await authService.apiCall(`${API_BASE_URL}/api/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          sessionId: 'dashboard-' + Math.random().toString(36).substring(2, 15)
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setShowCreateModal(false);
        setIsCreating(false);
        
        const deploymentId = result.id || result.deployment?.id;
        
        navigate(`/ide/${selectedFramework.id}`, {
          state: {
            ...selectedFramework,
            projectName: createForm.projectName,
            deploymentId: deploymentId,
            createdProject: result
          }
        });
        
        setCreateForm({
          projectName: '',
          subdomain: '',
          framework: 'react',
          resourceSize: 'medium'
        });
      } else {
        console.error('Failed to create project:', result.message);
        alert('Failed to create project: ' + result.message);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project: ' + error.message);
      setIsCreating(false);
    }
  };

  // Load user projects when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProjects();
    }
  }, [isAuthenticated, user, loadUserProjects]);

  // Handle project actions
  const handleProjectSelect = (project) => {
    navigate(`/ide/${project.framework}`, {
      state: {
        id: project.framework, 
        autoCreateFromProject: project,
        framework: FRAMEWORKS.find(f => f.id === project.framework)
      }
    });
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return;
    }

    setDeletingProjectId(projectId);
    try {
      const result = await deleteProject(projectId);
      if (!result.success) {
        alert(`Failed to delete project: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  if (loading) {
    return (
      <main className="dashboard-container" aria-label="Loading dashboard">
        <header className="dashboard-header-content">
          <div className="skeleton skeleton-text" style={{ width: '200px', height: '1.5rem' }}></div>
          <div className="skeleton skeleton-button" style={{ width: '100px', height: '36px' }}></div>
        </header>
        
        <section className="dashboard-stats" aria-label="Loading statistics">
          {[...Array(3)].map((_, i) => (
            <article key={i} className="stat-card">
              <div className="skeleton skeleton-avatar" style={{ width: '20px', height: '20px' }}></div>
              <div>
                <div className="skeleton skeleton-text" style={{ width: '30px', height: '20px', marginBottom: '4px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '60px', height: '12px' }}></div>
              </div>
            </article>
          ))}
        </section>
        
        <section className="dashboard-content" aria-label="Loading content">
          <div className="frameworks-grid">
            {[...Array(8)].map((_, i) => (
              <FrameworkCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-container" aria-label="Dashboard main content">
      {/* Header Section */}
      <header className="dashboard-header-content">
        <section className="dashboard-brand" aria-label="Code Studio brand information">
          <figure className="brand-icon-wrapper">
            <Code2 size={20} />
          </figure>
          <h1 className="brand-title">Code Studio</h1>
        </section>
        
        <nav className="header-actions" aria-label="Main navigation and user actions">
          {/* User Profile/Auth on the right */}
          <section className="header-auth">
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <button 
                className="auth-button btn btn-primary"
                onClick={() => setShowAuthModal(true)}
                aria-label="Sign in to Dev Studio"
              >
                <User size={14} />
                Sign in
              </button>
            )}
          </section>
        </nav>
      </header>

      <section className="dashboard-stats" aria-label="Dashboard statistics">
        <article className="stat-card" aria-label="Number of templates available">
          <Sparkles size={16} />
          <div>
            <span className="stat-number">{FRAMEWORKS.length}</span>
            <span className="stat-label">Templates</span>
          </div>
        </article>
        <article className="stat-card" aria-label="Possibilities count">
          <Rocket size={16} />
          <div>
            <span className="stat-number">∞</span>
            <span className="stat-label">Possibilities</span>
          </div>
        </article>
        {isAuthenticated && (
          <article className="stat-card" aria-label={`Number of projects: ${projects.length}`}>
            <Cloud size={16} />
            <div>
              <span className="stat-number">{projects.length}</span>
              <span className="stat-label">Projects</span>
            </div>
          </article>
        )}
      </section>

      <section className="dashboard-content" aria-label="Dashboard main content area">
        {/* My Projects Section */}
        {isAuthenticated && (
          <section className="dashboard-section" aria-labelledby="my-projects-title">
            <header className="section-title-wrapper">
              <h2 id="my-projects-title" className="section-title">
                <Cloud size={18} />
                My Projects
                {projectsLoading && <Loader size={14} className="loading-spinner" aria-label="Loading projects" />}
              </h2>
              <aside className="section-actions">
                <span className="projects-count">
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </span>
              </aside>
            </header>
            
            {projectsLoading ? (
              <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '1200px' }} aria-label="Loading project cards">
                {[...Array(3)].map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : projects.length > 0 ? (
              <>
                <ul className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '1200px' }} aria-label="List of user projects">
                  {projects.slice(0, 6).map(project => {
                    const framework = FRAMEWORKS.find(f => f.id === project.framework) || FRAMEWORKS[0];
                    return (
                      <li
                        key={project.id}
                        className="flowing-card project-card"
                        onClick={() => handleProjectSelect(project)}
                        aria-label={`Project ${project.name} using ${framework.name}`}
                      >
                        <header className="project-header">
                          <figure className="project-icon">
                            <FrameworkIcon framework={framework.iconKey} size={18} />
                          </figure>
                          <div className="project-info">
                            <h4 className="project-name">{project.name}</h4>
                            <p className="project-framework">{framework.name}</p>
                          </div>
                        </header>
                        
                        <section className="project-meta" aria-label="Project metadata">
                          <div className="project-stats">
                            <span className="stat" aria-label={`Total files: ${project.totalFiles || 0}`}>
                              <FileCode size={11} />
                              {project.totalFiles || 0} files
                            </span>
                            <span className="stat" aria-label={`Last updated on ${new Date(project.updatedAt).toLocaleDateString()}`}>
                              <Clock size={11} />
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </section>

                        <footer className="project-actions">
                          <button 
                            className="btn btn-primary project-btn-load"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectSelect(project);
                            }}
                            aria-label={`Open project ${project.name}`}
                          >
                            <Play size={11} />
                            Open
                          </button>
                          <button 
                            className="btn btn-danger project-btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id, project.name);
                            }}
                            disabled={deletingProjectId === project.id}
                            aria-label={`Delete project ${project.name}`}
                          >
                            {deletingProjectId === project.id ? (
                              <Loader size={11} className="loading-spinner" aria-label="Deleting project" />
                            ) : (
                              <Trash2 size={11} />
                            )}
                          </button>
                        </footer>
                      </li>
                    );
                  })}
                </ul>
                
                {projects.length > 6 && (
                  <footer className="view-all-section">
                    <button 
                      className="btn btn-secondary view-all-btn"
                      onClick={() => setShowProjectsModal(true)}
                      aria-label="View all projects"
                    >
                      <FolderOpen size={14} />
                      View All {projects.length} Projects
                      <ArrowRight size={14} />
                    </button>
                  </footer>
                )}
              </>
            ) : (
              <aside className="empty-state" aria-label="No projects found">
                <figure className="empty-icon">
                  <Cloud size={40} />
                </figure>
                <h3 className="empty-title">No projects yet</h3>
                <p className="empty-description">
                  Create your first project using one of our templates below
                </p>
              </aside>
            )}
          </section>
        )}

        {/* Templates Section */}
        <section className="dashboard-section" aria-labelledby="templates-title">
          <header className="section-title-wrapper">
            <h2 id="templates-title" className="section-title">
              <Sparkles size={18} />
              {isAuthenticated ? 'Create New Project' : 'Choose Your Framework'}
            </h2>
            <nav className="section-actions" aria-label="Filter templates by category">
              <fieldset className="category-filter">
                <Filter size={14} />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-select category-select"
                  aria-label="Select framework category"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </fieldset>
            </nav>
          </header>

          <ul className="frameworks-grid" aria-label="List of available frameworks">
            {filteredFrameworks.map(framework => (
              <li
                key={framework.id}
                className="flowing-card framework-card"
                onClick={() => handleFrameworkSelect(framework)}
                onMouseEnter={() => setHoveredFramework(framework.id)}
                onMouseLeave={() => setHoveredFramework(null)}
                aria-label={`Select ${framework.name} framework`}
              >
                <header className="framework-header">
                  <figure className="framework-icon-container">
                    <FrameworkIcon framework={framework.iconKey} size={20} />
                  </figure>
                  {framework.badge && (
                    <span className={`framework-badge ${framework.badge.toLowerCase()}`}>
                      {framework.badge}
                    </span>
                  )}
                </header>
                
                <section className="framework-info">
                  <h3 className="framework-name">{framework.name}</h3>
                  <p className="framework-description">{framework.description}</p>
                </section>

                {hoveredFramework === framework.id && (
                  <div className="card-hover-effect"></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Projects Modal */}
      {showProjectsModal && (
        <ProjectsModal
          isOpen={showProjectsModal}
          onClose={() => setShowProjectsModal(false)}
          projects={projects}
          onProjectSelect={handleProjectSelect}
          onDeleteProject={handleDeleteProject}
          deletingProjectId={deletingProjectId}
        />
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <dialog className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowCreateModal(false)} aria-labelledby="create-project-modal-title">
          <article className="flowing-card modal-card">
            <header className="modal-header">
              <hgroup className="modal-title-section">
                <h3 id="create-project-modal-title" className="modal-title">Create New {selectedFramework?.name || 'Project'}</h3>
                {/* <p className="modal-subtitle">Set up your development environment</p> */}
              </hgroup>
              <button className="btn btn-secondary modal-close" onClick={() => setShowCreateModal(false)} aria-label="Close create project modal">
                <X size={18} />
              </button>
            </header>
            
            <form className="modal-content" onSubmit={(e) => { e.preventDefault(); createProject(); }}>
              {selectedFramework && (
                <aside className="flowing-card selected-framework-card" aria-label="Selected framework details">
                  <section className="framework-preview">
                    <figure className="framework-preview-icon">
                      <FrameworkIcon framework={selectedFramework.iconKey} size={28} />
                    </figure>
                    <div className="framework-preview-info">
                      <h4 className="framework-preview-name">{selectedFramework.name}</h4>
                      <p className="framework-preview-desc">{selectedFramework.description}</p>
                    </div>
                  </section>
                </aside>
              )}
              
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="projectName" className="form-label">Project Name</label>
                  <input 
                    type="text" 
                    id="projectName"
                    className="form-input"
                    value={createForm.projectName}
                    onChange={(e) => setCreateForm({ ...createForm, projectName: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && !isCreating && createProject()}
                    placeholder="my-awesome-project"
                    aria-required="true"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subdomain" className="form-label">
                    Custom Subdomain
                    <span className="form-label-optional">(optional)</span>
                  </label>
                  <input 
                    type="text" 
                    id="subdomain"
                    className="form-input"
                    value={createForm.subdomain}
                    onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && !isCreating && createProject()}
                    placeholder="my-subdomain"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="resourceConfig" className="form-label">Resource Configuration</label>
                  <select 
                    id="resourceConfig"
                    className="form-select"
                    value={createForm.resourceSize}
                    onChange={(e) => setCreateForm({ ...createForm, resourceSize: e.target.value })}
                    aria-label="Select resource configuration size"
                  >
                    <option value="small">Small (512MB RAM, 0.5 CPU)</option>
                    <option value="medium">Medium (1.5GB RAM, 1 CPU)</option>
                    <option value="large">Large (3GB RAM, 2 CPU)</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  aria-label="Cancel project creation"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating || !createForm.projectName}
                  aria-label="Create project"
                >
                  {isCreating ? (
                    <>
                      <Loader size={14} className="loading-spinner" aria-label="Creating project" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket size={14} />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </article>
        </dialog>
      )}
    </main>
  );
};

export default Dashboard;