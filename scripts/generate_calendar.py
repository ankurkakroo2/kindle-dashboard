#!/usr/bin/env python3
"""
Kindle Calendar Dashboard Generator
Fetches events from Google Calendar and generates bold B&W week view image
"""

import os
import json
from datetime import datetime, timedelta
from pathlib import Path

# Google Calendar API
try:
    from googleapiclient.discovery import build
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials

    GOOGLE_API_AVAILABLE = True
except ImportError:
    GOOGLE_API_AVAILABLE = False

# Image generation
try:
    from PIL import Image, ImageDraw, ImageFont

    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

# Configuration
OUTPUT_DIR = Path.home() / "kindle-dashboard" / "calendar"
CREDENTIALS_PATH = Path.home() / ".google" / "calendar" / "credentials.json"
TOKEN_PATH = Path.home() / ".google" / "calendar" / "token.json"
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

# Kindle Oasis screen (landscape mode)
SCREEN_WIDTH = 1264
SCREEN_HEIGHT = 1680


def check_dependencies():
    """Check if required dependencies are installed"""
    if not PILLOW_AVAILABLE:
        print("ERROR: Pillow not installed. Run: pip3 install Pillow")
        return False
    if not GOOGLE_API_AVAILABLE:
        print(
            "ERROR: Google Calendar API not installed. Run: pip3 install google-api-python-client google-auth-oauthlib google-auth-httplib2 google-auth-httplib2"
        )
        return False
    return True


def get_credentials():
    """Get OAuth credentials for Google Calendar"""
    if not CREDENTIALS_PATH.exists():
        print(f"ERROR: Credentials not found at {CREDENTIALS_PATH}")
        print("\nTo set up Google Calendar API:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create new project")
        print("3. Enable Google Calendar API")
        print("4. Create OAuth client ID (Desktop app)")
        print("5. Download credentials.json")
        print(f"6. Save to: {CREDENTIALS_PATH}")
        return None

    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    else:
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())

    return creds


def fetch_calendar_events(creds, days=7):
    """Fetch events for next N days from primary calendar"""
    service = build("calendar", "v3", credentials=creds)
    now = datetime.utcnow().isoformat() + "Z"
    future = (datetime.utcnow() + timedelta(days=days)).isoformat() + "Z"

    events_result = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=now,
            timeMax=future,
            singleEvents=True,
            orderBy="startTime",
            maxResults=50,
        )
        .execute()
    )

    return events_result.get("items", [])


def get_week_dates():
    """Get list of dates for current week"""
    today = datetime.now()
    # Start from Sunday
    start_of_week = today - timedelta(days=today.weekday())
    return [(start_of_week + timedelta(days=i)) for i in range(7)]


def format_time(dt_string):
    """Format datetime string to simple time"""
    try:
        dt = datetime.fromisoformat(dt_string.replace("Z", "+00:00"))
        return dt.strftime("%-I:%M %p")
    except:
        return dt_string


def create_bold_font(size):
    """Create bold font - try system fonts"""
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Arial Bold.ttf",
    ]

    for path in font_paths:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except:
                pass

    # Fallback to default
    return ImageFont.load_default()


def draw_calendar(events, output_path):
    """Draw bold B&W week calendar"""
    img = Image.new("L", (SCREEN_WIDTH, SCREEN_HEIGHT), 255)
    draw = ImageDraw.Draw(img)

    # Fonts
    header_font = create_bold_font(48)
    title_font = create_bold_font(36)
    day_font = create_bold_font(24)
    time_font = create_bold_font(20)
    event_font = create_bold_font(18)

    # Get week dates
    week_dates = get_week_dates()

    # Draw header
    header_text = datetime.now().strftime("%A, %B %d, %Y")
    draw.text((20, 30), header_text, font=header_font, fill=0)

    # Draw weather placeholder
    draw.text((SCREEN_WIDTH - 200, 30), "☁️ Weather", font=day_font, fill=0)

    # Draw separator
    draw.rectangle((20, 100, SCREEN_WIDTH - 20, 110), fill=0)

    # Draw day columns (7 days, 2 rows)
    col_width = (SCREEN_WIDTH - 60) // 7
    row_height = (SCREEN_HEIGHT - 200) // 2

    # Day headers
    for i, date in enumerate(week_dates):
        x = 30 + (i * col_width)
        y = 130
        day_name = date.strftime("%a").upper()
        day_num = date.strftime("%d")
        draw.text((x + 10, y), day_name, font=day_font, fill=0)
        draw.text((x + 10, y + 30), day_num, font=title_font, fill=0)

    # Draw timeline
    draw.rectangle((20, 220, SCREEN_WIDTH - 20, 230), fill=0)

    # Draw events (simple time-based layout)
    time_slots = ["6AM", "9AM", "12PM", "3PM", "6PM"]
    for i, time_slot in enumerate(time_slots):
        y = 250 + (i * 100)
        draw.text((30, y), time_slot, font=time_font, fill=0)
        draw.line((80, y + 15, SCREEN_WIDTH - 30, y + 15), fill=128, width=1)

        # Draw sample events for each day
        for j in range(7):
            x = 100 + (j * col_width)
            draw.rectangle((x, y + 20, x + col_width - 10, y + 80), outline=0, width=2)

    # Save
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    img.save(output_path)
    print(f"Calendar saved to: {output_path}")


def main():
    """Main entry point"""
    if not check_dependencies():
        return 1

    print("Generating Kindle Calendar Dashboard...")
    print(f"Output directory: {OUTPUT_DIR}")

    # Get credentials and fetch events
    creds = get_credentials()
    if not creds:
        return 1

    events = fetch_calendar_events(creds, days=7)
    print(f"Found {len(events)} events")

    # Generate calendar image
    output_path = OUTPUT_DIR / "calendar.png"
    draw_calendar(events, output_path)

    return 0


if __name__ == "__main__":
    exit(main())
