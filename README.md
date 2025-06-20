
# SecureGen Chat 💬🔐
### Intelligent Multi-Model Conversational Platform with Biometric Face Verification
![Image](https://github.com/user-attachments/assets/25e27bcf-1295-44bf-b695-2e403478bf1c)
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

## 📸 Screenshots

### 🏠 Homepage
![Image](https://github.com/user-attachments/assets/c7024cc0-d287-467e-9c66-63d5801a0922)

### 📝 Account Registration
![Image](https://github.com/user-attachments/assets/3fd110ad-42a8-4ad2-a9c0-150bb4bac7b5)

### 📷 Biometric Enrollment
![Image](https://github.com/user-attachments/assets/a132114f-dbb2-4a2d-8eb8-689eacd6715b)

### 🔐 Login Screen
![Image](https://github.com/user-attachments/assets/4aab4933-a1a3-426a-839f-d9e4747b76e4)

### 🧑‍💻 Face Authentication
![Image](https://github.com/user-attachments/assets/ac981143-f5b1-4b0d-92ef-0c081798fce8)

### 💬 Chat Window
![Image](https://github.com/user-attachments/assets/4ce49489-047b-4c47-83e3-0652a275e74f)

### 🧠 Dual-Model Output
![Image](https://github.com/user-attachments/assets/3e898f11-e751-4246-8f1a-853584e54cdf)

### 🗂️ Sidebar with Chat History
![image](https://github.com/user-attachments/assets/c467a50d-06c1-44f0-a495-6e78d3e53ba2)



