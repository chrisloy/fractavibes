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
  const currentAnimation = useRef(null);

  const stopCurrentAnimation = () => {
    if (currentAnimation.current && typeof currentAnimation.current.cancel === 'function') {
      currentAnimation.current.cancel();
      currentAnimation.current = null;
    }
  };

  const resetCanvas = (ctx) => {
    stopCurrentAnimation();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    console.log("Canvas size", width, "x", height);
    resetCanvas(context);
  }, []);

  const handleClick = (event) => {
    stopCurrentAnimation();
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const rect = canvas.getBoundingClientRect();
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    if (algorithm === 'dla') {
      currentAnimation.current = runDLA(context, canvas.width, canvas.height, x, y);
    } else if (algorithm === 'colorfill') {
      currentAnimation.current = runColorFill(context, canvas.width, canvas.height, x, y);
    } else if (algorithm === 'spiral') {
      currentAnimation.current = runSpiral(context, canvas.width, canvas.height, x, y);
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