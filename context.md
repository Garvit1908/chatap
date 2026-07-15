# TalkFlow Project Context

## What This Repository Is

TalkFlow is a real-time chat application with:

- React + Vite frontend
- Express + Socket.IO backend
- MongoDB persistence via Mongoose
- One-to-one messaging with read/delivered states
- Group chats with room-based broadcasting
- Typing indicators
- Peer-to-peer video calling using WebRTC and `simple-peer`
- Email-based registration OTP flow
- Google sign-in
- An AI chat companion called TalkBot backed by OpenRouter

The current codebase is organized as a two-app workspace:

- `client/` for the browser UI
- `server/` for the API, database models, and socket events

This file is meant to be a high-signal map of how the project works, so future edits can start from the right files quickly.

## High-Level Architecture

### Runtime Shape

The app is not a single-page client talking to a thin API. It is a stateful chat system with three active channels of communication:

1. HTTP requests for authentication, user lookup, groups, and message history
2. Socket.IO for live message delivery, typing presence, receipts, and video-call signaling
3. Browser media APIs for local camera and microphone access during calls

### Main Flow

1. A user lands on the public marketing page.
2. They sign up with email + OTP or sign in with password or Google.
3. After login, the client stores the JWT and user profile in `localStorage`.
4. The chat shell mounts, opens a Socket.IO connection, and announces the user as online.
5. The sidebar fetches active direct-chat partners and groups.
6. Selecting a direct user or group loads message history and wires the chat window to socket events.
7. One-to-one chats can show read receipts, typing, and video calls.
8. Group chats use socket rooms and history fetched from the API.

## Tech Stack

### Client

- React 19
- React Router 7
- Vite
- Tailwind CSS 4 via the Vite plugin
- `axios` for HTTP calls
- `socket.io-client` for live events
- `simple-peer` for WebRTC call setup
- `emoji-picker-react` for message composition
- `@react-oauth/google` for Google login
- `ogl` for the animated Aurora effect on the landing page

### Server

- Node.js with CommonJS modules
- Express 5
- MongoDB + Mongoose 9
- Socket.IO 4
- JSON Web Tokens for session auth
- bcryptjs for password hashing
- Nodemailer-style email flow abstracted behind a helper that can call Brevo
- google-auth-library for Google credential verification
- mongodb-memory-server as a fallback database when a local Mongo URI is used or no URI is supplied

## Repository Layout

### Root

- `docker-compose.yml` - local multi-container setup for MongoDB, backend, and frontend
- `README.md` - currently minimal / effectively empty in this snapshot
- `skills-lock.json` - Copilot skill lock metadata for the workspace
- `context.md` - this file

### Client

- `client/src/main.jsx` - React bootstrap and Google OAuth provider setup
- `client/src/App.jsx` - routing and auth guards
- `client/src/index.css` - global CSS, Tailwind import, scrollbar styling, base font
- `client/src/context/AuthContext.jsx` - auth state and localStorage persistence
- `client/src/context/SocketContext.jsx` - socket connection and online-user tracking
- `client/src/pages/Landing.jsx` - public marketing page
- `client/src/pages/Login.jsx` - email/password login and Google login
- `client/src/pages/Register.jsx` - OTP registration flow
- `client/src/pages/Chat.jsx` - main chat shell and app state coordinator
- `client/src/components/Sidebar.jsx` - direct chat list, group list, search, and group creation
- `client/src/components/ChatWindow.jsx` - message stream, composer, typing indicator, emoji picker
- `client/src/components/VideoCall.jsx` - WebRTC call overlay and peer wiring
- `client/src/components/Aurora.jsx` - animated WebGL background effect
- `client/src/components/Magnetic.jsx` - hover-magnet wrapper used on landing CTAs

### Server

