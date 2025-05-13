"use client"

import React from 'react';
import { useState, useRef } from 'react';
import CanvasComponent from '../components/CanvasComponent';
import '../styles/globals.css';

export default function HomePage() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('dla');
  const canvasRef = useRef(null);

  const handleAlgorithmChange = (event) => {
    setSelectedAlgorithm(event.target.value);
  };

  return (
    <>
      <div id="controls">
        <label htmlFor="algo">Algorithm:</label>
        <select id="algo" value={selectedAlgorithm} onChange={handleAlgorithmChange}>
          <option value="dla">Crystal Growth (DLA)</option>
          <option value="colorfill">Color-Influenced Fill</option>
        </select>
      </div>

      <CanvasComponent
        ref={canvasRef}
        algorithm={selectedAlgorithm}
        width={400}
        height={400}
      />
    </>
  );
} 