const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

const app = express();
const PORT = 5001;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static assets from views (weather.html, preview.html)
app.use(express.static(path.join(__dirname, 'views')));

// Serve rendered framebuffer
app.get('/dashboard.raw', (req, res) => {
    const { exec } = require('child_process');
    // Render dashboard
    exec('python3 /tmp/dashboard_renderer.py', (error, stdout, stderr) => {
        if (error) {
            console.error('Renderer error:', error);
            return res.status(500).send('Render failed');
        }
        // Serve the rendered file
        res.sendFile('/tmp/dashboard.raw');
    });
});

// Serve landscape framebuffer (rotated)
app.get('/dashboard-landscape.raw', (req, res) => {
    res.sendFile('/tmp/kindle-rotated-dashboard.raw');
});

// API Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Weather proxy (Gurugram, India). Uses open-meteo (no API key).
app.get('/api/weather', (req, res) => {
    const lat = 28.4595;
    const lon = 77.0266;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,temperature_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,uv_index_max&timezone=auto`;

    https.get(url, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => {
            try {
                const json = JSON.parse(data);
                const cw = json.current_weather || {};
                const daily = (json.daily && json.daily.temperature_2m_max) ? json.daily : {};
                const humidity = (json.hourly && json.hourly.relativehumidity_2m) ? json.hourly.relativehumidity_2m[0] : null;
                const uv = (json.daily && json.daily.uv_index_max) ? json.daily.uv_index_max[0] : null;

                res.json({
                    temp: cw.temperature,
                    feelsLike: json.hourly?.apparent_temperature?.[0],
                    humidity,
                    condition: cw.weathercode,
                    uv,
                    time: cw.time,
                    today: {
                        low: daily.temperature_2m_min?.[0],
                        high: daily.temperature_2m_max?.[0],
                        condition: daily.weathercode?.[0]
                    },
                    tomorrow: {
                        low: daily.temperature_2m_min?.[1],
                        high: daily.temperature_2m_max?.[1],
                        condition: daily.weathercode?.[1]
                    }
                });
            } catch (e) {
                console.error('weather parse error', e);
                res.status(500).json({ error: 'parse-error' });
            }
        });
    }).on('error', (err) => {
        console.error('weather fetch error', err);
        res.status(500).json({ error: 'fetch-error' });
    });
});

// Calendar API - returns today's events with realistic overlap patterns
app.get('/api/calendar', (req, res) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const events = [
        { id: 1, title: 'Dropping off kid to school', start: `${dateStr}T06:15:00`, end: `${dateStr}T08:00:00`, type: 'personal' },
        { id: 2, title: 'Morning chores & Breakfast', start: `${dateStr}T08:00:00`, end: `${dateStr}T09:30:00`, type: 'personal' },
        { id: 3, title: 'Standups', start: `${dateStr}T09:30:00`, end: `${dateStr}T12:45:00`, type: 'work' },
        { id: 4, title: 'Vasu Adari and Ankur Kakroo', start: `${dateStr}T09:30:00`, end: `${dateStr}T10:30:00`, type: 'meeting' },
        { id: 5, title: 'VISA Sync', start: `${dateStr}T10:30:00`, end: `${dateStr}T11:00:00`, type: 'meeting' },
        { id: 6, title: 'SSE Hiring Sync', start: `${dateStr}T10:45:00`, end: `${dateStr}T11:00:00`, type: 'meeting' },
        { id: 7, title: 'Shanu / Ankur 1:1', start: `${dateStr}T11:00:00`, end: `${dateStr}T11:30:00`, type: 'meeting' },
        { id: 8, title: 'MTS5 calibration', start: `${dateStr}T11:30:00`, end: `${dateStr}T12:00:00`, type: 'meeting' },
        { id: 9, title: 'Standup: Platform Engineering', start: `${dateStr}T12:00:00`, end: `${dateStr}T12:30:00`, type: 'work' },
        { id: 10, title: 'Next-gen stand up', start: `${dateStr}T12:30:00`, end: `${dateStr}T13:00:00`, type: 'work' },
        { id: 11, title: 'Lunch time', start: `${dateStr}T13:00:00`, end: `${dateStr}T14:00:00`, type: 'personal' },
        { id: 12, title: 'Next-gen CAI', start: `${dateStr}T13:00:00`, end: `${dateStr}T14:00:00`, type: 'meeting' },
        { id: 13, title: 'Picking up kid from school', start: `${dateStr}T14:00:00`, end: `${dateStr}T14:30:00`, type: 'personal' },
        { id: 14, title: 'Meetings', start: `${dateStr}T14:00:00`, end: `${dateStr}T16:00:00`, type: 'work' },
        { id: 15, title: 'Next-Gen Jam', start: `${dateStr}T14:00:00`, end: `${dateStr}T15:00:00`, type: 'meeting' },
        { id: 16, title: 'Ankur / Sebastian', start: `${dateStr}T14:00:00`, end: `${dateStr}T14:30:00`, type: 'meeting' },
        { id: 17, title: 'Ankur / Ajay', start: `${dateStr}T14:30:00`, end: `${dateStr}T15:00:00`, type: 'meeting' },
        { id: 18, title: 'Ankur / Akshay', start: `${dateStr}T15:00:00`, end: `${dateStr}T15:30:00`, type: 'meeting' },
        { id: 19, title: 'Engg Sync', start: `${dateStr}T15:00:00`, end: `${dateStr}T16:00:00`, type: 'meeting' },
        { id: 20, title: 'Harshita / Ankur 1:1', start: `${dateStr}T15:30:00`, end: `${dateStr}T16:00:00`, type: 'meeting' },
        { id: 21, title: 'Dipesh / Ankur 1:1', start: `${dateStr}T15:00:00`, end: `${dateStr}T16:00:00`, type: 'meeting' },
        { id: 22, title: 'Hiring', start: `${dateStr}T16:00:00`, end: `${dateStr}T17:00:00`, type: 'work' },
        { id: 23, title: 'AI Interviewer Standup', start: `${dateStr}T16:00:00`, end: `${dateStr}T17:00:00`, type: 'meeting' },
        { id: 24, title: 'Play time with the kid', start: `${dateStr}T17:00:00`, end: `${dateStr}T18:00:00`, type: 'personal' },
        { id: 25, title: 'Ankur / Akshay', start: `${dateStr}T18:00:00`, end: `${dateStr}T19:00:00`, type: 'meeting' },
        { id: 26, title: 'Focus time', start: `${dateStr}T18:00:00`, end: `${dateStr}T19:00:00`, type: 'work' },
        { id: 27, title: 'Meetings', start: `${dateStr}T19:00:00`, end: `${dateStr}T21:00:00`, type: 'work' },
        { id: 28, title: 'Please confirm before blocking', start: `${dateStr}T19:00:00`, end: `${dateStr}T22:00:00`, type: 'tentative' },
        { id: 29, title: 'OOO', start: `${dateStr}T19:00:00`, end: `${dateStr}T20:00:00`, type: 'personal' },
        { id: 30, title: 'Sleep', start: `${dateStr}T22:00:00`, end: `${dateStr}T23:59:59`, type: 'personal' }
    ];

    res.json({ events, date: dateStr });
});

app.get('/api/todos', (req, res) => {
    res.json([
        { id: 1, text: 'Review project proposal', completed: false },
        { id: 2, text: 'Update documentation', completed: true },
        { id: 3, text: 'Setup development environment', completed: false },
        { id: 4, text: 'Prepare standup notes', completed: false },
        { id: 5, text: 'Follow up on hiring feedback', completed: true },
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

app.put('/api/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        res.json(todo);
    }
});

app.delete('/api/todos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    todos = todos.filter(t => t.id !== id);
    res.json({ success: true, deletedId: id });
});

app.get('/weather.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'weather.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'weather.html'));
});

app.get('/preview', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'preview.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/preview-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'preview-dashboard.html'));
});

app.get('/dashboard-portrait', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard-portrait.html'));
});

app.get('/preview-portrait', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'preview-portrait.html'));
});

app.get('/dashboard-vibe', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard-vibe.html'));
});

app.get('/preview-vibe', (req, res) => {
    // We can reuse the preview wrapper or create a new one. 
    // For simplicity, let's just serve the raw dashboard-vibe for now 
    // or create a quick wrapper if we want the desktop framing.
    // Actually, let's just serve the file directly as the 'preview' for now.
    res.sendFile(path.join(__dirname, 'views', 'dashboard-vibe.html'));
});

// Server-side rendered dashboard for Kindle (no JavaScript needed)
app.get('/kindle', async (req, res) => {
    try {
        // Fetch all data
        const [weatherData, calendarData, todosData] = await Promise.all([
            fetchWeatherData(),
            fetchCalendarData(),
            fetchTodosData()
        ]);

        // Render HTML with data
        const html = generateKindleHTML(weatherData, calendarData, todosData);
        res.send(html);
    } catch (error) {
        console.error('Error generating Kindle dashboard:', error);
        res.status(500).send('Error generating dashboard');
    }
});

// Helper functions to fetch data
function fetchWeatherData() {
    return new Promise((resolve, reject) => {
        const lat = 28.4595;
        const lon = 77.0266;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,temperature_2m&daily=temperature_2m_max,temperature_2m_min,weathercode,uv_index_max&timezone=auto`;

        https.get(url, (r) => {
            let data = '';
            r.on('data', chunk => data += chunk);
            r.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const cw = json.current_weather || {};
                    const daily = (json.daily && json.daily.temperature_2m_max) ? json.daily : {};
                    const humidity = (json.hourly && json.hourly.relativehumidity_2m) ? json.hourly.relativehumidity_2m[0] : null;

                    resolve({
                        temp: Math.round(cw.temperature || 0),
                        feelsLike: Math.round(json.hourly?.apparent_temperature?.[0] || 0),
                        humidity: Math.round(humidity || 0),
                        condition: cw.weathercode,
                        time: cw.time
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function fetchCalendarData() {
    return new Promise((resolve) => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];

        const events = [
            { id: 1, title: 'Dropping off kid to school', start: `${dateStr}T06:15:00`, end: `${dateStr}T08:00:00`, type: 'personal' },
            { id: 2, title: 'Morning chores & Breakfast', start: `${dateStr}T08:00:00`, end: `${dateStr}T09:30:00`, type: 'personal' },
            { id: 3, title: 'Standups', start: `${dateStr}T09:30:00`, end: `${dateStr}T12:45:00`, type: 'work' },
            { id: 4, title: 'Vasu Adari and Ankur Kakroo', start: `${dateStr}T09:30:00`, end: `${dateStr}T10:30:00`, type: 'meeting' },
            { id: 5, title: 'VISA Sync', start: `${dateStr}T10:30:00`, end: `${dateStr}T11:00:00`, type: 'meeting' },
            { id: 6, title: 'SSE Hiring Sync', start: `${dateStr}T10:45:00`, end: `${dateStr}T11:00:00`, type: 'meeting' },
            { id: 7, title: 'Shanu / Ankur 1:1', start: `${dateStr}T11:00:00`, end: `${dateStr}T11:30:00`, type: 'meeting' },
            { id: 8, title: 'MTS5 calibration', start: `${dateStr}T11:30:00`, end: `${dateStr}T12:00:00`, type: 'meeting' },
            { id: 9, title: 'Standup: Platform Engineering', start: `${dateStr}T12:00:00`, end: `${dateStr}T12:30:00`, type: 'work' },
            { id: 10, title: 'Next-gen stand up', start: `${dateStr}T12:30:00`, end: `${dateStr}T13:00:00`, type: 'work' },
            { id: 11, title: 'Lunch time', start: `${dateStr}T13:00:00`, end: `${dateStr}T14:00:00`, type: 'personal' },
            { id: 12, title: 'Next-gen CAI', start: `${dateStr}T13:00:00`, end: `${dateStr}T14:00:00`, type: 'meeting' },
            { id: 13, title: 'Picking up kid from school', start: `${dateStr}T14:00:00`, end: `${dateStr}T14:30:00`, type: 'personal' },
            { id: 14, title: 'Meetings', start: `${dateStr}T14:00:00`, end: `${dateStr}T16:00:00`, type: 'work' },
            { id: 15, title: 'Next-Gen Jam', start: `${dateStr}T14:00:00`, end: `${dateStr}T15:00:00`, type: 'meeting' },
            { id: 16, title: 'Ankur / Sebastian', start: `${dateStr}T14:00:00`, end: `${dateStr}T14:30:00`, type: 'meeting' },
            { id: 17, title: 'Ankur / Ajay', start: `${dateStr}T14:30:00`, end: `${dateStr}T15:00:00`, type: 'meeting' },
            { id: 18, title: 'Ankur / Akshay', start: `${dateStr}T15:00:00`, end: `${dateStr}T15:30:00`, type: 'meeting' },
            { id: 19, title: 'Engg Sync', start: `${dateStr}T15:00:00`, end: `${dateStr}T16:00:00`, type: 'meeting' },
            { id: 20, title: 'Harshita / Ankur 1:1', start: `${dateStr}T15:30:00`, end: `${dateStr}T16:00:00`, type: 'meeting' },
            { id: 21, title: 'Dipesh / Ankur 1:1', start: `${dateStr}T15:00:00`, end: `${dateStr}T16:00:00`, type: 'meeting' },
            { id: 22, title: 'Hiring', start: `${dateStr}T16:00:00`, end: `${dateStr}T17:00:00`, type: 'work' },
            { id: 23, title: 'AI Interviewer Standup', start: `${dateStr}T16:00:00`, end: `${dateStr}T17:00:00`, type: 'meeting' },
            { id: 24, title: 'Play time with the kid', start: `${dateStr}T17:00:00`, end: `${dateStr}T18:00:00`, type: 'personal' },
            { id: 25, title: 'Ankur / Akshay', start: `${dateStr}T18:00:00`, end: `${dateStr}T19:00:00`, type: 'meeting' },
            { id: 26, title: 'Focus time', start: `${dateStr}T18:00:00`, end: `${dateStr}T19:00:00`, type: 'work' },
            { id: 27, title: 'Meetings', start: `${dateStr}T19:00:00`, end: `${dateStr}T21:00:00`, type: 'work' },
            { id: 28, title: 'Please confirm before blocking', start: `${dateStr}T19:00:00`, end: `${dateStr}T22:00:00`, type: 'tentative' },
            { id: 29, title: 'OOO', start: `${dateStr}T19:00:00`, end: `${dateStr}T20:00:00`, type: 'personal' },
            { id: 30, title: 'Sleep', start: `${dateStr}T22:00:00`, end: `${dateStr}T23:59:59`, type: 'personal' }
        ];

        resolve(events);
    });
}

function fetchTodosData() {
    return new Promise((resolve) => {
        resolve([
            { id: 1, text: 'Review project proposal', completed: false },
            { id: 2, text: 'Update documentation', completed: true },
            { id: 3, text: 'Setup development environment', completed: false },
            { id: 4, text: 'Prepare standup notes', completed: false },
            { id: 5, text: 'Follow up on hiring feedback', completed: true },
        ]);
    });
}

function generateKindleHTML(weather, events, todos) {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;

    const currentDate = `${dayName}, ${monthName} ${date}`;
    const currentTime = `${displayHours}:${displayMinutes} ${ampm}`;

    // Format timestamp in IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    const updateTimestamp = istTime.toISOString().replace('T', ' ').substring(0, 19) + ' IST';

    // Map weather condition
    const conditionMap = {
        0: 'Sunny', 1: 'Partly Cloudy', 2: 'Partly Cloudy', 3: 'Partly Cloudy',
        45: 'Foggy', 48: 'Foggy', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
        61: 'Rain', 63: 'Rain', 65: 'Rain', 71: 'Snow', 73: 'Snow', 75: 'Snow',
        80: 'Showers', 81: 'Showers', 82: 'Showers'
    };
    const iconMap = {
        0: '☀️', 1: '⛅', 2: '⛅', 3: '⛅',
        45: '🌫️', 48: '🌫️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '❄️', 73: '❄️', 75: '❄️', 80: '🌧️', 81: '🌧️', 82: '🌧️'
    };

    const condition = conditionMap[weather.condition] || 'Clear';
    const icon = iconMap[weather.condition] || '☀️';

    // Generate todos HTML
    const todosHTML = todos.map(todo => {
        const checked = todo.completed ? '✓' : '';
        const textClass = todo.completed ? ' class="todo-completed"' : '';
        return `<div class="todo-item"><span class="todo-checkbox">${checked}</span><span${textClass}>${todo.text}</span></div>`;
    }).join('\n            ');

    // Generate calendar timeline - SINGLE LINE PER HOUR (most compact possible)
    const startHour = 9;
    const endHour = 22; // 9 AM to 10 PM

    // Group events by hour, but only keep FIRST event per hour
    const eventsByHour = {};
    for (let h = startHour; h <= endHour; h++) {
        eventsByHour[h] = null;
    }

    events.forEach(event => {
        const eventStart = new Date(event.start);
        const startH = eventStart.getHours();
        const startM = eventStart.getMinutes();
        const eventEnd = new Date(event.end);
        const endH = eventEnd.getHours();
        const endM = eventEnd.getMinutes();

        if (startH >= startHour && startH <= endHour && !eventsByHour[startH]) {
            const formatTime = (h, m) => {
                const ap = h >= 12 ? 'PM' : 'AM';
                const dh = h % 12 || 12;
                const dm = m < 10 ? '0' + m : m;
                return `${dh}:${dm}${ap}`;
            };

            const bgColor = event.type === 'personal' ? '#e8e8e8' : event.type === 'work' ? '#d0d0d0' : event.type === 'meeting' ? '#f0f0f0' : '#fafafa';
            const borderStyle = event.type === 'tentative' ? 'dashed' : 'solid';

            eventsByHour[startH] = {
                title: event.title,
                time: `${formatTime(startH, startM)}-${formatTime(endH, endM)}`,
                bgColor: bgColor,
                borderStyle: borderStyle
            };
        }
    });

    // Build MINIMAL table - one line per hour with event (or empty)
    let timelineHTML = '<table style="width:100%;border-collapse:collapse;font-size:9px;">';

    for (let h = startHour; h <= endHour; h++) {
        const ev = eventsByHour[h];
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;

        timelineHTML += '<tr style="border-bottom:1px solid #ccc;">';
        timelineHTML += `<td style="width:35px;padding:1px;font-size:9px;font-weight:800;border-right:1px solid #ccc;">${displayHour}${ampm}</td>`;

        if (ev) {
            timelineHTML += `<td style="padding:1px 3px;border:1px ${ev.borderStyle} #000;background:${ev.bgColor};"><b style="font-size:9px;">${ev.title}</b> <span style="font-size:7px;color:#666;">${ev.time}</span></td>`;
        } else {
            timelineHTML += '<td style="padding:1px;">&nbsp;</td>';
        }

        timelineHTML += '</tr>';
    }

    timelineHTML += '</table>';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="300">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: "Amazon Ember", "Helvetica LT", Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #000000;
            width: 100%;
            height: 100vh;
            overflow-y: auto;
            overflow-x: hidden;
        }

        .main-container {
            display: table;
            width: 100%;
            height: 100%;
            border-collapse: collapse;
        }

        .header {
            display: table-row;
            height: 70px;
        }

        .header-content {
            display: table-cell;
            padding: 16px 24px;
            border-bottom: 4px solid #000000;
            vertical-align: middle;
        }

        .header-left {
            float: left;
        }

        .header-right {
            float: right;
            text-align: right;
        }

        .date-large {
            font-size: 28px;
            font-weight: 900;
            line-height: 1.2;
        }

        .time-large {
            font-size: 20px;
            font-weight: 800;
            color: #333333;
        }

        .weather-summary {
            font-size: 24px;
            font-weight: 800;
        }

        .content {
            display: table-row;
            height: auto;
        }

        .content-wrapper {
            display: table-cell;
        }

        .content-inner {
            display: table;
            width: 100%;
            height: auto;
        }

        .content-row {
            display: table-row;
        }

        .sidebar {
            display: table-cell;
            width: 50%;
            padding: 20px;
            border-right: 2px solid #000000;
            vertical-align: top;
            vertical-align: top;
        }

        .weather-widget {
            margin-bottom: 32px;
        }

        .weather-icon {
            font-size: 80px;
            text-align: center;
            margin-bottom: 12px;
        }

        .weather-temp {
            font-size: 64px;
            font-weight: 900;
            text-align: center;
            line-height: 1;
        }

        .weather-location {
            font-size: 14px;
            font-weight: 700;
            text-align: center;
            margin-top: 8px;
            color: #333333;
        }

        .weather-details {
            margin-top: 16px;
            padding: 12px 0;
            border-top: 2px solid #000000;
            border-bottom: 2px solid #000000;
        }

        .weather-detail-row {
            padding: 6px 0;
            font-size: 16px;
            font-weight: 800;
        }

        .weather-detail-label {
            display: inline-block;
            width: 120px;
        }

        .weather-detail-value {
            font-weight: 900;
        }

        .todos-section {
            margin-top: 24px;
        }

        .section-title {
            font-size: 20px;
            font-weight: 900;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 3px solid #000000;
        }

        .todo-item {
            padding: 10px 0;
            font-size: 15px;
            font-weight: 700;
            border-bottom: 1px solid #cccccc;
        }

        .todo-checkbox {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid #000000;
            margin-right: 10px;
            vertical-align: middle;
            text-align: center;
            line-height: 14px;
            font-weight: 900;
        }

        .todo-completed {
            text-decoration: line-through;
            color: #666666;
        }

        .timeline {
            display: table-cell;
            padding: 8px 16px;
            vertical-align: top;
        }

        .footer-timestamp {
            position: fixed;
            bottom: 8px;
            left: 8px;
            font-size: 11px;
            font-weight: 700;
            color: #666;
        }
    </style>
</head>
<body>

<div class="main-container">
    <div class="header">
        <div class="header-content">
            <div class="header-left">
                <div class="date-large">${currentDate}</div>
                <div class="time-large">${currentTime}</div>
            </div>
            <div class="header-right">
                <div class="weather-summary">${icon} ${weather.temp}° • Gurugram</div>
            </div>
        </div>
    </div>

    <div class="content">
        <div class="content-wrapper">
            <div class="content-inner">
                <div class="content-row">
                    <div class="sidebar">
                        <div class="weather-widget">
                            <div class="weather-icon">${icon}</div>
                            <div class="weather-temp">${weather.temp}°</div>
                            <div class="weather-location">Gurugram, India</div>
                            <div class="weather-details">
                                <div class="weather-detail-row">
                                    <span class="weather-detail-label">Feels Like</span>
                                    <span class="weather-detail-value">${weather.feelsLike}°</span>
                                </div>
                                <div class="weather-detail-row">
                                    <span class="weather-detail-label">Humidity</span>
                                    <span class="weather-detail-value">${weather.humidity}%</span>
                                </div>
                                <div class="weather-detail-row">
                                    <span class="weather-detail-label">Condition</span>
                                    <span class="weather-detail-value">${condition}</span>
                                </div>
                            </div>
                        </div>

                        <div class="todos-section">
                            <div class="section-title">TODAY'S TASKS</div>
                            ${todosHTML}
                        </div>
                    </div>

                    <div class="timeline">
                        ${timelineHTML}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="footer-timestamp">Updated: ${updateTimestamp}</div>

</body>
</html>`;
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard server running on http://0.0.0.0:${PORT}`);
    console.log(`API Endpoints:`);
    console.log(`  GET  /api/weather`);
    console.log(`  GET  /api/todos`);
    console.log(`  POST /api/todos`);
    console.log(`  PUT /api/todos/:id`);
    console.log(`  DELETE /api/todos/:id`);
    console.log(`  GET  /`);
    console.log(`Open in browser: http://192.168.1.140:${PORT}`);
});
