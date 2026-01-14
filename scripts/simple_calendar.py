#!/usr/bin/env python3
"""
Simple Kindle Calendar Generator (Bold B&W Week View)
Standalone version - no Google Calendar API yet
"""

from datetime import datetime, timedelta
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont

    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

# Kindle Oasis landscape screen
SCREEN_WIDTH = 1264
SCREEN_HEIGHT = 1680


def check_dependencies():
    """Check if Pillow is installed"""
    if not PILLOW_AVAILABLE:
        print("ERROR: Pillow not installed")
        print("Install with: brew install python-pillow")
        return False
    return True


def get_week_dates():
    """Get list of dates for current week starting from Sunday"""
    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday())
    return [(start_of_week + timedelta(days=i)) for i in range(7)]


def get_bold_font(size):
    """Try to load a bold font"""
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Arial Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    ]

    for path in font_paths:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except:
                pass

    return ImageFont.load_default(size=size)


def draw_calendar(output_path):
    """Draw bold B&W week calendar"""
    img = Image.new("L", (SCREEN_WIDTH, SCREEN_HEIGHT), 255)
    draw = ImageDraw.Draw(img)

    # Fonts
    header_font = get_bold_font(56)
    day_font = get_bold_font(32)
    time_font = get_bold_font(24)
    event_font = get_bold_font(20)

    # Get week dates
    week_dates = get_week_dates()

    # Draw main header
    header_text = datetime.now().strftime("%A, %B %d, %Y")
    draw.text((40, 50), header_text, font=header_font, fill=0)

    # Weather placeholder
    draw.text((SCREEN_WIDTH - 350, 65), "☁️ 22°C", font=day_font, fill=0)

    # Draw separator
    draw.rectangle((40, 150, SCREEN_WIDTH - 40, 160), fill=0)

    # Calculate columns for 7 days
    col_width = (SCREEN_WIDTH - 80) // 7
    row_height = (SCREEN_HEIGHT - 350) // 2

    # Draw day headers
    days_of_week = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    for i, day_name in enumerate(days_of_week):
        x = 50 + (i * col_width)
        y = 200
        draw.text((x + 20, y), day_name, font=day_font, fill=0)

    # Draw day numbers
    for i, date in enumerate(week_dates):
        x = 50 + (i * col_width)
        y = 260
        day_num = date.strftime("%d")
        draw.text((x + 30, y), day_num, font=day_font, fill=0)

    # Draw separator after headers
    draw.rectangle((40, 320, SCREEN_WIDTH - 40, 330), fill=0)

    # Draw time slots
    time_slots = [
        ("6 AM", ""),
        ("9 AM", "Wake up"),
        ("12 PM", "Lunch"),
        ("3 PM", ""),
        ("6 PM", "Home"),
    ]

    start_y = 380
    for i, (time_str, event_sample) in enumerate(time_slots):
        y = start_y + (i * 220)

        # Time on left
        draw.text((60, y + 30), time_str, font=time_font, fill=0)

        # Vertical line separator
        draw.line((160, y, 160, y + 180), fill=128, width=2)

        # Sample event blocks for each day (7 columns)
        for j in range(7):
            x = 200 + (j * col_width)

            # Draw event rectangle
            draw.rectangle((x, y + 20, x + col_width - 15, y + 170), outline=0, width=2)

            # Sample event text
            if event_sample:
                draw.text((x + 10, y + 50), event_sample, font=event_font, fill=0)

    # Draw footer
    draw.rectangle(
        (40, SCREEN_HEIGHT - 120, SCREEN_WIDTH - 40, SCREEN_HEIGHT - 110), fill=0
    )
    draw.text((60, SCREEN_HEIGHT - 100), "Last updated:", font=day_font, fill=0)
    draw.text(
        (60, SCREEN_HEIGHT - 60),
        datetime.now().strftime("%-I:%M %p"),
        font=day_font,
        fill=0,
    )

    # Save image
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path)
    print(f"Calendar saved to: {output_path}")


def main():
    """Main entry point"""
    if not check_dependencies():
        return 1

    print("Generating Kindle Calendar Dashboard...")
    print(f"Screen size: {SCREEN_WIDTH}x{SCREEN_HEIGHT}")

    output_path = Path.home() / "kindle-dashboard" / "calendar" / "calendar.png"
    draw_calendar(output_path)

    return 0


if __name__ == "__main__":
    exit(main())
