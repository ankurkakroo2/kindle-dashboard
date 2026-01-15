# Kindle Oasis Dashboard Project

Transform a Kindle Oasis into a TRMNL-like e-ink dashboard.

## Environment
- **Host Machine**: Mac (macOS)
- **Device**: Kindle Oasis (confirm generation: 2/3?)
- **Target**: Low-power dashboard displaying useful information

---

## Phase 1: Calendar Display

**Goal**: Show Google Calendar events on the Kindle's screen.

### Step 1.1: Jailbreak the Kindle Oasis

**Prerequisites**:
- Kindle Oasis registered to Amazon account
- Mac for running jailbreak tools
- WiFi network

**Actions**:
1. [ ] Check current Kindle firmware version (Settings > Device Options > Device Info)
2. [ ] Visit [kindlemodding.org/jailbreaking/WinterBreak](https://kindlemodding.org/jailbreaking/WinterBreak/)
3. [ ] Follow WinterBreak jailbreak steps
4. [ ] After successful jailbreak, enable airplane mode to prevent auto-updates
5. [ ] Verify jailbreak worked (should see new options or MRPI installed)

**Resources**:
- [WinterBreak Guide](https://kindlemodding.org/jailbreaking/WinterBreak/)
- [MobileRead Forums](https://www.mobileread.com/forums/forumdisplay.php?f=150)

---

### Step 1.2: Install KUAL and Required Extensions

**What is KUAL?**
Kindle Unified Application Launcher - a homebrew app launcher for jailbroken Kindles.

**Actions**:
1. [ ] Download KUAL from MobileRead
2. [ ] Connect Kindle to Mac via USB
3. [ ] Copy KUAL .bin file to Kindle root directory
4. [ ] Install MRPI (MobileRead Package Installer) if not already present
5. [ ] Install USB Networking extension (for SSH access)
6. [ ] Eject Kindle, then test KUAL launches successfully

**Resources**:
- [KUAL Download](https://www.mobileread.com/forums/showthread.php?t=203326)
- [MRPI](https://www.mobileread.com/forums/showthread.php?t=251143)

---

### Step 1.3: Set Up Mac Server

**Architecture**:
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Google Calendar │────▶│   Mac Server     │────▶│   Kindle    │
│       API        │     │   (Python/Flask) │     │   Oasis     │
└─────────────────┘     └──────────────────┘     └─────────────┘
                              │
                              ▼
                        PNG image served
                        at http://<mac-ip>:5000/dashboard.png
```

**Mac Setup**:

1. [ ] Create Python virtual environment:
   ```bash
   cd /Users/ankur/D/Playground/kindle-upgrade
   python3 -m venv venv
   source venv/bin/activate
   ```

2. [ ] Install system dependencies via Homebrew:
   ```bash
   brew install cairo pango gdk-pixbuf libffi
   ```

3. [ ] Install Python dependencies:
   ```bash
   pip install flask google-api-python-client google-auth-oauthlib cairosvg Pillow
   ```

4. [ ] Set up Google Calendar API credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project "kindle-dashboard"
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials (Desktop app)
   - Download `credentials.json` to `server/` folder

5. [ ] Find your Mac's local IP (for Kindle to connect):
   ```bash
   ipconfig getifaddr en0   # WiFi
   # or
   ipconfig getifaddr en1   # Ethernet
   ```

6. [ ] (Optional) Set static IP in System Settings > Network > WiFi > Details > TCP/IP

**Kindle Oasis Display Specs**:
- Oasis 2 (2017): 300 PPI, 7" display, 1264 x 1680 pixels
- Oasis 3 (2019): 300 PPI, 7" display, 1264 x 1680 pixels

---

### Step 1.4: Create Calendar Rendering

**Actions**:
1. [ ] Design SVG template for calendar view (`server/templates/calendar.svg`)
   - Today's date header
   - Next 5-7 events with time and title
   - Clean, readable layout for e-ink
2. [ ] Write Flask server (`server/app.py`) that:
   - Fetches today's and tomorrow's events from Google Calendar
   - Populates SVG template with event data
   - Converts to 8-bit grayscale PNG at 1264x1680
   - Serves PNG at `/dashboard.png` endpoint
3. [ ] Test locally:
   ```bash
   cd server
   python app.py
   # Open http://localhost:5000/dashboard.png in browser
   ```

**Files to Create**:
```
server/
├── app.py              # Flask server
├── calendar_service.py # Google Calendar API wrapper
├── renderer.py         # SVG to PNG conversion
├── credentials.json    # Google OAuth credentials (DO NOT COMMIT)
├── token.json          # Generated after first auth (DO NOT COMMIT)
└── templates/
    └── calendar.svg    # SVG template
```

---

### Step 1.5: Configure Kindle to Fetch Dashboard

**Actions**:
1. [ ] Enable SSH on Kindle via USB Networking extension
2. [ ] SSH into Kindle from Mac:
   ```bash
   ssh root@192.168.15.244  # Default USB network IP
   # Default password: mario
   ```
3. [ ] Install Online Screensaver extension on Kindle
4. [ ] Configure it to fetch from: `http://<mac-ip>:5000/dashboard.png`
5. [ ] Set refresh interval (15-30 minutes)
6. [ ] Test end-to-end: trigger refresh and verify image appears

**Alternative - Manual Script**:
Create a script on Kindle that:
- Enables WiFi
- Downloads PNG via wget/curl
- Copies to screensaver directory
- Disables WiFi
- Scheduled via cron

---

### Step 1.6: Run Server Persistently on Mac

**Options**:

**Option A: Terminal (simple, must stay open)**
```bash
cd /Users/ankur/D/Playground/kindle-upgrade/server
source ../venv/bin/activate
python app.py
```

**Option B: Background process**
```bash
nohup python app.py > server.log 2>&1 &
```

**Option C: launchd (survives reboot)**
Create `~/Library/LaunchAgents/com.kindle.dashboard.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.kindle.dashboard</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/ankur/D/Playground/kindle-upgrade/venv/bin/python</string>
        <string>/Users/ankur/D/Playground/kindle-upgrade/server/app.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/ankur/D/Playground/kindle-upgrade/server</string>
</dict>
</plist>
```
Then: `launchctl load ~/Library/LaunchAgents/com.kindle.dashboard.plist`

---

### Step 1.7: Testing & Optimization

**Actions**:
1. [ ] Verify calendar displays correctly on Kindle
2. [ ] Check battery consumption over 24 hours
3. [ ] Optimize refresh interval for battery life
4. [ ] Handle edge cases:
   - No events today
   - Mac/server unreachable
   - WiFi connection failures

---

## Phase 1 Deliverables

- [ ] Jailbroken Kindle Oasis
- [ ] Python/Flask server running on Mac
- [ ] Google Calendar integration working
- [ ] Kindle displaying today's calendar events
- [ ] Documented setup process

---

## Future Phases (Planned)

### Phase 2: Weather Display
- Add current weather and forecast
- OpenWeatherMap API (free tier)

### Phase 3: Task List
- Apple Reminders integration (via AppleScript/Shortcuts)
- Or Todoist API

### Phase 4: News Headlines
- RSS feed parsing
- Top 3-5 headlines

### Phase 5: Combined Dashboard Layout
- All widgets in single view
- Configurable sections

### Phase 6: Reliability & Polish
- Auto-recovery from failures
- Battery optimization
- Physical mounting solution

---

## Mac-Specific Notes

- **Firewall**: Ensure Mac firewall allows incoming connections on port 5000
  - System Settings > Network > Firewall > Options > Allow incoming connections
- **Sleep**: Mac must stay awake or wake for network access
  - System Settings > Energy > Prevent sleep when display is off
  - Or use `caffeinate` command
- **IP Changes**: If Mac IP changes, Kindle config needs updating
  - Consider using Bonjour/mDNS: `http://your-mac.local:5000/dashboard.png`

## Resources

- [kindle-dash project](https://github.com/pascalw/kindle-dash)
- [Home Assistant Kindle Dashboard](https://blog.4dcu.be/diy/programming/2025/07/21/dashboard-for-home-assisant.html)
- [kindlemodding.org](https://kindlemodding.org/)
- [MobileRead Kindle Developer Corner](https://www.mobileread.com/forums/forumdisplay.php?f=150)
