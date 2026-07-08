import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import VideoCall from "../components/VideoCall";

export default function Chat() {
  const { user, token, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState("user"); // "user" or "group"
  const [messages, setMessages] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [callData, setCallData] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Fetch users and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          axios.get("https://talkflow-backend-k286.onrender.com/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("https://talkflow-backend-k286.onrender.com/api/groups", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setUsers(usersRes.data);
        setGroups(groupsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [token]);

  // Fetch message history when chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        let url = "";
        if (chatType === "user") {
          url = `https://talkflow-backend-k286.onrender.com/api/messages/${selectedChat._id}`;
        } else {
          url = `https://talkflow-backend-k286.onrender.com/api/messages/group/${selectedChat._id}`;
        }
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
      } catch (err) {
        // No message history endpoint yet — start fresh
        setMessages([]);
      }
    };
    fetchMessages();
  }, [selectedChat, chatType, token]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (socket && selectedChat && chatType === "user") {
      socket.emit("mark-messages-read", { senderId: selectedChat._id, receiverId: user.id });
      setMessages((prev) => prev.map(m => m.senderId === selectedChat._id ? { ...m, status: "read" } : m));
    }
  }, [selectedChat, socket, chatType, user.id]);

  // Socket listeners for messages
  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", (msg) => {
      if (
        selectedChat &&
        chatType === "user" &&
        msg.senderId === selectedChat._id
      ) {
        setMessages((prev) => [...prev, { ...msg, status: "read" }]);
        socket.emit("mark-messages-read", { senderId: msg.senderId, receiverId: user.id });
      }
    });

    socket.on("message-sent", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("messages-read", ({ byUserId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.receiverId === byUserId ? { ...m, status: "read" } : m
        )
      );
    });

    socket.on("receive-group-message", (msg) => {
      if (
        selectedChat &&
        chatType === "group" &&
        msg.groupId === selectedChat._id &&
        msg.senderId !== user.id
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // Video call listeners
    socket.on("incoming-call", (data) => {
      setIncomingCall(data);
    });

    socket.on("call-accepted", (data) => {
      setCallData((prev) => ({ ...prev, accepted: true, signal: data.signal }));
    });

    return () => {
      socket.off("receive-message");
      socket.off("message-sent");
      socket.off("messages-read");
      socket.off("receive-group-message");
      socket.off("incoming-call");
      socket.off("call-accepted");
    };
  }, [socket, selectedChat, chatType, user]);

  // Join group rooms when groups are loaded
  useEffect(() => {
    if (!socket || groups.length === 0) return;
    groups.forEach((g) => socket.emit("join-group", g._id));
  }, [socket, groups]);

  const sendMessage = (content) => {
    if (!socket || !content.trim()) return;

    if (chatType === "user") {
      socket.emit("send-message", {
        senderId: user.id,
        receiverId: selectedChat._id,
        content,
      });
    } else {
      socket.emit("send-group-message", {
        senderId: user.id,
        groupId: selectedChat._id,
        content,
        senderName: user.name,
      });
      // Add to local messages immediately for group
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now(),
          senderId: user.id,
          groupId: selectedChat._id,
          content,
          senderName: user.name,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const startCall = () => {
    setCallActive(true);
    setCallData({ to: selectedChat, initiator: true });
  };

  const acceptCall = () => {
    setCallActive(true);
    setCallData({
      to: incomingCall.from,
      initiator: false,
      incomingSignal: incomingCall.signal,
      callerName: incomingCall.name,
    });
    setIncomingCall(null);
  };

  const endCall = () => {
    setCallActive(false);
    setCallData(null);
  };

  const handleSelectUser = (u) => {
    setSelectedChat(u);
    setChatType("user");
    setMessages([]);
    setMobileChatOpen(true);
  };

  const handleSelectGroup = (g) => {
    setSelectedChat(g);
    setChatType("group");
    setMessages([]);
    setMobileChatOpen(true);
  };

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    if (socket) socket.emit("join-group", newGroup._id);
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#0a0e1a] to-[#12172b] overflow-hidden">
      {/* Sidebar */}
      <div className={`${mobileChatOpen ? 'hidden' : 'flex'} md:flex w-full md:w-auto`}>
        <Sidebar
          users={users}
          groups={groups}
          onlineUsers={onlineUsers}
          selectedChat={selectedChat}
          chatType={chatType}
          onSelectUser={handleSelectUser}
          onSelectGroup={handleSelectGroup}
          onGroupCreated={handleGroupCreated}
          currentUser={user}
          token={token}
          onLogout={logout}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`${mobileChatOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
        {selectedChat ? (
          <ChatWindow
            socket={socket}
            selectedChat={selectedChat}
            chatType={chatType}
            messages={messages}
            currentUser={user}
            onSendMessage={sendMessage}
            onlineUsers={onlineUsers}
            onStartCall={chatType === "user" ? startCall : null}
            onBack={() => setMobileChatOpen(false)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-transparent relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
            <div className="text-center relative z-10 animate-in fade-in zoom-in duration-700">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 opacity-20 blur-2xl animate-pulse"></div>
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl group-hover:scale-105 transition-transform">
                  <svg
                    className="w-16 h-16"
                    style={{ stroke: 'url(#chatGradient)', fill: 'none' }}
                    viewBox="0 0 24 24"
                  >
                    <defs>
                      <linearGradient id="chatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 tracking-tight">
                Your Conversations
              </h3>
              <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
                Select a user or group from the sidebar to start chatting or initiate a video call.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Incoming call notification */}
      {incomingCall && !callActive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="relative bg-[#1e1b4b]/80 border border-violet-500/50 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(139,92,246,0.2)] backdrop-blur-3xl transform scale-100 animate-in zoom-in-95 duration-300 min-w-[320px]">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl animate-pulse"></div>
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg ring-4 ring-emerald-500/30">
                <svg
                  className="w-14 h-14 text-white animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">
              {incomingCall.name}
            </h3>
            <p className="text-emerald-400 font-medium mb-8 animate-pulse">Incoming video call...</p>
            
            <div className="flex gap-4 justify-center relative z-10">
              <button
                onClick={acceptCall}
                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold tracking-wide hover:from-emerald-400 hover:to-green-500 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:-translate-y-1"
              >
                Accept
              </button>
              <button
                onClick={() => setIncomingCall(null)}
                className="flex-1 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold tracking-wide hover:from-red-400 hover:to-rose-500 transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] hover:-translate-y-1"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video call overlay */}
      {callActive && callData && (
        <VideoCall
          socket={socket}
          callData={callData}
          currentUser={user}
          onEndCall={endCall}
        />
      )}
    </div>
  );
}
