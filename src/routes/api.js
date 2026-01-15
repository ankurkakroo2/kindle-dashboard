const express = require('express');
const router = express.Router();
const weatherService = require('../services/weather');
const calendarService = require('../services/calendar');
const todoService = require('../services/todos');
const githubService = require('../services/github');
const hnService = require('../services/hackernews');

router.get('/weather', async (req, res) => {
    try {
        const data = await weatherService.fetchWeatherData();
        res.json(data);
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ error: 'Failed to fetch weather' });
    }
});

router.get('/calendar', async (req, res) => {
    try {
        const events = await calendarService.fetchCalendarData();
        res.json({ events, date: new Date().toISOString().split('T')[0] });
    } catch (error) {
        console.error('Calendar API error:', error);
        res.status(500).json({ error: 'Failed to fetch calendar' });
    }
});

router.get('/todos', (req, res) => {
    res.json(todoService.getTodos());
});

router.post('/todos', (req, res) => {
    const todo = todoService.addTodo(req.body.text);
    res.json(todo);
});

router.put('/todos/:id', (req, res) => {
    const todo = todoService.updateTodo(parseInt(req.params.id), req.body.completed);
    if (todo) res.json(todo);
    else res.status(404).json({ error: 'Todo not found' });
});

router.delete('/todos/:id', (req, res) => {
    const success = todoService.deleteTodo(parseInt(req.params.id));
    res.json({ success, deletedId: parseInt(req.params.id) });
});

router.get('/github', async (req, res) => {
    try {
        const data = await githubService.fetchGitHubData();
        res.json(data);
    } catch (error) {
        console.error('GitHub API error:', error);
        res.status(500).json({ error: 'Failed to fetch GitHub data' });
    }
});

router.get('/hackernews', async (req, res) => {
    try {
        const data = await hnService.fetchTopStories(3);
        res.json(data);
    } catch (error) {
        console.error('HN API error:', error);
        res.status(500).json({ error: 'Failed to fetch HN data' });
    }
});

module.exports = router;
