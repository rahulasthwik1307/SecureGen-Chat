import { useState, useEffect } from 'react';
import { getUserChat, saveUserChat, clearUserChat } from '../db/db';

/**
 * Custom hook for managing user-specific chat history
 * @param {string} username - The username of the current user
 * @param {Array} initialValue - Default value if no chat history exists
 * @returns {Array} - [chatHistory, setChatHistory, clearChat, error]
 */
const useUserChat = (username, initialValue = []) => {
  const [chatHistory, setChatHistory] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load chat history when component mounts or username changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userChat = await getUserChat(username);
        setChatHistory(userChat.length > 0 ? userChat : initialValue);
        setError(null);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setError('Failed to load chat history');
        setChatHistory(initialValue);
      } finally {
        setLoading(false);
      }
    };

    loadChatHistory();
  }, [username, initialValue]);

  // Save chat history whenever it changes
  useEffect(() => {
    const saveChatData = async () => {
      if (!username || loading) return;

      try {
        await saveUserChat(username, chatHistory);
      } catch (err) {
        console.error('Failed to save chat history:', err);
        setError('Failed to save chat history');
      }
    };

    saveChatData();
  }, [chatHistory, username, loading]);

  // Function to clear chat history
  const clearChat = async () => {
    try {
      if (!username) return;
      await clearUserChat(username);
      setChatHistory(initialValue);
      setError(null);
      return true;
    } catch (err) {
      console.error('Failed to clear chat history:', err);
      setError('Failed to clear chat history');
      return false;
    }
  };

  return [chatHistory, setChatHistory, clearChat, loading, error];
};

export default useUserChat;