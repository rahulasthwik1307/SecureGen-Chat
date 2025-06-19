import Dexie from "dexie";

export const db = new Dexie("ChatbotAuthDB");
db.version(3).stores({
  users: "&username", // primary key: username (changed from email)
  chats: "++id, username" // primary key: auto-incremented id, index: username (changed from userEmail)
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

export async function clearUserChat(userEmail) {
  try {
    await db.chats
      .where("userEmail")
      .equals(userEmail)
      .delete();
    return true;
  } catch (error) {
    console.error("Error clearing chat:", error);
    return false;
  }
}