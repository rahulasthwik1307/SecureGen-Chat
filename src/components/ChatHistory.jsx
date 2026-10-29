import React, { useState, useEffect } from "react";
import { getChatSessions, deleteChatSession } from "../db/db";
import { FaTrash, FaComments, FaClock, FaLayerGroup } from "react-icons/fa6";

const ChatHistory = ({ username, onSelectChat, currentChatId }) => {
  const [chatSessions, setChatSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChatSessions = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const sessions = await getChatSessions(username);
        // Sort descending by timestamp
        const sorted = (sessions || []).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setChatSessions(sorted);
      } catch (err) {
        console.error("Failed to load chat sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChatSessions();
  }, [username]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  const getPreviewText = (messages) => {
    if (!messages || messages.length === 0) return "Empty duel session";
    
    // Find the first user message
    const userMessage = messages.find(msg => msg.isUser);
    if (userMessage) {
      const text = typeof userMessage.content === "string" 
        ? userMessage.content 
        : "Duel Arena session";
      
      return text.length > 34 ? text.substring(0, 34) + "..." : text;
    }
    
    return "Duel Arena session";
  };

  const handleDeleteChat = async (e, id) => {
    e.stopPropagation(); // Prevent triggering parent onClick
    try {
      await deleteChatSession(id);
      setChatSessions(prev => prev.filter(chat => chat.id !== id));
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  if (loading) {
    return (
      <div className="chat-history-container">
        <div className="p-4 text-center text-xs font-mono font-bold text-gray-500 animate-pulse">
          Loading history...
        </div>
      </div>
    );
  }

  return (
    <div className="chat-history-container">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="chat-history-title flex items-center gap-1.5">
          <FaLayerGroup className="text-xs text-popBlue" />
          <span>Arena Duels</span>
        </h3>
        <span className="text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 text-black dark:text-white px-2 py-0.5 rounded-full border border-black shadow-neo-sm">
          {chatSessions.length}
        </span>
      </div>

      <div className="chat-history-list">
        {chatSessions.length === 0 ? (
          <div className="no-history-card">
            <FaClock className="text-2xl text-gray-400 mb-1.5" />
            <div className="font-bold text-xs text-gray-700 dark:text-gray-300">No duel history yet</div>
            <div className="text-[10px] text-gray-500 mt-0.5 font-mono">Ask a question to record your first arena match!</div>
          </div>
        ) : (
          chatSessions.map((chat) => {
            const isActive = currentChatId === chat.id;
            return (
              <div 
                key={chat.id}
                className={`chat-history-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
                title={getPreviewText(chat.messages)}
              >
                <div className="chat-preview flex items-start gap-2 overflow-hidden flex-1">
                  <FaComments className={`text-xs mt-1 shrink-0 ${isActive ? 'text-black' : 'text-popBlue'}`} />
                  <div className="overflow-hidden flex-1">
                    <div className="chat-preview-text truncate">{getPreviewText(chat.messages)}</div>
                    <div className="chat-preview-date">{formatDate(chat.timestamp)}</div>
                  </div>
                </div>

                <button 
                  type="button"
                  className="delete-chat-btn"
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  title="Delete this duel"
                  aria-label="Delete duel"
                >
                  <FaTrash className="text-[10px]" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
