const express = require('express');
const router = express.Router();
const path = require('path');
const ssr = require('../utils/ssr');
const weatherService = require('../services/weather');
const calendarService = require('../services/calendar');
const todoService = require('../services/todos');

// Primary Dashboard (JS)
router.get('/dashboard-portrait', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/dashboard-portrait.html'));
});

// Preview Wrapper
router.get('/preview-portrait', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/preview-portrait.html'));
});

// SSR Dashboard (Legacy/Fallback)
router.get('/kindle', async (req, res) => {
    try {
        const [weatherData, calendarData] = await Promise.all([
            weatherService.fetchWeatherData(),
            calendarService.fetchCalendarData()
        ]);
        const todosData = todoService.getTodos();

        const html = ssr.generateKindleHTML(weatherData, calendarData, todosData);
        res.send(html);
    } catch (error) {
        console.error('Error generating SSR dashboard:', error);
        res.status(500).send('Error generating dashboard');
    }
});

// Legacy redirects
router.get('/', (req, res) => res.redirect('/dashboard-portrait'));
router.get('/dashboard', (req, res) => res.redirect('/dashboard-portrait'));

module.exports = router;
