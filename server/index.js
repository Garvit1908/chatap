const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const dns = require("dns");
require("dotenv").config();

// Use Google DNS to resolve MongoDB SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");
const messageRoutes = require("./routes/messages");
const Message = require("./models/Message");
const Group = require("./models/Group");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);

// Track online users: userId -> socketId
const onlineUsers = new Map();

// Socket.io events
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // User comes online
  socket.on("user-online", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`User ${userId} is online`);
  });

  // Send message
  socket.on("send-message", async (data) => {
    const { senderId, receiverId, content } = data;

    try {
      // Save message to MongoDB
      const message = new Message({ senderId, receiverId, content });
      await message.save();

      // Emit to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-message", {
          _id: message._id,
          senderId,
          receiverId,
          content,
          createdAt: message.createdAt,
        });
      }

      // Confirm to sender
      socket.emit("message-sent", {
        _id: message._id,
        senderId,
        receiverId,
        content,
        createdAt: message.createdAt,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Video call: caller signals the target user
  socket.on("call-user", (data) => {
    const receiverSocketId = onlineUsers.get(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming-call", {
        signal: data.signal,
        from: data.from,
        name: data.name,
      });
    }
  });

  // Video call: callee accepts the call
  socket.on("accept-call", (data) => {
    const callerSocketId = onlineUsers.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", {
        signal: data.signal,
      });
    }
  });

  // ICE candidate exchange
  socket.on("ice-candidate", (data) => {
    const targetSocketId = onlineUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", {
        candidate: data.candidate,
      });
    }
  });

  // Group chat: join group room
  socket.on("join-group", (groupId) => {
    socket.join(`group-${groupId}`);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  // Group chat: send message to group
  socket.on("send-group-message", async (data) => {
    const { senderId, groupId, content, senderName } = data;

    try {
      const message = new Message({ senderId, groupId, content });
      await message.save();

      // Broadcast to all group members in the room
      io.to(`group-${groupId}`).emit("receive-group-message", {
        _id: message._id,
        senderId,
        groupId,
        content,
        senderName,
        createdAt: message.createdAt,
      });
    } catch (error) {
      console.error("Error saving group message:", error);
    }
  });

  // User disconnects
  socket.on("disconnect", () => {
    let disconnectedUserId = null;

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    io.emit("online-users", Array.from(onlineUsers.keys()));

    if (disconnectedUserId) {
      console.log(`User ${disconnectedUserId} disconnected`);
    }
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
