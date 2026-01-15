# Agent Manual: Kindle Dashboard Project

**Last Updated:** January 15, 2026
**Project Status:** Browser launches successfully without URL bar, but landscape orientation not yet solved

---

## 🎯 Project Goal

Build a **Cal.com-inspired dashboard** that displays on a jailbroken Kindle Oasis (10th Gen) in **landscape mode** with:
- Live weather for Gurugram, India
- Calendar timeline with events
- Todo list
- **NO URL bar or browser chrome** (achieved ✅)
- **Landscape orientation** (NOT achieved ❌ - this is the current blocker)
- Auto-refresh capability

---

## 📊 Current Status

### ✅ What's Working
- Express server running on Mac, serving dashboard
- Server-side rendering (SSR) - generates complete HTML with data
- Browser launches on Kindle **without URL bar** using `lipc-set-prop`
- Weather API integration (Open-Meteo, live data)
- Calendar API (30 mock events)
- Todos API (5 tasks)
- SSH access to Kindle
- Screenshot capture for testing
- KUAL launcher integration

### ❌ What's Not Working
- **Landscape orientation** - Browser stays in portrait mode (HARD REQUIREMENT)
- All attempts to rotate browser have failed:
  - `lipc-set-prop com.lab126.winmgr orientationLock L` - ignored
  - Mesquite framework `b.device.orientation` - doesn't affect browser content
  - CSS transforms - old WebKit doesn't support
  - Chromium orientation flags - browser ignores

### 🔍 What Was Explored But Not Preferred
- **Framebuffer rendering** - Works and achieves landscape, but battery overlay issues make it impractical
- User prefers browser or KOReader solution, not framebuffer

---

## 🖥️ System Setup

### Development Machine (Mac)
- **IP Address:** `192.168.1.140`
- **Server Location:** `/Users/ankur/D/Playground/kindle-upgrade/`
- **Server Port:** `5001`
- **Git Repo:** `/Users/ankur/D/Playground/kindle-upgrade` (initialized, not pushed yet)

### Kindle Device
- **Model:** Kindle Oasis 10th Gen
- **Firmware:** 5.18.2
- **Status:** Already jailbroken with KUAL installed
- **IP Address:** `192.168.1.145`
- **SSH User:** `root`
- **SSH Password:** `kindle`

### Key Constraints
- **Old WebKit:** No CSS grid/flex, no modern JS features
- **KOReader:** Does NOT execute JavaScript
- **Must use:** Server-side rendering, table layouts, system fonts

---

## 🚀 How to Run the App

### 1. Start the Server on Mac

```bash
# Navigate to server directory
cd /Users/ankur/D/Playground/kindle-upgrade

# Install dependencies (if needed)
npm install

# Start development server (with auto-reload)
npm run dev

# OR start production server
npm start
```

**Server will run on:** `http://192.168.1.140:5001`

**Verify it's working:**
```bash
# Check health
curl http://192.168.1.140:5001/api/weather

# Should return live weather JSON
```

### 2. Access the Dashboard

**On Desktop (for testing):**
- Preview with JS: `http://192.168.1.140:5001/preview-dashboard`
- Server-rendered: `http://192.168.1.140:5001/kindle`

**On Kindle:**
- Must use server-rendered endpoint: `http://192.168.1.140:5001/kindle`

---

## 🔑 SSH Access to Kindle

### Login Methods

```bash
# Method 1: Interactive (prompts for password)
ssh root@192.168.1.145
# Password: kindle

# Method 2: Non-interactive (recommended for scripts)
sshpass -p 'kindle' ssh root@192.168.1.145

# Method 3: With host key checking disabled (best for automation)
sshpass -p 'kindle' ssh -o StrictHostKeyChecking=no root@192.168.1.145
```

### File Transfer

```bash
# Copy TO Kindle
sshpass -p 'kindle' scp /local/file.html root@192.168.1.145:/mnt/us/documents/

# Copy FROM Kindle
sshpass -p 'kindle' scp root@192.168.1.145:/tmp/file.png /local/path/
```