- `server/index.js` - Express app, HTTP server, Socket.IO server, Mongo connection, AI bot integration
- `server/routes/auth.js` - OTP, registration, login, Google auth
- `server/routes/users.js` - user search and active chat partner retrieval
- `server/routes/groups.js` - group creation, membership updates, and deletion
- `server/routes/messages.js` - direct and group message history endpoints
- `server/models/User.js` - user schema
- `server/models/OTP.js` - temporary OTP storage with TTL
- `server/models/Group.js` - group schema with members and admin
- `server/models/Message.js` - message schema with status and chat indexes
- `server/utils/sendEmail.js` - email sender abstraction with Brevo API support and dev fallback
- `server/scratch-list-users.js` - utility / scratch script, not part of the main runtime path

## Client Behavior

### Routing and Access Control

The client routes are defined in `client/src/App.jsx`.

- `/` renders `Landing` for anonymous users.
- `/login` renders `Login` for anonymous users.
- `/signup` renders `Register` for anonymous users.
- `/chat` is protected by `PrivateRoute` and only renders after auth state exists.
- `/register` redirects to `/signup` for older links.

The app uses a simple auth-gating model:

- If `user` exists in `AuthContext`, the user is treated as authenticated.
- The auth token and user object are read from `localStorage` on mount.
- Login stores both values; logout clears both.

### Auth Context

`client/src/context/AuthContext.jsx` provides:

- `user`
- `token`
- `login(userData, authToken)`
- `logout()`

It also shows a fullscreen spinner while local auth state is being restored.

### Socket Context

`client/src/context/SocketContext.jsx` opens the Socket.IO connection only when a user is present.

Important behavior:

- Connects to the deployed backend URL directly.
- On connect, emits `user-online` with the current user ID.
- Listens for `online-users` and stores the current online user IDs in state.
- Disconnects the socket during cleanup.

This means the chat UI depends on the socket provider being nested under auth and only mounted inside the protected chat route.

### Landing Page

`client/src/pages/Landing.jsx` is a polished marketing page with:

- animated Aurora background
- gradient orbs
- prominent CTA buttons
- feature cards for messaging, video calls, and security
- magnetic hover behavior on primary buttons

It acts as a top-of-funnel page rather than a product shell.

### Login Page

`client/src/pages/Login.jsx` supports two login paths:

1. Email + password via `POST /api/auth/login`
2. Google credential login via `POST /api/auth/google`

Behavior notes:

- API base is hardcoded to the Render backend URL.
- Timeouts are set to 30 seconds to handle the free-tier wakeup delay.
- Errors distinguish between timeout, network failure, and API-reported auth failure.
- Successful login stores auth state and navigates into the app.

### Registration Page

`client/src/pages/Register.jsx` is a two-step sign-up flow:

1. Collect name, email, and password.
2. Send OTP to email.
3. After OTP is received, enter the 6-digit code.
4. Submit all fields to complete registration.

The UI includes:

- loading states for both OTP request and final registration
- success messaging after OTP delivery
- validation that OTP is 6 digits before enabling final submit

### Chat Shell

`client/src/pages/Chat.jsx` is the central orchestrator for the app.

It manages:

- `users` - active direct-chat partners
- `groups` - groups the user belongs to
- `selectedChat` - currently open direct user or group
- `chatType` - `user` or `group`
- `messages` - current conversation history
- `incomingCall` - pending video call payload
- `callActive` - whether the call overlay is visible
- `callData` - WebRTC peer setup data
- `mobileChatOpen` - responsive sidebar/chat switching state

#### Data Fetching

On mount it fetches:

- `GET /api/users`
- `GET /api/groups`

When a conversation is selected, it fetches history from:

- `GET /api/messages/:userId` for direct chat
- `GET /api/messages/group/:groupId` for group chat

#### Read Receipts

When a direct chat is opened, it emits `mark-messages-read` and locally marks messages as read.

#### Socket Listeners

The page listens for:

- `receive-message`
- `message-sent`
- `messages-read`
- `receive-group-message`
- `incoming-call`
- `call-accepted`

#### Group Rooms

After groups load, the client emits `join-group` for each group so the server can broadcast into the matching room.

#### Sending Messages

- Direct messages are sent through `send-message`.
- Group messages are sent through `send-group-message`.
- Group messages are also appended locally immediately for optimistic UI behavior.

