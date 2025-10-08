# 微信小程序项目配置说明

## project.config.json 配置说明

```json
{
  "description": "减肥记录小程序项目配置文件",
  "packOptions": {
    "ignore": [
      {
        "type": "file",
        "value": ".eslintrc.js"
      }
    ]
  },
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": false,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "enableEngineNative": false,
    "useIsolateContext": true,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "disableUseStrict": false,
    "minifyWXML": true,
    "showES6CompileOption": false,
    "useCompilerPlugins": false
  },
  "compileType": "miniprogram",
  "libVersion": "2.19.4",
  "appid": "你的小程序AppID",
  "projectname": "weightapp",
  "debugOptions": {
    "hidedInDevtools": []
  },
  "scripts": {},
  "staticServerOptions": {
    "baseURL": "",
    "servePath": ""
  },
  "isGameTourist": false,
  "condition": {
    "search": {
      "list": []
    },
    "conversation": {
      "list": []
    },
    "game": {
      "list": []
    },
    "plugin": {
      "list": []
    },
    "gamePlugin": {
      "list": []
    },
    "miniprogram": {
      "list": []
    }
  }
}
```

## 配置字段说明

### 基础配置
- `appid`: 小程序的AppID，需要在微信公众平台申请
- `projectname`: 项目名称
- `libVersion`: 基础库版本

### 编译配置
- `compileType`: 编译类型，通常为 "miniprogram"
- `es6`: 是否启用ES6转ES5
- `enhance`: 是否启用增强编译
- `postcss`: 是否启用postcss
- `minified`: 是否压缩代码

### 调试配置
- `urlCheck`: 是否检查URL域名
- `autoAudits`: 是否自动进行代码审计
- `uploadWithSourceMap`: 是否上传sourceMap

## 开发建议

1. **获取AppID**：
   - 访问微信公众平台 (https://mp.weixin.qq.com)
   - 注册小程序账号
   - 在开发管理中获取AppID

2. **开发工具设置**：
   - 启用ES6+语法支持
   - 开启代码自动补全
   - 启用实时编译

3. **调试技巧**：
   - 使用真机调试测试实际效果
   - 关注控制台错误信息
   - 使用Network面板检查数据请求

## 部署前检查清单

- [ ] 替换为真实的AppID
- [ ] 检查所有页面路径是否正确
- [ ] 验证本地存储功能
- [ ] 测试各页面交互功能
- [ ] 检查样式适配情况
- [ ] 验证数据导出功能
- [ ] 确认无console.log调试信息
- [ ] 检查图片资源是否存在