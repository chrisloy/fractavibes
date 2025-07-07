import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { runDLA } from '../lib/dla';
import { runColorFill } from '../lib/colorfill';
import { runSpiral } from '../lib/spiral';
interface CanvasComponentProps {
  width: number;
  height: number;
  algorithm: string;
}

const CanvasComponent = forwardRef(({ width, height, algorithm }: CanvasComponentProps, ref) => {
  const canvasRef = useRef(null);
  const currentAnimationId = useRef(null);

  const resetCanvas = (ctx) => {
    if (currentAnimationId.current) {
      cancelAnimationFrame(currentAnimationId.current);
      currentAnimationId.current = null;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.01)';
    ctx.fillRect(0, 0, width, height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    console.log("Canvas size", width, "x", height);
    resetCanvas(context);
  }, []);

  const handleClick = (event) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    resetCanvas(context); 

    if (algorithm === 'dla') {
      currentAnimationId.current = runDLA(context, canvas.width, canvas.height, x, y);
    } else if (algorithm === 'colorfill') {
      currentAnimationId.current = runColorFill(context, canvas.width, canvas.height, x, y);
    } else if (algorithm === 'spiral') {
      currentAnimationId.current = runSpiral(context, canvas.width, canvas.height, x, y);
    } else {
      alert('Algorithm not implemented yet: ' + algorithm);
    }
  };

  useImperativeHandle(ref, () => ({
    clearAndReset() {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      resetCanvas(context);
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      id="canvas"
    />
  );
});

CanvasComponent.displayName = 'CanvasComponent';

export default CanvasComponent; 