const User = require("../models/User");
const Message = require("../models/Message");

let talkBotId = null;
const TALK_BOT_TIMEOUT_MS = 30_000;

// Rate limiting state: userId -> timestamp[]
const userLimits = new Map();

const getTalkBotId = async () => {
  if (talkBotId) return talkBotId;
  const botUser = await User.findOne({ email: "talkbot@system.local" });
  if (botUser) {
    talkBotId = botUser._id;
  }
  return talkBotId;
};

/**
 * Checks if user is rate limited for bot messages (Limit: 20 calls/minute)
 */
const checkRateLimit = (userId) => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  if (!userLimits.has(userId)) {
    userLimits.set(userId, [now]);
    return false;
  }

  const timestamps = userLimits.get(userId).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return true;
  }

  timestamps.push(now);
  userLimits.set(userId, timestamps);
  return false;
};

/**
 * Retrieves the last 10 messages of conversational context between the user and the bot
 */
const getContextHistory = async (userId, botId) => {
  try {
    const messages = await Message.find({
      groupId: null,
      $or: [
        { senderId: userId, receiverId: botId },
        { senderId: botId, receiverId: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Sort to chronological order
    messages.reverse();

    return messages.map((m) => ({
      role: m.senderId.toString() === botId.toString() ? "assistant" : "user",
      content: m.content,
    }));
  } catch (err) {
    console.error("Error fetching bot conversation history:", err);
    return [];
  }
};

/**
 * Handles incoming message to TalkBot, fetches response from OpenRouter, and emits reply
 */
const handleTalkBotMessage = async (socket, io, onlineUsers, messageContent) => {
  const senderId = socket.userId;
  const senderSocketId = socket.id;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  const botId = await getTalkBotId();
  if (!botId) {
    console.error("TalkBot system user does not exist in the database.");
    return;
  }

  const sendBotReply = async (content) => {
    try {
      const botMessage = new Message({
        senderId: botId,
        receiverId: senderId,
        content,
        status: "delivered",
      });
      await botMessage.save();

      if (senderSocketId) {
        io.to(senderSocketId).emit("receive-message", {
          _id: botMessage._id,
          senderId: botId,
          receiverId: senderId,
          content,
          status: "delivered",
          createdAt: botMessage.createdAt,
        });
      }
    } catch (err) {
      console.error("Error saving/sending bot reply:", err);
    }
  };

  // 1. Rate Limit Enforcement
  if (checkRateLimit(senderId)) {
    console.warn(`User ${senderId} rate limited on TalkBot.`);
    await sendBotReply("You are sending messages too quickly! Please slow down and try again in a minute.");
    return;
  }

  try {
    // Send typing indicator
    socket.emit("typing", { from: botId });

    if (!openRouterKey) {
      throw new Error("TalkBot is not configured: OPENROUTER_API_KEY is missing.");
    }

    // 2. Bounded Context Conversation History
    const history = await getContextHistory(senderId, botId);
    
    // Prepare conversation messages array
    const messagesPayload = [
      {
        role: "system",
        content: "You are TalkBot, a friendly and extremely helpful AI assistant built into the TalkFlow chat app. Keep your answers concise, helpful, and friendly.",
      },
      ...history,
    ];

    // Ensure the current content is present if history didn't pick it up yet
    if (history.length === 0 || history[history.length - 1].content !== messageContent) {
      messagesPayload.push({ role: "user", content: messageContent });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TALK_BOT_TIMEOUT_MS);

    let response;
    try {
      // 3. OpenRouter Fetch Call
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://talkflow-frontend-s10c.onrender.com",
          "X-Title": "TalkFlow App",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: messagesPayload,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const apiData = await response.json();

    // 4. Safe Logging
    if (apiData.error) {
      console.error("OpenRouter API returned error:", {
        message: apiData.error.message,
        code: apiData.error.code,
      });
    } else {
      console.log("OpenRouter fetch successful, usage status:", apiData.usage || "N/A");
    }

    if (!response.ok) {
      throw new Error(apiData.error?.message || `OpenRouter returned HTTP ${response.status}.`);
    }

    const aiReply = apiData.choices?.[0]?.message?.content?.trim();
    if (!aiReply) {
      throw new Error("OpenRouter returned no message content.");
    }

    await sendBotReply(aiReply);
  } catch (aiError) {
    console.error("TalkBot AI Process Error:", aiError.message);
    const detail = aiError.message?.includes("OPENROUTER_API_KEY")
      ? "TalkBot is not configured on the server yet. Please contact the administrator."
      : aiError.name === "AbortError"
        ? "The AI request timed out. Please try again."
        : "TalkBot is temporarily unavailable. Please try again in a moment.";
    await sendBotReply(detail);
  } finally {
    socket.emit("stop-typing", { from: botId });
  }
};

module.exports = {
  handleTalkBotMessage,
  getTalkBotId,
};
