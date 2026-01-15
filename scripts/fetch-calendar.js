#!/usr/bin/env osascript -l JavaScript

function log(msg) {
    var app = Application.currentApplication();
    app.includeStandardAdditions = true;
    var str = (new Date()).toISOString() + ": " + msg + "\n";
    // Append to log file
    try {
        app.doShellScript('echo "' + str + '" >> /tmp/calendar_sync.log');
    } catch(e) {}
}

function run() {
    log("Starting sync...");
    const Calendar = Application('Calendar');
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    log("Range: " + startOfDay.toISOString() + " to " + endOfDay.toISOString());

    // Get all calendars
    log("Requesting calendars list...");
    const calendars = Calendar.calendars();
    log("Found " + calendars.length + " calendars.");
    
    let allEvents = [];

    for (let i = 0; i < calendars.length; i++) {
        const cal = calendars[i];
        const name = cal.name();
        log("Checking calendar: " + name);

        try {
            const events = cal.events.whose({
                startDate: { _greaterThanEquals: startOfDay },
                startDate: { _lessThanEquals: endOfDay }
            })();
            
            log("  > Found " + events.length + " events.");

            events.forEach(ev => {
                allEvents.push({
                    title: ev.summary(),
                    start: ev.startDate().toISOString(),
                    end: ev.endDate().toISOString(),
                    calendar: name,
                    allday: ev.alldayEvent()
                });
            });
        } catch (e) {
            log("  > Error reading calendar " + name + ": " + e);
        }
    }

    log("Total events found: " + allEvents.length);
    log("Sync complete.");
    return JSON.stringify(allEvents);
}
