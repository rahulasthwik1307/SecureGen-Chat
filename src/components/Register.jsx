import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";
import FaceCapture from "./FaceCapture";
import { db } from "../db/db";
import { loadModels } from "../utils/face";
import * as faceapi from "face-api.js";
import { FaArrowLeft } from "react-icons/fa6";
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

      toast.success("Account & Face Registration successful! Please sign in.");
      navigate("/login");
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
          <div className="auth-logo-badge pink">
            🚀
          </div>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Dual AI Arena Face-Protected Profile</p>

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
              buttonText={loading ? "Registering..." : "Register Face Now"}
              isRegistration={true}
            />

            <button
              type="button"
              className="auth-button secondary back mt-2"
              onClick={() => setShowFaceCapture(false)}
              disabled={loading}
            >
              <FaArrowLeft className="text-xs mr-1 inline" /> Back to Account Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
