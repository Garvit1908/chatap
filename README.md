# TalkFlow

TalkFlow is a real-time messaging and video calling app. It has instant direct messaging, group chats, video calls, Google sign-in, and an integrated AI assistant (TalkBot).

**Live Demo:** [https://chatap-six.vercel.app/](https://chatap-six.vercel.app/)

Built with React/Vite on the front end, and Node.js/Express/Socket.io on the back end, using MongoDB for storage.

---

## Features

- **Real-Time DMs & Group Chats:** Instant messaging with typing indicators, read receipts, and delivery status.
- **Video Calling:** Peer-to-peer audio and video calls using WebRTC (Simple-Peer) with STUN fallback.
- **Integrated AI Assistant:** A built-in AI chatbot (TalkBot) powered by OpenRouter that maintains conversation history.
- **Secure Authentication:** Standard email login with OTP verification, plus Google OAuth support.
- **Modern Responsive UI:** Glassmorphic layout designed to work seamlessly on both mobile screens and desktops.

---

## Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB (via Mongoose)
- **Deployment & Infra:** Docker, Docker Compose

---

## Getting Started

### Prerequisites
Make sure you have Node.js (v20+) and either MongoDB or Docker installed on your machine.

### Step 1: Environment Variables

Both the client and server expect environment configuration.

1. **Backend Configuration:**
   Go to `/server`, create a `.env` file, and fill it in matching [server/.env.example](server/.env.example):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/talkflow
   JWT_SECRET=your_secret_key
   BREVO_API_KEY=your_brevo_key
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   OPENROUTER_API_KEY=your_openrouter_key
   ```

2. **Frontend Configuration:**
   Go to `/client`, create a `.env` file, and fill it in matching [client/.env.example](client/.env.example):
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ```

### Step 2: Running with Docker Compose (Quickest)

If you have Docker installed, simply run the following command in the root folder:

```bash
docker-compose up --build
```
This boots up the MongoDB database instance, the Express API backend, and the Vite client concurrently.
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

### Step 3: Running Manually

If you prefer running without Docker:

1. **Start MongoDB locally.**
2. **Start Backend Server:**
   ```bash
   cd server
   npm install
   npm start
   ```
3. **Start React Client:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## Running Tests

To run the backend authentication unit tests:
```bash
cd server
npm test
```
