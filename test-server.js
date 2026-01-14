const http = require('http');
const server = http.createServer((req, res) => {
    console.log('Request received:', req.method, req.url);
    
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'OK', message: 'Simple HTTP server', timestamp: new Date().toISOString() }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
    console.log(`Simple HTTP server running on http://127.0.0.1:${PORT}`);
    console.log(`Test with curl: curl http://127.0.0.1:${PORT}/health`);
});
