
# SecureGen Chat 💬🔐

### Intelligent Multi-Model Conversational Platform with Biometric Face Verification

**Description**:
SecureGen Chat is a dual-AI chatbot platform that combines secure facial authentication and intelligent conversations using LLaMA and DeepSeek models. Users can interact through voice or text, with persistent chat history and a clean UI.

---

**🚀 Features**

* 🔐 Secure Registration & Login with Face Verification (via face-api.js)
* 🧠 Dual AI Engine – Integrates LLaMA and DeepSeek models via Groq SDK
* 🗣️ Voice Input support using Web Speech API
* 💬 Real-Time Chat Interface with typewriting effect
* 🕓 Session-Based Chat History displayed in sidebar using IndexedDB (Dexie.js)
* 🌓 Dark Mode Support and Responsive UI
* 🔁 Chat Continuation: Users can continue from past sessions

---

**🧩 Tech Stack**

* **Frontend**: React + Vite + Tailwind CSS + ShadCN UI
* **Authentication**: JWT + Face Recognition (face-api.js)
* **AI Integration**: Groq SDK (LLaMA & DeepSeek APIs)
* **Voice Input**: Web Speech API
* **State Management**: React Hooks (useState, useEffect, Context API)
* **Database**: IndexedDB (Dexie.js)
* **Icons**: Lucide React Icons

---

**📁 Folder Structure (Simplified)**

```
src/
├── components/
│   ├── ChatMessage.jsx
│   ├── Sidebar.jsx
│   ├── VoiceInput.jsx
│   └── FaceCapture.jsx
├── hooks/
├── utils/
├── db/
│   └── dexie-setup.js
├── pages/
│   ├── Register.jsx
│   ├── Login.jsx
│   └── Landing.jsx
└── App.jsx
```

---

**🛠️ How to Run Locally**

1. Clone the repository
   `git clone https://github.com/rahulasthwik1307/SecureGen-Chat.git`
   `cd SecureGen-Chat`

2. Install dependencies
   `npm install`

3. Start the development server
   `npm run dev`

4. Open in your browser
   `http://localhost:3000`

---



