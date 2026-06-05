const express = require("express");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");

const router = express.Router();

// Middleware: verify JWT token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET /api/messages/:userId — get chat history between two users
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      groupId: null,
      $or: [
        { senderId: req.userId, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/messages/group/:groupId — get group chat history
router.get("/group/:groupId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      groupId: req.params.groupId,
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "name");

    // Map to include senderName
    const formatted = messages.map((msg) => ({
      _id: msg._id,
      senderId: msg.senderId._id || msg.senderId,
      groupId: msg.groupId,
      content: msg.content,
      senderName: msg.senderId.name || "Unknown",
      createdAt: msg.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
