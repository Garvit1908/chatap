import { useState, useEffect, useRef } from "react";

export default function ChatWindow({
  socket,
  selectedChat,
  chatType,
  messages,
  currentUser,
  onSendMessage,
  onlineUsers,
  onStartCall,
  onBack,
}) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!socket) return;
    
    const handleTyping = ({ from }) => {
      if (chatType === "user" && from === selectedChat._id) {
        setIsTyping(true);
      }
    };
    
    const handleStopTyping = ({ from }) => {
      if (chatType === "user" && from === selectedChat._id) {
        setIsTyping(false);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, selectedChat, chatType]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (socket && chatType === "user") {
       socket.emit("stop-typing", { to: selectedChat._id, from: currentUser.id });
       if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
    
    onSendMessage(input);
    setInput("");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    if (socket && chatType === "user") {
      socket.emit("typing", { to: selectedChat._id, from: currentUser.id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop-typing", { to: selectedChat._id, from: currentUser.id });
      }, 1500);
    }
  };

  const isOnline =
    chatType === "user" && onlineUsers.includes(selectedChat._id);

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || "?";

  const avatarColors = [
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-pink-500 to-rose-600",
  ];

  const getColor = (id) => {
    const index =
      id?.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      avatarColors.length;
    return avatarColors[index || 0];
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0f0c29]/95 via-[#13102e]/95 to-[#1a1540]/95 relative overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-xl z-20 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Back button - mobile only */}
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${getColor(selectedChat._id)} flex items-center justify-center text-white text-lg font-bold shadow-lg ring-2 ring-white/10`}
            >
              {getInitial(selectedChat.name)}
            </div>
            {chatType === "user" && onlineUsers.includes(selectedChat._id) && selectedChat.email !== "talkbot@system.local" && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#13102e] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {selectedChat.name}
            </h2>
            {chatType === "user" ? (
              selectedChat.email === "talkbot@system.local" ? (
                <p className="text-cyan-400 text-xs font-medium mt-0.5">
                  AI Assistant
                </p>
              ) : (
                <p className={`text-xs flex items-center gap-1.5 font-medium mt-0.5 ${onlineUsers.includes(selectedChat._id) ? "text-emerald-400" : "text-gray-500"}`}>
                  {onlineUsers.includes(selectedChat._id) && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                  )}
                  {onlineUsers.includes(selectedChat._id) ? "Active now" : "Offline"}
                </p>
              )
            ) : (
              <p className="text-cyan-400 text-xs font-medium mt-0.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {selectedChat.members?.length || 0} members
              </p>
            )}
          </div>
        </div>
        
        {chatType === "user" && onStartCall && (
          <button
            onClick={onStartCall}
            className="p-3 text-white bg-gradient-to-r from-violet-600 to-cyan-600 rounded-full hover:from-violet-500 hover:to-cyan-500 transition-all duration-300 hover:scale-110 cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.4)] group"
            title="Video Call"
          >
            <svg
              className="w-5 h-5 group-hover:animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide relative z-10">
        {messages.map((m, i) => {
          const isOwn = m.senderId === currentUser.id;
          return (
            <div
              key={m._id || i}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[75%] rounded-3xl px-5 py-3.5 shadow-md backdrop-blur-sm ${
                  isOwn
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm border border-violet-500/20"
                    : "bg-white/10 text-gray-100 rounded-bl-sm border border-white/5"
                }`}
              >
                {!isOwn && chatType === "group" && (
                  <p className="text-xs text-cyan-300 font-bold mb-1 tracking-wide">
                    {m.senderName}
                  </p>
                )}
                <p className="text-sm leading-relaxed">{m.content}</p>
                <div className={`flex items-center gap-1.5 mt-2 justify-end`}>
                  <p className={`text-[10px] font-medium ${isOwn ? 'text-violet-200' : 'text-gray-400'}`}>
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : ""}
                  </p>
                  {isOwn && chatType === "user" && (
                    <span className="text-[14px]">
                      {m.status === "read" ? (
                        <span className="text-cyan-300">✓✓</span>
                      ) : m.status === "delivered" ? (
                        <span className="text-violet-200/80">✓✓</span>
                      ) : (
                        <span className="text-violet-200/50">✓</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white/10 rounded-3xl rounded-bl-sm px-4 py-3 shadow-md border border-white/5 backdrop-blur-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-3 md:p-4 bg-transparent flex gap-3 relative z-20"
      >
        <div className="flex-1 relative group">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="w-full pl-5 pr-12 py-4 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 shadow-[0_-5px_25px_rgba(0,0,0,0.2)]"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer shadow-md hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          >
            <svg
              className="w-5 h-5 -ml-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
