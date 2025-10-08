# 创建现代化底部导航栏图标
from PIL import Image, ImageDraw

# 统一的灰色
INACTIVE_COLOR = (153, 153, 153)  # #999999
# 主题绿色
ACTIVE_COLOR = (72, 187, 120)     # #48bb78

def create_modern_home_icon(is_active=False):
    img = Image.new('RGBA', (128, 128), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    color = ACTIVE_COLOR if is_active else INACTIVE_COLOR

    # 简约房屋图标 - 更大尺寸128x128
    # 屋顶
    points = [(64, 32), (32, 64), (96, 64)]
    draw.polygon(points, fill=color)
    # 房体
    draw.rectangle([40, 64, 88, 96], fill=color)
    # 门（简约设计）
    draw.rectangle([56, 80, 72, 96], fill=(255, 255, 255))

    filename = 'images/home-active.png' if is_active else 'images/home.png'
    img.save(filename)
    print(f"Created {filename}")

def create_modern_chart_icon(is_active=False):
    img = Image.new('RGBA', (128, 128), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    color = ACTIVE_COLOR if is_active else INACTIVE_COLOR

    # 自然柱状图 - 有高有低，不递增
    bars = [
        (35, 72, 48, 96),  # 中等高度
        (52, 56, 65, 96),  # 较高
        (69, 80, 82, 96),  # 较矮
        (86, 48, 99, 96),  # 最高
    ]

    for bar in bars:
        draw.rectangle(bar, fill=color)

    # 底线
    draw.line([32, 96, 102, 96], fill=color, width=3)

    # 活跃状态添加装饰点
    if is_active:
        draw.ellipse([40, 68, 43, 71], fill=(255, 255, 255))
        draw.ellipse([57, 52, 60, 55], fill=(255, 255, 255))
        draw.ellipse([74, 76, 77, 79], fill=(255, 255, 255))
        draw.ellipse([91, 44, 94, 47], fill=(255, 255, 255))

    filename = 'images/chart-active.png' if is_active else 'images/chart.png'
    img.save(filename)
    print(f"Created {filename}")

def create_modern_user_icon(is_active=False):
    img = Image.new('RGBA', (128, 128), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    color = ACTIVE_COLOR if is_active else INACTIVE_COLOR

    # 简约用户图标 - 只有头和肩膀
    # 头部 - 圆形
    draw.ellipse([48, 32, 80, 64], fill=color)

    # 肩膀 - 椭圆形
    draw.ellipse([40, 60, 88, 84], fill=color)

    # 如果是活跃状态，添加简单装饰
    if is_active:
        # 简单的眼睛
        draw.ellipse([56, 42, 60, 46], fill=(255, 255, 255))
        draw.ellipse([68, 42, 72, 46], fill=(255, 255, 255))

    filename = 'images/user-active.png' if is_active else 'images/user.png'
    img.save(filename)
    print(f"Created {filename}")

def create_all_icons():
    """创建所有图标"""
    # 创建非活跃状态图标
    create_modern_home_icon(is_active=False)
    create_modern_chart_icon(is_active=False)
    create_modern_user_icon(is_active=False)

    # 创建活跃状态图标
    create_modern_home_icon(is_active=True)
    create_modern_chart_icon(is_active=True)
    create_modern_user_icon(is_active=True)

    print("Modern navigation icons created successfully!")

if __name__ == "__main__":
    create_all_icons()