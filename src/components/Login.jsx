import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";
import FaceCapture from "./FaceCapture";
import { db } from "../db/db";
import { useAuth } from "../contexts/AuthContext";
import { compareFaces, loadModels } from "../utils/face";
import { FaShieldHalved, FaKey, FaArrowRotateRight, FaArrowLeft } from "react-icons/fa6";
import "../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
        login(currentUser);
        toast.success(`Face verified! Welcome back, ${currentUser.username}`);
        navigate("/chat");
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
          <div className="auth-logo-badge">
            ⚡
          </div>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Dual AI Arena Secure Sign-In</p>

        {!showFaceCapture ? (
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
              buttonText={loading ? "Verifying..." : "Verify Face Now"}
              currentAttempt={attempt}
              maxAttempts={2}
              isRegistration={false}
            />

            <button
              type="button"
              className="auth-button secondary back mt-2"
              onClick={() => setShowFaceCapture(false)}
              disabled={loading}
            >
              <FaArrowLeft className="text-xs mr-1 inline" /> Back to Credentials
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
