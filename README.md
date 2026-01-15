# Kindle Dashboard

A Cal.com-inspired weather and calendar dashboard for jailbroken Kindle Oasis (10th Gen, firmware 5.18.2).

## Features

- **Weather Display**: Live weather for Gurugram, India using Open-Meteo API
- **Calendar Timeline**: Daily events with time slots (9 AM - 10 PM)
- **Todo List**: Task management with completion tracking
- **Auto-refresh**: Updates every 5 minutes
- **High-contrast Design**: Minimal chrome, landscape layout using separators

## Architecture

### Server-Side Rendering (SSR)
The dashboard uses server-side rendering because KOReader's HTML viewer does not execute JavaScript. The Node.js/Express server generates complete HTML with all data embedded.

### Display Methods

1. **Browser Method** (Portrait only)
   - Uses Kindle's native Chromium browser
   - Launched via KUAL menu or mesquite framework
   - **Note**: Browser appears hardcoded to portrait mode

2. **Framebuffer Method** (Landscape supported)
   - Direct rendering to `/dev/fb0`
   - Perfect landscape orientation
   - **Note**: Battery overlay may appear periodically

## Setup

### Prerequisites
- Jailbroken Kindle Oasis (10th Gen, firmware 5.18.2)
- KUAL launcher installed
- Node.js server running on Mac (or local network)
- SSH access to Kindle

### Installation

1. **Server Setup**:
```bash
cd /Users/ankur/D/Playground/kindle-upgrade
npm install
node server.js
```

Server runs on `http://192.168.1.140:5001`

2. **Kindle Setup**:
   - Copy KUAL extension to `/mnt/us/extensions/dashboard/`
   - Copy mesquite app to `/mnt/us/extensions/dashboard_app/`
   - Install screenshot tool: `~/kindle-screenshot.sh`

### KUAL Menu Options

- **Launch Dashboard (Mesquite - Landscape)**: Uses mesquite framework
- **Launch Dashboard (Chromium - No URL Bar)**: Direct Chromium launch
- **Close Chromium / Return Home**: Kill browser and return to home
- **Update Dashboard Now**: Manual refresh
- **Start Auto-Refresh (5 min)**: Enable automatic updates
- **Stop Auto-Refresh**: Disable automatic updates

## API Endpoints

- `GET /kindle` - Server-side rendered dashboard HTML
- `GET /api/weather` - Weather data proxy (Open-Meteo)
- `GET /api/calendar` - Mock calendar events
- `GET /api/todos` - Mock todo list
- `GET /dashboard.raw` - Rendered framebuffer (for framebuffer method)

## Testing

Use the screenshot capture tool:
```bash
~/kindle-screenshot.sh
```

This captures the current framebuffer and saves to `/tmp/kindle_screenshot.png`

## Known Issues

1. **Browser Orientation**: Kindle browser appears hardcoded to portrait mode. Landscape rotation doesn't work even with mesquite framework's `b.device.orientation`.

2. **Battery Overlay**: When using framebuffer method, system battery/status overlays may appear periodically.

3. **Auto-refresh**: Background refresh loops need to be manually stopped if they interfere with display.

## File Structure

```
kindle-dashboard/
├── server.js              # Express server with SSR
├── package.json           # Node.js dependencies
├── README.md             # This file
└── views/                # Static HTML files (if any)

/mnt/us/extensions/dashboard/     # KUAL extension
/mnt/us/extensions/dashboard_app/ # Mesquite framework app
```

## Development Notes

- Dashboard uses table-based layouts for KOReader compatibility
- CSS `grid`/`flex`/`@font-face` are unreliable on old WebKit
- JavaScript is ES5-compatible (though not executed in KOReader)
- Server-side rendering ensures compatibility with all viewers

## License

MIT
