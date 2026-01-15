const https = require('https');

function fetchWeatherData() {
    return new Promise((resolve, reject) => {
        const lat = process.env.WEATHER_LAT || 28.4595;
        const lon = process.env.WEATHER_LON || 77.0266;
        
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
                        isDay: cw.is_day, // 1 = Day, 0 = Night
                        time: cw.time
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

module.exports = { fetchWeatherData };
