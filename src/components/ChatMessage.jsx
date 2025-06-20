import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { SyncLoader } from "react-spinners";
import { motion } from "framer-motion";

// Helper function to generate stable hash from string
function hashCode(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

const ChatMessage = ({ content, isUser, isLoading, isDarkMode, isHistory = false }) => {
  const [displayedText, setDisplayedText] = useState({ llama: "", deepseek: "" });
  const [isTypingComplete, setIsTypingComplete] = useState(isHistory); // Set to true immediately for history messages
  const [copiedModelIdx, setCopiedModelIdx] = useState(null);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedCodeBlocks, setCopiedCodeBlocks] = useState({});
  const [retryStates, setRetryStates] = useState({ llama: false, deepseek: false });

  // Memoize the copy code function to prevent re-renders on hover
  const handleCopyCode = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const codeBlockId = e.currentTarget.dataset.codeId;
    const codeContainer = e.currentTarget.closest('.relative');
    const codeBlock = codeContainer?.querySelector('code');

    if (codeBlock) {
      // Copy the text content
      navigator.clipboard.writeText(codeBlock.textContent)
        .then(() => {
          // Use functional update to avoid race conditions
          setCopiedCodeBlocks(prev => ({
            ...prev,
            [codeBlockId]: true
          }));
          
          // Set a timeout to reset this specific code block's copied state
          setTimeout(() => {
            setCopiedCodeBlocks(prev => ({
              ...prev,
              [codeBlockId]: false
            }));
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy code:', err);
        });
    }
  }, []);

  const handleCopyUserPrompt = () => {
    navigator.clipboard.writeText(content);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 2000);
  };

  const handleCopyModel = (e) => {
    const container = e.currentTarget.closest('.model-response');
    if (!container) return;

    const clone = container.cloneNode(true);
    clone.querySelector('.model-header')?.remove();
    clone.querySelectorAll('button').forEach(btn => btn.remove());
    const text = clone.innerText;
    navigator.clipboard.writeText(text);

    const tempIdx = Array.from(container.parentNode.children).indexOf(container);
    setCopiedModelIdx(tempIdx);
    setTimeout(() => setCopiedModelIdx(null), 2000);
  };

  // Initialize displayedText immediately for history messages
  useEffect(() => {
    if (isHistory && !isUser && !isLoading) {
      setDisplayedText({
        llama: content.llama || "",
        deepseek: content.deepseek || ""
      });
      setIsTypingComplete(true);
    }
  }, [isHistory, content, isUser, isLoading]);

  // Memoize the pre component to prevent re-renders
  const PreComponent = useMemo(() => {
    // Return a memoized component function
    return ({ children, ...props }) => {
      const codeId = `code-${props.codeHash}-${props.node.position?.start.line || 0}`;
      const isCopied = copiedCodeBlocks[codeId] || false;
      
      return (
        <div className="relative code-block-container">
          <button
            onClick={handleCopyCode}
            data-code-id={codeId}
            className="code-copy-button"
            aria-label="Copy code block"
          >
            {isCopied ? "✓" : "⎘"}
          </button>
          <pre {...props}>{children}</pre>
        </div>
      );
    };
  }, [handleCopyCode, copiedCodeBlocks]);

  const renderWithThinkingProcess = (text, modelName) => {
    if (!text) return null;

    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
    const textHash = hashCode(text);

    if (!thinkMatch) {
      return (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeHighlight]}
          components={{
            pre: (props) => <PreComponent {...props} codeHash={textHash} />
          }}
        >
          {text}
        </ReactMarkdown>
      );
    }

    const thinkingProcess = thinkMatch[1].trim();
    const answer = text.replace(thinkMatch[0], '').trim();
    const thinkHash = hashCode(thinkingProcess);
    const answerHash = hashCode(answer);

    return (
      <>
        <details className="thinking-process" open>
          <summary>🤔 Thinking Process</summary>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: (props) => <PreComponent {...props} codeHash={`think-${thinkHash}`} />
            }}
          >
            {thinkingProcess}
          </ReactMarkdown>
        </details>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeHighlight]}
          components={{
            pre: (props) => <PreComponent {...props} codeHash={`answer-${answerHash}`} />
          }}
        >
          {answer}
        </ReactMarkdown>
      </>
    );
  };

  // Modified typewriter effect to skip for history messages
  useEffect(() => {
    // Skip animation for history messages or if typing is already complete
    if (isHistory || isUser || isLoading || isTypingComplete) {
      return;
    }

    let llamaIndex = 0;
    let deepseekIndex = 0;
    const llamaText = content.llama || "";
    const deepseekText = content.deepseek || "";

    const llamaInterval = setInterval(() => {
      if (llamaIndex <= llamaText.length) {
        setDisplayedText(prev => ({ ...prev, llama: llamaText.substring(0, llamaIndex) }));
        llamaIndex++;
      } else {
        clearInterval(llamaInterval);
        setRetryStates(prev => ({ ...prev, llama: false }));
      }
    }, 20);

    const deepseekInterval = setInterval(() => {
      if (deepseekIndex <= deepseekText.length) {
        setDisplayedText(prev => ({ ...prev, deepseek: deepseekText.substring(0, deepseekIndex) }));
        deepseekIndex++;
      } else {
        clearInterval(deepseekInterval);
        setIsTypingComplete(true);
        setRetryStates(prev => ({ ...prev, deepseek: false }));
      }
    }, 20);

    return () => {
      clearInterval(llamaInterval);
      clearInterval(deepseekInterval);
    };
  }, [content, isUser, isLoading, isTypingComplete, isHistory]);

  useEffect(() => {
    if (!isUser && !isLoading) {
      const container = document.querySelector('.chatbot_response_container');
      if (container) container.scrollTop = container.scrollHeight;
    }
  }, [displayedText.llama, displayedText.deepseek, isUser, isLoading]);

  // These functions are already defined above, removing duplicates

  if (!isUser && content.showSingle) {
    return (
      <div className={`message bot ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="message-content">{content.llama}</div>
      </div>
    );
  }

  return (
    <div className={`message ${isUser ? "user" : "bot"} ${isDarkMode ? "dark" : "light"}`}>
      <div className="message-content">
        {isUser && (
          <div className="user-message-container">
            <motion.button
              onClick={handleCopyUserPrompt}
              initial={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              className="user-copy-button"
              aria-label="Copy user message"
            >
              <span>{content}</span>
              <span className="copy-icon">
                {copiedUser ? "✓" : "⎘"}
              </span>
            </motion.button>
          </div>
        )}

        {isLoading ? (
          <div className="dual-loading">
            <div className="model-loading">
              <SyncLoader color={isDarkMode ? "#ffffff" : "#333333"} size={8} speedMultiplier={0.8} />
              <div className="typing-text">
                {retryStates.llama ? "Retrying Llama..." : "Llama is typing"}
                <span className="dot-animation">...</span>
              </div>
            </div>
            <div className="model-loading">
              <SyncLoader color={isDarkMode ? "#ffffff" : "#333333"} size={8} speedMultiplier={0.8} />
              <div className="typing-text">
                {retryStates.deepseek ? "Retrying Deepseek..." : "Deepseek is typing"}
                <span className="dot-animation">...</span>
              </div>
            </div>
          </div>
        ) : isUser ? null : (
          <div className="dual-response">
            {[
              { label: 'Llama Response', text: isHistory ? content.llama : displayedText.llama, model: "llama" },
              { label: 'Deepseek Response', text: isHistory ? content.deepseek : displayedText.deepseek, model: "deepseek" }
            ].map((model, idx) => (
              <div key={idx} className={`model-response ${isTypingComplete ? "" : "typing-active"}`}>
                <div className="model-header">
                  <h4>{model.label}</h4>
                  <div className="copy-button-container">
                    <motion.button
                      onClick={handleCopyModel}
                      whileTap={{ scale: 0.9 }}
                      className="model-copy-button"
                      aria-label={`Copy ${model.label}`}
                    >
                      {copiedModelIdx === idx ? "✓" : "⎘"}
                    </motion.button>
                  </div>
                </div>
                {renderWithThinkingProcess(model.text, model.model)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;