---

## 🌐 Launching Dashboard on Kindle

### ✅ THE CORRECT METHOD (What Actually Works)

**DO THIS:**
```bash
sshpass -p 'kindle' ssh root@192.168.1.145 "lipc-set-prop com.lab126.appmgrd start 'app://com.lab126.browser?action=goto&url=http://192.168.1.140:5001/kindle'"
```

**Why this works:**
- Uses Kindle's application manager to launch browser
- System handles all library paths and environment setup
- Browser process managed correctly by OS

### ❌ WHAT DOESN'T WORK (Common Mistakes)

**DON'T DO THIS:**
```bash
# ❌ Manually launching Chromium binary
export LD_LIBRARY_PATH='/usr/bin/chromium/lib:/usr/bin/chromium/usr/lib:/usr/lib/'
chroot /chroot /usr/bin/chromium/bin/kindle_browser --content-shell-hide-toolbar ...
```

**Why this fails:**
- Causes library conflicts (`timeout: relocation error`)
- Background processes don't persist via SSH
- Environment variables don't propagate correctly

### Complete Launch Sequence

```bash
# Kill any existing browser
sshpass -p 'kindle' ssh root@192.168.1.145 "killall -9 kindle_browser 2>/dev/null"

# Wait a moment
sleep 2

# Launch browser with dashboard
sshpass -p 'kindle' ssh root@192.168.1.145 "lipc-set-prop com.lab126.appmgrd start 'app://com.lab126.browser?action=goto&url=http://192.168.1.140:5001/kindle'"

# Wait for browser to start
sleep 5

# Capture screenshot to verify
~/kindle-screenshot.sh
```

### Close Browser

```bash
sshpass -p 'kindle' ssh root@192.168.1.145 "killall -9 kindle_browser 2>/dev/null && lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.home"
```

---

## 🛠️ Important Server Endpoints

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/kindle` | Server-side rendered dashboard | **Use this for Kindle** |
| `/preview-dashboard` | Client-side JS version | Desktop testing only |
| `/api/weather` | Live weather data | Gurugram, India |
| `/api/calendar` | Mock calendar events | 30 events with overlaps |
| `/api/todos` | Mock todo list | 5 tasks |

---

## 📸 Testing & Debugging

### Capture Screenshot from Kindle

```bash
# Run screenshot script (already on Kindle at ~/kindle-screenshot.sh)
sshpass -p 'kindle' ssh root@192.168.1.145 "~/kindle-screenshot.sh"

# Copy to Mac desktop for viewing
sshpass -p 'kindle' scp root@192.168.1.145:/tmp/kindle_screenshot.png ~/Desktop/
```

**Screenshot Details:**
- Resolution: 1264x1680 (portrait), stride=1280
- Format: 8-bit grayscale PNG
- Location on Kindle: `/tmp/kindle_screenshot.png`

### Check If Browser Is Running

```bash
sshpass -p 'kindle' ssh root@192.168.1.145 "ps aux | grep kindle_browser | grep -v grep"
```

### Check Server Accessibility from Kindle

```bash
# Test from Kindle
sshpass -p 'kindle' ssh root@192.168.1.145 "curl -I http://192.168.1.140:5001/kindle"

# Should return: HTTP/1.1 200 OK
```

### View Server Logs

Server logs appear in the terminal where `npm run dev` is running. Watch for:
- Weather API requests
- Calendar/todo data fetches
- Any errors or warnings

---

## 📁 Key Files & Locations

### On Mac (Development Machine)

```
/Users/ankur/D/Playground/kindle-upgrade/
├── server.js                 # Express server with SSR
├── package.json              # Dependencies
├── README.md                 # Project documentation
└── views/
    ├── dashboard.html        # Client-side version (with JS)
    ├── preview-dashboard.html # Iframe wrapper for desktop
    └── weather.html          # Simple weather panel
```

### On Kindle

```
/mnt/us/documents/
└── dashboard.html            # Deployed server-rendered HTML

