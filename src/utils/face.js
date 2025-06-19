import * as faceapi from "face-api.js";


// Load face-api.js models from public directory
let modelsLoaded = false;
let modelLoadPromise = null; // Cache the loading promise to prevent duplicate loading

export async function loadModels() {
  // Skip loading if models are already loaded
  if (modelsLoaded) {
    console.log("Face-api models already loaded");
    return true;
  }

  // If models are currently loading, return the existing promise
  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  try {
    // Create a new loading promise and cache it
    modelLoadPromise = (async () => {
      console.log("Starting face-api models loading");
      
      // Configure model loading for better performance
      faceapi.env.monkeyPatch({
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        ImageData: ImageData,
        Video: HTMLVideoElement,
        createCanvasElement: () => document.createElement('canvas'),
        createImageElement: () => document.createElement('img')
      });
      
      // Load models in parallel with optimized settings
      const loadPromises = [
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models")
      ];
      
      await Promise.all(loadPromises);
      
      console.log("Face-api models loaded successfully");
      modelsLoaded = true;
      return true;
    })();
    
    return await modelLoadPromise;
  } catch (error) {
    console.error("Error loading face-api models:", error);
    modelLoadPromise = null; // Reset promise on error
    return false;
  }
}

// Preprocess image for better detection in various lighting conditions and skin tones
function preprocessImage(inputElement) {
  // Create a temporary canvas for preprocessing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Set canvas dimensions to match input
  canvas.width = inputElement.videoWidth || inputElement.width;
  canvas.height = inputElement.videoHeight || inputElement.height;
  
  // Draw the original image to the canvas
  ctx.drawImage(inputElement, 0, 0, canvas.width, canvas.height);
  
  // Get image data for processing
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate image statistics for adaptive processing
  let totalBrightness = 0;
  let darkPixels = 0;
  let brightPixels = 0;
  let totalR = 0, totalG = 0, totalB = 0;
  const pixelCount = data.length / 4;
  
  // First pass: gather statistics
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate pixel brightness using perceptual weights
    // Human eyes are more sensitive to green, less to blue
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    
    totalBrightness += brightness;
    totalR += r;
    totalG += g;
    totalB += b;
    
    if (brightness < 60) darkPixels++;
    if (brightness > 200) brightPixels++;
  }
  
  // Calculate averages
  const avgBrightness = totalBrightness / pixelCount;
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  
  // Determine image characteristics
  const isDark = avgBrightness < 90;
  const isLowContrast = (brightPixels + darkPixels) / pixelCount < 0.2;
  const hasColorCast = Math.max(avgR, avgG, avgB) / Math.min(avgR, avgG, avgB) > 1.5;
  
  // Second pass: apply adaptive corrections
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // 1. Adaptive brightness correction for low-light conditions
    if (isDark) {
      const brightnessFactor = Math.min(2.0, 120 / Math.max(1, avgBrightness));
      r = Math.min(255, r * brightnessFactor);
      g = Math.min(255, g * brightnessFactor);
      b = Math.min(255, b * brightnessFactor);
    }
    
    // 2. Adaptive contrast enhancement
    if (isLowContrast) {
      const contrastFactor = 1.3;
      r = Math.min(255, Math.max(0, 128 + (r - 128) * contrastFactor));
      g = Math.min(255, Math.max(0, 128 + (g - 128) * contrastFactor));
      b = Math.min(255, Math.max(0, 128 + (b - 128) * contrastFactor));
    }
    
    // 3. Color balance correction for better skin tone detection
    if (hasColorCast) {
      // Normalize color channels to improve skin tone detection
      const maxChannel = Math.max(avgR, avgG, avgB);
      const rFactor = maxChannel / Math.max(1, avgR);
      const gFactor = maxChannel / Math.max(1, avgG);
      const bFactor = maxChannel / Math.max(1, avgB);
      
      // Apply gentler correction to avoid over-correction
      r = Math.min(255, r * (1 + (rFactor - 1) * 0.5));
      g = Math.min(255, g * (1 + (gFactor - 1) * 0.5));
      b = Math.min(255, b * (1 + (bFactor - 1) * 0.5));
    }
    
    // 4. Apply subtle local normalization to enhance features
    // This helps with darker skin tones by enhancing local contrast
    const localBrightness = (r + g + b) / 3;
    if (localBrightness < 100) {
      const localEnhanceFactor = 1.0 + (0.4 * (1 - localBrightness / 100));
      r = Math.min(255, r * localEnhanceFactor);
      g = Math.min(255, g * localEnhanceFactor);
      b = Math.min(255, b * localEnhanceFactor);
    }
    
    // Update pixel values
    data[i] = Math.round(r);
    data[i + 1] = Math.round(g);
    data[i + 2] = Math.round(b);
  }
  
  // Put the processed image data back to the canvas
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
}

