#!/usr/bin/env osascript -l JavaScript

function run() {
    const Reminders = Application('Reminders');
    const todos = [];

    // Get incomplete reminders from default list (or iterate all lists)
    // For simplicity, let's get from all lists, limit to top 10?
    
    const lists = Reminders.lists();
    
    for (let i = 0; i < lists.length; i++) {
        const list = lists[i];
        try {
            const incomplete = list.reminders.whose({ completed: false })();
            
            incomplete.forEach(rem => {
                todos.push({
                    text: rem.name(),
                    completed: false, // by definition
                    id: rem.id(),
                    list: list.name(),
                    priority: rem.priority() // 0-9
                });
            });
        } catch(e) {}
    }

    // Sort by priority (high to low) or creation date?
    // Reminders priority: 1 (High) to 9 (Low). 0 is None.
    // Let's sort: Priority 1-9 first, then 0.
    
    todos.sort((a, b) => {
        const pA = a.priority === 0 ? 10 : a.priority;
        const pB = b.priority === 0 ? 10 : b.priority;
        return pA - pB;
    });

    return JSON.stringify(todos.slice(0, 10)); // Limit to top 10
}
