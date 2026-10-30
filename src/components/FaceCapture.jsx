import React, { useRef, useEffect, useState, useCallback } from "react";
import { animate } from "animejs";
import { getFaceDescriptor, loadModels, detectFaceLocation } from "../utils/face";
import { 
  FaCamera, 
  FaCircleCheck, 
  FaTriangleExclamation, 
  FaBolt, 
  FaArrowRotateRight
} from "react-icons/fa6";
import "../styles/FaceCapture.css";

const FaceCapture = ({ 
  onCapture, 
  currentAttempt = 1,
  maxAttempts = 2,
  isRegistration = false
}) => {
  const videoRef = useRef(null);
  const flashRef = useRef(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState("");
  const [stream, setStream] = useState(null);
  const [snapshotUrl, setSnapshotUrl] = useState(null);

  // Real-time face tracking state: center, zoom, and distance
  const [faceStatus, setFaceStatus] = useState({
    detected: false,
    isCentered: false,
    box: null,
    advice: "Position face inside the frame"
  });

  // 3-second auto-capture countdown timer
  const [countdown, setCountdown] = useState(null); // null or 3, 2, 1
  const countdownIntervalRef = useRef(null);

  // Initialize camera and start video stream
  useEffect(() => {
    let active = true;

    const startWebcam = async () => {
      try {
        await loadModels();
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          }
        });

        if (active) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } else {
          mediaStream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Camera permission denied. Please allow camera access.");
      }
    };

    startWebcam();

    return () => {
      active = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopWebcam = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Execute snapshot capture with instant frame freeze (eliminates video lag & UI hanging)
  const executeCapture = useCallback(async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    setError("");

    // 1. Immediately grab a crystal-clear frame on offscreen canvas
    let captureCanvas = null;
    try {
      const video = videoRef.current;
      captureCanvas = document.createElement("canvas");
      captureCanvas.width = video.videoWidth || 640;
      captureCanvas.height = video.videoHeight || 480;
      const ctx = captureCanvas.getContext("2d");
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.92);
      setSnapshotUrl(dataUrl);

      // Pause live video immediately so camera stops competing for GPU/CPU cycles
      video.pause();
    } catch (e) {
      console.warn("Snapshot capture fallback:", e);
    }

    // 2. Trigger tactile shutter flash animation
    if (flashRef.current) {
      animate(flashRef.current, {
        opacity: [0, 0.95, 0],
        duration: 300,
        ease: "outExpo"
      });
    }

    try {
      // 3. Extract high-precision descriptor from the still frame
      const targetElement = captureCanvas || videoRef.current;
      const descriptor = await getFaceDescriptor(targetElement);
      if (descriptor) {
        stopWebcam();
        onCapture(descriptor);
      } else {
        setError("Failed to extract clear face features. Try again with direct lighting.");
        setSnapshotUrl(null);
        if (videoRef.current) videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setError(err.message || "Face capture failed. Please center your face and try again.");
      setSnapshotUrl(null);
      if (videoRef.current) videoRef.current.play().catch(() => {});
    } finally {
      setIsCapturing(false);
      setCountdown(null);
    }
  }, [isCapturing, onCapture, stopWebcam]);
  // Real-time face tracking loop (10Hz) for guidance, auto-zoom, and 3s countdown trigger
  useEffect(() => {
    if (!stream || isCapturing) return;

    let frameId;
    let isTracking = true;

    const runTrackingLoop = async () => {
      if (!isTracking) return;

      if (videoRef.current && videoRef.current.readyState === 4) {
        const result = await detectFaceLocation(videoRef.current);
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
          // Face moved away from center: abort countdown
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setCountdown(null);
          }
        }
      }

      if (isTracking) {
        setTimeout(() => {
          frameId = requestAnimationFrame(runTrackingLoop);
        }, 100);
      }
    };

    frameId = requestAnimationFrame(runTrackingLoop);

    return () => {
      isTracking = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [stream, isCapturing, executeCapture]);

  // Dynamic interactive zoom scale based on face distance and center
  const getZoomStyle = () => {
    if (!faceStatus.detected || !faceStatus.box) {
      return { transform: "scale(1)" };
    }
    // Interactive zoom: slight digital crop when face is centered
    const scale = faceStatus.isCentered ? 1.08 : 1.0;
    return {
      transform: `scale(${scale})`,
      transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
    };
  };

  return (
    <div className="face-kiosk-container">
      {/* Top Header Strip: Mode & Attempt Badge */}
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

      {/* Neo-Brutalist Rounded Square Viewfinder with Corner Brackets */}
      <div className={`biometric-viewfinder-box ${faceStatus.isCentered ? "locked" : faceStatus.detected ? "detected" : "searching"}`}>
        {/* Real-time Video Stream with Interactive Face Zoom */}
        <div className="biometric-video-cropper">
          {snapshotUrl ? (
            <img
              src={snapshotUrl}
              alt="Captured Biometric Frame"
              className="biometric-video-element"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="biometric-video-element"
              style={getZoomStyle()}
            />
          )}
        </div>

        {/* Shutter Flash Animation Overlay */}
        <div ref={flashRef} className="shutter-flash-overlay"></div>

        {/* 4 Neo-Brutalist Corner Brackets */}
        <span className="crosshair-bracket top-left"></span>
        <span className="crosshair-bracket top-right"></span>
        <span className="crosshair-bracket bottom-left"></span>
        <span className="crosshair-bracket bottom-right"></span>

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

      {/* Live Biometric Guidance & Processing Status Pill */}
      <div className={`guidance-status-pill ${isCapturing ? "capturing" : faceStatus.isCentered ? "success" : faceStatus.detected ? "warning" : "info"}`}>
        {isCapturing ? (
          <FaArrowRotateRight className="animate-spin text-emerald-600 text-xs shrink-0" />
        ) : faceStatus.isCentered ? (
          <FaCircleCheck className="text-emerald-500 text-xs shrink-0" />
        ) : faceStatus.detected ? (
          <FaTriangleExclamation className="text-amber-600 text-xs shrink-0" />
        ) : (
          <FaCamera className="text-blue-600 text-xs shrink-0" />
        )}
        <span className="guidance-text">
          {isCapturing 
            ? "Extracting Face Biometrics..." 
            : countdown !== null 
              ? `Auto-capturing in ${countdown}... Hold steady!` 
              : faceStatus.advice}
        </span>
      </div>

      {/* Diagnostic Error Box */}
      {error && (
        <div className="biometric-diagnostic-error">
          <FaTriangleExclamation className="text-rose-600 shrink-0 text-sm" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FaceCapture;
