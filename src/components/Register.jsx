import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";
import FaceCapture from "./FaceCapture";
import DualArenaLogo from "./DualArenaLogo";
import { db } from "../db/db";
import { loadModels } from "../utils/face";
import * as faceapi from "face-api.js";
import { FaArrowLeft, FaCircleCheck } from "react-icons/fa6";
import "../styles/Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  // Pre-load face models silently in background
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
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Must be at least 3 characters";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const exists = await db.users.get(formData.username);
      if (exists) {
        toast.error("Username already registered. Please sign in.");
        navigate("/login");
        return;
      }
      setShowFaceCapture(true);
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = async (descriptor) => {
    setLoading(true);
    try {
      // Check for duplicate face across registered users
      const all = await db.users.toArray();
      const dup = all.some((user) => {
        if (!user.faceDescriptor) return false;
        const stored = new Float32Array(user.faceDescriptor);
        return faceapi.euclideanDistance(stored, descriptor) < 0.5;
      });

      if (dup) {
        toast.error("This face is already registered with another account.");
        setShowFaceCapture(false);
        return;
      }

      const hash = await bcrypt.hash(formData.password, 10);
      await db.users.add({
        username: formData.username,
        passwordHash: hash,
        faceDescriptor: Array.from(descriptor),
      });

      setRegistrationSuccess({
        username: formData.username
      });
      toast.success("Account & Face Registration successful! Redirecting...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" role="main">
        {/* Compact Logo Mark */}
        <div className="auth-badge-row">
          <DualArenaLogo size={36} />
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Dual AI Arena Face-Protected Profile</p>

        {registrationSuccess ? (
          <div className="biometric-success-screen message-enter">
            <div className="success-badge-container">
              <div className="w-16 h-16 bg-popYellow border-3 border-black rounded-2xl flex items-center justify-center text-3xl text-black shadow-neo mx-auto mb-3 animate-bounce-short">
                <FaCircleCheck className="text-3xl text-black" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-popYellow rounded-full text-[11px] font-mono font-black uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-popYellow animate-ping"></span>
              ENROLLMENT COMPLETE
            </span>

            <h3 className="font-display font-black text-2xl text-black mb-1">
              FACE PROFILE REGISTERED!
            </h3>
            <p className="text-xs text-gray-600 font-medium max-w-xs mx-auto mb-5 leading-relaxed">
              Biometric face key enrolled for <span className="font-bold text-black font-mono">"{registrationSuccess.username}"</span>.
            </p>

            <div className="bg-[#FFFDF6] border-2 border-black rounded-2xl p-4 shadow-neo-sm mb-5 text-left">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-200 text-xs">
                <span className="font-mono text-gray-500 font-bold uppercase">Biometric Hash</span>
                <span className="font-mono font-black text-emerald-600">128D Face Descriptor Stored</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-200 text-xs">
                <span className="font-mono text-gray-500 font-bold uppercase">Protection</span>
                <span className="font-mono font-black text-black">Active & Protected ✓</span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-xs">
                <span className="font-mono text-gray-500 font-bold uppercase">Next Step</span>
                <span className="font-mono font-black text-popBlue">Face-Protected Sign In</span>
              </div>
            </div>

            <div className="w-full bg-gray-100 border-2 border-black rounded-full h-3 overflow-hidden shadow-neo-sm mb-2">
              <div className="bg-popMint h-full border-r-2 border-black animate-progress-fill"></div>
            </div>
            <span className="text-[11px] font-mono font-bold text-gray-500">
              Redirecting to Sign In in 1s...
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
                placeholder="Choose your handle"
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
                placeholder="Create password"
                required
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
              {errors.confirmPassword && (
                <span className="error">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? "Processing..." : "Continue to Face Scan →"}
            </button>

            <p className="auth-link">
              Already have an account?{" "}
              <Link to="/login" className="link">
                Sign In
              </Link>
            </p>
            <Link to="/" className="auth-home-link">
              ← Back to Arena Home
            </Link>
          </form>
        ) : (
          <div className="face-auth-step">
            <FaceCapture
              onCapture={handleFaceCapture}
              isRegistration={true}
            />

            <button
              type="button"
              className="auth-button secondary back mt-3"
              onClick={() => setShowFaceCapture(false)}
              disabled={loading}
            >
              <FaArrowLeft className="text-xs mr-1.5 inline" /> Back to Account Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
