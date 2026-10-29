// Updated api.js with Qwen (Fast) and OpenAI GPT-OSS (Reasoning)
// Configured for beautiful, structured layouts, rich markdown tables & authentic reasoning
import Groq from "groq-sdk";

// Helper to get or initialize a fresh Groq client with sanitized key
const getGroqClient = () => {
  const envKey = import.meta.env.VITE_API_GROQ_KEY;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('GROQ_API_KEY') : null;
  const apiKey = (envKey || localKey || '').trim();

  if (!apiKey) {
    throw new Error("Missing Groq API Key! Please verify VITE_API_GROQ_KEY in your .env file and restart your Vite dev server.");
  }

  return new Groq({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

export const hasApiKey = () => {
  const envKey = import.meta.env.VITE_API_GROQ_KEY;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('GROQ_API_KEY') : null;
  return Boolean((envKey || localKey || '').trim());
};

// Helper to validate response completeness
const isCompleteResponse = (text) => {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  // Check for balanced tags in thinking process if present
  const thinkTagsBalanced = (trimmed.match(/<think>/g) || []).length === 
                            (trimmed.match(/<\/think>/g) || []).length;
  return thinkTagsBalanced;
};

const MAX_RETRIES = 2;
const BASE_DELAY = 1000;

const fetchWithRetry = async (fetchFn, retries = MAX_RETRIES) => {
  try {
    const result = await fetchFn();
    if (!isCompleteResponse(result)) {
      throw new Error("Incomplete response detected");
    }
    return result;
  } catch (error) {
    // If it's an authentication error (401), retrying won't help
    if (error?.status === 401 || (error?.message && error.message.includes("401"))) {
      throw error;
    }
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, BASE_DELAY));
      return fetchWithRetry(fetchFn, retries - 1);
    }
    throw error;
  }
};

// Left Model: Fast Model (Qwen 3.8 27B) - Formats with markdown tables, lists & bold highlights
export const generateLlamaResponse = async (prompt) => {
  return fetchWithRetry(async () => {
    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "system",
            content: "You are a fast, articulate AI assistant. Deliver answers with outstanding layout: use structured markdown headings, clean bullet points, bold key concepts, and formatted comparison tables with clear column headers whenever comparing options or presenting multi-attribute data. Be direct and avoid empty conversational filler."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      return completion.choices[0]?.message?.content || "⚠️ No response generated";
    } catch (error) {
      console.error("Fast Model (Qwen) API error:", error);
      if (error?.status === 401 || (error?.message && error.message.includes("401"))) {
        return `⚠️ Fast Model Error: 401 Invalid API Key. Please restart your Vite dev server (Ctrl+C, then npm run dev) to load the new .env key, and refresh your browser tab.`;
      }
      return `⚠️ Fast Model Error: ${error.message}`;
    }
  });
};

// Right Model: Reasoning Model (OpenAI GPT-OSS 120B) - Deep step-by-step thinking & beautiful formatting
export const generateDeepseekResponse = async (prompt) => {
  return fetchWithRetry(async () => {
    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You are a deep analytical reasoning engine. Think carefully step-by-step through the core logic, principles, and trade-offs. Then deliver a beautifully structured, comprehensive final answer using markdown tables for comparisons, numbered steps for procedures, and clear bold headings. Keep your thought process analytical and direct."
          },
          { role: "user", content: prompt }
        ],
        reasoning_effort: "medium", // Provides authentic step-by-step logic while keeping tokens bounded
        max_tokens: 1500
      });

      const message = completion.choices[0]?.message;
      if (!message) return "⚠️ No response generated";

      const reasoning = message.reasoning ? message.reasoning.trim() : "";
      const content = message.content ? message.content.trim() : "";

      // Format with <think> tag so ChatMessage renders the collapsible reasoning drawer
      if (reasoning) {
        return `<think>\n${reasoning}\n</think>\n\n${content}`;
      }

      return content || "⚠️ No response generated";
    } catch (error) {
      console.error("Reasoning Model (GPT-OSS) API error:", error);
      if (error?.status === 401 || (error?.message && error.message.includes("401"))) {
        return `⚠️ Reasoning Model Error: 401 Invalid API Key. Please restart your Vite dev server (Ctrl+C, then npm run dev) to load the new .env key, and refresh your browser tab.`;
      }
      return `⚠️ Reasoning Model Error: ${error.message}`;
    }
  });
};
