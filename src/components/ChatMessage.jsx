import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { animate, stagger } from "animejs";
import DualArenaLogo from "./DualArenaLogo";
import { 
  FaBrain, 
  FaCopy, 
  FaCheck, 
  FaBolt, 
  FaChevronDown,
  FaCode,
  FaVolumeHigh,
  FaVolumeXmark,
  FaTrophy
} from "react-icons/fa6";

// Reliable fallback clipboard copy
function fallbackCopyText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.error("Fallback copy failed", err);
  }
  document.body.removeChild(textArea);
}

// Auto-close open markdown blocks during typewriter streaming so markdown never flashes raw
function normalizeStreamingMarkdown(text) {
  if (!text) return "";
  let clean = text;

  // Auto-close unclosed <think> tag during live stream
  const thinkOpenCount = (clean.match(/<think>/g) || []).length;
  const thinkCloseCount = (clean.match(/<\/think>/g) || []).length;
  if (thinkOpenCount > thinkCloseCount) {
    clean += "\n</think>\n";
  }

  // Auto-close unclosed code blocks
  const codeBlockCount = (clean.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    clean += "\n```";
  }

  // Auto-close incomplete table line if a table has started
  const lines = clean.split("\n");
  const lastLine = lines[lines.length - 1] || "";
  if (lastLine.trim().startsWith("|") && !lastLine.trim().endsWith("|")) {
    clean += " |";
  }

  // Auto-close unclosed bold
  const boldCount = (clean.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    clean += "**";
  }

  return clean;
}

// Standalone Code Block component with Anime.js tactile copy feedback
const CodeBlock = ({ children, className, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Anime.js punchy tactile spring
    if (e.currentTarget) {
      animate(e.currentTarget, {
        scale: [1, 0.88, 1.08, 1],
        duration: 250,
        ease: "outBack"
      });
    }

    const textToCopy = codeRef.current ? codeRef.current.textContent : "";
    if (!textToCopy) return;

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {
        fallbackCopyText(textToCopy);
      });
    } else {
      fallbackCopyText(textToCopy);
    }
  };

  return (
    <div className="neo-code-container my-4 rounded-xl border-3 border-black bg-[#121216] text-white shadow-neo-sm overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 bg-black border-b-2 border-black text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-popPink border border-black inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-popYellow border border-black inline-block"></span>
          <span className="w-3 h-3 rounded-full bg-popMint border border-black inline-block"></span>
          <span className="text-gray-400 ml-2 font-bold flex items-center gap-1.5 text-[11px]">
            <FaCode className="text-[10px]" /> CODE
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-200 border border-gray-600 flex items-center gap-1.5 text-xs font-bold transition-transform cursor-pointer"
          title="Copy code snippet"
        >
          {copied ? <><FaCheck className="text-emerald-400" /> Copied!</> : <><FaCopy /> Copy Code</>}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-[#141418]">
        <pre ref={codeRef} {...props} className="m-0 p-0 font-mono text-gray-100">{children}</pre>
      </div>
    </div>
  );
};

