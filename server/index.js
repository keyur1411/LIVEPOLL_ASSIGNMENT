// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://livepoll-assignment.vercel.app/"],
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
    
    // Create a new poll room
    activePolls.set(roomId, {
      id: roomId,
      creator: username,
      question,
      options: options || ["Option A", "Option B"],
      votes: {
        0: 0, // Option A count
        1: 0  // Option B count
      },
      userVotes: {}, // Track which user voted for what
      startTime: Date.now(),
      endTime: Date.now() + 60000, // 60 seconds from now
      active: true
    });
    
    // Join the room
    socket.join(roomId);
    
    // Send room info back to the creator
    socket.emit('room_created', { roomId, pollData: activePolls.get(roomId) });
    console.log(`Room created: ${roomId}`);
  });

  // Join an existing poll room
  socket.on('join_room', ({ roomId, username }) => {
    const normalizedRoomId = roomId.toUpperCase();
    const room = activePolls.get(normalizedRoomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Check if the poll is still active
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
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Check if voting is still active
    if (!room.active || Date.now() > room.endTime) {
      room.active = false;
      socket.emit('error', { message: 'Voting has ended for this poll' });
      return;
    }
    
    // Check if user already voted
    if (room.userVotes[username] !== undefined) {
      socket.emit('error', { message: 'You have already voted' });
      return;
    }
    
    // Record the vote
    room.votes[optionIndex]++;
    room.userVotes[username] = optionIndex;
    
    // Broadcast updated poll data to all users in the room
    io.to(roomId).emit('vote_update', { pollData: room });
    console.log(`${username} voted for option ${optionIndex} in room ${roomId}`);
  });

  // Check poll status
  socket.on('check_poll_status', ({ roomId }) => {
    const room = activePolls.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    // Check if the poll should be closed
    if (room.active && Date.now() > room.endTime) {
      room.active = false;
      io.to(roomId).emit('poll_ended', { pollData: room });
    }
    
    socket.emit('poll_status', { pollData: room });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Clean up inactive polls periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, poll] of activePolls.entries()) {
    // Remove polls that ended more than 30 minutes ago
    if (now > poll.endTime + 1800000) {
      activePolls.delete(roomId);
      console.log(`Removed inactive poll ${roomId}`);
    }
  }
}, 600000);

const path = require('path');

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.send('Live Poll Battle Server is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});