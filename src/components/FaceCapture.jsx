import React, { useRef, useState, useEffect } from "react";
import { getFaceDescriptor } from "../utils/face";
import "../styles/FaceCapture.css";

const FaceCapture = ({ onCapture, buttonText = "Capture Face" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState("");
  const [stream, setStream] = useState(null);

  // Listen for toast messages that require webcam cleanup
  useEffect(() => {
    const handleToastMessage = (event) => {
      if (event.detail?.message?.includes("Login successful!") ||
          event.detail?.message?.includes("Face is already registered")) {
        stopWebcam();
      }
    };

    document.addEventListener('toast', handleToastMessage);
    return () => document.removeEventListener('toast', handleToastMessage);
  }, []);

  // Initialize webcam with optimized settings
  useEffect(() => {
    let mounted = true;
    let retryTimeout = null;
    
    const startVideo = async (retryCount = 0) => {
      // Clear any existing error when attempting to start video
      if (mounted) setError("");
      
      // Stop any existing stream before starting a new one
      stopWebcam();
      
      try {
        // Optimize resolution for faster processing
        // Use exact constraints for more consistent performance
        const constraints = {
          video: { 
            width: { ideal: 320, max: 400 },
            height: { ideal: 240, max: 300 },
            frameRate: { ideal: 15, max: 24 }, // Lower max framerate for better performance
            facingMode: "user",
            // Request lower resolution for mobile devices
            resizeMode: "crop-and-scale",
            // Prioritize performance over quality
            deviceId: undefined // Let browser choose best camera
          },
          audio: false // Explicitly disable audio to save resources
        };
        
        // Try to get stream with optimized settings
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Check if component is still mounted before proceeding
        if (!mounted) {
          // If component unmounted during async operation, clean up the stream
          newStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        if (videoRef.current) {
          // Apply video element optimizations
          const videoEl = videoRef.current;
          
          // Set attributes for better performance
          videoEl.srcObject = newStream;
          videoEl.setAttribute('playsinline', 'true');
          videoEl.setAttribute('muted', 'true');
          videoEl.setAttribute('autoplay', 'true');
          
          // Reduce memory usage and improve performance
          videoEl.disablePictureInPicture = true;
          videoEl.disableRemotePlayback = true;
          
          // Wait for metadata to load before playing to prevent auto-play errors
          videoEl.onloadedmetadata = () => {
            if (mounted && videoEl) {
              videoEl.play().catch(e => {
                console.log('Video play error:', e);
                // If autoplay fails, retry with user interaction simulation
                if (mounted && retryCount < 2) {
                  retryTimeout = setTimeout(() => startVideo(retryCount + 1), 500);
                }
              });
            }
          };
          
          // Add error handler for video element
          videoEl.onerror = (e) => {
            console.error('Video element error:', e);
            if (mounted && retryCount < 2) {
              retryTimeout = setTimeout(() => startVideo(retryCount + 1), 1000);
            }
          };
          
          // Apply advanced video track settings for better performance
          const videoTrack = newStream.getVideoTracks()[0];
          if (videoTrack && videoTrack.getSettings) {
            try {
              // Get camera capabilities
              const capabilities = videoTrack.getCapabilities && videoTrack.getCapabilities();
              
              if (capabilities) {
                // Create advanced constraints object
                const advancedConstraints = {};
                
                // Optimize white balance for better skin tone detection
                if (capabilities.whiteBalanceMode && 
                    capabilities.whiteBalanceMode.includes('continuous')) {
                  advancedConstraints.whiteBalanceMode = 'continuous';
                }
                
                // Optimize exposure for better low-light performance
                if (capabilities.exposureMode && 
                    capabilities.exposureMode.includes('continuous')) {
                  advancedConstraints.exposureMode = 'continuous';
                }
                
                // Apply all optimized constraints if available
                if (Object.keys(advancedConstraints).length > 0 && mounted) {
                  await videoTrack.applyConstraints({ advanced: [advancedConstraints] });
                }
              }
            } catch (e) {
              console.log('Advanced camera settings not supported:', e);
            }
          }
          
          // Add track ended event handler to detect if camera is disconnected
          videoTrack.onended = () => {
            console.log('Video track ended unexpectedly');
            if (mounted && retryCount < 2) {
              retryTimeout = setTimeout(() => startVideo(retryCount + 1), 1000);
            }
          };
          
          if (mounted) {
            setStream(newStream);
          } else {
            // Clean up if component unmounted during async operations
            newStream.getTracks().forEach(track => track.stop());
          }
        } else if (newStream) {
          // Clean up if video ref is no longer available
          newStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        if (mounted) {
          setError("Camera access denied or not available. Please enable camera access.");
          console.error("Error accessing webcam:", err);
          
          // Retry camera access after a delay (only once)
          if (retryCount < 1) {
            retryTimeout = setTimeout(() => startVideo(retryCount + 1), 1500);
          }
        }
      }
    };

    startVideo(0);

    // Cleanup function to stop the video stream when component unmounts
    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      stopWebcam();
    };
  }, []);

  const stopWebcam = () => {
    // Get current stream from state and from video element (in case they're different)
    const currentStream = stream;
    const videoStream = videoRef.current?.srcObject;
    
    // Clean up the stream from state
    if (currentStream) {
      try {
        const tracks = currentStream.getTracks();
        tracks.forEach(track => {
          try {
            track.stop();
            track.enabled = false; // Immediately disable track
            // Force end event to trigger any listeners
            try { track.dispatchEvent(new Event('ended')); } catch (e) {}
            // Remove all event listeners to prevent memory leaks
            track.onended = null;
            track.onmute = null;
            track.onunmute = null;
          } catch (trackErr) {
            console.log('Error stopping track:', trackErr);
          }
        });
        
        // Clear all stream event listeners
        currentStream.onaddtrack = null;
        currentStream.onremovetrack = null;
        currentStream.onactive = null;
        currentStream.oninactive = null;
      } catch (streamErr) {
        console.log('Error cleaning up stream:', streamErr);
      }
    }
    
    // Also clean up the video element's stream if it's different
    if (videoStream && videoStream !== currentStream) {
      try {
        const tracks = videoStream.getTracks();
        tracks.forEach(track => {
          try {
            track.stop();
            track.enabled = false;
          } catch (trackErr) {
            console.log('Error stopping video element track:', trackErr);
          }
        });
      } catch (videoStreamErr) {
        console.log('Error cleaning up video stream:', videoStreamErr);
      }
    }
    
    // Clean up video element
    if (videoRef.current) {
      try {
        // Clear source and force garbage collection of media resources
        videoRef.current.srcObject = null;
        videoRef.current.pause();
        videoRef.current.load(); // Force reload to clear buffer
        
        // Clear all event handlers
        videoRef.current.onloadedmetadata = null;
        videoRef.current.onloadeddata = null;
        videoRef.current.onplay = null;
        videoRef.current.onpause = null;
        videoRef.current.onerror = null;
      } catch (videoErr) {
        console.log('Error cleaning up video element:', videoErr);
      }
    }
    
    // Update state
    setStream(null);
  };

  // Ensure canvas dimensions match video for optimal processing
  useEffect(() => {
    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth) {
      // Update canvas dimensions to match actual video dimensions
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }
  }, [stream]); // Update when stream changes

  const handleCapture = async () => {
    if (!videoRef.current) return;
    
    setIsCapturing(true);
    setError("");
    
    // Use a timeout to ensure UI updates before heavy processing begins
    // This improves perceived performance
    setTimeout(async () => {
      try {
        // Draw current video frame to canvas with proper dimensions
        const canvas = canvasRef.current;
        if (!canvas) {
          setError("Canvas initialization failed. Please refresh the page.");
          setIsCapturing(false);
          return;
        }
        
        const context = canvas.getContext("2d", { alpha: false, desynchronized: true, willReadFrequently: true });
        
        // Ensure canvas dimensions match video for optimal processing
        if (canvas.width !== videoRef.current.videoWidth || canvas.height !== videoRef.current.videoHeight) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
        }
        
        // Draw video frame to canvas with optimized settings
        context.imageSmoothingEnabled = false; // Disable anti-aliasing for faster rendering
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Implement retry logic for better reliability
        let descriptor = null;
        let attempts = 0;
        const maxAttempts = 2; // Maximum number of attempts to detect face
        
        while (!descriptor && attempts < maxAttempts) {
          try {
            // Get face descriptor with optimized processing
            descriptor = await getFaceDescriptor(videoRef);
            break; // Exit loop if successful
          } catch (detectionError) {
            attempts++;
            if (attempts >= maxAttempts) {
              // Rethrow the last error if all attempts fail
              throw detectionError;
            }
            // Short delay before retry
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        if (descriptor) {
          stopWebcam(); // Stop webcam after successful capture
          onCapture(descriptor);
        } else {
          setError("No face detected. Please ensure your face is clearly visible and well-lit.");
        }
      } catch (err) {
        setError(err.message || "Face capture failed. Please try again with better lighting.");
        console.error("Face capture error:", err);
      } finally {
        setIsCapturing(false);
      }
    }, 0); // Execute immediately after UI updates
  };

  return (
    <div className="face-capture-container">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width="400"
          height="300"
        />
        <canvas
          ref={canvasRef}
          width="400"
          height="300"
          style={{ display: "none" }}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button
        className="capture-button"
        onClick={handleCapture}
        disabled={isCapturing}
      >
        {isCapturing ? "Processing..." : buttonText}
      </button>
    </div>
  );
};

export default FaceCapture;