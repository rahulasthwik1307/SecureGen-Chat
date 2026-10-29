import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { animate, stagger } from "animejs";
import "./App.css";
import ChatMessage from "./components/ChatMessage";
import ChatHistory from "./components/ChatHistory";
import VoiceButton from "./components/VoiceButton";
import { generateLlamaResponse, generateDeepseekResponse } from "./utils/api";
import sendIcon from "./assets/send-icon.svg";
import { useAuth } from "./contexts/AuthContext";
import useUserChat from "./hooks/useUserChat";
import Logout from "./components/Logout";
import { saveChatSession, getChatSessionById, updateChatSession } from "./db/db";
import { 
  FaBoltLightning, 
  FaFire,
  FaTrash, 
  FaShareNodes, 
  FaDownload,
  FaPlus, 
  FaHouse, 
  FaBolt, 
  FaBrain, 
  FaMoon, 
  FaSun,
  FaCheck,
  FaArrowDown,
  FaTrophy
} from "react-icons/fa6";

const STARTER_PROMPTS = [
  { icon: "🌌", text: "Explain black holes in simple words" },
  { icon: "🍕", text: "Write a playful poem about a pizza-cooking robot" },
  { icon: "🦖", text: "Who would win: T-Rex vs Megalodon?" },
  { icon: "💻", text: "Code a bouncing ball in Python" },
  { icon: "🛸", text: "What should I feed a pet alien from Mars?" },
];

