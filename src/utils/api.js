// src/utils/api.js
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_API_GROQ_KEY,
  dangerouslyAllowBrowser: true,
});

// ========= Helpers =========
const isNonEmpty = (s) => typeof s === "string" && s.trim().length > 0;

const MAX_RETRIES = 1;
const BASE_DELAY_MS = 800;

const retry = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS));
      return retry(fn, retries - 1);
    }
    throw err;
  }
};

// ========= ANSWER-ONLY MODEL (Lightweight) =========
// Uses moonshotai/kimi-k2-instruct-0905
// Greeting handling changed: give a friendly sentence instead of one-word echo.
export const generateLlamaResponse = async (prompt) => {
  const trimmed = (prompt || "").trim().toLowerCase();
  if (["hi", "hello", "hey"].includes(trimmed)) {
    return "Hello! How can I help you today?";
  }

  return retry(async () => {
    try {
      const completion = await groq.chat.completions.create({
        model: "moonshotai/kimi-k2-instruct-0905",
        stream: false, // simpler client handling
        messages: [
          {
            role: "system",
            content:
              "You are a concise assistant. Provide the final answer only. Do not reveal chain-of-thought.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.6,
        top_p: 1.0,
      });

      const text = completion.choices?.[0]?.message?.content ?? "";
      if (!isNonEmpty(text)) throw new Error("Empty response");
      const fr = completion.choices?.[0]?.finish_reason;
      if (fr === "length") {
        return text + "\n\n⚠️ Truncated (hit max_tokens). Consider raising max_tokens.";
      }
      return text;
    } catch (error) {
      console.error("Groq (Kimi) error:", error);
      return `⚠️ Llama Error: ${error.message}`;
    }
  });
};

// ========= REASONING MODEL (Keep name, use Qwen3-32B) =========
// Keep the exported name so other files don't change.
export const generateDeepseekResponse = async (prompt) => {
  return retry(async () => {
    try {
      const completion = await groq.chat.completions.create({
        model: "qwen/qwen3-32b", // reasoning model on Groq (preview)
        stream: false,
        messages: [
          {
            role: "system",
            content: [
              "You are a reasoning assistant.",
              "Do your detailed reasoning in a private scratchpad and DO NOT reveal it.",
              "Return output in EXACTLY this format:",
              "",
              "Answer: <one short clear answer>",
              "Reasoning: <up to 3 short bullet points, each <= 20 words>",
            ].join("\n"),
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 2048,
        // If your Groq account supports it, you could try:
        // reasoning_format: "hidden",
      });

      const text = completion.choices?.[0]?.message?.content ?? "";
      if (!isNonEmpty(text)) throw new Error("Empty response");
      const fr = completion.choices?.[0]?.finish_reason;
      if (fr === "length") {
        return text + "\n\n⚠️ Truncated (hit max_tokens). Consider increasing it.";
      }
      return text;
    } catch (error) {
      console.error("Groq (Qwen reasoning) error:", error);
      return `⚠️ Deepseek (Qwen) Error: ${error.message}`;
    }
  });
};