#### Video Calls

The chat page can open the `VideoCall` overlay for direct chats only.

### Sidebar

`client/src/components/Sidebar.jsx` is a multi-purpose navigation and creation panel.

It supports:

- search over the current chat list
- database-backed search for new direct chats
- switching between `Users` and `Groups` tabs
- creating groups
- logging out

Notable behavior:

- The current user is shown at the top with an online indicator.
- TalkBot is treated specially and labeled as an AI assistant.
- Online presence uses the `onlineUsers` array from socket context.
- New direct chat search hits `/api/users/search?q=...`.
- Group creation posts to `/api/groups` and emits the created group back to the parent.

### Chat Window

`client/src/components/ChatWindow.jsx` handles the active conversation view.

It provides:

- message rendering
- emoji picker
- message composition
- typing status display
- scroll-to-bottom behavior
- read receipt icon rendering for outgoing direct messages

Typing flow:

- When the input changes in a direct chat, it emits `typing`.
- A timeout emits `stop-typing` after inactivity.
- Incoming `typing` and `stop-typing` socket events toggle the typing indicator.

Message rendering differences:

- Own messages render on the right with gradient styling.
- Other messages render on the left with a muted panel.
- Group messages show `senderName` above the message body.
- Direct-chat outgoing messages show status ticks for `sent`, `delivered`, and `read`.

### Video Call Overlay

`client/src/components/VideoCall.jsx` handles browser media and WebRTC negotiation.

Core flow:

- Requests camera and microphone via `getUserMedia`.
- Shows local video in a picture-in-picture preview.
- Uses `simple-peer` with Google STUN servers.
- The initiator emits `call-user` with the offer signal.
- The callee emits `accept-call` with the answer signal.
- Both sides exchange ICE and peer signals through Socket.IO.

The overlay also supports:

- mute toggle
- end call button
- status states for connecting, ringing, connected, and error

### Decorative Components

`Aurora.jsx` and `Magnetic.jsx` are UI-only helpers used on the landing page.

- `Aurora.jsx` renders a WebGL shader background through `ogl`.
- `Magnetic.jsx` applies a subtle cursor-following translation to child elements.

## Server Behavior

### Express and Socket Setup

`server/index.js` creates:

- an Express app
- an HTTP server
- a Socket.IO server layered on top of HTTP

It also:

- enables CORS for all origins
- parses JSON bodies
- exposes a `/health` endpoint
- mounts the API routers under `/api/...`

### MongoDB Connection Strategy

The server attempts to connect to `process.env.MONGO_URI`.

If the URI is missing or points to localhost / 127.0.0.1, it starts an in-memory MongoDB instance via `mongodb-memory-server` instead.

That makes local development easier, but it also means persistence behavior depends on the environment.

### TalkBot

The server initializes a system user with the email `talkbot@system.local` if it does not already exist.

That user is used as the receiver for AI chats.

When a message is sent to TalkBot:

1. The user message is stored.
2. Typing status is emitted to the sender if the sender is online.
3. The server calls OpenRouter chat completions.
4. The AI reply is saved as a message from the TalkBot user.
5. The reply is sent back to the original user through the socket.

The bot prompt tells the assistant to be friendly, concise, and helpful.

## Socket Event Map

### Client to Server

- `user-online` - register a socket as the active presence for a user ID
- `send-message` - send a direct message
- `typing` - forward typing presence to the other user
- `stop-typing` - stop typing presence
- `mark-messages-read` - mark a conversation as read
- `call-user` - send a WebRTC offer to another user
- `accept-call` - respond to an incoming call with an answer signal
- `ice-candidate` - exchange ICE candidates
- `join-group` - subscribe the socket to a group room
- `send-group-message` - send a group message

### Server to Client

- `online-users` - list of user IDs currently connected
- `receive-message` - incoming direct message
- `message-sent` - confirmation back to sender
- `typing` - typing indicator for direct chat
- `stop-typing` - typing stopped
- `messages-read` - read receipt broadcast to sender
- `incoming-call` - incoming video call notification
- `call-accepted` - answer signal for the caller
- `receive-group-message` - group room message broadcast

