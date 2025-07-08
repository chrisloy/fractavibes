export function runInkDrop(ctx, canvasWidth, canvasHeight, seedX, seedY) {
  const w = canvasWidth;
  const h = canvasHeight;
  
  // Set canvas to white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w, h);
  
  const img = ctx.getImageData(0, 0, w, h);
  
  // Algorithm parameters
  const MAX_ITERATIONS = 50000;
  const NUMBER_OF_DROPS = Math.floor(Math.random() * 96) + 5; // 5-100 drops
  const COLOR_RANDOMNESS = Math.random() * 0.9 + 0.1; // Color randomness 0.1-0.9
  const DECAY_FACTOR = Math.random() * 0.001 + 0.999; // 0.999-0.9999999 exponential decay
  const SPREAD_PROBABILITY = Math.random() * 0.4 + 0.3; // 0.3-0.7 base spread chance
  const WEIGHT_INFLUENCE = Math.random() * 0.3 + 0.1; // 0.1-0.4 neighbor weight influence
  const SMOOTHING_RADIUS = Math.floor(Math.random() * 3) + 2; // 2-4 pixel smoothing radius
  const COLOR_NOISE = Math.random() * 0.05 + 0.01; // 0.01-0.06 subtle color noise
  const BASE_COLOUR = {
    r: Math.floor(Math.random() * 255 * 0.8),
    g: Math.floor(Math.random() * 255 * 0.8),
    b: Math.floor(Math.random() * 255 * 0.8)
  };
  
  console.log("NUMBER_OF_DROPS", NUMBER_OF_DROPS);
  console.log("COLOR_RANDOMNESS", COLOR_RANDOMNESS);
  console.log("DECAY_FACTOR", DECAY_FACTOR);
  console.log("SPREAD_PROBABILITY", SPREAD_PROBABILITY);
  console.log("WEIGHT_INFLUENCE", WEIGHT_INFLUENCE);
  console.log("SMOOTHING_RADIUS", SMOOTHING_RADIUS);
  console.log("COLOR_NOISE", COLOR_NOISE);
  console.log("BASE_COLOUR", BASE_COLOUR);
  
  // Create ink drops data and pixel ownership tracking
  const inkDrops = [];
  const pixelOwnership = Array(h).fill(null).map(() => Array(w).fill(-1)); // -1 = unowned, dropId = owned by that drop
  
  for (let i = 0; i < NUMBER_OF_DROPS; i++) {
    const drop = {
      id: i,
      x: Math.floor(Math.random() * w),
      y: Math.floor(Math.random() * h),
      radius: Math.floor(Math.random() * 10) + 1, // 1-10 pixels
      color: {
        r: Math.max(0, Math.min(255, BASE_COLOUR.r + (Math.random() - 0.5) * COLOR_RANDOMNESS * 255)),
        g: Math.max(0, Math.min(255, BASE_COLOUR.g + (Math.random() - 0.5) * COLOR_RANDOMNESS * 255)),
        b: Math.max(0, Math.min(255, BASE_COLOUR.b + (Math.random() - 0.5) * COLOR_RANDOMNESS * 255))
      },
      currentSaturationMultiplier: 1.0, // For exponential decay
      frontier: new Map(), // key = y * w + x, value = [x, y]
      frontierWeights: new Map(), // key = y * w + x, value = weight
      isInitialized: false // Track if center pixel has been painted
    };
    inkDrops.push(drop);
  }
  
  // Helper function to get pixel color
  function getPixelColor(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return { r: 255, g: 255, b: 255 }; // white for out of bounds
    const idx = (y * w + x) * 4;
    return {
      r: img.data[idx],
      g: img.data[idx + 1],
      b: img.data[idx + 2]
    };
  }
  
  // Helper function to set pixel color with cross-drop blending
  function setPixelColor(x, y, color, dropId) {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    
    const idx = (y * w + x) * 4;
    const currentOwner = pixelOwnership[y][x];
    
    // If pixel is unowned, claim it
    if (currentOwner === -1) {
      img.data[idx] = Math.round(color.r);
      img.data[idx + 1] = Math.round(color.g);
      img.data[idx + 2] = Math.round(color.b);
      img.data[idx + 3] = 255; // alpha
      pixelOwnership[y][x] = dropId;
      return true;
    }
    
    // If pixel belongs to same drop, update it
    if (currentOwner === dropId) {
      img.data[idx] = Math.round(color.r);
      img.data[idx + 1] = Math.round(color.g);
      img.data[idx + 2] = Math.round(color.b);
      img.data[idx + 3] = 255; // alpha
      return true;
    }
    
    // Pixel belongs to different drop - blend colors for smooth boundaries
    const existingColor = {
      r: img.data[idx],
      g: img.data[idx + 1],
      b: img.data[idx + 2]
    };
    
    // Blend new color with existing (favor existing slightly for stability)
    const blendFactor = 0.3; // How much of the new color to mix in
    const blendedColor = {
      r: existingColor.r * (1 - blendFactor) + color.r * blendFactor,
      g: existingColor.g * (1 - blendFactor) + color.g * blendFactor,
      b: existingColor.b * (1 - blendFactor) + color.b * blendFactor
    };
    
    img.data[idx] = Math.round(blendedColor.r);
    img.data[idx + 1] = Math.round(blendedColor.g);
    img.data[idx + 2] = Math.round(blendedColor.b);
    img.data[idx + 3] = 255; // alpha
    
    // Keep original ownership but allow color blending
    return true;
  }
  
  // Helper function to count colored neighbors for weight calculation
  function countColoredNeighbors(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const neighborColor = getPixelColor(nx, ny);
          // If not white (has ink), count it
          if (neighborColor.r < 255 || neighborColor.g < 255 || neighborColor.b < 255) {
            count++;
          }
        }
      }
    }
    return count;
  }
  
  // Helper function to get cross-drop color blend from area around pixel
  // This function samples colors from ALL drops within the smoothing radius
  function getCrossDropAreaColor(x, y, radius = SMOOTHING_RADIUS) {
    const colorsByDrop = new Map(); // Track colors by drop ID for better blending
    const weights = [];
    
    // Sample colors in a radius around the pixel from all drops
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= radius && nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const color = getPixelColor(nx, ny);
          // Only include non-white pixels (pixels with ink from any drop)
          if (color.r < 255 || color.g < 255 || color.b < 255) {
            const dropId = pixelOwnership[ny][nx];
            
            // Group colors by drop for more intelligent blending
            if (!colorsByDrop.has(dropId)) {
              colorsByDrop.set(dropId, { colors: [], weights: [] });
            }
            
            const dropData = colorsByDrop.get(dropId);
            dropData.colors.push(color);
            // Weight decreases with distance for smoother blending
            const weight = 1 / (dist + 1);
            dropData.weights.push(weight);
            weights.push(weight);
          }
        }
      }
    }
    
    if (colorsByDrop.size === 0) return { r: 255, g: 255, b: 255 };
    
    // If only one drop contributes, use simple weighted average
    if (colorsByDrop.size === 1) {
      const dropData = Array.from(colorsByDrop.values())[0];
      const totalWeight = dropData.weights.reduce((a, b) => a + b, 0);
      const blended = dropData.colors.reduce((acc, color, i) => ({
        r: acc.r + color.r * dropData.weights[i],
        g: acc.g + color.g * dropData.weights[i],
        b: acc.b + color.b * dropData.weights[i]
      }), { r: 0, g: 0, b: 0 });
      
      return {
        r: blended.r / totalWeight,
        g: blended.g / totalWeight,
        b: blended.b / totalWeight
      };
    }
    
    // Multiple drops contribute - blend their average colors
    const dropAverages = [];
    const dropWeights = [];
    
    for (const [dropId, dropData] of colorsByDrop.entries()) {
      const dropTotalWeight = dropData.weights.reduce((a, b) => a + b, 0);
      const dropAverage = dropData.colors.reduce((acc, color, i) => ({
        r: acc.r + color.r * dropData.weights[i],
        g: acc.g + color.g * dropData.weights[i],
        b: acc.b + color.b * dropData.weights[i]
      }), { r: 0, g: 0, b: 0 });
      
      dropAverages.push({
        r: dropAverage.r / dropTotalWeight,
        g: dropAverage.g / dropTotalWeight,
        b: dropAverage.b / dropTotalWeight
      });
      
      // Weight by total contribution of this drop to the area
      dropWeights.push(dropTotalWeight);
    }
    
    // Blend the drop averages weighted by their total contribution
    const totalDropWeight = dropWeights.reduce((a, b) => a + b, 0);
    const finalBlend = dropAverages.reduce((acc, color, i) => ({
      r: acc.r + color.r * dropWeights[i],
      g: acc.g + color.g * dropWeights[i],
      b: acc.b + color.b * dropWeights[i]
    }), { r: 0, g: 0, b: 0 });
    
    return {
      r: finalBlend.r / totalDropWeight,
      g: finalBlend.g / totalDropWeight,
      b: finalBlend.b / totalDropWeight
    };
  }
  
  // Helper function to blend colors with anti-aliasing
  function blendColors(colors) {
    if (colors.length === 0) return { r: 255, g: 255, b: 255 }; // white default
    
    const total = colors.reduce((acc, color) => ({
      r: acc.r + color.r,
      g: acc.g + color.g,
      b: acc.b + color.b
    }), { r: 0, g: 0, b: 0 });
    
    return {
      r: total.r / colors.length,
      g: total.g / colors.length,
      b: total.b / colors.length
    };
  }
  
  // Helper function to add subtle color noise for smoother transitions
  function addColorNoise(color) {
    const noise = COLOR_NOISE * 255;
    return {
      r: Math.max(0, Math.min(255, color.r + (Math.random() - 0.5) * noise)),
      g: Math.max(0, Math.min(255, color.g + (Math.random() - 0.5) * noise)),
      b: Math.max(0, Math.min(255, color.b + (Math.random() - 0.5) * noise))
    };
  }
  
  // Helper function to apply exponential decay to color intensity
  function applyExponentialDecay(color, saturationMultiplier) {
    // Apply exponential decay by reducing the distance from white
    const decayedR = 255 - (255 - color.r) * saturationMultiplier;
    const decayedG = 255 - (255 - color.g) * saturationMultiplier;
    const decayedB = 255 - (255 - color.b) * saturationMultiplier;
    
    return {
      r: Math.max(0, Math.min(255, decayedR)),
      g: Math.max(0, Math.min(255, decayedG)),
      b: Math.max(0, Math.min(255, decayedB))
    };
  }
  
  // Helper function to add a pixel to a drop's frontier
  function addToFrontier(drop, x, y) {
    const key = y * w + x;
    if (x >= 0 && x < w && y >= 0 && y < h && 
        pixelOwnership[y][x] === -1 && 
        !drop.frontier.has(key)) {
      drop.frontier.set(key, [x, y]);
      drop.frontierWeights.set(key, computeFrontierWeight(drop, x, y));
    }
  }
  
  // Helper function to compute weight for frontier pixel
  function computeFrontierWeight(drop, x, y) {
    const neighborCount = countColoredNeighbors(x, y);
    const distFromCenter = Math.hypot(x - drop.x, y - drop.y);
    // Weight based on neighbor count (ink pressure) and distance from center
    return Math.pow(neighborCount + 1, 2) / Math.pow(distFromCenter + 1, 0.5);
  }
  
  // Helper function to pick a frontier pixel from a drop based on weights
  function pickFrontierPixel(drop) {
    const entries = Array.from(drop.frontier.values());
    if (entries.length === 0) return null;
    
    const weights = entries.map(([fx, fy]) => drop.frontierWeights.get(fy * w + fx) || 1);
    const total = weights.reduce((a, b) => a + b, 0);
    
    if (total === 0) return entries[Math.floor(Math.random() * entries.length)];
    
    let r = Math.random() * total;
    for (let i = 0; i < entries.length; i++) {
      r -= weights[i];
      if (r <= 0) return entries[i];
    }
    return entries[entries.length - 1];
  }
  
  let iteration = 0;
  let animationFrameId = null;
  
  function step() {
    if (iteration >= MAX_ITERATIONS) {
      console.log("Ink Drop finished after " + MAX_ITERATIONS + " iterations");
      return;
    }
    
    // Apply exponential decay to all drops
    inkDrops.forEach(drop => {
      drop.currentSaturationMultiplier *= DECAY_FACTOR;
    });
    
    // For each ink drop, process frontier pixels
    inkDrops.forEach(drop => {
      // Initialize drop with center pixel if not done yet
      if (!drop.isInitialized) {
        // Paint center pixel with slight noise for organic feel
        let centerColor = applyExponentialDecay(drop.color, drop.currentSaturationMultiplier);
        centerColor = addColorNoise(centerColor);
        
        if (setPixelColor(drop.x, drop.y, centerColor, drop.id)) {
          // Add neighbors to frontier
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              addToFrontier(drop, drop.x + dx, drop.y + dy);
            }
          }
        }
        drop.isInitialized = true;
        return; // Skip further processing this iteration for this drop
      }
      
      // Process fewer frontier pixels per iteration for smoother transitions
      const pixelsToProcess = Math.min(3, drop.frontier.size);
      for (let i = 0; i < pixelsToProcess; i++) {
        const frontierPixel = pickFrontierPixel(drop);
        if (!frontierPixel) break; // No more frontier pixels
        
        const [x, y] = frontierPixel;
        const key = y * w + x;
        
        // Calculate spreading probability based on neighbor weight and randomness
        const neighborCount = countColoredNeighbors(x, y);
        const weightBonus = neighborCount * WEIGHT_INFLUENCE;
        const spreadChance = SPREAD_PROBABILITY + weightBonus;
        
        // Random check for spreading
        if (Math.random() <= spreadChance) {
          // Get cross-drop blended color from surrounding area
          const areaColor = getCrossDropAreaColor(x, y);
          
          let finalColor;
          if (areaColor.r < 255 || areaColor.g < 255 || areaColor.b < 255) {
            // Blend current drop color with cross-drop area average for smooth boundaries
            const blended = blendColors([drop.color, areaColor, areaColor]); // Weight area color more
            finalColor = applyExponentialDecay(blended, drop.currentSaturationMultiplier);
          } else {
            // No surrounding ink, use drop color with exponential decay
            finalColor = applyExponentialDecay(drop.color, drop.currentSaturationMultiplier);
          }
          
          // Add subtle color noise for organic variation
          finalColor = addColorNoise(finalColor);
          
          // Try to paint pixel
          if (setPixelColor(x, y, finalColor, drop.id)) {
            // Add neighboring pixels to frontier
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                addToFrontier(drop, x + dx, y + dy);
              }
            }
          }
        }
        
        // Remove processed pixel from frontier
        drop.frontier.delete(key);
        drop.frontierWeights.delete(key);
      }
      
      // Update weights occasionally for dynamic behavior
      if (iteration % 10 === 0 && drop.frontier.size > 0) {
        for (const [key, coords] of drop.frontier.entries()) {
          const [fx, fy] = coords;
          drop.frontierWeights.set(key, computeFrontierWeight(drop, fx, fy));
        }
      }
    });
    
    // Update canvas every few iterations to see progress
    if (iteration % 3 === 0) {
      ctx.putImageData(img, 0, 0);
    }
    
    iteration++;
    
    if (iteration < MAX_ITERATIONS) {
      animationFrameId = requestAnimationFrame(step);
    } else {
      ctx.putImageData(img, 0, 0); // Final update
      animationFrameId = null;
    }
  }
  
  // Start the animation
  animationFrameId = requestAnimationFrame(step);
  
  return {
    cancel: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  };
} 