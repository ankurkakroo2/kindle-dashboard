# Kindle Dashboard

A Cal.com-inspired weather and calendar dashboard for jailbroken Kindle Oasis (10th Gen, firmware 5.18.2).

<img width="962" height="1024" alt="image" src="https://github.com/user-attachments/assets/183bcea8-9bd0-4c99-a2e3-3fc75d84bb38" />


## Features

- **Weather Display**: Live weather for Gurugram, India using Open-Meteo API
- **Calendar Timeline**: Real-time calendar events synced from macOS Calendar app via icalBuddy
- **Todo List**: Task management with completion tracking
- **GitHub Integration**: GitHub contribution graph via GraphQL API
- **Auto-refresh**: Dashboard updates every 5 minutes
- **High-contrast Design**: Minimal chrome, portrait-optimized layout for e-ink display

## Architecture

### Server-Side Rendering (SSR)
The dashboard uses server-side rendering because KOReader's HTML viewer does not execute JavaScript. The Node.js/Express server generates complete HTML with all data embedded.

### Display Methods

1. **Browser Method** (Portrait - Primary)
   - Uses Kindle's native Chromium browser
   - Launched via `lipc-set-prop` command or KUAL menu
   - **Note**: Browser appears hardcoded to portrait mode

2. **SSR Method** (Fallback for KOReader)
   - Server-side rendered HTML at `/kindle` endpoint
   - Works in KOReader (no JavaScript execution)
   - Basic table layout for compatibility

## Setup

### Prerequisites
- Jailbroken Kindle Oasis (10th Gen, firmware 5.18.2)
- KUAL launcher installed
- Node.js server running on Mac (or local network)
- SSH access to Kindle
- macOS Calendar app (for calendar sync)

### Installation

1. **Server Setup**:
```bash
cd /Users/ankur/D/Playground/kindle-upgrade
npm install
npm start
# Or for development with auto-reload:
npm run dev
```

Server runs on `http://192.168.1.140:5001` (or `http://0.0.0.0:5001`)

2. **Environment Variables** (Optional):
Create a `.env` file in the project root:
```bash
PORT=5001
GITHUB_USERNAME=your_username
GITHUB_TOKEN=your_github_token
CALENDAR_URL=https://your-calendar-url.ics
```

3. **Kindle Setup**:
   - Copy KUAL extension to `/mnt/us/extensions/dashboard/`
   - Copy mesquite app to `/mnt/us/extensions/dashboard_app/`
   - Install screenshot tool: `~/kindle-screenshot.sh`

### Calendar Sync Service

The calendar sync service runs automatically in the background:
- Syncs every 10 minutes using `icalBuddy` via Node.js wrapper
- Fetches events from macOS Calendar app
- Saves to `src/data/calendar.json`
- Events are filtered and formatted for display

### KUAL Menu Options

- **Launch Dashboard (Browser)**: Opens dashboard in Chromium without URL bar
- **Close Chromium / Return Home**: Kill browser and return to home
- **Update Dashboard Now**: Manual refresh
- **Start Auto-Refresh (5 min)**: Enable automatic updates
- **Stop Auto-Refresh**: Disable automatic updates

## API Endpoints

- `GET /dashboard-portrait` - Main dashboard (client-side JS version)
- `GET /kindle` - Server-side rendered dashboard HTML (fallback)
- `GET /preview-portrait` - Desktop preview wrapper
- `GET /api/weather` - Weather data (Open-Meteo)
- `GET /api/calendar` - Calendar events (synced from macOS Calendar)
- `GET /api/todos` - Todo list
- `GET /api/github` - GitHub contribution data (requires credentials)
- `GET /api/hackernews` - HackerNews top stories

## Testing

Use the screenshot capture tool:
```bash
sshpass -p 'kindle' ssh root@192.168.1.145 "~/kindle-screenshot.sh"
sshpass -p 'kindle' scp root@192.168.1.145:/tmp/kindle_screenshot.png ~/Desktop/
```

This captures the current framebuffer and saves to `/tmp/kindle_screenshot.png`

## Known Issues

1. **Browser Orientation**: Kindle browser appears hardcoded to portrait mode. Landscape rotation doesn't work even with mesquite framework's `b.device.orientation`.

2. **Calendar Filtering**: Some events may be filtered out if they match ignored title patterns (sleep, standups, lunch, etc.).

3. **Auto-refresh**: Background refresh loops need to be manually stopped if they interfere with display.

## File Structure

```
kindle-upgrade/
├── src/
│   ├── server.js              # Main Express server entry point
│   ├── routes/
│   │   ├── api.js             # API route handlers
│   │   └── views.js           # View route handlers
│   ├── services/
│   │   ├── weather.js         # Weather service (Open-Meteo)
│   │   ├── calendar.js        # Calendar service (icalBuddy sync)
│   │   ├── todos.js           # Todo service
│   │   ├── github.js          # GitHub service (GraphQL)
│   │   └── hackernews.js      # HackerNews service
│   ├── utils/
│   │   └── ssr.js             # Server-side rendering utilities
│   ├── views/
│   │   ├── dashboard-portrait.html  # Main dashboard
│   │   └── preview-portrait.html    # Preview wrapper
│   └── data/
│       ├── calendar.json      # Synced calendar data
│       └── todos.json         # Todo data
├── scripts/
│   ├── fetch-calendar-buddy.js # Calendar sync script (icalBuddy wrapper)
│   ├── fetch-calendar.js       # Alternative calendar fetch
│   └── fetch-reminders.js      # Reminders fetch script
├── public/
│   └── fonts/                  # Static font assets
├── docs/
│   ├── AGENT-MANUAL.md         # Agent documentation
│   ├── conversation.md         # Development log
│   └── archive/                # Archived old files
├── package.json                # Node.js dependencies
├── README.md                   # This file
└── .env.example                # Environment variables template

/mnt/us/extensions/dashboard/     # KUAL extension (on Kindle)
/mnt/us/extensions/dashboard_app/ # Mesquite framework app (on Kindle)
```

## Development Notes

- Dashboard uses modern CSS (grid/flex) for browser version, table layouts for SSR fallback
- JavaScript is ES6+ compatible (works in Chromium browser)
- Server-side rendering ensures compatibility with KOReader
- Calendar sync runs automatically via background service
- Services are modular and testable

## Recent Changes

### Code Reorganization (January 2026)
- Moved to organized `src/` directory structure
- Separated routes into `api.js` and `views.js`
- Created service layer for modular data fetching
- Moved static assets to `public/` directory
- Added calendar sync service with automatic background updates
- Added GitHub integration via GraphQL API
- Added HackerNews service (ready for integration)

### Migration Notes
- Server entry point changed from `server.js` to `src/server.js`
- Views moved from `views/` to `src/views/`
- Old files archived in `docs/archive/`
- Fonts moved from root to `public/fonts/`

## License

MIT
