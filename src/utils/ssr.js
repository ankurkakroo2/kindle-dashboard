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
    const istOffset = 5.5 * 60 * 60 * 1000;
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

    // Generate calendar timeline - SINGLE LINE PER HOUR
    const startHour = 9;
    const endHour = 22; // 9 AM to 10 PM

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

    // Return simple HTML template (embedded)
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="300">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Amazon Ember", sans-serif; width: 100%; height: 100vh; }
        .main-container { display: table; width: 100%; height: 100%; border-collapse: collapse; }
        .header { display: table-row; height: 70px; }
        .header-content { display: table-cell; padding: 16px 24px; border-bottom: 4px solid #000; vertical-align: middle; }
        .header-left { float: left; }
        .header-right { float: right; text-align: right; }
        .date-large { font-size: 28px; font-weight: 900; }
        .time-large { font-size: 20px; font-weight: 800; color: #333; }
        .weather-summary { font-size: 24px; font-weight: 800; }
        .content { display: table-row; height: auto; }
        .sidebar { display: table-cell; width: 50%; padding: 20px; border-right: 2px solid #000; vertical-align: top; }
        .weather-icon { font-size: 80px; text-align: center; margin-bottom: 12px; }
        .weather-temp { font-size: 64px; font-weight: 900; text-align: center; line-height: 1; }
        .weather-location { font-size: 14px; font-weight: 700; text-align: center; margin-top: 8px; color: #333; }
        .weather-details { margin-top: 16px; padding: 12px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; }
        .weather-detail-row { padding: 6px 0; font-size: 16px; font-weight: 800; }
        .weather-detail-label { display: inline-block; width: 120px; }
        .weather-detail-value { font-weight: 900; }
        .section-title { font-size: 20px; font-weight: 900; margin-bottom: 12px; border-bottom: 3px solid #000; }
        .todo-item { padding: 10px 0; font-size: 15px; font-weight: 700; border-bottom: 1px solid #ccc; }
        .todo-checkbox { display: inline-block; width: 18px; height: 18px; border: 2px solid #000; margin-right: 10px; font-weight: 900; text-align: center; }
        .todo-completed { text-decoration: line-through; color: #666; }
        .timeline { display: table-cell; padding: 8px 16px; vertical-align: top; }
        .footer-timestamp { position: fixed; bottom: 8px; left: 8px; font-size: 11px; font-weight: 700; color: #666; }
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
        <div class="sidebar">
            <div class="weather-widget">
                <div class="weather-icon">${icon}</div>
                <div class="weather-temp">${weather.temp}°</div>
                <div class="weather-location">Gurugram, India</div>
                <div class="weather-details">
                    <div class="weather-detail-row"><span class="weather-detail-label">Feels Like</span><span class="weather-detail-value">${weather.feelsLike}°</span></div>
                    <div class="weather-detail-row"><span class="weather-detail-label">Humidity</span><span class="weather-detail-value">${weather.humidity}%</span></div>
                    <div class="weather-detail-row"><span class="weather-detail-label">Condition</span><span class="weather-detail-value">${condition}</span></div>
                </div>
            </div>
            <div class="todos-section">
                <div class="section-title">TODAY'S TASKS</div>
                ${todosHTML}
            </div>
        </div>
        <div class="timeline">${timelineHTML}</div>
    </div>
</div>
<div class="footer-timestamp">Updated: ${updateTimestamp}</div>
</body>
</html>`;
}

module.exports = { generateKindleHTML };
