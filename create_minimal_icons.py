# 创建最小PNG图标的Python脚本
import base64

# 1x1像素的透明PNG (base64编码)
transparent_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

# 解码并保存为PNG文件
transparent_png_data = base64.b64decode(transparent_png_base64)

# 创建图标文件
with open('images/home.png', 'wb') as f:
    f.write(transparent_png_data)

with open('images/home-active.png', 'wb') as f:
    f.write(transparent_png_data)

with open('images/chart.png', 'wb') as f:
    f.write(transparent_png_data)

with open('images/chart-active.png', 'wb') as f:
    f.write(transparent_png_data)

with open('images/user.png', 'wb') as f:
    f.write(transparent_png_data)

with open('images/user-active.png', 'wb') as f:
    f.write(transparent_png_data)

print("最小图标文件已创建")