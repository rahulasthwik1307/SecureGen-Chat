import Dexie from "dexie";

export const db = new Dexie("ChatbotAuthDB");
db.version(4).stores({
  users: "&username", // primary key: username
  chats: "++id, username", // primary key: auto-incremented id, index: username
  chatSessions: "++id, userId, timestamp" // new table for chat history
});

// Helper functions for user operations
export async function addUser(username, passwordHash, faceDescriptor) {
  return await db.users.add({
    username,
    passwordHash,
    faceDescriptor: Array.from(faceDescriptor),
  });
}

export async function getUser(username) {
  return await db.users.get(username);
}

export async function getAllUsers() {
  return await db.users.toArray();
}

export async function deleteUser(username) {
  return await db.users.delete(username);
}

// Helper functions for chat operations
export async function saveUserChat(username, chatData) {
  try {
    return await db.chats.put({
      username,
      chatData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving chat:", error);
    throw error;
  }
}

export async function getUserChat(username) {
  try {
    const chat = await db.chats
      .where("username")
      .equals(username)
      .last();
    return chat ? chat.chatData : [];
  } catch (error) {
    console.error("Error getting chat:", error);
    throw error;
  }
}

export async function clearUserChat(username) {
  try {
    await db.chats
      .where("username")
      .equals(username)
      .delete();
    return true;
  } catch (error) {
    console.error("Error clearing chat:", error);
    return false;
  }
}

// New functions for chat sessions
export async function saveChatSession(userId, messages) {
  try {
    const timestamp = new Date().toISOString();
    const id = await db.chatSessions.add({
      userId,
      timestamp,
      messages
    });
    return { id, timestamp };
  } catch (error) {
    console.error("Error saving chat session:", error);
    throw error;
  }
}

export async function getChatSessions(userId) {
  try {
    return await db.chatSessions
      .where("userId")
      .equals(userId)
      .reverse()
      .sortBy("timestamp");
  } catch (error) {
    console.error("Error getting chat sessions:", error);
    throw error;
  }
}

export async function getChatSessionById(id) {
  try {
    return await db.chatSessions.get(id);
  } catch (error) {
    console.error("Error getting chat session:", error);
    throw error;
  }
}

export async function deleteChatSession(id) {
  try {
    await db.chatSessions.delete(id);
    return true;
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return false;
  }
}

export async function updateChatSession(id, messages) {
  try {
    const timestamp = new Date().toISOString();
    await db.chatSessions.update(id, {
      timestamp,
      messages
    });
    return { id, timestamp };
  } catch (error) {
    console.error("Error updating chat session:", error);
    throw error;
  }
}