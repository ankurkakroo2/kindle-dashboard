#!/bin/sh

# Kindle Calendar Update Script
# Downloads latest calendar from Mac and displays it

# Configuration
MAC_USER="ankur"
MAC_IP="192.168.1.146"  # Update to your Mac's WiFi IP
CALENDAR_DIR="/mnt/us/calendar"
LOG_FILE="/mnt/us/calendar_update.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Starting calendar update..."

# Ensure directory exists
mkdir -p "$CALENDAR_DIR"

# Download calendar from Mac
log "Downloading calendar from Mac..."
scp -o StrictHostKeyChecking=no ${MAC_USER}@${MAC_IP}:~/kindle-dashboard/calendar/calendar.png "${CALENDAR_DIR}/calendar.png"

if [ $? -eq 0 ]; then
    log "Calendar downloaded successfully"

    # Try to display using KOReader
    if [ -f "/mnt/us/koreader/koreader.sh" ]; then
        log "Launching KOReader to display calendar..."
        # Open image in KOReader fullscreen mode
        /mnt/us/koreader/koreader.sh --fullscreen "${CALENDAR_DIR}/calendar.png"
    else
        log "ERROR: KOReader not found"
        log "KOReader should be at /mnt/us/koreader/"
    fi
else
    log "ERROR: Failed to download calendar"
fi

log "Update complete"
