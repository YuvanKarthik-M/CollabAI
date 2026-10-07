const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Express app & HTTP Server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Import Database Models
const Message = require('./models/Message');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'CollabAI Server is operational' });
});

// Socket.io Real-Time In-Team Chat Events
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Join dedicated team room
  socket.on('join_team', (teamId) => {
    socket.join(teamId);
    console.log(`Socket ${socket.id} joined room: ${teamId}`);
  });

  // Alias for compatibility
  socket.on('join_team_chat', (teamId) => {
    socket.join(teamId);
  });

  // Handle incoming team messages
  socket.on('send_message', async ({ teamId, senderId, text }) => {
    if (!text || !text.trim() || !teamId || !senderId) return;

    try {
      const newMessage = await Message.create({
        team: teamId,
        sender: senderId,
        text: text.trim()
      });

      const populatedMessage = await newMessage.populate('sender', 'name email');

      // Broadcast saved message to all members in the team room
      io.to(teamId).emit('receive_message', populatedMessage);
      io.to(teamId).emit('receive_team_message', populatedMessage);
    } catch (err) {
      console.error('Error saving or emitting socket message:', err.message);
    }
  });

  // Alias for compatibility with send_team_message
  socket.on('send_team_message', async (data) => {
    const { teamId, senderId, text } = data;
    if (!text || !text.trim() || !teamId || !senderId) return;

    try {
      const newMessage = await Message.create({
        team: teamId,
        sender: senderId,
        text: text.trim()
      });

      const populatedMessage = await newMessage.populate('sender', 'name email');

      io.to(teamId).emit('receive_message', populatedMessage);
      io.to(teamId).emit('receive_team_message', populatedMessage);
    } catch (err) {
      console.error('Error in send_team_message handler:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// 404 Route Catch-All
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB and Start Server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/collabAI';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`CollabAI Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });