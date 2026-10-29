import React, { useRef, useState, useEffect, useCallback } from "react";
import { getFaceDescriptor, detectFaceLocation, loadModels } from "../utils/face";
import { animate } from "animejs";
import { 
  FaCamera, 
  FaCrosshairs, 
  FaCircleCheck, 
  FaTriangleExclamation,
  FaBolt,
  FaArrowRotateRight
} from "react-icons/fa6";
import "../styles/FaceCapture.css";

const FaceCapture = ({ 
  onCapture, 
  buttonText = "Capture Face",
  currentAttempt = 1,
  maxAttempts = 2,
  isRegistration = false
}) => {
  const videoRef = useRef(null);
  const flashRef = useRef(null);
  const captureBtnRef = useRef(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState("");
  const [stream, setStream] = useState(null);
  
  // Real-time tracking state
  const [faceStatus, setFaceStatus] = useState({
    detected: false,
    isCentered: false,
    score: 0,
    advice: "Position face in the center crosshairs",
    box: null
  });

  // 3-second auto-capture countdown timer
  const [countdown, setCountdown] = useState(null); // null or 3, 2, 1
  const countdownIntervalRef = useRef(null);

  // Initialize camera and start video stream
  useEffect(() => {
    let mounted = true;

    // Pre-warm models as soon as camera view opens
    loadModels();

    const startVideo = async () => {
      if (mounted) setError("");
      try {
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mounted) {
          newStream.getTracks().forEach(t => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("muted", "true");
          videoRef.current.setAttribute("autoplay", "true");
          await videoRef.current.play().catch(e => console.log("Play error:", e));
        }

        if (mounted) setStream(newStream);
      } catch (err) {
        if (mounted) {
          setError("Camera permission denied. Please allow camera access in your browser.");
        }
      }
    };

    startVideo();

    return () => {
      mounted = false;
      stopWebcam();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  }, [stream]);

  // Execute snapshot capture
  const executeCapture = useCallback(async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    setError("");

    // Trigger visual shutter flash using Anime.js
    if (flashRef.current) {
      flashRef.current.style.opacity = "1";
      animate(flashRef.current, {
        opacity: [1, 0],
        duration: 350,
        ease: "outExpo"
      });
    }

    try {
      const descriptor = await getFaceDescriptor(videoRef);
      if (descriptor) {
        stopWebcam();
        onCapture(descriptor);
      } else {
        setError("Failed to extract clear face features. Try again with direct lighting.");
      }
    } catch (err) {
      setError(err.message || "Face capture failed. Please center your face and try again.");
    } finally {
      setIsCapturing(false);
      setCountdown(null);
    }
  }, [isCapturing, onCapture, stopWebcam]);

  // Real-time face tracking loop (10Hz) for guidance, auto-zoom, and 3s countdown trigger
  useEffect(() => {
    if (!stream || isCapturing) return;

    let isScanning = true;

    const interval = setInterval(async () => {
      if (!isScanning || !videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const result = await detectFaceLocation(videoRef.current);
        if (!isScanning) return;

        setFaceStatus(result);

        // Auto-Capture logic:
        if (result.isCentered && !isCapturing) {
          // If countdown not started, start 3-second countdown
          if (!countdownIntervalRef.current) {
            let timeLeft = 3;
            setCountdown(timeLeft);

            countdownIntervalRef.current = setInterval(() => {
              timeLeft -= 1;
              if (timeLeft > 0) {
                setCountdown(timeLeft);
              } else {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
                setCountdown("SNAP!");
                executeCapture();
              }
            }, 1000);
          }
        } else {
          // If face moved away, cancel countdown
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setCountdown(null);
          }
        }
      } catch (err) {
        console.warn("Face tracking tick error:", err);
      }
    }, 120);

    return () => {
      isScanning = false;
      clearInterval(interval);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [stream, isCapturing, executeCapture]);

  // Dynamic interactive zoom scale based on face distance and center
  const getZoomStyle = () => {
    if (!faceStatus.detected || !faceStatus.box) {
      return { transform: "scale(1.05) translate(0%, 0%)" };
    }
    const { centerX, centerY, faceRatio } = faceStatus.box;
    // Zoom slightly closer if face is small, focal zoom onto head center
    const zoomScale = Math.min(1.35, Math.max(1.08, 0.42 / Math.max(0.2, faceRatio)));
    const tx = (0.5 - centerX) * 35;
    const ty = (0.5 - centerY) * 35;
    return {
      transform: `scale(${zoomScale.toFixed(2)}) translate(${tx.toFixed(1)}%, ${ty.toFixed(1)}%)`,
      transition: "transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)"
    };
  };

  const handleManualClick = () => {
    if (captureBtnRef.current) {
      animate(captureBtnRef.current, {
        scale: [1, 0.92, 1.08, 1],
        duration: 250,
        ease: "outBack"
      });
    }
    executeCapture();
  };

  return (
    <div className="face-kiosk-container">
      {/* Top Header Strip: Attempt Badge & Mode */}
      <div className="face-header-strip">
        <span className="kiosk-mode-tag">
          <FaBolt className="text-amber-500 text-[10px]" />
          {isRegistration ? "REGISTRATION SCAN" : "BIOMETRIC AUTH"}
        </span>

        {!isRegistration && (
          <span className={`kiosk-attempt-pill ${currentAttempt > 1 ? "final" : ""}`}>
            ATTEMPT {currentAttempt} OF {maxAttempts}
          </span>
        )}
      </div>

      {/* Neo-Brutalist Rounded Square Viewfinder with Crosshair Brackets */}
      <div className={`biometric-viewfinder-box ${faceStatus.isCentered ? "locked" : faceStatus.detected ? "detected" : "searching"}`}>
        {/* Real-time Video Stream with Interactive Face Zoom */}
        <div className="biometric-video-cropper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="biometric-video-element"
            style={getZoomStyle()}
          />
        </div>

        {/* Shutter Flash Animation Overlay */}
        <div ref={flashRef} className="shutter-flash-overlay"></div>

        {/* 4 Neo-Brutalist Corner Crosshair Brackets */}
        <span className="crosshair-bracket top-left"></span>
        <span className="crosshair-bracket top-right"></span>
        <span className="crosshair-bracket bottom-left"></span>
        <span className="crosshair-bracket bottom-right"></span>

        {/* Center Aiming Reticle */}
        <div className="center-aim-reticle">
          <FaCrosshairs className={`reticle-icon ${faceStatus.isCentered ? "locked" : ""}`} />
        </div>

        {/* Animated Laser Scanning Line */}
        <div className={`laser-scanner-line ${faceStatus.isCentered ? "locked" : ""}`}></div>

        {/* 3-Second Countdown Overlay Badge */}
        {countdown !== null && (
          <div className="countdown-lock-badge">
            <span className="countdown-number">{countdown}</span>
            <span className="countdown-label">{countdown === "SNAP!" ? "CAPTURING..." : "HOLD STEADY"}</span>
          </div>
        )}
      </div>

      {/* Live Biometric Guidance Pill */}
      <div className={`guidance-status-pill ${faceStatus.isCentered ? "success" : faceStatus.detected ? "warning" : "info"}`}>
        {faceStatus.isCentered ? (
          <FaCircleCheck className="text-emerald-500 text-xs shrink-0" />
        ) : faceStatus.detected ? (
          <FaTriangleExclamation className="text-amber-600 text-xs shrink-0" />
        ) : (
          <FaCamera className="text-blue-600 text-xs shrink-0" />
        )}
        <span className="guidance-text">
          {countdown !== null ? `Auto-capturing in ${countdown}... Hold steady!` : faceStatus.advice}
        </span>
      </div>

      {/* Diagnostic Error Box */}
      {error && (
        <div className="biometric-diagnostic-error">
          <FaTriangleExclamation className="text-rose-600 shrink-0 text-sm" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button: Fast manual snap trigger */}
      <button
        ref={captureBtnRef}
        type="button"
        className="kiosk-action-btn"
        onClick={handleManualClick}
        disabled={isCapturing}
      >
        {isCapturing ? (
          <>
            <FaArrowRotateRight className="animate-spin text-sm" />
            <span>Analyzing Features...</span>
          </>
        ) : (
          <>
            <FaCamera className="text-sm" />
            <span>{buttonText}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default FaceCapture;
