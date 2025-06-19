import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";
import FaceCapture from "./FaceCapture";
import { db } from "../db/db";
import * as faceapi from "face-api.js";
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
      newErrors.username = "Username must be at least 3 characters";
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
        toast.error("Username already exists. Please sign in.");
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
      // duplicate face check...
      const all = await db.users.toArray();
      const dup = all.some((user) => {
        if (!user.faceDescriptor) return false;
        const stored = new Float32Array(user.faceDescriptor);
        return faceapi.euclideanDistance(stored, descriptor) < 0.5;
      });
      if (dup) {
        toast.error("Face already registered with another user.");
        setShowFaceCapture(false);
        return;
      }
      const hash = await bcrypt.hash(formData.password, 10);
      await db.users.add({
        username: formData.username,
        passwordHash: hash,
        faceDescriptor: Array.from(descriptor),
      });
      toast.success("Registration successful! Redirecting to login...");
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
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">
          Secure your account with face authentication
        </p>

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
                placeholder="Choose a username"
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
                placeholder="Enter a password"
                required
              />
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
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
              {loading ? "Processing…" : "Continue"}
            </button>

            <p className="auth-link">
              Already have an account?{" "}
              <Link to="/login" className="link">
                Sign In
              </Link>
            </p>
          </form>
        ) : (
          <div className="face-auth-step">
            <h2>Face Registration</h2>
            <p>Please look at the camera to register your face.</p>
            <FaceCapture
              onCapture={handleFaceCapture}
              buttonText={loading ? "Processing…" : "Register Face"}
            />
            <button
              className="auth-button secondary back"
              onClick={() => setShowFaceCapture(false)}
              disabled={loading}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