## API Routes

### Auth

Base path: `/api/auth`

- `POST /send-otp` - generate OTP, store it, and email it
- `POST /register` - verify OTP, hash password, create user, return JWT
- `POST /login` - verify email/password, return JWT
- `POST /google` - verify Google credential, create user if needed, return JWT

### Users

Base path: `/api/users`

- `GET /search?q=...` - search users by name or email, excluding current user and TalkBot from normal search results
- `GET /` - return active chat partners plus TalkBot

### Groups

Base path: `/api/groups`

- `POST /` - create a group with creator included as admin and member
- `GET /` - return groups the current user belongs to
- `PUT /:id/add-members` - admin-only member addition
- `DELETE /:id` - admin-only delete

### Messages

Base path: `/api/messages`

- `GET /:userId` - direct chat history between the current user and another user
- `GET /group/:groupId` - group chat history for a group

## Data Models

### User

Fields:

- `name`
- `email` unique
- `password`

This model has timestamps enabled.

### OTP

Fields:

- `email`
- `otp`
- `createdAt` with a TTL of 300 seconds

This is used only during registration and automatically expires after 5 minutes.

### Group

Fields:

- `name`
- `admin` - user reference
- `members` - array of user references

There is an index on `members` to make membership queries faster.

### Message

Fields:

- `senderId`
- `receiverId` - direct chat recipient, nullable
- `groupId` - group room reference, nullable
- `content`
- `status` - `sent`, `delivered`, or `read`

There are indexes for direct message lookups and group message lookups.

## Environment Variables And Deployment Assumptions

### Server Environment Variables

The server code expects these values in the environment:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `OPENROUTER_API_KEY`
- `GOOGLE_CLIENT_ID`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `SMTP_USER`

### Client Assumptions

The client currently hardcodes the deployed backend URL in several files instead of reading a runtime environment variable. That affects:

- auth requests
- user and group data fetches
- message history fetches
- user search
- socket connection target

### Docker Compose

`docker-compose.yml` defines:

- a MongoDB container
- a backend container
- a frontend container

It uses sample values for runtime variables inside the compose file. Treat those as local development placeholders, not production secrets.

## Styling And UX Notes

- The visual direction is dark, glossy, and neon-accented.
- Landing and chat screens use blurred gradients, orbs, and glassmorphism panels.
- Tailwind utility classes drive most of the layout and appearance.
- The global font is Inter from Google Fonts.
- Scrollbars are customized globally in `client/src/index.css`.

## Important Maintenance Notes

1. The frontend is tightly coupled to the deployed backend URL. If the deployment target changes, those hardcoded URLs need to be updated together.
2. The socket provider only connects after auth state is present, so auth initialization issues can look like socket failures.
3. The current chat history flow assumes direct and group messages are separated by whether `groupId` is null.
4. TalkBot is a special system user and should remain excluded from normal user search behavior.
5. `mongodb-memory-server` is a useful local fallback, but it means data may disappear between runs when no persistent Mongo URI is provided.

## Quick Reading Order For Future Work

If you need to understand or modify the app quickly, read in this order:

1. `server/index.js`
2. `server/routes/auth.js`
3. `server/routes/users.js`
4. `server/routes/groups.js`
5. `server/routes/messages.js`
6. `client/src/context/AuthContext.jsx`
7. `client/src/context/SocketContext.jsx`
8. `client/src/pages/Chat.jsx`
9. `client/src/components/Sidebar.jsx`
10. `client/src/components/ChatWindow.jsx`
11. `client/src/components/VideoCall.jsx`

## Summary

TalkFlow is a real-time messaging and calling app with a fairly complete end-to-end feature set already wired in:

- auth and onboarding
- active-presence chat UX
- group rooms
- receipts and typing indicators
- direct peer-to-peer calls
- an embedded AI chat target

The main architectural constraint to keep in mind is that the client currently depends on a fixed deployed backend URL, so environment changes should be made consistently across auth, chat, and socket setup.