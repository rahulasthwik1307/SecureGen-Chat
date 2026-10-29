import React, { useState, useEffect } from "react";
import { getChatSessions, deleteChatSession } from "../db/db";

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
        setChatSessions(sessions);
      } catch (err) {
        console.error("Failed to load chat sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChatSessions();
  }, [username]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const getPreviewText = (messages) => {
    if (!messages || messages.length === 0) return "Empty chat";
    
    // Find the first user message
    const userMessage = messages.find(msg => msg.isUser);
    if (userMessage) {
      const text = typeof userMessage.content === "string" 
        ? userMessage.content 
        : "Chat session";
      
      return text.length > 30 ? text.substring(0, 30) + "..." : text;
    }
    
    return "Chat session";
  };

  const handleDeleteChat = async (e, id) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    await deleteChatSession(id);
    setChatSessions(chatSessions.filter(chat => chat.id !== id));
  };

  if (loading) {
    return <div className="chat-history-loading">Loading...</div>;
  }

  return (
    <div className="chat-history-container">
      <h3 className="chat-history-title">Chat History</h3>
      <div className="chat-history-list">
        {chatSessions.length === 0 ? (
          <div className="no-history">No chat history</div>
        ) : (
          chatSessions.map((chat) => (
            <div 
              key={chat.id}
              className={`chat-history-item ${currentChatId === chat.id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="chat-preview">
                <div className="chat-preview-text">{getPreviewText(chat.messages)}</div>
                <div className="chat-preview-date">{formatDate(chat.timestamp)}</div>
              </div>
              <button 
                className="delete-chat-btn"
                onClick={(e) => handleDeleteChat(e, chat.id)}
                aria-label="Delete chat"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;