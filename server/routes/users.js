const express = require("express");
const User = require("../models/User");
const Message = require("../models/Message");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// GET /api/users/search — search users by name or email (excluding current user)
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const query = req.query.q || "";
    if (!query.trim()) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      email: { $ne: "talkbot@system.local" }, // Keep bot separate
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).select("-password").limit(10);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/users — return only users who have active chat history with logged-in user + TalkBot
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Find unique users we sent messages to (excluding groups)
    const activeReceivers = await Message.distinct("receiverId", { 
      senderId: req.userId,
      receiverId: { $ne: null } 
    });

    // Find unique users who sent messages to us
    const activeSenders = await Message.distinct("senderId", { 
      receiverId: req.userId 
    });

    // Merge and deduplicate
    const chatPartnerIds = Array.from(
      new Set([...activeReceivers, ...activeSenders].map(id => id.toString()))
    );

    // Find TalkBot and add to the list if not already present
    const talkBot = await User.findOne({ email: "talkbot@system.local" });
    if (talkBot && !chatPartnerIds.includes(talkBot._id.toString())) {
      chatPartnerIds.push(talkBot._id.toString());
    }

    const users = await User.find({
      _id: { $in: chatPartnerIds, $ne: req.userId }
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

