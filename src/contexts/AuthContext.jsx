import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("authUser");
      }
    }
    setLoading(false);
  }, []);

  const login = (userRecord) => {
    // Store user in state and localStorage (excluding sensitive data)
    const userToStore = {
      username: userRecord.username,
      // Add any other non-sensitive user data here
    };
    setUser(userToStore);
    localStorage.setItem("authUser", JSON.stringify(userToStore));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authUser");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}