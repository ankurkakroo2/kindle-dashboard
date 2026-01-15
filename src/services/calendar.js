const ical = require('node-ical');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { exec } = require('child_process');

// Start periodic sync (every 10 minutes)
function startSyncService() {
    console.log('Starting Calendar Sync Service...');
    syncNow();
    setInterval(syncNow, 10 * 60 * 1000);
}

function syncNow() {
    // Use the Node.js wrapper around icalBuddy (faster, reliable)
    const scriptPath = path.join(__dirname, '../../scripts/fetch-calendar-buddy.js');
    const outputPath = path.join(__dirname, '../../src/data/calendar.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const command = `node "${scriptPath}" > "${outputPath}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Calendar sync error: ${error.message}`);
            return;
        }
        // fetch-calendar-buddy.js might output logs to stderr, or just JSON to stdout
        // We redirected stdout to file.
        console.log(`Calendar synced via icalBuddy at ${new Date().toLocaleTimeString()}`);
    });
}

async function fetchCalendarData() {
    // Priority 1: Local synced file (from JXA script)
    const localPath = path.join(__dirname, '../../src/data/calendar.json');
    if (fs.existsSync(localPath)) {
        try {
            const rawData = fs.readFileSync(localPath, 'utf8');
            const events = JSON.parse(rawData);
            return processEvents(events);
        } catch (e) {
            console.error('Error reading local calendar.json:', e);
        }
    }

    // Priority 2: iCal URL
    const calendarUrl = process.env.CALENDAR_URL;
    if (calendarUrl) {
        // ... existing ical fetch logic ...
        try {
            const events = await ical.async.fromURL(calendarUrl);
            return processICalEvents(events);
        } catch (error) {
            console.error('Error fetching iCal:', error);
        }
    }

    console.log('No calendar source found, returning mock data');
    return getMockCalendarData();
}

function processEvents(simpleEvents) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const formattedEvents = [];

    simpleEvents.forEach(event => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        if (start >= startOfDay && start <= endOfDay) {
            formattedEvents.push({
                title: event.title,
                start: start.toISOString(),
                end: end.toISOString(),
                type: determineEventType(event.title),
                attendees: event.attendees // Pass through
            });
        }
    });

    formattedEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Add formatted time strings (IST) - Server Side
    return formattedEvents.map(e => {
        const date = new Date(e.start);
        // Force IST (Asia/Kolkata)
        const timeDisplay = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });
        // "10:30 PM" -> split
        const [timeVal, ampm] = timeDisplay.split(' ');
        
        return {
            ...e,
            timeDisplay: { timeVal, ampm }
        };
    });
}

function processICalEvents(events) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const formattedEvents = [];

    for (const k in events) {
        const event = events[k];
        if (event.type === 'VEVENT') {
            const start = new Date(event.start);
            const end = new Date(event.end);

            if (start >= startOfDay && start <= endOfDay) {
                formattedEvents.push({
                    title: event.summary,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    type: determineEventType(event.summary),
                    attendees: event.attendees // Might need extraction if using ical lib directly
                });
            }
        }
    }

    formattedEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Add formatted time strings (IST)
    return formattedEvents.map(e => {
        const date = new Date(e.start);
        const timeDisplay = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });
        const [timeVal, ampm] = timeDisplay.split(' ');
        
        return {
            ...e,
            timeDisplay: { timeVal, ampm }
        };
    });
}

module.exports = { fetchCalendarData, startSyncService };

function determineEventType(title) {
    if (!title) return 'work';
    const lower = title.toLowerCase();
    if (lower.includes('meeting') || lower.includes('sync') || lower.includes('standup')) return 'meeting';
    if (lower.includes('lunch') || lower.includes('break') || lower.includes('personal')) return 'personal';
    return 'work';
}

function getMockCalendarData() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const events = [
        { title: 'Standups', start: `${dateStr}T09:30:00`, end: `${dateStr}T12:45:00`, type: 'work' },
        { title: 'Lunch', start: `${dateStr}T13:00:00`, end: `${dateStr}T14:00:00`, type: 'personal' },
        { title: 'Meetings', start: `${dateStr}T14:00:00`, end: `${dateStr}T16:00:00`, type: 'work' },
        { title: 'Sleep', start: `${dateStr}T22:00:00`, end: `${dateStr}T23:59:59`, type: 'personal' }
    ];
    
    // Add formatted time strings (IST)
    return events.map(e => {
        const date = new Date(e.start);
        const timeDisplay = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });
        const [timeVal, ampm] = timeDisplay.split(' ');
        
        return {
            ...e,
            timeDisplay: { timeVal, ampm }
        };
    });
}

function determineEventType(title) {
    if (!title) return 'work';
    const lower = title.toLowerCase();
    if (lower.includes('meeting') || lower.includes('sync') || lower.includes('standup')) return 'meeting';
    if (lower.includes('lunch') || lower.includes('break') || lower.includes('personal')) return 'personal';
    return 'work';
}

function getMockCalendarData() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const events = [
        { title: 'Standups', start: `${dateStr}T09:30:00`, end: `${dateStr}T12:45:00`, type: 'work' },
        { title: 'Lunch', start: `${dateStr}T13:00:00`, end: `${dateStr}T14:00:00`, type: 'personal' },
        { title: 'Meetings', start: `${dateStr}T14:00:00`, end: `${dateStr}T16:00:00`, type: 'work' },
        { title: 'Sleep', start: `${dateStr}T22:00:00`, end: `${dateStr}T23:59:59`, type: 'personal' }
    ];
    
    // Add formatted time strings (IST)
    return events.map(e => {
        const date = new Date(e.start);
        const timeDisplay = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });
        const [timeVal, ampm] = timeDisplay.split(' ');
        
        return {
            ...e,
            timeDisplay: { timeVal, ampm }
        };
    });
}
