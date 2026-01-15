const axios = require('axios');

async function fetchGitHubData() {
    const username = process.env.GITHUB_USERNAME;
    const token = process.env.GITHUB_TOKEN;

    if (!username || !token) {
        console.log('GitHub credentials missing, returning mock data');
        return getMockData();
    }
    
    try {
        const query = `
          query($userName:String!) {
            user(login: $userName){
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      contributionCount
                      date
                      color
                    }
                  }
                }
              }
            }
          }
        `;

        const response = await axios.post(
            'https://api.github.com/graphql',
            { query, variables: { userName: username } },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.errors) {
            console.error('GitHub API Errors:', response.data.errors);
            return getMockData();
        }

        const calendar = response.data.data.user.contributionsCollection.contributionCalendar;
        const allDays = [];
        
        // Flatten weeks into a single array of days
        calendar.weeks.forEach(week => {
            week.contributionDays.forEach(day => {
                allDays.push(day);
            });
        });

        // Align to week (Row 1 = Sunday, Row 7 = Saturday)
        // We want a 7x7 grid (49 slots) ending at the end of the CURRENT week
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
        const daysToFillWeek = 6 - dayOfWeek; // Days remaining in this week (future)
        
        // We need (49 - daysToFillWeek) actual past days (including today)
        const daysNeeded = 49 - daysToFillWeek;
        const recentDays = allDays.slice(-daysNeeded);

        // Map to our format
        const formattedDays = recentDays.map(day => {
            let level = 0;
            if (day.contributionCount > 0) level = 1;
            if (day.contributionCount > 5) level = 2;
            if (day.contributionCount > 10) level = 3;
            return { level, date: day.date, count: day.contributionCount, future: false };
        });

        // Pad with future days
        for (let i = 0; i < daysToFillWeek; i++) {
            formattedDays.push({ level: 0, date: 'future', count: 0, future: true });
        }

        return formattedDays;

    } catch (error) {
        console.error('Error fetching GitHub data:', error.message);
        return getMockData();
    }
}

function getMockData() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToFillWeek = 6 - dayOfWeek;
    const daysNeeded = 49 - daysToFillWeek;
    
    const days = [];
    
    // Past days
    for (let i = 0; i < daysNeeded; i++) {
        // Simple deterministic random
        const val = (i * 3 + Math.floor(i/7)) % 10;
        let level = 0;
        if (val > 2) level = 1;
        if (val > 6) level = 2;
        if (val > 8) level = 3;
        days.push({ level, date: i, future: false });
    }
    
    // Future days
    for (let i = 0; i < daysToFillWeek; i++) {
        days.push({ level: 0, date: 'future', future: true });
    }
    
    return days;
}

module.exports = { fetchGitHubData };