// Rich, Single-Box Neo-Brutalist Markdown Components: Tables, Headers, Lists, Callouts
const customMarkdownComponents = {
  pre: CodeBlock,
  table: ({ children, ...props }) => (
    <div className="markdown-table-wrapper my-5 w-full overflow-x-auto rounded-2xl border-3 border-black bg-white shadow-neo-sm">
      <table className="w-full text-left text-sm border-collapse min-w-[500px] m-0 border-0 shadow-none rounded-none" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-[#FFDE59] border-b-3 border-black text-black font-display font-black text-xs uppercase tracking-wider" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y-2 divide-black/15 font-medium bg-white" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-amber-50/70 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="py-3 px-4 font-black border-r-2 border-black/20 last:border-r-0 select-none text-black" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="py-3 px-4 text-gray-800 leading-relaxed border-r-2 border-black/10 last:border-r-0 align-top" {...props}>
      {children}
    </td>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="font-display font-black text-xl sm:text-2xl text-black mt-5 mb-3 border-b-3 border-black/15 pb-1.5 flex items-center gap-2" {...props}>
      <span className="w-2.5 h-6 bg-popBlue rounded-full inline-block border border-black"></span>
      <span>{children}</span>
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="font-display font-black text-lg sm:text-xl text-black mt-4 mb-2.5 flex items-center gap-2" {...props}>
      <span className="w-2 h-5 bg-popPink rounded-full inline-block border border-black"></span>
      <span>{children}</span>
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="font-display font-black text-base sm:text-lg text-black mt-3 mb-1.5 flex items-center gap-2" {...props}>
      <span className="w-1.5 h-4 bg-popYellow rounded-full inline-block border border-black"></span>
      <span>{children}</span>
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-2.5 leading-relaxed text-gray-800 text-sm sm:text-base font-normal" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-3 space-y-2 pl-1 list-none" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-3 space-y-2 pl-1 list-decimal list-inside font-medium" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed text-sm sm:text-base text-gray-800 flex items-start gap-2.5 my-1" {...props}>
      <span className="mt-2 w-2 h-2 rounded-full bg-black shrink-0 border border-black"></span>
      <div className="flex-1">{children}</div>
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="my-4 border-2 border-l-6 border-black border-l-popYellow bg-amber-50/80 rounded-r-xl p-4 italic text-gray-800 shadow-neo-sm" {...props}>
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-5 border-t-3 border-black/15" />
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-black text-black bg-amber-100/60 px-1 py-0.5 rounded border border-black/10" {...props}>
      {children}
    </strong>
  ),
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code className="bg-amber-100/90 text-rose-700 font-mono text-xs px-1.5 py-0.5 rounded border border-black/30 font-bold" {...props}>
          {children}
        </code>
      );
    }
    return <code className={className} {...props}>{children}</code>;
  }
};