// Lightweight self-cleaning Anime.js celebration particle burst
function triggerCelebrationBurst(originX, originY) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = `${originX || window.innerWidth / 2}px`;
  container.style.top = `${originY || 80}px`;
  container.style.pointerEvents = "none";
  container.style.zIndex = "9999";
  document.body.appendChild(container);

  const icons = ["🏆", "⚡", "✨", "🔥", "⭐", "🎉", "👑"];
  const count = 14;
  const elements = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.innerText = icons[i % icons.length];
    el.style.position = "absolute";
    el.style.fontSize = `${16 + Math.random() * 12}px`;
    el.style.userSelect = "none";
    container.appendChild(el);
    elements.push(el);
  }

  animate(elements, {
    translateX: () => (Math.random() - 0.5) * 180,
    translateY: () => -30 - Math.random() * 100,
    scale: [0.2, 1.25, 0.4],
    opacity: [1, 1, 0],
    rotate: () => (Math.random() - 0.5) * 120,
    duration: 800,
    ease: "outExpo",
    onComplete: () => {
      container.remove();
    }
  });
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const { user } = useAuth();
  const [chatHistory, setChatHistory, clearChat, chatLoading] = useUserChat(
    user?.username,
    []
  );
  const [currentChat, setCurrentChat] = useState([
    {
      id: Date.now(),
      content: {
        llama: "Welcome to the Dual AI Arena! Ask any question, and both Qwen 3.8 (Fast) and OpenAI GPT-OSS (Reasoning) will generate side-by-side answers simultaneously.",
        deepseek: "",
        showSingle: true
      },
      isUser: false,
      isHistory: true,
      winner: null
    },
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Animation Refs
  const scoreboardRef = useRef(null);
  const sendBtnRef = useRef(null);

  // Scoreboard calculation
  const qwenWins = currentChat.filter(m => m.winner === 'llama').length;
  const gptWins = currentChat.filter(m => m.winner === 'deepseek').length;
  const duelRounds = currentChat.filter(m => m.isUser).length;

  // Anime.js interactive tactile send animation
  const triggerSendAnimation = () => {
    if (sendBtnRef.current) {
      animate(sendBtnRef.current, {
        scale: [1, 0.82, 1.15, 1],
        rotate: [0, -10, 8, 0],
        duration: 380,
        ease: "outElastic"
      });
    }
  };

  // Toggle winner vote for a round with Anime.js celebration
  const handleVoteWinner = useCallback((messageId, modelKey, clickEvent) => {
    setCurrentChat(prevChat =>
      prevChat.map(msg => {
        if (msg.id === messageId) {
          const newWinner = msg.winner === modelKey ? null : modelKey;
          if (newWinner) {
            // Animate scoreboard pill in header
            if (scoreboardRef.current) {
              animate(scoreboardRef.current, {
                scale: [1, 1.15, 0.96, 1.04, 1],
                duration: 450,
                ease: "outBack"
              });
            }

            // Spawn celebration particles
            const x = clickEvent?.clientX || window.innerWidth / 2;
            const y = clickEvent?.clientY || 100;
            triggerCelebrationBurst(x, y);
          }
          return { ...msg, winner: newWinner };
        }
        return msg;
      })
    );
  }, []);

  // Stagger in starter chips on initial mount with Anime.js
  useEffect(() => {
    if (currentChat.length <= 1) {
      animate('.starter-chip', {
        translateY: [16, 0],
        opacity: [0, 1],
        delay: stagger(50),
        duration: 380,
        ease: "outBack"
      });
    }
  }, [currentChat.length]);

  // Safety Measures
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

  // Load chat history when user changes or on page reload
  useEffect(() => {
    if (chatHistory.length > 0 && !chatLoading && !currentChatId) {
      setCurrentChat(chatHistory.map(msg => ({ ...msg, isHistory: true })));
    }
  }, [chatHistory, chatLoading, currentChatId]);

  const handleSubmitWithText = useCallback(async (textToSubmit) => {
    const query = (textToSubmit || prompt).trim();
    if (!query) return;

    triggerSendAnimation();

    // Reset textarea height
    const textarea = document.querySelector('.chatbot_input textarea');
    if (textarea) textarea.style.height = '40px';

    const userMessageId = Date.now();
    const botMessageId = userMessageId + 1;

    const updatedChat = [
      ...currentChat,
      { id: userMessageId, content: query, isUser: true },
      {
        id: botMessageId,
        content: { llama: "", deepseek: "", showSingle: false },
        isUser: false,
        loading: true,
        winner: null
      }
    ];

    setPrompt("");
    setCurrentChat(updatedChat);
    setLoadingId(botMessageId);

    try {
      let llamaResponse, deepseekResponse;
      
      try {
        llamaResponse = await generateLlamaResponse(query);
      } catch (llamaError) {
        console.error("LLaMA API error:", llamaError);
        llamaResponse = "⚠️ Failed to fetch LLaMA response";
      }
      
      try {
        deepseekResponse = await generateDeepseekResponse(query);
      } catch (deepseekError) {
        console.error("DeepSeek API error:", deepseekError);
        deepseekResponse = "⚠️ Failed to fetch DeepSeek response";
      }

      const finalChat = updatedChat.map(item =>
        item.id === botMessageId ? {
          ...item,
          content: {
            llama: llamaResponse,
            deepseek: deepseekResponse,
            showSingle: false
          },
          loading: false,
          isHistory: false
        } : {
          ...item,
          isHistory: true
        }
      );

      setCurrentChat(finalChat);
      
      if (user?.username) {
        try {
          if (currentChatId) {
            await updateChatSession(currentChatId, finalChat);
          } else {
            const { id } = await saveChatSession(user.username, finalChat);
            setCurrentChatId(id);
          }
        } catch (dbError) {
          console.error("Error saving chat session:", dbError);
        }
      }

    } catch (error) {
      console.error("General error in handleSubmit:", error);
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
    } finally {
      setLoadingId(null);
    }
  }, [currentChat, prompt, user?.username, currentChatId]);

  const handleSubmit = useCallback(() => {
    handleSubmitWithText(prompt);
  }, [handleSubmitWithText, prompt]);

  // Click physics for starter chips
  const handleChipClick = (e, text) => {
    const chipEl = e.currentTarget;
    animate(chipEl, {
      scale: [1, 0.92, 1.05, 1],
      duration: 220,
      ease: "outBack",
      onComplete: () => {
        handleSubmitWithText(text);
      }
    });
  };

  const startNewChat = () => {
    const newChat = [{
      id: Date.now(),
      content: {
        llama: "Welcome to the Dual AI Arena! Ask any question, and both Qwen 3.8 (Fast) and OpenAI GPT-OSS (Reasoning) will generate side-by-side answers simultaneously.",
        deepseek: "",
        showSingle: true
      },
      isUser: false,
      isHistory: true,
      winner: null
    }];
    setCurrentChat(newChat);
    setCurrentChatId(null);
    setIsSidebarOpen(false);
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear this entire duel conversation?")) {
      await clearChat();
      startNewChat();
    }
  };

  const handleSelectChat = async (chatId) => {
    if (chatId === currentChatId) return;
    try {
      const session = await getChatSessionById(chatId);
      if (session) {
        const messagesWithHistoryFlag = session.messages.map(msg => ({
          ...msg,
          isHistory: true
        }));
        setCurrentChat(messagesWithHistoryFlag);
        setCurrentChatId(chatId);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading chat session:", error);
    }
  };

  useEffect(() => {
    const container = document.querySelector('.chatbot_response_container');
    if (container) container.scrollTop = container.scrollHeight;
  }, [currentChat]);

  // Throttled scroll handler using requestAnimationFrame to prevent scroll lag and 60fps frame drops
  const scrollRafRef = useRef(null);
  const handleScroll = useCallback((e) => {
    if (scrollRafRef.current) return;
    const target = e.currentTarget;
    scrollRafRef.current = requestAnimationFrame(() => {
      const { scrollTop, scrollHeight, clientHeight } = target;
      const shouldShow = scrollHeight - scrollTop - clientHeight > 220;
      setShowScrollBottom(prev => prev !== shouldShow ? shouldShow : prev);
      scrollRafRef.current = null;
    });
  }, []);

  // Quick clipboard copy
  const handleShareChat = useCallback(() => {
    const formattedChat = currentChat.map(message => {
      if (message.isUser) {
        return `👤 You: ${message.content}`;
      } else {
        const llamaAns = message.content?.llama || "";
        const deepseekAns = message.content?.deepseek || "";
        const winnerNote = message.winner ? `\n🏆 Winner: ${message.winner === 'llama' ? 'Qwen 3.8' : 'GPT-OSS 120B'}` : '';
        return `⚡ Qwen 3.8: ${llamaAns}\n\n🧠 GPT-OSS 120B: ${deepseekAns}${winnerNote}`;
      }
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(formattedChat)
      .then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      });
  }, [currentChat]);

  // Download entire duel transcript as a Markdown (.md) document
  const handleDownloadChat = useCallback(() => {
    const formattedChat = currentChat.map(message => {
      if (message.isUser) {
        return `### 👤 Question\n${message.content}`;
      } else {
        const llamaAns = message.content?.llama || "";
        const deepseekAns = message.content?.deepseek || "";
        const winnerNote = message.winner 
          ? `\n\n> 🏆 **Round Winner:** ${message.winner === 'llama' ? 'Qwen 3.8 27B' : 'OpenAI GPT-OSS 120B'}` 
          : '';
        return `#### ⚡ Qwen 3.8 27B (Fast)\n${llamaAns}\n\n#### 🧠 OpenAI GPT-OSS 120B (Reasoning)\n${deepseekAns}${winnerNote}`;
      }
    }).join('\n\n---\n\n');

    const header = `# 🥊 Dual AI Arena Duel Transcript\nDate: ${new Date().toLocaleString()}\nScoreboard: Qwen 3.8 (${qwenWins} wins) vs GPT-OSS 120B (${gptWins} wins)\nTotal Rounds: ${duelRounds}\n\n---\n\n`;
    const fullDoc = header + formattedChat;

    const blob = new Blob([fullDoc], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dual-arena-duel-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }, [currentChat, qwenWins, gptWins, duelRounds]);

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? "Close Sidebar" : "Open History & Settings"}
        aria-label="Toggle Navigation Sidebar"
      >
        {isSidebarOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="flex flex-col gap-2">
          {/* User Profile Card */}
          {user && (
            <div className="bg-popYellow border-2 border-black rounded-xl p-3 shadow-neo-sm mb-2">
              <div className="text-[11px] font-mono font-bold text-gray-700 uppercase">Logged In As</div>
              <div className="font-display font-black text-base text-black flex items-center gap-1.5">
                <span>👤</span> {user.username}
              </div>
            </div>
          )}

          <button
            onClick={startNewChat}
            className="new-chat-button"
            title="Start a New Duel Chat"
          >
            <FaPlus className="text-xs" />
            <span>New Arena Chat</span>
          </button>

          {currentChat.length > 1 && (
            <button
              onClick={handleDownloadChat}
              className="neo-btn bg-white hover:bg-gray-50 text-black rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-2"
              title="Download duel as Markdown (.md) file"
            >
              <FaDownload className="text-blue-600" /> Download .md
            </button>
          )}

          {currentChat.length > 1 && (
            <button
              onClick={handleShareChat}
              className="neo-btn bg-white hover:bg-gray-50 text-black rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-2"
              title="Copy chat session to clipboard"
            >
              {copiedShare ? <><FaCheck className="text-green-600" /> Copied!</> : <><FaShareNodes /> Export Chat</>}
            </button>
          )}

          {currentChat.length > 1 && (
            <button
              onClick={handleClearChat}
              className="neo-btn bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-2"
              title="Wipe conversation"
            >
              <FaTrash /> Wipe Chat
            </button>
          )}
        </div>
        
        {/* Chat History Component */}
        {isSidebarOpen && user && (
          <ChatHistory 
            username={user.username} 
            onSelectChat={handleSelectChat}
            currentChatId={currentChatId}
          />
        )}
        
        {isSidebarOpen && <Logout />}
      </aside>

      {/* Main Chat Workspace */}
      <main className="main-content">
        <header className="header">
          {/* Brand & Championship Emblem */}
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="heading">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-popYellow via-amber-300 to-popOrange border-3 border-black flex items-center justify-center text-sm shadow-neo-sm transform hover:scale-105 active:scale-95 transition-all text-black shrink-0">
                <FaBoltLightning className="text-base text-black" />
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="tracking-tight font-black font-display text-lg sm:text-xl leading-none">
                    DUAL<span className="text-popPink">.ARENA</span>
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-wider bg-popMint text-black px-1.5 py-0.5 rounded-md border border-black shadow-neo-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    LIVE DUEL
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-gray-500 hidden sm:block">
                  Side-by-Side Model Arena
                </span>
              </div>
            </h1>

            {/* Stadium Matchup & Live Scoreboard Pill with Anime.js Spring Ref */}
            <div ref={scoreboardRef} className="header-matchup-pill">
              <div className="flex items-center gap-1.5">
                <span className="text-popBlue font-extrabold flex items-center gap-1">
                  <FaBolt className="text-popYellow text-[11px]" /> Qwen 3.8
                </span>
                <span className="bg-popBlue text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black border border-black shadow-neo-sm">
                  {qwenWins}
                </span>
              </div>

              <span className="text-popPink font-black px-1 text-xs">VS</span>

              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black border border-black shadow-neo-sm">
                  {gptWins}
                </span>
                <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                  <FaBrain className="text-emerald-600 text-[11px]" /> GPT-OSS 120B
                </span>
              </div>

              {duelRounds > 0 && (
                <span className="ml-1 text-[9px] font-mono font-black uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-400">
                  R{duelRounds}
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="header-actions">
            {/* Quick New Duel Action */}
            <button
              onClick={startNewChat}
              className="header-quick-btn"
              title="Start a fresh arena duel"
              aria-label="New Duel"
            >
              <FaPlus className="text-xs" />
              <span className="hidden sm:inline">New Duel</span>
            </button>

            {/* Direct Download Transcript as Markdown (.md) */}
            {currentChat.length > 1 && (
              <button
                onClick={handleDownloadChat}
                className="header-action-btn"
                title="Download full duel transcript as Markdown (.md)"
                aria-label="Download Markdown"
              >
                <FaDownload className="text-xs text-blue-600 dark:text-blue-400" />
              </button>
            )}

            {/* Quick Share / Export Action */}
            {currentChat.length > 1 && (
              <button
                onClick={handleShareChat}
                className="header-action-btn"
                title="Copy duel transcript to clipboard"
                aria-label="Share duel"
              >
                {copiedShare ? <FaCheck className="text-emerald-500 text-xs" /> : <FaShareNodes className="text-xs" />}
              </button>
            )}

            {/* Direct Clear Chat Action in Header */}
            {currentChat.length > 1 && (
              <button
                onClick={handleClearChat}
                className="header-action-btn text-rose-600 hover:bg-rose-50"
                title="Wipe conversation"
                aria-label="Clear chat"
              >
                <FaTrash className="text-xs" />
              </button>
            )}

            <Link
              to="/"
              className="header-action-btn"
              title="Return to Home Landing Page"
              aria-label="Home"
            >
              <FaHouse className="text-xs" />
            </Link>

            <button
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Switch to Vibrant Pop Mode" : "Switch to Dark Neo Mode"}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <FaSun className="text-popYellow text-sm" /> : <FaMoon className="text-sm" />}
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <div className="chatbot_container">
          <div 
            className="chatbot_response_container"
            onScroll={handleScroll}
          >
            {currentChat.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                isLoading={message.id === loadingId}
                isDarkMode={isDarkMode}
                isHistory={message.isHistory || false}
                winner={message.winner || null}
                onVoteWinner={(modelKey, e) => handleVoteWinner(message.id, modelKey, e)}
              />
            ))}

            {/* Floating Jump-to-Bottom Pill */}
            {showScrollBottom && (
              <button
                type="button"
                onClick={() => {
                  const container = document.querySelector('.chatbot_response_container');
                  if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }}
                className="scroll-bottom-fab"
                title="Jump to latest message"
                aria-label="Scroll to bottom"
              >
                <FaArrowDown className="text-xs" />
                <span>Latest</span>
              </button>
            )}

            {/* Prompt Starter Chips for instant interaction */}
            {currentChat.length <= 1 && (
              <div className="starter-chips-container">
                <div className="w-full text-center text-xs font-mono font-bold text-gray-500 mb-1">
                  ⚡ TAP TO TRY A PRESET QUESTION:
                </div>
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleChipClick(e, item.text)}
                    className="starter-chip"
                  >
                    <span className="mr-1.5">{item.icon}</span>
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Input Bar at Bottom */}
        <div className={`chatbot_input${isSidebarOpen ? ' sidebar-open' : ''}`}>
          <div className="input-row">
            <textarea
              rows={1}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask anything... Qwen 3.8 and GPT-OSS 120B duel in real-time!"
              aria-label="Chat input message"
            />
            
            <VoiceButton 
              prompt={prompt}
              setPrompt={setPrompt}
              disabled={!!loadingId}
            />

            <button
              ref={sendBtnRef}
              className="send-pill"
              onClick={handleSubmit}
              aria-label="Send prompt"
              disabled={!prompt.trim() || !!loadingId}
            >
              <img src={sendIcon} alt="Send" className="send-icon" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
