# 创建可见的底部导航栏图标
from PIL import Image, ImageDraw
import base64

def create_colored_icon(color, name):
    # 创建40x40的彩色图标
    img = Image.new('RGBA', (40, 40), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 绘制一个实心圆
    draw.ellipse([5, 5, 35, 35], fill=color)

    # 保存图标
    img.save(f'images/{name}.png')
    print(f"已创建图标: {name}.png")

if __name__ == "__main__":
    # 创建不同颜色的图标
    create_colored_icon((100, 150, 200), 'home')           # 蓝色
    create_colored_icon((60, 180, 75), 'home-active')       # 绿色
    create_colored_icon((200, 100, 100), 'chart')          # 红色
    create_colored_icon((255, 150, 50), 'chart-active')     # 橙色
    create_colored_icon((150, 100, 200), 'user')            # 紫色
    create_colored_icon((50, 150, 200), 'user-active')       # 青色

    print("所有图标已创建完成！")