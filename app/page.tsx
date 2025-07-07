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

  // Set initial canvas dimensions once when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialWidth = Math.floor(window.innerWidth * 0.5);
      const initialHeight = Math.floor(window.innerHeight * 0.5);
      setCanvasDimensions({ width: initialWidth, height: initialHeight });
    }
    setMounted(true);
  }, []);

  const handleAlgorithmChange = (event) => {
    setSelectedAlgorithm(event.target.value);
  };

  return (
    <div className="container">
      <div id="controls">
        <label htmlFor="algo">Algorithm:</label>
        <select id="algo" value={selectedAlgorithm} onChange={handleAlgorithmChange}>
        <option value="colorfill">Jump Splat</option>
        <option value="dla">Crystal Growth</option>
        <option value="spiral">Spiral</option>
        </select>
      </div>

      {mounted && (
        <CanvasComponent
          ref={canvasRef}
          algorithm={selectedAlgorithm}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
        />
      )}
    </div>
  );
} 