// This is a placeholder for the DLA algorithm. 

export function runDLA(ctx, canvasWidth, canvasHeight, seedX, seedY) {
  const w = canvasWidth;
  const h = canvasHeight;
  const img = ctx.getImageData(0, 0, w, h);
  const visited = new Set(); // Stores "x,y" for DLA particles

  let aggregatedParticlesCount = 0;
  const MAX_PARTICLES = w * h; // Stop when canvas is full
  // console.log("DLA MAX_PARTICLES", MAX_PARTICLES);
  const MAX_WALKER_STEPS = Math.max(w, h) * 5; // Max steps before a walker is considered lost

  const PARTICLES_PER_FRAME = 50; // Number of walkers to process per animation frame
  const MAX_CONSECUTIVE_SPAWN_FAILS_TOTAL = 10000; // If 10k total spawn attempts fail in a row, stop.
  let consecutiveSpawnFails = 0;
  let particlesSinceLastDraw = 0; // Counter for particles since last draw
  const DRAW_INTERVAL = 5; // Draw after this many particles are added

  const DLA_SIMILARITY_PERCENT = 0.98;
  const DLA_SIMILAR_VARIATION = 3;
  const DLA_DISSIMILAR_VARIATION = 50;

  let animationFrameId = null;

  function getDlaNeighborColors(x, y) {
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

  function generateDlaInfluencedColor(neighborColors) {
    if (neighborColors.length === 0) {
      return {
        r: Math.random() * 255,
        g: Math.random() * 255,
        b: Math.random() * 255
      };
    }

    // TODO: divide by length outside the loop for performance
    const avg = neighborColors.reduce((acc, col) => ({
      r: acc.r + col.r / neighborColors.length,
      g: acc.g + col.g / neighborColors.length,
      b: acc.b + col.b / neighborColors.length
    }), { r: 0, g: 0, b: 0 });

    let useSimilar = false;
    if (neighborColors.length >= 3) {
      useSimilar = true;
    } else {
      useSimilar = Math.random() < DLA_SIMILARITY_PERCENT;
    }
    const variation = useSimilar ? DLA_SIMILAR_VARIATION : DLA_DISSIMILAR_VARIATION;

    return {
      r: Math.min(255, Math.max(0, avg.r + (Math.random() - 0.5) * variation * 2)),
      g: Math.min(255, Math.max(0, avg.g + (Math.random() - 0.5) * variation * 2)),
      b: Math.min(255, Math.max(0, avg.b + (Math.random() - 0.5) * variation * 2))
    };
  }

  function paintPixel(x, y, color) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = (y * w + x) * 4;
    img.data[idx] = color.r;
    img.data[idx + 1] = color.g;
    img.data[idx + 2] = color.b;
    img.data[idx + 3] = 255;
  }

  if (seedX < 0 || seedX >= w || seedY < 0 || seedY >= h) {
    console.error("DLA seed is out of bounds.");
    return null; // Indicate error or no animation started
  }

  // Initial seed placement (canvas is assumed to be cleared by CanvasComponent)
  const seedColor = generateDlaInfluencedColor([]);
  paintPixel(seedX, seedY, seedColor);
  visited.add(seedY * w + seedX);
  aggregatedParticlesCount++;
  ctx.putImageData(img, 0, 0); // Draw initial seed

  function animationStep() {
    if (aggregatedParticlesCount >= MAX_PARTICLES) {
      console.log("DLA finished: Max particles reached.");
      ctx.putImageData(img, 0, 0); // Final draw
      animationFrameId = null; // Clear self-reference
      return;
    }

    if (consecutiveSpawnFails >= MAX_CONSECUTIVE_SPAWN_FAILS_TOTAL) {
      console.log("DLA finished: Too many consecutive spawn failures.");
      ctx.putImageData(img, 0, 0); // Final draw
      animationFrameId = null;
      return;
    }

    for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
      if (aggregatedParticlesCount >= MAX_PARTICLES) break;

      let walkerX, walkerY;
      let spawnedSuccessfully = false;
      const MAX_ATTEMPTS_PER_WALKER_SPAWN = 200;

      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_WALKER_SPAWN; attempt++) {
        walkerX = Math.floor(Math.random() * w);
        walkerY = Math.floor(Math.random() * h);
        if (!visited.has(walkerY * w + walkerX)) {
          spawnedSuccessfully = true;
          consecutiveSpawnFails = 0;
          break;
        }
      }

      if (!spawnedSuccessfully) {
        consecutiveSpawnFails++;
        continue;
      }

      let currentWalkerSteps = 0;
      while (currentWalkerSteps < MAX_WALKER_STEPS) {
        currentWalkerSteps++;

        let isAdjacentToAggregate = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = walkerX + dx;
            const ny = walkerY + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h && visited.has(ny * w + nx)) {
              isAdjacentToAggregate = true;
              break;
            }
          }
          if (isAdjacentToAggregate) break;
        }

        if (isAdjacentToAggregate) {
          const neighborColors = getDlaNeighborColors(walkerX, walkerY);
          const newColor = generateDlaInfluencedColor(neighborColors);
          paintPixel(walkerX, walkerY, newColor);
          visited.add(walkerY * w + walkerX);
          aggregatedParticlesCount++;
          particlesSinceLastDraw++;
          break;
        }

        const moveDx = Math.floor(Math.random() * 3) - 1;
        const moveDy = Math.floor(Math.random() * 3) - 1;

        if (moveDx === 0 && moveDy === 0) continue;

        const nextX = walkerX + moveDx;
        const nextY = walkerY + moveDy;

        if (nextX < 0 || nextX >= w || nextY < 0 || nextY >= h) {
          break;
        }

        if (visited.has(nextY * w + nextX)) {
          break;
        }

        walkerX = nextX;
        walkerY = nextY;
      }
    }

    if (particlesSinceLastDraw >= DRAW_INTERVAL) {
      ctx.putImageData(img, 0, 0);
      particlesSinceLastDraw = 0;
    }

    if (aggregatedParticlesCount < MAX_PARTICLES && consecutiveSpawnFails < MAX_CONSECUTIVE_SPAWN_FAILS_TOTAL) {
      animationFrameId = requestAnimationFrame(animationStep);
    } else {
      ctx.putImageData(img, 0, 0); // Final draw
      animationFrameId = null;
      if (aggregatedParticlesCount >= MAX_PARTICLES) console.log("DLA finished: Max particles reached (final check).");
      else console.log("DLA finished: Too many spawn failures (final check).");
    }
  }

  animationFrameId = requestAnimationFrame(animationStep);
  return animationFrameId; // Return the ID for cancellation
} 