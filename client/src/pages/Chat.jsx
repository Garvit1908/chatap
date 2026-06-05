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

  // Fetch users and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/groups", {
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
          url = `http://localhost:5000/api/messages/${selectedChat._id}`;
        } else {
          url = `http://localhost:5000/api/messages/group/${selectedChat._id}`;
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

  // Socket listeners for messages
  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", (msg) => {
      if (
        selectedChat &&
        chatType === "user" &&
        msg.senderId === selectedChat._id
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("message-sent", (msg) => {
      setMessages((prev) => [...prev, msg]);
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
  };

  const handleSelectGroup = (g) => {
    setSelectedChat(g);
    setChatType("group");
    setMessages([]);
  };

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    if (socket) socket.emit("join-group", newGroup._id);
  };

  return (
    <div className="h-screen flex bg-[#0f0c29] overflow-hidden">
      {/* Sidebar */}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatWindow
            selectedChat={selectedChat}
            chatType={chatType}
            messages={messages}
            currentUser={user}
            onSendMessage={sendMessage}
            onlineUsers={onlineUsers}
            onStartCall={chatType === "user" ? startCall : null}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-violet-600/20 to-cyan-600/20 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500">
                Select a user or group from the sidebar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Incoming call notification */}
      {incomingCall && !callActive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e1b4b] border border-violet-500/30 rounded-2xl p-8 text-center shadow-2xl animate-pulse">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {incomingCall.name} is calling...
            </h3>
            <div className="flex gap-4 mt-6 justify-center">
              <button
                onClick={acceptCall}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-400 hover:to-emerald-400 transition-all cursor-pointer"
              >
                Accept
              </button>
              <button
                onClick={() => setIncomingCall(null)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-medium hover:from-red-400 hover:to-rose-400 transition-all cursor-pointer"
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