/mnt/us/extensions/dashboard/  # KUAL extension
├── menu.json                 # KUAL menu definition
├── launch-browser.sh         # Browser launcher script
├── close-chromium.sh         # Browser closer script
├── open-server.sh            # Open server-rendered dashboard
└── stop-all-refresh.sh       # Stop auto-refresh processes

/root/
└── kindle-screenshot.sh      # Screenshot capture tool
```

---

## 🎮 Using KUAL Menu

The Kindle has a KUAL launcher with pre-configured dashboard options:

1. Open KUAL on Kindle (tap top-right corner menu)
2. Navigate to "Dashboard"
3. Available options:
   - **Launch Dashboard (Browser)** - Opens dashboard without URL bar
   - **Close Browser / Return Home** - Kills browser, returns to home
   - **Open Dashboard (Network - Server)** - Alternative launch method

---

## 🔧 Common Issues & Solutions

### Issue: "Server not accessible from Kindle"

**Symptoms:** Browser loads but shows error or blank page

**Solution:**
```bash
# 1. Verify server is running on Mac
ps aux | grep "node server.js"

# 2. Verify server is listening on 0.0.0.0 (not 127.0.0.1)
lsof -i :5001

# 3. Test from Kindle
sshpass -p 'kindle' ssh root@192.168.1.145 "curl http://192.168.1.140:5001/kindle | head -20"
```

### Issue: "Port 5001 already in use"

**Solution:**
```bash
# Find what's using the port
lsof -i :5001

# Kill that process
kill <PID>

# Or kill all node processes
killall node
```

### Issue: "SSH connection fails"

**Symptoms:** `Permission denied` or `Connection timeout`

**Solution:**
```bash
# Verify Kindle IP hasn't changed
# On Kindle: Settings -> Device Options -> Device Info -> Wi-Fi Network

# Update IP in commands if needed
# Note: Kindle blocks ping, so "no response" is normal

# Test SSH connectivity
sshpass -p 'kindle' ssh root@192.168.1.145 "echo 'Connected successfully'"
```

### Issue: "Browser shows wrong page"

**Solution:**
```bash
# Kill browser completely
sshpass -p 'kindle' ssh root@192.168.1.145 "killall -9 kindle_browser 2>/dev/null && killall -9 mesquite 2>/dev/null"

# Wait
sleep 2

# Relaunch
sshpass -p 'kindle' ssh root@192.168.1.145 "lipc-set-prop com.lab126.appmgrd start 'app://com.lab126.browser?action=goto&url=http://192.168.1.140:5001/kindle'"
```

---

## 🎯 Current Challenge: Landscape Orientation

### The Problem

Browser launches successfully **without URL bar** (✅), but remains in **portrait mode** (❌).

**User's hard requirement:** Dashboard MUST display in landscape.

### What's Been Tried (All Failed)

1. **System Orientation Lock**
   ```bash
   lipc-set-prop com.lab126.winmgr orientationLock L
   ```
   **Result:** Browser ignores, stays portrait

2. **Mesquite Framework**
   - Created custom mesquite app based on WebLaunch
   - Set `b.device.orientation = b.enums.orientations.landscape`
   **Result:** App launches but browser content stays portrait

3. **CSS Rotation**
   - Added CSS transforms to rotate content
   **Result:** Old WebKit doesn't support properly

4. **Chromium Orientation Flags**
   - Tried various flags like `--force-device-scale-factor`
   **Result:** Browser ignores orientation-related flags

### What We Know

- **Ebooks CAN rotate:** Orientation works for reading apps
- **Browser CANNOT rotate:** System-level restriction on browser
- **KOReader CAN'T help:** Doesn't execute JavaScript
- **Framebuffer WORKS but not preferred:** Battery overlay issues

### Next Steps to Explore

1. **Find browser configuration files** - Look for browser settings that might control orientation
2. **Explore Kindle OS internals** - Research how ebook reader achieves landscape
3. **Check for browser patches** - Look for community patches that enable landscape
4. **Alternative browsers** - Research if other browsers can be installed on Kindle
5. **Accept portrait and redesign** - Last resort if landscape truly impossible

---

## 📋 Quick Command Reference

### Essential Commands

```bash
# Start server
cd /Users/ankur/D/Playground/kindle-upgrade && npm run dev

