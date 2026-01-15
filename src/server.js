require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');
const calendarService = require('./services/calendar');
const todoService = require('./services/todos');

// Start background services
calendarService.startSyncService();
// todoService.startSyncService(); // Disabled until JXA is stable

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Support JSON bodies for POST/PUT

// Serve static assets
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, 'views'))); // Serve HTML directly if needed

// Routes
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dashboard server running on http://0.0.0.0:${PORT}`);
    console.log(`👉 Main Dashboard: http://192.168.1.140:${PORT}/dashboard-portrait`);
    console.log(`👉 SSR Endpoint:   http://192.168.1.140:${PORT}/kindle`);
});
