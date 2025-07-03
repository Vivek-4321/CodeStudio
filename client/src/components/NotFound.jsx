import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-animation">
          <svg
            width="400"
            height="300"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="not-found-svg"
          >
            {/* Background stars */}
            <circle cx="50" cy="40" r="1.5" fill="var(--geist-foreground)" opacity="0.6">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="350" cy="60" r="1" fill="var(--geist-foreground)" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="320" cy="30" r="1.2" fill="var(--geist-foreground)" opacity="0.5">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="80" cy="280" r="1.3" fill="var(--geist-foreground)" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.8s" repeatCount="indefinite" />
            </circle>
            
            {/* Main 404 text */}
            <g className="error-text">
              {/* 4 */}
              <path
                d="M60 120L60 180L90 180L90 150L110 150L110 180L140 180L140 120L110 120L110 140L90 140L90 120L60 120Z"
                fill="var(--geist-foreground)"
                stroke="var(--geist-border-light)"
                strokeWidth="2"
              >
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.5s" begin="0s" fill="freeze" />
              </path>
              
              {/* 0 (UFO shape) */}
              <ellipse
                cx="200"
                cy="150"
                rx="45"
                ry="30"
                fill="var(--geist-foreground)"
                stroke="var(--geist-border-light)"
                strokeWidth="2"
              >
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.5s" begin="0.3s" fill="freeze" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 0,-5; 0,0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </ellipse>
              
              {/* UFO dome */}
              <ellipse
                cx="200"
                cy="135"
                rx="25"
                ry="15"
                fill="none"
                stroke="var(--geist-border-light)"
                strokeWidth="1.5"
                opacity="0.7"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 0,-5; 0,0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </ellipse>
              
              {/* UFO lights */}
              <circle cx="180" cy="150" r="3" fill="var(--geist-success)" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 0,-5; 0,0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="200" cy="155" r="3" fill="var(--geist-warning)" opacity="0.8">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 0,-5; 0,0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="220" cy="150" r="3" fill="var(--geist-error)" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 0,-5; 0,0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              
              {/* 4 (second one) */}
              <path
                d="M260 120L260 180L290 180L290 150L310 150L310 180L340 180L340 120L310 120L310 140L290 140L290 120L260 120Z"
                fill="var(--geist-foreground)"
                stroke="var(--geist-border-light)"
                strokeWidth="2"
              >
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.5s" begin="0.6s" fill="freeze" />
              </path>
            </g>
            
            {/* Alien character */}
            <g className="alien-character">
              {/* Alien head */}
              <ellipse
                cx="200"
                cy="220"
                rx="25"
                ry="35"
                fill="var(--geist-success)"
                opacity="0.8"
              >
                <animate attributeName="fill-opacity" values="0;0.8;0.8" dur="0.8s" begin="1s" fill="freeze" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </ellipse>
              
              {/* Alien eyes */}
              <ellipse cx="190" cy="210" rx="5" ry="8" fill="var(--geist-background)">
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.3s" begin="1.3s" fill="freeze" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </ellipse>
              <ellipse cx="210" cy="210" rx="5" ry="8" fill="var(--geist-background)">
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.3s" begin="1.3s" fill="freeze" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </ellipse>
              
              {/* Eye pupils */}
              <circle cx="190" cy="210" r="2" fill="var(--geist-foreground)">
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.2s" begin="1.5s" fill="freeze" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="210" cy="210" r="2" fill="var(--geist-foreground)">
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.2s" begin="1.5s" fill="freeze" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
              
              {/* Alien antennae */}
              <line x1="185" y1="190" x2="180" y2="175" stroke="var(--geist-success)" strokeWidth="2">
                <animate attributeName="stroke-opacity" values="0;0.8;0.8" dur="0.3s" begin="1.8s" fill="freeze" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </line>
              <line x1="215" y1="190" x2="220" y2="175" stroke="var(--geist-success)" strokeWidth="2">
                <animate attributeName="stroke-opacity" values="0;0.8;0.8" dur="0.3s" begin="1.8s" fill="freeze" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </line>
              <circle cx="180" cy="175" r="3" fill="var(--geist-warning)">
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.2s" begin="2s" fill="freeze" />
                <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" begin="2s" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="220" cy="175" r="3" fill="var(--geist-warning)">
                <animate attributeName="fill-opacity" values="0;1;1" dur="0.2s" begin="2s" fill="freeze" />
                <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" begin="2s" />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 2,0; -2,0; 0,0"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
            
            {/* Tractor beam */}
            <polygon
              points="175,180 225,180 250,260 150,260"
              fill="url(#tractorBeam)"
              opacity="0.3"
            >
              <animate attributeName="opacity" values="0;0.3;0.1;0.3" dur="2s" repeatCount="indefinite" begin="2.2s" />
            </polygon>
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="tractorBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--geist-warning)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--geist-warning)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="not-found-text">
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-description">
            Looks like this page was abducted by aliens! 
            <br />
            The URL you're looking for doesn't exist in our universe.
          </p>
          
          <div className="not-found-actions">
            <button className="not-found-btn primary" onClick={handleGoHome}>
              Return to Earth
            </button>
            <button className="not-found-btn secondary" onClick={() => window.history.back()}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;