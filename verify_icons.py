# 验证图标文件
import os
from PIL import Image

def verify_icon(filename):
    try:
        img = Image.open(f'images/{filename}')
        print(f"✅ {filename}: {img.size[0]}x{img.size[1]}px, 模式: {img.mode}")
        return True
    except Exception as e:
        print(f"❌ {filename}: 错误 - {e}")
        return False

if __name__ == "__main__":
    print("验证底部导航栏图标文件...")

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
        print("\n🎉 所有图标文件验证通过！")
        print("底部导航栏应该能正常显示了。")
    else:
        print("\n⚠️ 部分图标文件有问题，请检查。")