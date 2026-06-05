import { useState, useEffect, useRef } from "react";

export default function ChatWindow({
  selectedChat,
  chatType,
  messages,
  currentUser,
  onSendMessage,
  onlineUsers,
  onStartCall,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
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
    <div className="flex-1 flex flex-col bg-[#0f0c29]">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-[#13102e] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColor(selectedChat._id)} flex items-center justify-center text-white font-semibold`}
          >
            {getInitial(selectedChat.name)}
          </div>
          <div>
            <h2 className="text-white font-semibold">{selectedChat.name}</h2>
            {chatType === "user" ? (
              <p
                className={`text-xs ${isOnline ? "text-green-400" : "text-gray-500"}`}
              >
                {isOnline ? "Online" : "Offline"}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                {selectedChat.members?.length || 0} members
              </p>
            )}
          </div>
        </div>

        {/* Call button (only for 1-on-1) */}
        {onStartCall && (
          <button
            id="video-call-btn"
            onClick={onStartCall}
            className="p-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-400 hover:to-emerald-400 transition-all shadow-lg shadow-green-500/20 cursor-pointer"
            title="Video Call"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUser.id;
          return (
            <div
              key={msg._id || i}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] ${
                  isOwn
                    ? "bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl rounded-br-md"
                    : "bg-white/10 rounded-2xl rounded-bl-md"
                } px-4 py-2.5`}
              >
                {/* Show sender name in group chats */}
                {chatType === "group" && !isOwn && (
                  <p className="text-violet-400 text-xs font-medium mb-1">
                    {msg.senderName || "Unknown"}
                  </p>
                )}
                <p className="text-white text-sm leading-relaxed">
                  {msg.content}
                </p>
                <p
                  className={`text-[10px] mt-1 ${isOwn ? "text-violet-200/60" : "text-gray-500"} text-right`}
                >
                  {msg.createdAt ? formatTime(msg.createdAt) : ""}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-6 py-4 bg-[#13102e] border-t border-white/5">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            id="message-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
          />
          <button
            id="send-message-btn"
            type="submit"
            className="px-5 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl hover:from-violet-500 hover:to-cyan-500 transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
