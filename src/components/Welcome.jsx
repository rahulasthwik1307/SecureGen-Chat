import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Auth.css";
// Inside Welcome.jsx
import '@fortawesome/fontawesome-free/css/all.min.css';


const Welcome = () => {
  useEffect(() => {
    // Typing animation
    const chatBubbles = document.querySelectorAll('.chat-bubble p');
    chatBubbles.forEach((bubble) => {
      const text = bubble.textContent;
      bubble.textContent = '';
      let i = 0;
      const typing = setInterval(() => {
        if (i < text.length) {
          bubble.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(typing);
        }
      }, 30);
    });

    // Disable scrolling on mount
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling on unmount
    return () => {
      document.body.style.overflow = 'visible';
    };
  }, []);

  return (
    <div className="welcome-page">
      <div className="gradient-bg min-h-screen font-sans overflow-hidden">
        <div className="container mx-auto px-4 pt-6 md:pt-10 pb-8 relative">
          {/* Navbar */}
          <nav className="flex justify-between items-center mb-16 relative pt-2 md:pt-0">
            {/* Centered Title + Icon */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <i className="fas fa-robot text-3xl"></i>
              </div>
              <span className="text-4xl md:text-5xl font-extrabold text-gray-800">Dual AI</span>
            </div>

            {/* Top-right buttons */}
            <div className="flex space-x-4 ml-auto">
              <Link to="/register" className="btn-hover bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full transition-all duration-300 shadow-md text-sm md:text-base">
                Sign Up - It's Free
              </Link>
              <Link to="/login" className="btn-hover bg-white hover:bg-gray-50 text-blue-500 font-semibold py-2 px-6 rounded-full border border-blue-200 transition-all duration-300 shadow-md text-sm md:text-base">
                Sign In
              </Link>
            </div>
          </nav>

          {/* Main Section */}
          <main className="flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden">
            {/* Left Content */}
            <div className="md:w-1/2 ml-8"> 
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight ml-12">
                Welcome to <span className="gradient-text">Dual AI Chatbot!</span>
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-lg ml-12">
                Experience the future of conversation with our intelligent dual AI system. 
                Get instant, accurate responses powered by cutting-edge artificial intelligence 
                that understands context and delivers human-like interactions.
              </p>
            </div>

            {/* Right Chat Card */}
            <div className="md:w-1/2 relative overflow-hidden">
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-blue-100 opacity-50 blur-xl"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-purple-100 opacity-50 blur-xl"></div>
                
                <div className="relative bg-white p-6 rounded-3xl shadow-xl max-w-md mx-auto overflow-hidden">
                  <div className="flex space-x-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>

                  <div className="space-y-4 overflow-hidden">
                    <div className="chat-bubble bg-blue-100 text-gray-800 ml-0">
                      <p>Hi there! I'm your Dual AI assistant. How can I help you today?</p>
                      <div className="absolute -bottom-1 left-4 w-4 h-4 bg-blue-100 transform rotate-45"></div>
                    </div>
                    <div className="chat-bubble bg-purple-100 text-gray-800 mr-0 ml-auto">
                      <p>Can you explain how the dual AI system works?</p>
                      <div className="absolute -bottom-1 right-4 w-4 h-4 bg-purple-100 transform rotate-45"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-100 rounded-full py-3 px-4 text-gray-500">
                        Type your message...
                      </div>
                      <button className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Welcome;