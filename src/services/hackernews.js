const axios = require('axios');

async function fetchTopStories(limit = 3) {
    try {
        // 1. Get Top Story IDs
        const { data: ids } = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
        
        // 2. Fetch details for top N
        const topIds = ids.slice(0, limit);
        const storyPromises = topIds.map(id => 
            axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        );
        
        const stories = await Promise.all(storyPromises);
        
        return stories.map(s => ({
            title: s.data.title,
            score: s.data.score,
            by: s.data.by,
            url: s.data.url
        }));
    } catch (error) {
        console.error('HN API Error:', error.message);
        return [];
    }
}

module.exports = { fetchTopStories };
