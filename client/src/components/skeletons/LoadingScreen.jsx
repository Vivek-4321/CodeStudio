import React from 'react';
import { Code2 } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div id="pre-load" className="loader">
      <div className="loader-inner">
        <div className="loader-logo">
          <Code2 size={60} color="#ffffff" />
        </div>
        <div className="box"></div>
        <div className="box"></div>
        <div className="box"></div>
        <div className="box"></div>
        <div className="box"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;