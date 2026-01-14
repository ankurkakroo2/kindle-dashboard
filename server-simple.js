const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Simple test - no middleware except CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Simple routes
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/api/weather', (req, res) => {
    console.log('Weather requested');
    res.json({ temp: 22, condition: 'Light rain', icon: '☁️' });
});

app.get('/api/todos', (req, res) => {
    console.log('Todos requested');
    res.json([
        { id: 1, text: 'Review project proposal', completed: false },
        { id: 2, text: 'Update documentation', completed: true },
        { id: 3, text: 'Setup development environment', completed: false },
    ]);
});

app.post('/api/todos', (req, res) => {
    const { text } = req.body;
    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    res.json(newTodo);
});

app.listen(PORT, () => {
    console.log(`Simple server running on http://localhost:${PORT}`);
    console.log(`GET  /health`);
    console.log(`GET  /api/weather - Weather data`);
    console.log(`GET  /api/todos - Get all todos`);
    console.log(`POST /api/todos - Add todo`);
    console.log(`Open http://localhost:${PORT}/ in browser`);
});
