# Verify icon files
import os
from PIL import Image

def verify_icon(filename):
    try:
        img = Image.open(f'images/{filename}')
        print(f"OK {filename}: {img.size[0]}x{img.size[1]}px, mode: {img.mode}")
        return True
    except Exception as e:
        print(f"ERROR {filename}: {e}")
        return False

if __name__ == "__main__":
    print("Verifying navigation bar icons...")

    icons = [
        'home.png', 'home-active.png',
        'chart.png', 'chart-active.png',
        'user.png', 'user-active.png'
    ]

    all_ok = True
    for icon in icons:
        if not verify_icon(icon):
            all_ok = False

    if all_ok:
        print("\nAll icon files verified successfully!")
        print("Navigation bar should display properly now.")
    else:
        print("\nSome icon files have issues.")