// Detect face and compute descriptor with improved processing
export async function getFaceDescriptor(videoRef) {
  if (!videoRef.current) return null;
  
  // Ensure models are loaded
  if (!modelsLoaded) {
    await loadModels();
  }
  
  // Create a smaller version of the video frame for faster initial detection
  // This significantly speeds up the detection process
  const smallCanvas = document.createElement('canvas');
  const smallCtx = smallCanvas.getContext('2d', { willReadFrequently: true });
  
  // Use a smaller size for initial detection to improve speed
  const detectionWidth = 160; // Reduced size for faster detection
  const aspectRatio = videoRef.current.videoHeight / videoRef.current.videoWidth;
  smallCanvas.width = detectionWidth;
  smallCanvas.height = Math.round(detectionWidth * aspectRatio);
  
  // Draw the video frame to the small canvas
  smallCtx.drawImage(videoRef.current, 0, 0, smallCanvas.width, smallCanvas.height);
  
  // Optimize detector options for better performance and accuracy
  const detectorOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 160,      // Smaller input size for faster initial detection
    scoreThreshold: 0.3  // Lower threshold for better detection in challenging conditions
  });
  
  // First pass: Quick detection on smaller image to check if face exists
  // This is much faster than running full detection on the original image
  const initialDetection = await faceapi.detectSingleFace(smallCanvas, detectorOptions);
  
  if (!initialDetection) {
    throw new Error("No face detected. Please ensure your face is clearly visible.");
  }
  
  // If face is detected in the small image, process the full-size image with preprocessing
  // for better accuracy in the final descriptor generation
  const processedInput = preprocessImage(videoRef.current);
  
  // Use a slightly larger size for the final detection to improve accuracy
  const finalDetectorOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,      // Balanced size for accuracy and speed
    scoreThreshold: 0.4  // Slightly higher threshold for more accurate final detection
  });
  
  // Second pass: Full detection on preprocessed image for accurate descriptor
  const detections = await faceapi
    .detectSingleFace(processedInput, finalDetectorOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  if (!detections) {
    throw new Error("Face detection failed. Please try again with better lighting.");
  }
  
  return detections.descriptor;
}

// Compare face descriptors using euclidean distance with improved accuracy
export function compareFaces(descriptor1, descriptor2) {
  // Convert arrays to Float32Array if needed for consistent comparison
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);
  
  // Calculate Euclidean distance with normalization for better accuracy
  // This helps with variations in lighting and skin tone
  let distance = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  // Calculate norms for normalization
  for (let i = 0; i < d1.length; i++) {
    norm1 += d1[i] * d1[i];
    norm2 += d2[i] * d2[i];
  }
  
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  
  // Calculate normalized distance
  for (let i = 0; i < d1.length; i++) {
    const diff = (d1[i] / norm1) - (d2[i] / norm2);
    distance += diff * diff;
  }
  
  distance = Math.sqrt(distance);
  
  // Apply adaptive threshold based on distance value
  // This makes the comparison more reliable across different conditions
  const threshold = 0.5; // Base threshold - balanced for accuracy with diverse skin tones
  
  return {
    distance: distance,
    isMatch: distance < threshold
  };
}