# SSH to Kindle
sshpass -p 'kindle' ssh root@192.168.1.145

# Launch dashboard on Kindle
sshpass -p 'kindle' ssh root@192.168.1.145 "killall -9 kindle_browser 2>/dev/null && sleep 1 && lipc-set-prop com.lab126.appmgrd start 'app://com.lab126.browser?action=goto&url=http://192.168.1.140:5001/kindle'"

# Capture screenshot
sshpass -p 'kindle' ssh root@192.168.1.145 "~/kindle-screenshot.sh" && sshpass -p 'kindle' scp root@192.168.1.145:/tmp/kindle_screenshot.png ~/Desktop/

# Close browser
sshpass -p 'kindle' ssh root@192.168.1.145 "killall -9 kindle_browser 2>/dev/null"

# Check server accessibility
sshpass -p 'kindle' ssh root@192.168.1.145 "curl -I http://192.168.1.140:5001/kindle"
```

---

## 📚 Additional Resources

### Documentation Files

- **conversation.md** - Detailed conversation log with full history
- **README.md** - Project README in `/Users/ankur/D/Playground/kindle-upgrade/`
- **PLAN.md** - Original project plan (may be outdated)

### Key Technical Learnings

1. **KOReader doesn't execute JavaScript** - Must use server-side rendering
2. **Old WebKit limitations** - Use tables, system fonts, avoid modern CSS
3. **Browser launch via lipc-set-prop** - Don't manually launch Chromium
4. **Server must bind to 0.0.0.0** - Or Kindle can't access it
5. **Always use server-rendered `/kindle` endpoint** - Not JS-based versions

### Git Repository

```bash
# Location
cd /Users/ankur/D/Playground/kindle-upgrade

# Status: Initialized but no remote configured
# Commits:
# - f9751af: Add Kindle dashboard with weather, calendar, and todos
# - f728bbf: Add comprehensive README

# To push (need GitHub URL first):
git remote add origin <github-url>
git push -u origin main
```

---

## 🎓 Important Notes for Agents

### Do's ✅

1. **Always use `lipc-set-prop` to launch browser** - It's the only reliable method
2. **Test from desktop first** - Use `/preview-dashboard` to verify changes
3. **Capture screenshots frequently** - Essential for e-ink verification
4. **Use sshpass for automation** - Password is `kindle`
5. **Check server logs** - Watch terminal where `npm run dev` is running
6. **Update conversation.md** - Document discoveries and changes

### Don'ts ❌

1. **Don't try to manually launch Chromium binary** - Use system app manager
2. **Don't set LD_LIBRARY_PATH before system commands** - Causes failures
3. **Don't use JS-based endpoints for Kindle** - Must be server-side rendered
4. **Don't assume CSS features work** - Test on actual device
5. **Don't use framebuffer as primary solution** - User prefers browser
6. **Don't forget the landscape requirement** - It's the current blocker

---

## 🚧 Your Mission (If You Choose to Accept It)

**Primary Goal:** Solve the landscape orientation issue for the browser.

**Success Criteria:**
- Dashboard displays in landscape mode (1680×1264 viewport)
- No URL bar or browser chrome (already achieved)
- Browser-based solution (not framebuffer)
- Auto-refresh works
- Stable and reliable

**Where to Start:**
1. Research Kindle browser internals and configuration
2. Look for orientation-related system settings
3. Explore browser launch parameters we haven't tried
4. Check Kindle OS documentation for browser API
5. Consider alternative approaches (different browser, OS-level hooks)

**How to Test:**
1. Make changes on Mac server
2. Restart server: `npm run dev`
3. Kill browser on Kindle
4. Launch browser with your changes
5. Capture screenshot
6. Verify orientation and layout
7. Document what worked/didn't work

**Good luck! The user really wants landscape mode. 🚀**

---

*This manual is your starting point. Read conversation.md for detailed history and context.*
