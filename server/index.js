const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const dns = require("dns");
require("dotenv").config();

// Use Google DNS and force IPv4 to fix Render's ENETUNREACH SMTP issue
dns.setServers(["8.8.8.8", "8.8.4.4"]);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");
const messageRoutes = require("./routes/messages");
const Message = require("./models/Message");
const Group = require("./models/Group");
const User = require("./models/User");
const openRouterKey = process.env.OPENROUTER_API_KEY;
let talkBotId = null;
const TALK_BOT_TIMEOUT_MS = 30_000;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check endpoint (keeps Render awake when pinged by UptimeRobot)
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

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
  socket.on("user-online", async (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`User ${userId} is online`);
    
    try {
      // Mark messages as delivered for this user
      await Message.updateMany(
        { receiverId: userId, status: "sent" },
        { $set: { status: "delivered" } }
      );
      // We could broadcast to senders that messages were delivered, but standard read receipts is usually enough for a resume project.
    } catch (err) {
      console.error("Error marking delivered:", err);
    }
  });

  // Send message
  socket.on("send-message", async (data) => {
    const { senderId, receiverId, content } = data;

    try {
      // Determine initial status based on if receiver is online
      const receiverSocketId = onlineUsers.get(receiverId);
      const initialStatus = receiverSocketId ? "delivered" : "sent";

      // Save message to MongoDB
      const message = new Message({ senderId, receiverId, content, status: initialStatus });
      await message.save();

      // Emit to receiver if online
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-message", {
          _id: message._id,
          senderId,
          receiverId,
          content,
          status: initialStatus,
          createdAt: message.createdAt,
        });
      }

      // Confirm to sender
      socket.emit("message-sent", {
        _id: message._id,
        senderId,
        receiverId,
        content,
        status: initialStatus,
        createdAt: message.createdAt,
      });

      // --- AI TalkBot Logic ---
      if (receiverId === talkBotId?.toString()) {
        const senderSocketId = onlineUsers.get(senderId);

        const sendBotReply = async (content) => {
          const botMessage = new Message({
            senderId: talkBotId,
            receiverId: senderId,
            content,
            status: "delivered",
          });
          await botMessage.save();

          if (senderSocketId) {
            io.to(senderSocketId).emit("receive-message", {
              _id: botMessage._id,
              senderId: talkBotId,
              receiverId: senderId,
              content,
              status: "delivered",
              createdAt: botMessage.createdAt,
            });
          }
        };

        try {
          // Send typing indicator to user
          if (senderSocketId) {
            io.to(senderSocketId).emit("typing", { from: talkBotId });
          }

          if (!openRouterKey) {
            throw new Error("TalkBot is not configured: OPENROUTER_API_KEY is missing.");
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), TALK_BOT_TIMEOUT_MS);

          // OpenRouter API call
          let response;
          try {
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "HTTP-Referer": "https://talkflow-frontend-s10c.onrender.com",
                "X-Title": "TalkFlow App",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                "model": "openrouter/auto",
                "messages": [
                  { "role": "system", "content": "You are TalkBot, a friendly and extremely helpful AI assistant built into the TalkFlow chat app. Keep your answers concise, helpful, and friendly." },
                  { "role": "user", "content": content },
                ],
              }),
              signal: controller.signal,
            });
          } finally {
            clearTimeout(timeout);
          }

          const apiData = await response.json();
          console.log("OpenRouter response:", JSON.stringify(apiData).substring(0, 300));
          if (!response.ok) {
            throw new Error(apiData.error?.message || `OpenRouter returned HTTP ${response.status}.`);
          }

          const aiReply = apiData.choices?.[0]?.message?.content?.trim();
          if (!aiReply) {
            throw new Error("OpenRouter returned no message content.");
          }

          await sendBotReply(aiReply);
        } catch (aiError) {
          console.error("TalkBot AI Error:", aiError);
          const detail = aiError.name === "AbortError"
            ? "The AI request timed out. Please try again."
            : "TalkBot is temporarily unavailable. Please try again in a moment.";
          await sendBotReply(detail);
        } finally {
          if (senderSocketId) {
            io.to(senderSocketId).emit("stop-typing", { from: talkBotId });
          }
        }
      }

    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Typing indicators
  socket.on("typing", (data) => {
    const receiverSocketId = onlineUsers.get(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { from: data.from });
    }
  });

  socket.on("stop-typing", (data) => {
    const receiverSocketId = onlineUsers.get(data.to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stop-typing", { from: data.from });
    }
  });

  // Read receipts
  socket.on("mark-messages-read", async (data) => {
    const { senderId, receiverId } = data; // receiverId is the one who read the messages
    try {
      await Message.updateMany(
        { senderId, receiverId, status: { $ne: "read" } },
        { $set: { status: "read" } }
      );
      
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages-read", {
          byUserId: receiverId
        });
      }
    } catch (err) {
      console.error("Error marking messages read:", err);
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

const { MongoMemoryServer } = require("mongodb-memory-server");

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    
    // Fallback to in-memory server if local connection string or none provided
    if (!mongoUri || mongoUri.includes("127.0.0.1") || mongoUri.includes("localhost")) {
      console.log("Starting in-memory MongoDB database...");
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Initialize TalkBot usernot 
    let botUser = await User.findOne({ email: "talkbot@system.local" });
    if (!botUser) {
      botUser = new User({
        name: "🤖 TalkBot (AI)",
        email: "talkbot@system.local",
        password: "system_generated_bot_pwd_123!" 
      });
      await botUser.save();
    }
    talkBotId = botUser._id;
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

startServer();
