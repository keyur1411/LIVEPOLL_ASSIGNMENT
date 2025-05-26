const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://livepoll-assignment.vercel.app"],
    methods: ["GET", "POST"]
  }
});

// Store for active polls
const activePolls = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new poll room
  socket.on('create_room', ({ username, question, options }) => {
    const roomId = nanoid(6).toUpperCase();

    // ✅ Validate and set default options
    if (!Array.isArray(options) || options.length < 2) {
      options = ["Option A", "Option B"];
    }

    // ✅ Initialize votes based on number of options
    const votes = {};
    options.forEach((_, index) => {
      votes[index] = 0;
    });

    activePolls.set(roomId, {
      id: roomId,
      creator: username,
      question,
      options,
      votes,
      userVotes: {}, // Track who voted what
      startTime: Date.now(),
      endTime: Date.now() + 60000, // 60 seconds
      active: true
    });

    socket.join(roomId);
    socket.emit('room_created', { roomId, pollData: activePolls.get(roomId) });
    console.log(`Room created: ${roomId}`);
  });

  // Join a poll room
  socket.on('join_room', ({ roomId, username }) => {
    const normalizedRoomId = roomId.toUpperCase();
    const room = activePolls.get(normalizedRoomId);

    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }

    if (Date.now() > room.endTime) {
      room.active = false;
    }

    socket.join(normalizedRoomId);
    socket.emit('room_joined', { roomId: normalizedRoomId, pollData: room });

    console.log(`${username} joined room: ${normalizedRoomId}`);
  });

  // Submit vote
  socket.on('submit_vote', ({ roomId, username, optionIndex }) => {
    const room = activePolls.get(roomId);

    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }

    if (!room.active || Date.now() > room.endTime) {
      room.active = false;
      socket.emit('error', { code: 'POLL_ENDED', message: 'Voting has ended for this poll' });
      return;
    }

    if (room.userVotes[username] !== undefined) {
      socket.emit('error', { code: 'ALREADY_VOTED', message: 'You have already voted' });
      return;
    }

    if (room.votes[optionIndex] === undefined) {
      socket.emit('error', { code: 'INVALID_OPTION', message: 'Invalid option index' });
      return;
    }

    room.votes[optionIndex]++;
    room.userVotes[username] = optionIndex;

    io.to(roomId).emit('vote_update', { pollData: room });
    console.log(`${username} voted for option ${optionIndex} in room ${roomId}`);
  });

  // Check poll status
  socket.on('check_poll_status', ({ roomId }) => {
    const room = activePolls.get(roomId);

    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }

    if (room.active && Date.now() > room.endTime) {
      room.active = false;
      io.to(roomId).emit('poll_ended', { pollData: room });
    }

    socket.emit('poll_status', { pollData: room });
  });

  // Optional cleanup or logging on disconnecting
  socket.on('disconnecting', () => {
    // const rooms = [...socket.rooms]; // use if needed
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Clean up inactive polls every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [roomId, poll] of activePolls.entries()) {
    if (now > poll.endTime + 1800000) {
      activePolls.delete(roomId);
      console.log(`Removed inactive poll ${roomId}`);
    }
  }
}, 600000);

// ✅ Health check route (must be before wildcard)
app.get('/', (req, res) => {
  res.send('Live Poll Battle Server is running');
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Wildcard route for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
