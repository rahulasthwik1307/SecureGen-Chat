import { useEffect, useState, useCallback } from "react";
import "./App.css";
import ChatMessage from "./components/ChatMessage";
import VoiceButton from "./components/VoiceButton";
import { generateLlamaResponse, generateDeepseekResponse } from "./utils/api";
import sendIcon from "./assets/send-icon.svg";
import { useAuth } from "./contexts/AuthContext";
import useUserChat from "./hooks/useUserChat";
import Logout from "./components/Logout";

function App() {
  const [prompt, setPrompt] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const { user } = useAuth();
  const [chatHistory, setChatHistory, clearChat, chatLoading, chatError] = useUserChat(
    user?.username,
    []
  );
  const [currentChat, setCurrentChat] = useState([
    {
      id: Date.now(),
      content: {
        llama: "I am a chatbot, ask me anything.",
        deepseek: "",
        showSingle: true
      },
      isUser: false,
    },
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Safety Measures (from first project)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure? Use the Clear Chat button instead. Your conversation will be lost.';
      return e.returnValue;
    };

    const handleKeyDown = (e) => {
      if ((e.key === 'r' && (e.ctrlKey || e.metaKey)) || e.key === 'F5') {
        e.preventDefault();
        alert('Are you sure? Use the Clear Chat button instead. Your conversation will be lost.');
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load chat history when user changes
  useEffect(() => {
    if (chatHistory.length > 0 && !chatLoading) {
      setCurrentChat(chatHistory);
    }
  }, [chatHistory, chatLoading]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;

    // Reset textarea height
    const textarea = document.querySelector('.chatbot_input textarea');
    if (textarea) textarea.style.height = '56px';

    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;

    const updatedChat = [
      ...currentChat,
      { id: userMessageId, content: prompt, isUser: true },
      {
        id: botMessageId,
        content: { llama: "", deepseek: "", showSingle: false },
        isUser: false,
        loading: true
      }
    ];

    setPrompt("");
    setCurrentChat(updatedChat);
    setLoadingId(botMessageId);

    try {
      const [llamaResponse, deepseekResponse] = await Promise.all([
        generateLlamaResponse(prompt),
        generateDeepseekResponse(prompt)
      ]);

      const finalChat = updatedChat.map(item =>
        item.id === botMessageId ? {
          ...item,
          content: {
            llama: llamaResponse,
            deepseek: deepseekResponse,
            showSingle: false
          },
          loading: false
        } : item
      );

      setCurrentChat(finalChat);
      setChatHistory(finalChat);

    } catch (error) {
      const finalChat = updatedChat.map(item =>
        item.id === botMessageId ? {
          ...item,
          content: {
            llama: "⚠️ Failed to fetch response",
            deepseek: "⚠️ Failed to fetch response",
            showSingle: false
          },
          loading: false
        } : item
      );
      setCurrentChat(finalChat);
    }

    setLoadingId(null);
  }, [currentChat, prompt, setChatHistory]);

  const startNewChat = () => {
    const newChat = [{
      id: Date.now(),
      content: {
        llama: "I am a chatbot, ask me anything.",
        deepseek: "",
        showSingle: true
      },
      isUser: false
    }];
    setCurrentChat(newChat);
    setChatHistory(newChat);
    setIsSidebarOpen(false);
  };

  const handleClearChat = async () => {
    await clearChat();
    startNewChat();
  };

  useEffect(() => {
    const container = document.querySelector('.chatbot_response_container');
    if (container) container.scrollTop = container.scrollHeight;
  }, [currentChat]);

  const handleShareChat = useCallback(() => {
    const formattedChat = currentChat.map(message => {
      if (message.isUser) {
        return `👤 You: ${message.content}`;
      } else {
        return `🤖 LLaMA: ${message.content.llama}\n🤖 DeepSeek: ${message.content.deepseek}`;
      }
    }).join('\n\n');

    navigator.clipboard.writeText(formattedChat)
      .then(() => alert('✅ Chat copied to clipboard!'));
  }, [currentChat]);

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {isSidebarOpen ? "✕" : "☰"}
      </div>

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="flex justify-start items-center gap-3 px-2">
          <button
            onClick={startNewChat}
            className="new-chat-button"
            title="Start a New Chat"
          >
            💬
          </button>
          {currentChat.length > 1 && (
            <button
              onClick={handleShareChat}
              className="new-chat-button"
              title="Share Chat"
              aria-label="Copy chat to clipboard"
            >
              📋
            </button>
          )}
        </div>
        {isSidebarOpen && <Logout />}
      </div>

      <div className="main-content">
        <header className="header">
          <h1 className="heading">AI Chat Bot {user && `(${user.username})`}</h1>
          <div
            className="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? "🌙" : "☀️"}
          </div>
        </header>

        <div className="chatbot_container">
          <div className="chatbot_response_container">
            {currentChat.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                isLoading={message.id === loadingId}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>

        <div className={`chatbot_input${isSidebarOpen ? ' sidebar-open' : ''}`}>
          <div className="input-row">
            <textarea
              rows={1}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Enter your question..."
            />
            <VoiceButton 
              prompt={prompt}
              setPrompt={setPrompt}
              disabled={!!loadingId}
            />
            <button
              className="send-pill"
              onClick={handleSubmit}
              aria-label="Send"
              style={{ padding: 0, border: 'none' }}
            >
              <img src={sendIcon} alt="Send" className="send-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;