"use client"

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import CanvasComponent from '../components/CanvasComponent';
import '../styles/globals.scss';

export default function HomePage() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('colorfill');
  const [mounted, setMounted] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 400, height: 400 });
  const canvasRef = useRef(null);

  const algorithms = [
    { key: 'colorfill', name: 'Jump Splat' },
    { key: 'dla', name: 'Crystal Growth' },
    { key: 'spiral', name: 'Spiral' }
  ];

  // Set initial canvas dimensions once when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialWidth = Math.floor(window.innerWidth * 0.5);
      const initialHeight = Math.floor(window.innerHeight * 0.5);
      setCanvasDimensions({ width: initialWidth, height: initialHeight });
    }
    setMounted(true);
  }, []);

  const cycleAlgorithm = () => {
    const currentIndex = algorithms.findIndex(algo => algo.key === selectedAlgorithm);
    const nextIndex = (currentIndex + 1) % algorithms.length;
    setSelectedAlgorithm(algorithms[nextIndex].key);
  };

  const getCurrentAlgorithmName = () => {
    const current = algorithms.find(algo => algo.key === selectedAlgorithm);
    return current ? current.name : 'Unknown';
  };

  return (
    <div className="app-container">
      {mounted && (
        <CanvasComponent
          ref={canvasRef}
          algorithm={selectedAlgorithm}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
        />
      )}
      
      <div className="controls">
        <button className="algorithm-button" onClick={cycleAlgorithm}>
          {getCurrentAlgorithmName()}
        </button>
      </div>

      <footer className="footer">
        Built by <a href="https://chrisloy.dev" target="_blank" rel="noopener noreferrer">Chris Loy</a>
      </footer>
    </div>
  );
} 