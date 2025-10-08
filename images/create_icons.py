# Python脚本用于创建简单的图标
from PIL import Image, ImageDraw
import base64

def create_home_icon():
    # 创建40x40的图像
    img = Image.new('RGBA', (40, 40), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 绘制简单的房子图标
    # 屋顶
    draw.polygon([(20, 8), (8, 20), (32, 20)], fill=(122, 126, 131))
    # 房体
    draw.rectangle([12, 20, 28, 32], fill=(122, 126, 131))
    # 门
    draw.rectangle([18, 26, 22, 32], fill=(255, 255, 255))

    return img

def create_active_icon(color=(60, 197, 96)):
    # 创建40x40的图像（激活状态）
    img = Image.new('RGBA', (40, 40), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 绘制简单的房子图标
    # 屋顶
    draw.polygon([(20, 8), (8, 20), (32, 20)], fill=color)
    # 房体
    draw.rectangle([12, 20, 28, 32], fill=color)
    # 门
    draw.rectangle([18, 26, 22, 32], fill=(255, 255, 255))

    return img

if __name__ == "__main__":
    # 创建图标
    home_icon = create_home_icon()
    home_active = create_active_icon()

    # 保存图标
    home_icon.save('home.png')
    home_active.save('home-active.png')

    print("图标已创建完成")