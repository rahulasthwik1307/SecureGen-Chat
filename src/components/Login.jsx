import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";
import FaceCapture from "./FaceCapture";
import DualArenaLogo from "./DualArenaLogo";
import { db } from "../db/db";
import { useAuth } from "../contexts/AuthContext";
import { compareFaces, loadModels } from "../utils/face";
import { FaShieldHalved, FaKey, FaArrowRotateRight, FaArrowLeft, FaCircleCheck } from "react-icons/fa6";
import "../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [verificationSuccess, setVerificationSuccess] = useState(null);

  // 2-Attempt tracking for face verification
  const [attempt, setAttempt] = useState(1);
  const [failedAttempts, setFailedAttempts] = useState(false);
  const [failureReason, setFailureReason] = useState("");

  // Preload face models silently in background on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors((errs) => ({ ...errs, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const user = await db.users.get(formData.username);
      if (!user) {
        toast.error("Invalid username or password");
        return;
      }
      const ok = await bcrypt.compare(formData.password, user.passwordHash);
      if (!ok) {
        toast.error("Invalid username or password");
        return;
      }
      setCurrentUser(user);
      setAttempt(1);
      setFailedAttempts(false);
      setShowFaceCapture(true);
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyFace = async (descriptor) => {
    setLoading(true);
    try {
      if (!currentUser?.faceDescriptor) {
        toast.error("Missing stored face data for this account");
        return;
      }

      const stored = new Float32Array(currentUser.faceDescriptor);
      const result = compareFaces(stored, descriptor);

      if (result.isMatch) {
        setVerificationSuccess({
          similarity: result.similarity || 99,
          distance: result.distance,
          username: currentUser.username
        });
        toast.success(`Face verified! Welcome back, ${currentUser.username}`);
        setTimeout(() => {
          login(currentUser);
          navigate("/chat");
        }, 1500);
      } else {
        if (attempt < 2) {
          setAttempt(2);
          toast.warning(`Face mismatch. Distance: ${result.distance}. 1 attempt remaining.`);
        } else {
          setFailedAttempts(true);
          setFailureReason(result.reason);
          toast.error("Face verification failed after 2 attempts.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Face verification encountered an error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Login with password credentials when biometric limit is reached
  const handlePasswordBypass = () => {
    if (currentUser) {
      login(currentUser);
      toast.success("Logged in with verified password credentials.");
      navigate("/chat");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" role="main">
        {/* Compact Logo Mark */}
        <div className="auth-badge-row">
          <DualArenaLogo size={36} />
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Dual AI Arena Secure Sign-In</p>

        {verificationSuccess ? (
          <div className="biometric-success-screen message-enter">
            <div className="success-badge-container">
              <div className="w-16 h-16 bg-[#00E599] border-3 border-black rounded-2xl flex items-center justify-center text-3xl text-black shadow-neo mx-auto mb-3 animate-bounce-short">
                <FaCircleCheck className="text-3xl text-black" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-[#00E599] rounded-full text-[11px] font-mono font-black uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00E599] animate-ping"></span>
              ACCESS GRANTED
            </span>

            <h3 className="font-display font-black text-2xl text-black mb-1">
              BIOMETRICS VERIFIED!
            </h3>
            <p className="text-xs text-gray-600 font-medium max-w-xs mx-auto mb-5 leading-relaxed">
              Identity confirmed for <span className="font-bold text-black font-mono">"{verificationSuccess.username}"</span>.
            </p>

            <div className="bg-[#FFFDF6] border-2 border-black rounded-2xl p-4 shadow-neo-sm mb-5 text-left">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-200 text-xs">
                <span className="font-mono text-gray-500 font-bold uppercase">Match Accuracy</span>
                <span className="font-mono font-black text-emerald-600">{verificationSuccess.similarity}% Confirmed</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-200 text-xs">
                <span className="font-mono text-gray-500 font-bold uppercase">Security Guard</span>
                <span className="font-mono font-black text-black">Dual-Layer Biometric ID ✓</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-xs">
                <span className="font-mono text-gray-500 font-bold uppercase">Destination</span>
                <span className="font-mono font-black text-popBlue">Dual AI Arena Workspace</span>
              </div>
            </div>

            <div className="w-full bg-gray-100 border-2 border-black rounded-full h-3 overflow-hidden shadow-neo-sm mb-2">
              <div className="bg-popYellow h-full border-r-2 border-black animate-progress-fill"></div>
            </div>
            <span className="text-[11px] font-mono font-bold text-gray-500">
              Entering Arena in 1s...
            </span>
          </div>
        ) : !showFaceCapture ? (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
              />
              {errors.username && <span className="error">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Continue to Biometrics →"}
            </button>

            <p className="auth-link">
              Don't have an account?{" "}
              <Link to="/register" className="link">
                Register Free
              </Link>
            </p>
            <Link to="/" className="auth-home-link">
              ← Back to Arena Home
            </Link>
          </form>
        ) : failedAttempts ? (
          /* Graceful Fallback screen when 2 attempts fail */
          <div className="face-fallback-step">
            <div className="fallback-warning-badge">
              <FaShieldHalved className="text-xl text-amber-600" />
            </div>
            <h2 className="fallback-title">Biometric Limit Reached</h2>
            <p className="fallback-desc">
              {failureReason || "Your face could not be verified after 2 attempts. For your security, choose an option below:"}
            </p>

            <div className="flex flex-col gap-2 w-full mt-3">
              <button
                type="button"
                className="auth-button primary flex items-center justify-center gap-2"
                onClick={handlePasswordBypass}
              >
                <FaKey className="text-xs" /> Sign In with Password Only
              </button>

              <button
                type="button"
                className="auth-button secondary flex items-center justify-center gap-2"
                onClick={() => {
                  setFailedAttempts(false);
                  setAttempt(1);
                }}
              >
                <FaArrowRotateRight className="text-xs" /> Try Biometrics Again
              </button>

              <button
                type="button"
                className="auth-home-link mt-1"
                onClick={() => setShowFaceCapture(false)}
              >
                ← Back to Credentials
              </button>
            </div>
          </div>
        ) : (
          /* Face Capture Step */
          <div className="face-auth-step">
            <FaceCapture
              onCapture={verifyFace}
              currentAttempt={attempt}
              maxAttempts={2}
              isRegistration={false}
            />

            <button
              type="button"
              className="auth-button secondary back mt-3"
              onClick={() => setShowFaceCapture(false)}
              disabled={loading}
            >
              <FaArrowLeft className="text-xs mr-1.5 inline" /> Back to Credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
