import React from "react";
import { useAuth } from "../contexts/AuthContext";
import "./Logout.css";

const Logout = () => {
  const { logout } = useAuth();

  return (
    <button 
      className="logout-button" 
      onClick={logout}
      aria-label="Logout"
    >
      Logout
    </button>
  );
};

export default Logout;