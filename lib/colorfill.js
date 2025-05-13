// This is a placeholder for the ColorFill algorithm. 

export function runColorFill(ctx, canvasWidth, canvasHeight, seedX, seedY) {
  const w = canvasWidth;
  const h = canvasHeight;
  const img = ctx.getImageData(0, 0, w, h);
  const visited = new Set(); // Stores numeric key: y * w + x
  
  const frontierBiasExponent = 4;
  const neighborBiasExponent = 5;

  const frontier = new Map(); // key = numeric (y * w + x), value = [x, y]
  const frontierWeights = new Map(); // key = numeric (y * w + x), value = weight

  let lastX = seedX, lastY = seedY;
  let animationFrameId = null;

  function computeWeight(x, y) {
    const dist = Math.hypot(x - lastX, y - lastY);
    let neighborCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && visited.has(ny * w + nx)) {
          neighborCount++;
        }
      }
    }
    return Math.pow(neighborCount + 1, neighborBiasExponent) / Math.pow(dist + 1e-2, frontierBiasExponent);
  }

  function addFrontier(x, y) {
    const key = y * w + x;
    if (x >= 0 && x < w && y >= 0 && y < h && !visited.has(key) && !frontier.has(key)) {
      frontier.set(key, [x, y]);
      frontierWeights.set(key, computeWeight(x, y));
    }
  }

  // Initial seed processing
  if (seedX >= 0 && seedX < w && seedY >= 0 && seedY < h) {
    addFrontier(seedX, seedY); // Add initial seed to frontier, it will be processed in the first step.
  } else {
    console.error("ColorFill seed is out of bounds.");
    return null; // Indicate error or no animation started
  }

  function getNeighborColors(x, y) {
    const colors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && visited.has(ny * w + nx)) {
          const idx = (ny * w + nx) * 4;
          colors.push({
            r: img.data[idx],
            g: img.data[idx + 1],
            b: img.data[idx + 2]
          });
        }
      }
    }
    return colors;
  }

  function generateInfluencedColor(neighborColors) {
    const SIMILARITY_PERCENT = 0.99;
    const SIMILAR_VARIATION = 9;
    const DISSIMILAR_VARIATION = 30;
    if (neighborColors.length === 0) {
      return {
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
      };
    }
    const avg = neighborColors.reduce((acc, col) => ({
      r: acc.r + col.r / neighborColors.length,
      g: acc.g + col.g / neighborColors.length,
      b: acc.b + col.b / neighborColors.length
    }), { r: 0, g: 0, b: 0 });
    
    let useSimilar = false;
    if (neighborColors.length >= 2) {
      useSimilar = true;
    } else {
      useSimilar = Math.random() < SIMILARITY_PERCENT;
    }
    const variation = useSimilar ? SIMILAR_VARIATION : DISSIMILAR_VARIATION;
    return {
      r: Math.min(255, Math.max(0, avg.r + (Math.random() - 0.5) * variation)),
      g: Math.min(255, Math.max(0, avg.g + (Math.random() - 0.5) * variation)),
      b: Math.min(255, Math.max(0, avg.b + (Math.random() - 0.5) * variation))
    };
  }

  function pickFrontierPixel() {
    const entries = Array.from(frontier.values());
    const weights = entries.map(([fx, fy]) => frontierWeights.get(fy * w + fx) || 1);
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0 && entries.length > 0) return entries[Math.floor(Math.random() * entries.length)]; // Fallback if all weights are 0
    if (entries.length === 0) return null; // No frontier pixels
    if (total === 0) return entries[0];

    let r = Math.random() * total;
    for (let i = 0; i < entries.length; i++) {
      r -= weights[i];
      if (r <= 0) return entries[i];
    }
    return entries[entries.length - 1]; // Fallback
  }

  function processPixel(x, y) {
    const key = y * w + x;
    const idx = key * 4; // (y * w + x) * 4

    const neighborColors = getNeighborColors(x, y);
    const newColor = generateInfluencedColor(neighborColors);
    img.data[idx] = newColor.r;
    img.data[idx + 1] = newColor.g;
    img.data[idx + 2] = newColor.b;
    img.data[idx + 3] = 255;
    
    visited.add(key);
    frontier.delete(key);
    frontierWeights.delete(key);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        addFrontier(x + dx, y + dy);
      }
    }
    lastX = x;
    lastY = y;
  }

  let stepCount = 0;
  function step() {
    let count = 0;
    const maxPerFrame = 100;
    while (frontier.size > 0 && count < maxPerFrame) {
      const pixelToProcess = pickFrontierPixel();
      if (!pixelToProcess) break; // No pixel to process
      const [x,y] = pixelToProcess;
      processPixel(x, y);
      count++;
      stepCount++;
    }

    if (stepCount % 100 === 0 && frontier.size > 0) { // Only update weights if there's a frontier
      for (const [key, coords] of frontier.entries()) { // key is numeric, coords is [fx, fy]
        const [fx, fy] = coords;
        frontierWeights.set(key, computeWeight(fx, fy));
      }
    }

    ctx.putImageData(img, 0, 0);

    if (frontier.size > 0) {
      animationFrameId = requestAnimationFrame(step);
    } else {
      console.log("ColorFill finished: Frontier empty.");
      animationFrameId = null;
    }
  }

  // Start the animation if seed was valid
  if (frontier.size > 0) {
    animationFrameId = requestAnimationFrame(step);
  }
  return animationFrameId; // Return the ID for cancellation
} 