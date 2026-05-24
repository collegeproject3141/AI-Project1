import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function App() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState("");

  const [recentChats, setRecentChats] = useState([]);

  const chatEndRef = useRef(null);

  // =========================
  // LOAD STORAGE
  // =========================
  useEffect(() => {

    const savedChat = localStorage.getItem("chatHistory");

    if (savedChat) {
      setChat(JSON.parse(savedChat));
    }

    const savedRecentChats = localStorage.getItem("recentChats");

    if (savedRecentChats) {
      setRecentChats(JSON.parse(savedRecentChats));
    }

  }, []);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [chat, loading]);

  // =========================
  // UPDATE CHAT
  // =========================
  const updateChat = (newChat) => {

    setChat(newChat);

    localStorage.setItem(
      "chatHistory",
      JSON.stringify(newChat)
    );
  };

  // =========================
  // SAVE RECENT CHAT
  // =========================
  const saveRecentChat = (userMessage, fullChat) => {

    const filteredChats = recentChats.filter(
      (item) => item.title !== userMessage
    );

    const updatedRecentChats = [
      {
        id: Date.now(),
        title:
          userMessage.length > 35
            ? userMessage.slice(0, 35) + "..."
            : userMessage,
        chatData: fullChat,
      },
      ...filteredChats,
    ];

    const limitedChats = updatedRecentChats.slice(0, 8);

    setRecentChats(limitedChats);

    localStorage.setItem(
      "recentChats",
      JSON.stringify(limitedChats)
    );
  };

  // =========================
  // OPEN RECENT CHAT
  // =========================
  const openRecentChat = (chatData) => {

    setChat(chatData);

    localStorage.setItem(
      "chatHistory",
      JSON.stringify(chatData)
    );
  };

  // =========================
  // NEW CHAT
  // =========================
  const newChat = () => {

    setChat([]);

    localStorage.removeItem("chatHistory");
  };

  // =========================
  // CLEAR RECENT CHATS
  // =========================
  const clearRecentChats = () => {

    setRecentChats([]);

    localStorage.removeItem("recentChats");
  };

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = async () => {

    const currentPrompt = message;

    if (!currentPrompt.trim() && !selectedFile) return;

    setMessage("");

    let updatedChat = [...chat];

    const userMessage = {
      sender: "user",
      text: currentPrompt || "Analyze uploaded file",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    updatedChat.push(userMessage);

    updateChat(updatedChat);

    setLoading(true);

    try {

      // FILE FLOW
      if (selectedFile) {

        const formData = new FormData();

        if (fileType === "pdf") {
          formData.append("pdf", selectedFile);
        }

        if (fileType === "image") {
          formData.append("image", selectedFile);
        }

        formData.append("prompt", currentPrompt);

        const endpoint =
          fileType === "pdf"
            ? "https://ai-project1-gqfv.onrender.com/upload-pdf"
            : "https://ai-project1-gqfv.onrender.com/upload-image";

        const response = await axios.post(
          endpoint,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const botReply = {
          sender: "bot",
          text:
            response.data.summary ||
            response.data.reply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        updatedChat.push(botReply);

        updateChat(updatedChat);

        saveRecentChat(currentPrompt, updatedChat);

        setSelectedFile(null);
        setFileType("");
      }

      // NORMAL CHAT FLOW
      else {

        const response = await axios.post(
          "https://ai-project1-gqfv.onrender.com/chat",
          {
            message: currentPrompt,
          }
        );

        const botMessage = {
          sender: "bot",
          text: response.data.reply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        updatedChat.push(botMessage);

        updateChat(updatedChat);

        saveRecentChat(currentPrompt, updatedChat);
      }

    } catch (error) {

      console.log(error);

      updatedChat.push({
        sender: "bot",
        text: "Something went wrong",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      updateChat(updatedChat);
    }

    setLoading(false);
  };

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-[280px] lg:w-[300px] bg-[#0b0b0b]/90 backdrop-blur-md border-r border-gray-800 p-5 hidden md:flex flex-col sticky top-0 h-screen">

        {/* Logo */}
        <div>

          <h1
            onClick={newChat}
            className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent cursor-pointer hover:scale-[1.02] transition-all"
          >
            StudyAI
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            AI Powered Productivity Workspace
          </p>

        </div>

        {/* User Card */}
        <div className="mt-8 bg-[#151515] border border-gray-800 rounded-3xl p-4 hover:border-blue-500 transition-all">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
              G
            </div>

            <div>

              <h2 className="font-semibold">
                Guest User
              </h2>

              <p className="text-gray-400 text-xs">
                Active Session
              </p>

            </div>

          </div>

        </div>

        {/* Menu */}
        <div className="mt-8 flex flex-col gap-3">

          <button
            onClick={newChat}
            className="bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.96] transition-all rounded-2xl px-4 py-4 text-left font-medium cursor-pointer hover:shadow-lg hover:shadow-blue-500/20"
          >
            ➕ New Chat
          </button>

          <div className="bg-[#151515] border border-gray-800 rounded-2xl px-4 py-4 hover:border-blue-500 hover:bg-[#1a1a1a] transition-all cursor-pointer">
            💬 AI Chat Assistant
          </div>

          <div className="bg-[#151515] border border-gray-800 rounded-2xl px-4 py-4 hover:border-blue-500 hover:bg-[#1a1a1a] transition-all cursor-pointer">
            📄 PDF Analyzer
          </div>

          <div className="bg-[#151515] border border-gray-800 rounded-2xl px-4 py-4 hover:border-blue-500 hover:bg-[#1a1a1a] transition-all cursor-pointer">
            🖼️ Image Solver
          </div>

        </div>

        {/* Recent Chats */}
        <div className="mt-8 flex-1 overflow-y-auto pr-1 scrollbar-hide">

          <div className="flex items-center justify-between mb-3">

            <h2 className="text-gray-400 text-sm">
              Recent Chats
            </h2>

            <button
              onClick={clearRecentChats}
              className="text-xs text-red-400 hover:text-red-500 cursor-pointer"
            >
              Clear All
            </button>

          </div>

          <div className="flex flex-col gap-2">

            {recentChats.length === 0 && (
              <div className="text-gray-600 text-sm">
                No recent chats
              </div>
            )}

            {recentChats.map((item) => (
              <button
                key={item.id}
                onClick={() => openRecentChat(item.chatData)}
                className="bg-[#151515] border border-gray-800 rounded-xl px-3 py-3 text-sm truncate text-gray-300 hover:border-blue-500 hover:bg-[#1a1a1a] transition-all text-left cursor-pointer"
              >
                💬 {item.title}
              </button>
            ))}

          </div>

        </div>

      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOPBAR */}
        <div className="min-h-[80px] border-b border-gray-800 bg-[#0b0b0b]/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between">

          <div className="min-w-0">

            <h1 className="text-xl md:text-2xl font-bold truncate">
              AI Study Assistant
            </h1>

            <div className="flex gap-2 mt-2 flex-wrap">

              <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/20">
                AI Powered
              </span>

              <span className="bg-cyan-500/10 text-cyan-400 text-xs px-3 py-1 rounded-full border border-cyan-500/20">
                Smart Analysis
              </span>

              <span className="bg-green-500/10 text-green-400 text-xs px-3 py-1 rounded-full border border-green-500/20">
                Beta
              </span>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>

            <span className="text-sm text-gray-400 hidden sm:block">
              AI Online
            </span>

          </div>

        </div>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-black scrollbar-hide">

          {chat.length === 0 && (

            <div className="h-full flex flex-col items-center justify-center">

              <div className="text-7xl mb-6">
                ✨
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold text-center bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent leading-tight">
                Welcome to StudyAI
              </h1>

              <p className="text-gray-400 mt-4 text-base md:text-lg text-center max-w-2xl px-4">
                Your intelligent AI workspace for engineering studies, coding help, PDFs and image analysis.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10 w-full max-w-5xl">

                <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 hover:border-blue-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                  <h2 className="text-2xl font-bold mb-2">
                    💬 AI Chat
                  </h2>

                  <p className="text-gray-400">
                    Ask coding doubts, engineering concepts, DBMS, DSA, OS and more.
                  </p>
                </div>

                <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 hover:border-blue-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                  <h2 className="text-2xl font-bold mb-2">
                    📄 PDF Analysis
                  </h2>

                  <p className="text-gray-400">
                    Upload PDFs and generate summaries, notes and MCQs instantly.
                  </p>
                </div>

                <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 hover:border-blue-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                  <h2 className="text-2xl font-bold mb-2">
                    🖼️ Image Understanding
                  </h2>

                  <p className="text-gray-400">
                    Upload screenshots, diagrams and coding questions for AI analysis.
                  </p>
                </div>

                <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6 hover:border-blue-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                  <h2 className="text-2xl font-bold mb-2">
                    ⚡ Fast Responses
                  </h2>

                  <p className="text-gray-400">
                    Modern AI powered learning experience with smooth UI and instant responses.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* Messages */}
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`mb-6 flex ${
                msg.sender === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`w-fit max-w-[95%] md:max-w-[80%] rounded-3xl px-5 py-4 shadow-xl transition-all ${
                  msg.sender === "user"
                    ? "bg-blue-600"
                    : "bg-[#111111] border border-gray-800"
                }`}
              >

                <div className="flex items-center gap-2 mb-2">

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    msg.sender === "user"
                      ? "bg-blue-500"
                      : "bg-gray-700"
                  }`}>
                    {msg.sender === "user" ? "U" : "AI"}
                  </div>

                  <span className="text-sm text-gray-300">
                    {msg.sender === "user"
                      ? "You"
                      : "StudyAI"}
                  </span>

                  <span className="text-xs text-gray-500">
                    {msg.time}
                  </span>

                </div>

                <div className="leading-7 whitespace-pre-wrap overflow-x-auto scrollbar-hide">
                  <ReactMarkdown>
                    {msg.text}
                  </ReactMarkdown>
                </div>

              </div>

            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">

              <div className="bg-[#111111] border border-gray-800 rounded-3xl px-5 py-4">

                <div className="flex gap-2 items-center">

                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>

                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>

                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>

                  <span className="ml-2">
                    Analyzing...
                  </span>

                </div>

              </div>

            </div>
          )}

          <div ref={chatEndRef}></div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-gray-800 bg-[#0b0b0b]/90 backdrop-blur-md p-4 md:p-5">

          {/* Selected File */}
          {selectedFile && (
            <div className="mb-4 flex items-center justify-between bg-[#151515] border border-gray-800 rounded-2xl px-4 py-3">

              <div className="flex items-center gap-3 min-w-0">

                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {fileType === "pdf"
                    ? "📄"
                    : "🖼️"}
                </div>

                <div className="min-w-0">

                  <p className="font-semibold text-sm truncate">
                    {selectedFile.name}
                  </p>

                  <p className="text-gray-400 text-xs">
                    {fileType.toUpperCase()} Selected
                  </p>

                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>

                </div>

              </div>

              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFileType("");
                }}
                className="text-red-400 hover:text-red-500 transition cursor-pointer text-lg"
              >
                ✕
              </button>

            </div>
          )}

          {/* Input Section */}
          <div className="flex gap-3">

            {/* PDF Upload */}
            <label className="bg-[#151515] hover:bg-[#1b1b1b] border border-gray-800 hover:border-blue-500 rounded-2xl px-4 py-4 cursor-pointer transition-all">

              📄

              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={(e) => {
                  setSelectedFile(e.target.files[0]);
                  setFileType("pdf");
                }}
              />

            </label>

            {/* Image Upload */}
            <label className="bg-[#151515] hover:bg-[#1b1b1b] border border-gray-800 hover:border-blue-500 rounded-2xl px-4 py-4 cursor-pointer transition-all">

              🖼️

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  setSelectedFile(e.target.files[0]);
                  setFileType("image");
                }}
              />

            </label>

            {/* Input */}
            <input
              type="text"
              placeholder={
                selectedFile
                  ? "Ask about uploaded file..."
                  : "Ask anything..."
              }
              value={message}
              disabled={loading}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  sendMessage();
                }
              }}
              className="flex-1 bg-[#151515] border border-gray-800 rounded-2xl px-5 py-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all min-w-0"
            />

            {/* Send */}
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.96] disabled:opacity-50 transition-all px-6 md:px-8 py-4 rounded-2xl font-semibold cursor-pointer"
            >
              Send
            </button>

          </div>

          {/* Footer */}
          <div className="text-center text-gray-600 text-xs pt-4">
            StudyAI • Intelligent Learning Workspace
          </div>

        </div>

      </div>

      {/* HIDE SCROLLBAR */}
      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }

          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

    </div>
  );
}

export default App;