// Updated api.js with anti-truncation measures
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_API_GROQ_KEY,
  dangerouslyAllowBrowser: true
});

// Helper to validate response completeness
const isCompleteResponse = (text) => {
  if (!text) return false;
  // Check for proper sentence termination
  const hasProperEnding = /[.!?]\s*$/.test(text);
  // Check for balanced tags in thinking process
  const thinkTagsBalanced = (text.match(/<think>/g) || []).length === 
                          (text.match(/<\/think>/g) || []).length;
  return hasProperEnding && thinkTagsBalanced;
};

const MAX_RETRIES = 2;
const BASE_DELAY = 1000;

const fetchWithRetry = async (fetchFn, retries = MAX_RETRIES) => {
  try {
    const result = await fetchFn();
    if (!isCompleteResponse(result)) {
      throw new Error('Incomplete response detected');
    }
    return result;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, BASE_DELAY));
      return fetchWithRetry(fetchFn, retries - 1);
    }
    throw error;
  }
};

export const generateLlamaResponse = async (prompt) => {
  return fetchWithRetry(async () => {
    try {
      const completion = await groq.chat.completions.create({
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048 // Explicit token limit
      });
      return completion.choices[0]?.message?.content || "⚠️ No response generated";
    } catch (error) {
      console.error("Groq API error:", error);
      return `⚠️ Llama-4 Error: ${error.message}`;
    }
  });
};

export const generateDeepseekResponse = async (prompt) => {
  return fetchWithRetry(async () => {
    try {
      const completion = await groq.chat.completions.create({
        model: "deepseek-r1-distill-llama-70b",
        messages: [{
          role: "user",
          content: `Please reason step by step. Wrap the reasoning inside <think>...</think> tags. Then give the final answer.\n\nQuestion:\n${prompt}`
        }],
        temperature: 0.6,
        max_tokens: 2048, // Increased from 1024
        top_p: 0.95,
        stream: true,
        reasoning_format: "raw"
      });

      let fullResponse = "";
      let isComplete = false;

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullResponse += content;
        // Check if this is the final chunk
        if (chunk.choices[0]?.finish_reason === "stop") {
          isComplete = true;
        }
      }

      if (!isComplete || !isCompleteResponse(fullResponse)) {
        throw new Error('Stream ended prematurely');
      }

      return fullResponse || "⚠️ No response generated";
    } catch (error) {
      console.error("Deepseek API error:", error);
      return `⚠️ Deepseek Error: ${error.message}`;
    }
  });
};