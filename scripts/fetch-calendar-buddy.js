const { execSync } = require('child_process');

function parseTime(timeStr) {
    // timeStr format: "10:00 AM - 11:00 AM" or "... - 6:15 AM" or "All-day"
    // Also handle narrow no-break space (U+202F)
    const cleanStr = timeStr.replace(/\u202F/g, ' ').trim();
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Helper to create date object
    const createDate = (tStr) => {
        if (tStr === '...') return null; // Continuation
        const match = tStr.match(/(\d{1,2}):(\d{2})\s?([AP]M)/i);
        if (!match) return null;
        
        let [_, h, m, ap] = match;
        h = parseInt(h);
        m = parseInt(m);
        if (ap.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ap.toUpperCase() === 'AM' && h === 12) h = 0;
        
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    };

    if (cleanStr.includes(' - ')) {
        const [startStr, endStr] = cleanStr.split(' - ');
        let start = createDate(startStr);
        let end = createDate(endStr);
        
        // Handle wrapping events ("... - 6:15 AM" means ended today, started before)
        if (!start && startStr === '...') {
            start = new Date(); 
            start.setHours(0,0,0,0); // Start of day
        }
        
        // Handle "... " at end? ("10:00 PM - ...")
        if (!end && endStr === '...') {
            end = new Date();
            end.setHours(23,59,59,999);
        }

        return { start, end };
    }
    
    return null;
}

try {
    // Run icalBuddy
    // -npn: no property names
    // -nc: no calendar names
    // -b "EVT:" : bullet point
    // -eep "url,notes,location" : exclude extras to reduce noise
    const output = execSync('/opt/homebrew/bin/icalBuddy -npn -nc -b "EVT:" -eep "url,notes,location" eventsToday').toString();
    
    const lines = output.split('\n');
    const events = [];
    
    let currentEvent = null;

    lines.forEach(line => {
        if (line.startsWith('EVT:')) {
            if (currentEvent) events.push(currentEvent);
            currentEvent = {
                title: line.replace('EVT:', '').trim(),
                timeStr: ''
            };
        } else if (currentEvent && line.trim().length > 0) {
            // It's a detail line (attendees or time)
            // Heuristic: Check if it looks like time
            const text = line.trim();
            // Check if it looks like time
            if (text.match(/\d{1,2}:\d{2}/) || text.includes('...')) {
                currentEvent.timeStr = text;
            } else {
                // Assume it's attendees (since notes/location/url are excluded)
                // Append to attendees string (comma separated)
                if (currentEvent.attendees) {
                    currentEvent.attendees += ", " + text;
                } else {
                    currentEvent.attendees = text;
                }
            }
        }
    });
    if (currentEvent) events.push(currentEvent);

    // Process events into final format
    const finalEvents = events.map(e => {
        const times = parseTime(e.timeStr);
        if (!times || !times.start || !times.end) return null;
        
        return {
            title: e.title,
            start: times.start.toISOString(),
            end: times.end.toISOString(),
            attendees: e.attendees || "" // Pass attendees
        };
    }).filter(e => e !== null);

    console.log(JSON.stringify(finalEvents));

} catch (e) {
    console.error(e);
    // Return empty array on error to not break JSON parse
    console.log("[]");
}
