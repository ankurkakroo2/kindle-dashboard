const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let todos = []; // Fallback/Cache

function startSyncService() {
    console.log('Starting Todos Sync Service...');
    syncNow();
    setInterval(syncNow, 10 * 60 * 1000); // 10 mins
}

function syncNow() {
    const scriptPath = path.join(__dirname, '../../scripts/fetch-reminders.js');
    const outputPath = path.join(__dirname, '../../src/data/todos.json');
    
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const command = `osascript -l JavaScript "${scriptPath}" > "${outputPath}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Todos sync error: ${error.message}`);
            return;
        }
        console.log(`Todos synced at ${new Date().toLocaleTimeString()}`);
        loadTodos(); // Refresh cache
    });
}

function loadTodos() {
    const localPath = path.join(__dirname, '../../src/data/todos.json');
    if (fs.existsSync(localPath)) {
        try {
            const rawData = fs.readFileSync(localPath, 'utf8');
            todos = JSON.parse(rawData);
        } catch (e) {
            console.error('Error reading todos.json:', e);
        }
    }
}

function getTodos() {
    loadTodos(); // Ensure fresh on read (or rely on cache)
    // If empty, return hardcoded mock for demo purposes? 
    // Or return empty array?
    if (todos.length === 0) {
        // Return mock if file missing/empty
        return [
            { id: 1, text: 'No reminders found', completed: false }
        ];
    }
    return todos;
}

// Write-back is harder with JXA (need script to complete reminder).
// For now, read-only on dashboard (checkboxes are visual only or local state).
function updateTodo(id, completed) {
    // TODO: Implement JXA to complete reminder
    return null; 
}

function addTodo(text) { return null; }
function deleteTodo(id) { return null; }

module.exports = { getTodos, addTodo, updateTodo, deleteTodo, startSyncService };
