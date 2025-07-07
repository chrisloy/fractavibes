"use client"

import React from 'react';
import { useState, useRef } from 'react';
import CanvasComponent from '../components/CanvasComponent';
import '../styles/globals.scss';

export default function HomePage() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('dla');
  const canvasRef = useRef(null);

  const handleAlgorithmChange = (event) => {
    setSelectedAlgorithm(event.target.value);
  };

  return (
    <div className="container">
      <div id="controls">
        <label htmlFor="algo">Algorithm:</label>
        <select id="algo" value={selectedAlgorithm} onChange={handleAlgorithmChange}>
        <option value="dla">Crystal Growth</option>
        <option value="colorfill">Jump Splat</option>
        <option value="spiral">Spiral</option>
        </select>
      </div>

      <CanvasComponent
        ref={canvasRef}
        algorithm={selectedAlgorithm}
        width={400}
        height={400}
      />
    </div>
  );
} 