// Memoized Markdown Renderer so scrolling and sibling re-renders NEVER re-parse markdown AST
const MarkdownRenderer = React.memo(({ content }) => {
  if (!content) return null;
  return (
    <div className="markdown-prose text-sm sm:text-base leading-relaxed text-gray-800">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeHighlight]}
        components={customMarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

const ChatMessage = ({ 
  content, 
  isUser, 
  isLoading, 
  isDarkMode, 
  isHistory = false,
  winner = null,
  onVoteWinner,
  onSelectPrompt
}) => {
  // Initialize displayedText immediately if this is a historical or previously loaded message
  const [displayedText, setDisplayedText] = useState(() => {
    if (isHistory || !content) {
      return { llama: content?.llama || "", deepseek: content?.deepseek || "" };
    }
    return { llama: "", deepseek: "" };
  });
  const [isTypingComplete, setIsTypingComplete] = useState(Boolean(isHistory));
  const [copiedModel, setCopiedModel] = useState(null); // 'llama' or 'deepseek'
  const [copiedUser, setCopiedUser] = useState(false);
  const [activeTab, setActiveTab] = useState("both"); // 'both', 'llama', 'deepseek'
  const [speakingModel, setSpeakingModel] = useState(null); // 'llama' or 'deepseek'

  // Model Card Anime.js Refs
  const llamaCardRef = useRef(null);
  const deepseekCardRef = useRef(null);

  // Stagger entrance of the two model cards when response is loaded
  useEffect(() => {
    if (!isUser && !isLoading) {
      const cards = [llamaCardRef.current, deepseekCardRef.current].filter(Boolean);
      if (cards.length > 0) {
        animate(cards, {
          translateY: [14, 0],
          opacity: [0, 1],
          delay: stagger(60),
          duration: 380,
          ease: "outBack"
        });
      }
    }
  }, [isUser, isLoading]);

  const handleCopyUserPrompt = (e) => {
    if (e?.currentTarget) {
      animate(e.currentTarget, {
        scale: [1, 0.82, 1.12, 1],
        duration: 250,
        ease: "outBack"
      });
    }

    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 2000);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(content).catch(() => {
        fallbackCopyText(content);
      });
    } else {
      fallbackCopyText(content);
    }
  };

  const handleCopyModelText = (modelKey, rawText, e) => {
    if (e?.currentTarget) {
      animate(e.currentTarget, {
        scale: [1, 0.88, 1.08, 1],
        duration: 250,
        ease: "outBack"
      });
    }

    setCopiedModel(modelKey);
    setTimeout(() => setCopiedModel(null), 2000);

    const cleanText = (rawText || "").replace(/<think>[\s\S]*?<\/think>/i, '').trim();
    const textToCopy = cleanText || rawText || "";

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {
        fallbackCopyText(textToCopy);
      });
    } else {
      fallbackCopyText(textToCopy);
    }
  };

  // Speech synthesis interval ref to prevent Chrome garbage-collection pause
  const speechIntervalRef = useRef(null);

  const clearSpeechKeepAlive = () => {
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
  };

  // Text-To-Speech audio player with reliable auto-reset
  const handleSpeak = (modelKey, rawText) => {
    if (!('speechSynthesis' in window)) return;

    // If currently playing, clicking acts as mute / stop
    if (speakingModel === modelKey) {
      clearSpeechKeepAlive();
      window.speechSynthesis.cancel();
      setSpeakingModel(null);
      return;
    }

    clearSpeechKeepAlive();
    window.speechSynthesis.cancel();

    const cleanText = (rawText || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/[#*`|_]/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;

    const stopPlayback = () => {
      clearSpeechKeepAlive();
      setSpeakingModel(null);
    };

    utterance.onend = stopPlayback;
    utterance.onerror = stopPlayback;

    setSpeakingModel(modelKey);
    window.speechSynthesis.speak(utterance);

    // Keep Chrome speech synthesis alive on longer responses
    speechIntervalRef.current = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        stopPlayback();
      }
    }, 8000);
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      clearSpeechKeepAlive();
      if (window?.speechSynthesis?.cancel) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Spring bounce card when user declares winner
  const handleVoteWinnerAction = (modelKey, e) => {
    const cardEl = modelKey === 'llama' ? llamaCardRef.current : deepseekCardRef.current;
    if (cardEl) {
      animate(cardEl, {
        scale: [1, 0.98, 1.025, 1],
        duration: 400,
        ease: "outBack"
      });
    }
    if (onVoteWinner) {
      onVoteWinner(modelKey, e);
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (window?.speechSynthesis?.cancel) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Immediate sync if message is marked history or content arrives for existing message
  useEffect(() => {
    if (isHistory && !isTypingComplete) {
      setDisplayedText({
        llama: content?.llama || "",
        deepseek: content?.deepseek || ""
      });
      setIsTypingComplete(true);
    }
  }, [isHistory, content, isTypingComplete]);

  // Tab visibility handling: if user switches tabs or window loses focus,
  // immediately complete typing so it never lags, stalls, or restarts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isTypingComplete) {
        setDisplayedText({
          llama: content?.llama || "",
          deepseek: content?.deepseek || ""
        });
        setIsTypingComplete(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [content, isTypingComplete]);

  // Dynamic Typewriter effect for live incoming bot messages:
  // Dynamically computes step size to finish in ~3.0 - 3.5 seconds (always < 10 seconds)
  useEffect(() => {
    if (isHistory || isUser || isLoading || isTypingComplete) return;

    const llamaTarget = content?.llama || "";
    const deepseekTarget = content?.deepseek || "";

    if (!llamaTarget && !deepseekTarget) return;

    const TARGET_DURATION_MS = 3200;
    const INTERVAL_MS = 20;
    const totalTicks = TARGET_DURATION_MS / INTERVAL_MS;

    const llamaStep = Math.max(5, Math.ceil(llamaTarget.length / totalTicks));
    const deepseekStep = Math.max(5, Math.ceil(deepseekTarget.length / totalTicks));

    let llamaIdx = 0;
    let deepseekIdx = 0;

    const timer = setInterval(() => {
      llamaIdx = Math.min(llamaIdx + llamaStep, llamaTarget.length);
      deepseekIdx = Math.min(deepseekIdx + deepseekStep, deepseekTarget.length);

      setDisplayedText({
        llama: llamaTarget.substring(0, llamaIdx),
        deepseek: deepseekTarget.substring(0, deepseekIdx)
      });

      if (llamaIdx >= llamaTarget.length && deepseekIdx >= deepseekTarget.length) {
        clearInterval(timer);
        setIsTypingComplete(true);
      }
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [content, isUser, isLoading, isTypingComplete, isHistory]);

  // Smart User-Aware Auto-Scroll:
  // Only autoscrolls if the user is ALREADY near the bottom (< 120px).
  // If the user scrolls UP with wheel or touch, it preserves their scroll position!
  useEffect(() => {
    if (isUser || isLoading || isTypingComplete) return;

    const container = document.querySelector('.chatbot_response_container');
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [displayedText, isUser, isLoading, isTypingComplete]);

  const renderWithThinkingProcess = (rawText) => {
    if (!rawText) return null;

    const text = normalizeStreamingMarkdown(rawText);
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);

    if (!thinkMatch) {
      return <MarkdownRenderer content={text} />;
    }

    const thinkingProcess = thinkMatch[1].trim();
    const answer = text.replace(thinkMatch[0], '').trim();

    return (
      <div className="space-y-4">
        {/* Playful Neo-Brutalist Thinking Process Drawer */}
        <details className="group border-3 border-black rounded-2xl bg-amber-50/80 overflow-hidden shadow-neo-sm" open>
          <summary className="cursor-pointer px-4 py-3 font-mono text-xs font-black text-amber-950 flex items-center justify-between bg-amber-100/95 border-b-3 border-black select-none hover:bg-amber-200/90 transition-colors">
            <span className="flex items-center gap-2">
              <FaBrain className="text-amber-800 text-sm animate-pulse" />
              <span>REASONING LAB ({thinkingProcess.length} chars)</span>
            </span>
            <span className="text-[11px] bg-white border-2 border-black px-2.5 py-1 rounded-lg font-sans font-black shadow-neo-sm flex items-center gap-1.5 active:scale-95 transition-transform">
              Toggle <FaChevronDown className="group-open:rotate-180 transition-transform text-[9px]" />
            </span>
          </summary>
          <div className="p-4 text-xs sm:text-sm font-mono text-gray-800 leading-relaxed max-h-60 overflow-y-auto bg-amber-50/50">
            <MarkdownRenderer content={thinkingProcess} />
          </div>
        </details>

        {/* Final Answer */}
        <MarkdownRenderer content={answer} />
      </div>
    );
  };

  // Helper to count words
  const getWordCount = (text) => {
    if (!text) return 0;
    const clean = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
    return clean ? clean.split(/\s+/).length : 0;
  };

  // 1. Initial Welcome Banner - Arena Championship Deck with Live Starter Prompts
  if (content && typeof content === 'object' && content.showSingle) {
    const starterPrompts = [
      {
        icon: "⚡",
        title: "Speed vs Scalability",
        query: "Compare SQL vs NoSQL for building high-scale real-time web applications. Provide a clear comparison table."
      },
      {
        icon: "🧠",
        title: "Deep Physics Logic",
        query: "Explain Quantum Entanglement step-by-step: first to a 10-year-old, then to an undergraduate physics student."
      },
      {
        icon: "⚖️",
        title: "Socio-Economic Systems",
        query: "What is the core difference between Socialism and Communism? Compare state ownership, wealth distribution, and practical examples."
      },
      {
        icon: "💻",
        title: "Algorithmic Architecture",
        query: "Write a high-performance LRU Cache implementation in Python with complete time-complexity analysis."
      }
    ];

    return (
      <div className="my-6 max-w-4xl mx-auto message-enter px-2">
        <div className="bg-[#FFFDF6] dark:bg-[#181820] border-3 border-black dark:border-white shadow-neo-lg rounded-3xl p-5 sm:p-7">
          {/* Header Badge & Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <DualArenaLogo size={60} className="mb-3" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-popYellow text-black border-2 border-black rounded-full text-xs font-mono font-black uppercase shadow-neo-sm mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Side-by-Side Model Arena
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-black dark:text-white tracking-tight">
              WELCOME TO DUAL AI ARENA
            </h2>
            <p className="font-medium text-gray-600 dark:text-gray-300 text-xs sm:text-sm max-w-xl mt-1 leading-relaxed">
              Every query triggers an authentic head-to-head confrontation. Compare lightning-fast flash execution against deep step-by-step analytical reasoning.
            </p>
          </div>

          {/* Contender Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
            {/* Contender 1: Qwen 3.8 */}
            <div className="border-2 border-black dark:border-zinc-700 rounded-2xl p-4 bg-white dark:bg-[#20202A] shadow-neo-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-popBlue text-white text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full border border-black shadow-neo-sm flex items-center gap-1">
                    <FaBolt className="text-popYellow text-[10px]" /> FAST MODEL
                  </span>
                  <span className="text-[11px] font-mono font-bold text-gray-500">Qwen 3.8 27B</span>
                </div>
                <h4 className="font-display font-black text-base text-black dark:text-white mb-1">
                  Speed & Structured Formatting
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Engineered for near-instant responses, concise clarity, markdown tables, bold highlights, and clean bullet lists.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-[10px] font-mono font-bold text-gray-500">
                <span>⚡ Sub-1s First Token</span>
                <span>•</span>
                <span>📊 Auto Markdown Tables</span>
              </div>
            </div>

            {/* Contender 2: GPT-OSS 120B */}
            <div className="border-2 border-black dark:border-zinc-700 rounded-2xl p-4 bg-white dark:bg-[#20202A] shadow-neo-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-popMint text-black text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full border border-black shadow-neo-sm flex items-center gap-1">
                    <FaBrain className="text-emerald-700 text-[10px]" /> REASONING MODEL
                  </span>
                  <span className="text-[11px] font-mono font-bold text-gray-500">OpenAI GPT-OSS 120B</span>
                </div>
                <h4 className="font-display font-black text-base text-black dark:text-white mb-1">
                  Chain-of-Thought Reasoning
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  Dedicated reasoning drawer breaking down internal logic, edge cases, foundational principles, and trade-offs.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-[10px] font-mono font-bold text-gray-500">
                <span>🔬 Visible Thought Process</span>
                <span>•</span>
                <span>🎯 Deep Analytical Logic</span>
              </div>
            </div>
          </div>

          {/* Quick Starter Arena Prompts */}
          <div>
            <div className="text-[11px] font-mono font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>⚡</span> CLICK A STARTER CHALLENGE TO TEST BOTH MODELS:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {starterPrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectPrompt && onSelectPrompt(item.query)}
                  className="text-left bg-white dark:bg-[#20202A] hover:bg-popYellow dark:hover:bg-amber-300 hover:text-black border-2 border-black dark:border-white rounded-xl p-3 text-xs font-semibold transition-all shadow-neo-sm hover:translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-display font-bold text-black dark:text-white group-hover:text-black mb-0.5">
                    <span>{item.icon}</span>
                    <span>{item.title}</span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 group-hover:text-gray-900 line-clamp-1 text-[11px] font-mono">
                    "{item.query}"
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. User Question Bubble - Sleek Neo-Brutalist Card with min-width and integrated header
  // Strictly inside the asking box with zero awkward crowding on short queries
  if (isUser) {
    return (
      <div className="my-4 flex justify-end w-full message-enter">
        <div className="min-w-[160px] max-w-[85%] sm:max-w-[70%] bg-popPink text-white border-3 border-black shadow-neo rounded-2xl rounded-tr-xs p-3.5 sm:p-4 transition-transform">
          {/* Internal Header bar: "YOU ASKED" on left, sleek copy icon on right */}
          <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b-2 border-white/20 select-none">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-pink-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-popYellow border border-black inline-block"></span>
              YOU ASKED
            </span>
            <button
              type="button"
              onClick={handleCopyUserPrompt}
              className="w-6 h-6 rounded-lg bg-black/20 hover:bg-black/35 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Copy question text"
              aria-label="Copy prompt"
            >
              {copiedUser ? (
                <FaCheck className="text-[11px] text-popMint" />
              ) : (
                <FaCopy className="text-[11px]" />
              )}
            </button>
          </div>

          {/* Question Text */}
          <p className="text-sm sm:text-base font-bold leading-relaxed whitespace-pre-wrap font-sans text-white selection:bg-black selection:text-white">
            {content}
          </p>
        </div>
      </div>
    );
  }

  // 3. Loading State (Dual Cards Computing in Parallel)
  if (isLoading) {
    return (
      <div className="my-6 max-w-6xl mx-auto message-enter">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Qwen Loading */}
          <div className="bg-white border-3 border-black shadow-neo rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2">
              <span className="font-display font-bold text-popBlue flex items-center gap-1.5 text-sm">
                <FaBolt className="text-popYellow" /> Qwen 3.8 27B
              </span>
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-900 border border-blue-400 px-2 py-0.5 rounded-full">
                GENERATING...
              </span>
            </div>
            <div className="flex items-center gap-3 py-4">
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 bg-popBlue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2.5 h-2.5 bg-popBlue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2.5 h-2.5 bg-popBlue rounded-full animate-bounce"></div>
              </div>
              <span className="font-mono text-xs font-bold text-gray-600">Generating swift response...</span>
            </div>
          </div>

          {/* GPT-OSS Loading */}
          <div className="bg-white border-3 border-black shadow-neo rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 border-b-2 border-black/10 pb-2">
              <span className="font-display font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                <FaBrain className="text-popMint" /> OpenAI GPT-OSS 120B
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded-full">
                THINKING...
              </span>
            </div>
            <div className="flex items-center gap-3 py-4">
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-bounce"></div>
              </div>
              <span className="font-mono text-xs font-bold text-gray-600">Formulating chain-of-thought...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Completed Dual Bot Responses (THE ARENA COMPARISON VIEW)
  const llamaText = isHistory ? content?.llama : displayedText.llama;
  const deepseekText = isHistory ? content?.deepseek : displayedText.deepseek;

  return (
    <div className="my-6 max-w-6xl mx-auto message-enter">
      {/* Mobile/Compact View Mode Switcher */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="inline-flex bg-white border-2 border-black shadow-neo-sm rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("both")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === "both" ? "bg-popYellow border-2 border-black shadow-neo-sm text-black" : "text-gray-600 hover:text-black"
            }`}
          >
            🥊 Dual Arena
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("llama")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === "llama" ? "bg-popBlue border-2 border-black shadow-neo-sm text-white" : "text-gray-600 hover:text-black"
            }`}
          >
            ⚡ Qwen 3.8
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deepseek")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === "deepseek" ? "bg-popMint border-2 border-black shadow-neo-sm text-black" : "text-gray-600 hover:text-black"
            }`}
          >
            🧠 GPT-OSS 120B
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-gray-500">
          <span>
            {activeTab === "both" 
              ? "Side-by-Side Model Duel" 
              : activeTab === "llama" 
                ? "Full Width View: Qwen 3.8" 
                : "Full Width View: GPT-OSS 120B"}
          </span>
        </div>
      </div>

      {/* Grid of the Dual Responses: 2-column for Dual Arena, full-width single column when one model is selected */}
      <div className={`grid gap-5 w-full ${activeTab === "both" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {/* Model 1: Qwen 3.8 27B */}
        {(activeTab === "both" || activeTab === "llama") && (
          <div 
            ref={llamaCardRef}
            className={`w-full bg-white border-3 border-black shadow-neo-lg rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between transition-all ${winner === 'llama' ? 'ring-4 ring-popYellow' : ''}`}
          >
            {/* Header */}
            <div className="bg-popBlue text-white border-b-3 border-black p-3.5 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white border-2 border-black text-black font-display font-black text-sm flex items-center justify-center shadow-neo-sm">
                  Q3
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black text-base sm:text-lg leading-tight flex items-center gap-1.5">
                      Qwen 3.8 27B <FaBolt className="text-popYellow text-xs" />
                    </h4>
                    {winner === 'llama' && (
                      <span className="text-[10px] font-mono font-black bg-popYellow text-black px-2 py-0.5 rounded-full border border-black shadow-neo-sm flex items-center gap-1">
                        <FaTrophy className="text-amber-700 text-[10px]" /> WINNER
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-blue-100 font-bold uppercase tracking-wider">Fast & Accurate Response</span>
                </div>
              </div>

              {/* Action Buttons: Speaker Audio & Instant Copy */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSpeak("llama", llamaText)}
                  className={`w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center text-xs transition-all cursor-pointer shadow-neo-sm active:scale-95 ${speakingModel === 'llama' ? 'bg-popYellow text-black animate-pulse' : 'bg-white hover:bg-gray-100 text-black'}`}
                  title={speakingModel === "llama" ? "Mute / Stop voice readout" : "Listen to Qwen response (Voice)"}
                  aria-label="Listen"
                >
                  {speakingModel === 'llama' ? <FaVolumeHigh className="text-black" /> : <FaVolumeXmark className="text-gray-400" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleCopyModelText("llama", llamaText, e)}
                  className="neo-btn bg-white hover:bg-gray-100 active:scale-95 text-black text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer shadow-neo-sm"
                  title="Copy entire Qwen response"
                >
                  {copiedModel === "llama" ? <><FaCheck className="text-emerald-600" /> Copied!</> : <><FaCopy /> Copy</>}
                </button>
              </div>
            </div>

            {/* Response Body with Full Table & Typography Styling */}
            <div className="p-4 sm:p-6 flex-1 overflow-x-auto">
              {renderWithThinkingProcess(llamaText)}
            </div>

            {/* Footer Tag with Word Count & Winner Vote */}
            <div className="bg-blue-50 border-t-2 border-black/10 px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-popBlue">
              <span>{getWordCount(llamaText)} words • ~350+ t/s</span>

              <button
                type="button"
                onClick={(e) => handleVoteWinnerAction("llama", e)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border-2 border-black flex items-center gap-1.5 transition-all cursor-pointer ${winner === 'llama' ? 'bg-popYellow text-black shadow-neo-sm ring-2 ring-black' : 'bg-white text-gray-700 hover:text-black hover:bg-gray-50'}`}
                title="Mark Qwen 3.8 as the duel winner"
              >
                <FaTrophy className={winner === 'llama' ? 'text-amber-600' : 'text-gray-400'} />
                <span>{winner === 'llama' ? 'Duel Winner! 🏆' : 'Pick Winner'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Model 2: OpenAI GPT-OSS 120B Reasoning */}
        {(activeTab === "both" || activeTab === "deepseek") && (
          <div 
            ref={deepseekCardRef}
            className={`w-full bg-white border-3 border-black shadow-neo-lg rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between transition-all ${winner === 'deepseek' ? 'ring-4 ring-popMint' : ''}`}
          >
            {/* Header */}
            <div className="bg-popMint text-black border-b-3 border-black p-3.5 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white border-2 border-black text-black font-display font-black text-sm flex items-center justify-center shadow-neo-sm">
                  OS
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-black text-base sm:text-lg leading-tight flex items-center gap-1.5">
                      GPT-OSS 120B <FaBrain className="text-emerald-800 text-xs" />
                    </h4>
                    {winner === 'deepseek' && (
                      <span className="text-[10px] font-mono font-black bg-popMint text-black px-2 py-0.5 rounded-full border border-black shadow-neo-sm flex items-center gap-1">
                        <FaTrophy className="text-emerald-800 text-[10px]" /> WINNER
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-emerald-950 font-bold uppercase tracking-wider">Deep Chain-of-Thought Reasoning</span>
                </div>
              </div>

              {/* Action Buttons: Speaker Audio & Instant Copy */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSpeak("deepseek", deepseekText)}
                  className={`w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center text-xs transition-all cursor-pointer shadow-neo-sm active:scale-95 ${speakingModel === 'deepseek' ? 'bg-popYellow text-black animate-pulse' : 'bg-white hover:bg-gray-100 text-black'}`}
                  title={speakingModel === "deepseek" ? "Mute / Stop voice readout" : "Listen to GPT-OSS response (Voice)"}
                  aria-label="Listen"
                >
                  {speakingModel === 'deepseek' ? <FaVolumeHigh className="text-black" /> : <FaVolumeXmark className="text-gray-400" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleCopyModelText("deepseek", deepseekText, e)}
                  className="neo-btn bg-white hover:bg-gray-100 active:scale-95 text-black text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer shadow-neo-sm"
                  title="Copy entire GPT-OSS response"
                >
                  {copiedModel === "deepseek" ? <><FaCheck className="text-emerald-600" /> Copied!</> : <><FaCopy /> Copy</>}
                </button>
              </div>
            </div>

            {/* Response Body with Full Table & Typography Styling */}
            <div className="p-4 sm:p-6 flex-1 overflow-x-auto">
              {renderWithThinkingProcess(deepseekText)}
            </div>

            {/* Footer Tag with Word Count & Winner Vote */}
            <div className="bg-emerald-50 border-t-2 border-black/10 px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-emerald-800">
              <span>{getWordCount(deepseekText)} words • Step Logic</span>

              <button
                type="button"
                onClick={(e) => handleVoteWinnerAction("deepseek", e)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border-2 border-black flex items-center gap-1.5 transition-all cursor-pointer ${winner === 'deepseek' ? 'bg-popMint text-black shadow-neo-sm ring-2 ring-black' : 'bg-white text-gray-700 hover:text-black hover:bg-gray-50'}`}
                title="Mark GPT-OSS as the duel winner"
              >
                <FaTrophy className={winner === 'deepseek' ? 'text-amber-600' : 'text-gray-400'} />
                <span>{winner === 'deepseek' ? 'Duel Winner! 🏆' : 'Pick Winner'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap in React.memo so historical messages NEVER re-render during typing or scrolling
export default React.memo(ChatMessage);
