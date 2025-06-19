import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";
import FaceCapture from "./FaceCapture";
import { db } from "../db/db";
import { useAuth } from "../contexts/AuthContext";
import { compareFaces } from "../utils/face";
import "../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
        toast.error("Invalid credentials");
        return;
      }
      const ok = await bcrypt.compare(
        formData.password,
        user.passwordHash
      );
      if (!ok) {
        toast.error("Invalid credentials");
        return;
      }
      setCurrentUser(user);
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
        toast.error("Missing stored face data");
        return;
      }
      const stored = new Float32Array(currentUser.faceDescriptor);
      const { isMatch } = compareFaces(stored, descriptor);
      if (isMatch) {
        login(currentUser);
        toast.success("Login successful! Redirecting…");
        navigate("/chat");
      } else {
        toast.error("Face verification failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Face verification error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" role="main">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to continue to your chat</p>

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
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? "Processing…" : "Sign In"}
            </button>

            <p className="auth-link">
              Don't have an account?{" "}
              <Link to="/register" className="link">
                Register
              </Link>
            </p>
          </form>
        ) : (
          <div className="face-auth-step">
            <h2>Face Verification</h2>
            <p>Please look at the camera to verify you.</p>
            <FaceCapture
              onCapture={verifyFace}
              buttonText={loading ? "Processing…" : "Verify Face"}
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

export default Login;
