# 创建简单的纯色图标
from PIL import Image, ImageDraw

def create_simple_icon(color, name):
    # 创建40x40的图标
    img = Image.new('RGBA', (40, 40), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 绘制一个实心圆
    draw.ellipse([5, 5, 35, 35], fill=color)

    # 保存图标
    img.save(f'images/{name}.png')
    print(f"已创建图标: {name}.png")

if __name__ == "__main__":
    # 创建不同颜色的纯色图标
    create_simple_icon((66, 133, 244), 'home')           # 蓝色
    create_simple_icon((46, 213, 115), 'home-active')      # 绿色
    create_simple_icon((245, 34, 45), 'chart')            # 红色
    create_simple_icon((255, 125, 0), 'chart-active')       # 橙色
    create_simple_icon((114, 46, 209), 'user')             # 紫色
    create_simple_icon((23, 165, 230), 'user-active')        # 青色

    print("所有纯色图标已创建完成！")