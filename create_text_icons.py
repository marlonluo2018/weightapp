# 创建文字图标作为底部导航栏图标
from PIL import Image, ImageDraw, ImageFont

def create_text_icon(text, color, name):
    # 创建40x40的图标
    img = Image.new('RGBA', (40, 40), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 绘制文字（尝试使用默认字体）
    try:
        # 尝试使用较大的字体
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        # 如果找不到字体，使用默认字体
        font = None

    # 计算文字位置
    text_width = draw.textlength(text, font=font) if font else len(text) * 6
    text_height = 20 if font else 20

    x = (40 - text_width) // 2
    y = (40 - text_height) // 2

    # 绘制文字
    draw.text((x, y), text, fill=color, font=font)

    # 保存图标
    img.save(f'images/{name}.png')
    print(f"已创建文字图标: {name}.png - '{text}'")

if __name__ == "__main__":
    # 创建文字图标
    create_text_icon('🏠', (100, 150, 200), 'home')
    create_text_icon('⚡', (60, 180, 75), 'home-active')
    create_text_icon('📊', (200, 100, 100), 'chart')
    create_text_icon('🔥', (255, 150, 50), 'chart-active')
    create_text_icon('👤', (150, 100, 200), 'user')
    create_text_icon('⭐', (50, 150, 200), 'user-active')

    print("文字图标创建完成！")