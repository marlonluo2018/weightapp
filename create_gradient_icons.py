# 创建渐变效果的底部导航栏图标
from PIL import Image, ImageDraw
import math

def create_gradient_icon(color1, color2, name):
    img = Image.new('RGBA', (40, 40), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 创建径向渐变效果的圆形
    center_x, center_y = 20, 20
    radius = 15

    for r in range(radius, 0, -1):
        # 计算渐变比例
        ratio = (radius - r) / radius
        # 混合颜色
        color = tuple(int(color1[i] * (1 - ratio) + color2[i] * ratio) for i in range(3))

        # 绘制圆环
        draw.ellipse([
            center_x - r, center_y - r,
            center_x + r, center_y + r
        ], fill=color)

    img.save(f'images/{name}.png')
    print(f"Created gradient icon: {name}.png")

if __name__ == "__main__":
    # 创建渐变图标
    create_gradient_icon((100, 181, 246), (66, 133, 244), 'home')        # 蓝色渐变
    create_gradient_icon((129, 236, 236), (46, 213, 115), 'home-active')  # 绿色渐变
    create_gradient_icon((250, 173, 173), (245, 34, 45), 'chart')       # 红色渐变
    create_gradient_icon((255, 207, 128), (255, 125, 0), 'chart-active')  # 橙色渐变
    create_gradient_icon((187, 134, 252), (114, 46, 209), 'user')        # 紫色渐变
    create_gradient_icon((134, 239, 172), (23, 165, 230), 'user-active')   # 青色渐变

    print("Gradient icons created successfully!")