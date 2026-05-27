require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
// 1. IMPORT THE ERROR HANDLER
const errorHandler = require('./middleware/errorHandler'); 

// Connect to Database
connectDB();

// Initialize App
const app = express();
const server = http.createServer(app);

// Socket.io for Real-time Admin Dashboard
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet()); 
app.use(cors({
  origin: [
    'https://foodwavebistro.vercel.app', // Your live Vercel frontend
    'http://localhost:5173',             // Your local frontend (for testing)
    'http://localhost:3000'              
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); 
app.use(morgan('dev')); 

// Make io accessible to controllers
app.set('io', io);

// Socket.io connection handler for real-time order tracking
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to socket: ${socket.id}`);
  
  // Admin triggers this when opening the admin portal
  socket.on('join_admin_room', () => {
    socket.join('admin_dashboard');
    console.log(`👑 Admin client registered in room: admin_dashboard`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected from socket`);
  });
});

// Mount API Routes
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/menu', require('./modules/menu/menu.routes'));
app.use('/api/v1/orders', require('./modules/orders/order.routes'));

// Basic Route for testing
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Food Wave Bistro API is running!' });
});


app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});