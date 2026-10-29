import * as faceapi from "face-api.js";

// Cache loading state
let modelsLoaded = false;
let modelLoadPromise = null;

export function isModelsLoaded() {
  return modelsLoaded;
}

// Pre-warm and load face-api models from /models
export async function loadModels() {
  if (modelsLoaded) {
    return true;
  }

  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  try {
    modelLoadPromise = (async () => {
      // Configure environment for browser
      faceapi.env.monkeyPatch({
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        ImageData: ImageData,
        Video: HTMLVideoElement,
        createCanvasElement: () => document.createElement("canvas"),
        createImageElement: () => document.createElement("img")
      });

      // Load models in parallel
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models")
      ]);

      modelsLoaded = true;
      return true;
    })();

    return await modelLoadPromise;
  } catch (error) {
    console.error("Error loading face-api models:", error);
    modelLoadPromise = null;
    return false;
  }
}

// Fast live detection for interactive guidance and auto-zoom (runs in ~15ms on GPU)
export async function detectFaceLocation(videoElement) {
  if (!videoElement || videoElement.readyState < 2) {
    return { detected: false, advice: "Initializing camera..." };
  }

  if (!modelsLoaded) {
    await loadModels();
  }

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 160, // Fastest size for 60fps tracking
    scoreThreshold: 0.35
  });

  const detection = await faceapi.detectSingleFace(videoElement, options);

  if (!detection) {
    return {
      detected: false,
      box: null,
      score: 0,
      isCentered: false,
      advice: "Position face in the center of the frame"
    };
  }

  const { box, score } = detection;
  const vw = videoElement.videoWidth || 320;
  const vh = videoElement.videoHeight || 240;

  // Calculate face center ratio (0.0 to 1.0)
  const centerX = (box.x + box.width / 2) / vw;
  const centerY = (box.y + box.height / 2) / vh;
  const faceRatio = box.width / vw;

  // Guidance heuristics
  let advice = "Hold steady...";
  let isCentered = false;
  let isGoodDistance = true;

  if (faceRatio < 0.22) {
    advice = "Move a little closer to camera";
    isGoodDistance = false;
  } else if (faceRatio > 0.75) {
    advice = "Move back slightly";
    isGoodDistance = false;
  } else if (centerX < 0.35) {
    advice = "Move head slightly to the right";
  } else if (centerX > 0.65) {
    advice = "Move head slightly to the left";
  } else if (centerY < 0.28) {
    advice = "Lower camera angle or tilt down";
  } else if (centerY > 0.72) {
    advice = "Raise camera angle or tilt up";
  } else {
    isCentered = true;
    advice = isGoodDistance ? "Face locked! Hold steady..." : advice;
  }

  return {
    detected: true,
    score: Math.round(score * 100),
    box: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      centerX,
      centerY,
      faceRatio
    },
    isCentered: isCentered && isGoodDistance,
    advice
  };
}

// Fast High-Quality Descriptor Extractor (Direct GPU execution, no CPU pixel loops)
export async function getFaceDescriptor(videoRef) {
  const video = videoRef?.current || videoRef;
  if (!video) return null;

  if (!modelsLoaded) {
    await loadModels();
  }

  // Use balanced 224 input size for crisp descriptor without latency
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 224,
    scoreThreshold: 0.4
  });

  const detection = await faceapi
    .detectSingleFace(video, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    throw new Error("No face detected. Please ensure your face is clearly visible and well-lit.");
  }

  return detection.descriptor;
}

// Compare face descriptors with exact distance, similarity %, and diagnostics
export function compareFaces(descriptor1, descriptor2) {
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);

  const distance = faceapi.euclideanDistance(d1, d2);
  const threshold = 0.52; // Balanced threshold for high accuracy

  const isMatch = distance < threshold;
  const similarity = Math.max(0, Math.min(100, Math.round((1 - distance / 0.8) * 100)));

  return {
    isMatch,
    distance: Number(distance.toFixed(3)),
    similarity,
    reason: isMatch
      ? "Face identity verified!"
      : `Face mismatch (Distance: ${distance.toFixed(2)}, threshold: ${threshold}). Please face the camera directly.`
  };
}
