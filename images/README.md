# 图标文件夹说明

这个文件夹用于存放小程序的图标文件。

## 需要的图标文件

### 底部导航栏图标
- `home.png` - 首页图标（未选中状态）
- `home-active.png` - 首页图标（选中状态）
- `chart.png` - 统计图标（未选中状态）
- `chart-active.png` - 统计图标（选中状态）
- `user.png` - 用户图标（未选中状态）
- `user-active.png` - 用户图标（选中状态）

### 页面内图标
- `exercise.png` - 运动图标
- `diet.png` - 饮食图标
- `weight.png` - 体重图标
- `running.png` - 跑步图标
- `walking.png` - 步行图标
- `cycling.png` - 骑行图标
- `swimming.png` - 游泳图标
- `yoga.png` - 瑜伽图标
- `gym.png` - 健身图标
- `breakfast.png` - 早餐图标
- `lunch.png` - 午餐图标
- `dinner.png` - 晚餐图标
- `snack.png` - 加餐图标
- `calendar.png` - 日历图标
- `clock.png` - 时钟图标
- `export.png` - 导出图标
- `clear.png` - 清空图标
- `about.png` - 关于图标
- `arrow-right.png` - 右箭头图标
- `achievement-exercise.png` - 运动成就图标
- `achievement-diet.png` - 饮食成就图标
- `achievement-weight.png` - 体重成就图标
- `achievement-calorie.png` - 卡路里成就图标
- `default-avatar.png` - 默认头像图标

## 图标要求

### 尺寸要求
- 底部导航栏图标：40px × 40px
- 页面内小图标：32px × 32px 或 24px × 24px
- 头像图标：120px × 120px

### 格式要求
- 推荐使用PNG格式
- 支持透明背景
- 建议使用简洁的线条图标或扁平化设计

### 颜色建议
- 未选中状态图标：使用灰色（#7A7E83）
- 选中状态图标：使用主题色（#3cc51f）
- 页面内图标：使用彩色或单色根据设计需求

## 临时解决方案

如果暂时没有图标文件，可以：

1. **使用在线图标库**
   - iconfont.cn
   - flaticon.com
   - material.io/icons

2. **创建简单图标**
   - 使用绘图工具创建简单图标
   - 使用在线图标生成工具

3. **移除图标配置**
   - 从app.json中移除tabBar配置
   - 在页面中使用文字导航

## 恢复tabBar功能

当图标文件准备就绪后，可以恢复app.json中的tabBar配置：

```json
{
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#3cc51f",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png",
        "text": "首页"
      },
      {
        "pagePath": "pages/statistics/statistics",
        "iconPath": "images/chart.png",
        "selectedIconPath": "images/chart-active.png",
        "text": "统计"
      },
      {
        "pagePath": "pages/profile/profile",
        "iconPath": "images/user.png",
        "selectedIconPath": "images/user-active.png",
        "text": "我的"
      }
    ]
  }
}
```