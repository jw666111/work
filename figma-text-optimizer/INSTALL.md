# 文本智能优化助手 - 本地安装指南

## 📦 文件清单

分享包应包含以下文件：

```
figma-text-optimizer/
├── manifest.json      # 插件配置文件（必需）
└── dist/
    ├── code.js        # 插件主代码（必需）
    └── ui.html        # 插件界面（必需）
```

## 🔧 安装步骤

### 1. 下载并解压文件

将收到的 `figma-text-optimizer` 文件夹保存到你的电脑上，记住存放位置。

### 2. 在 Figma 中导入插件

1. 打开 **Figma 桌面版**（不支持网页版导入本地插件）
2. 点击左上角 **Figma 图标** → **Plugins** → **Development** → **Import plugin from manifest...**
3. 在弹出的文件选择器中，找到刚才保存的文件夹
4. 选择 `manifest.json` 文件，点击打开
5. 看到 "Plugin imported" 提示即表示导入成功

### 3. 运行插件

导入后，可以通过以下方式运行：

- **快捷方式**：右键点击画布 → **Plugins** → **Development** → **文本智能优化助手**
- **或者**：菜单栏 **Plugins** → **Development** → **文本智能优化助手**

## ⚙️ 首次使用配置

插件需要配置 AI 模型才能使用优化功能：

### 1. 打开设置

点击插件右上角的 **⚙️ 设置图标**

### 2. 配置 AI 模型

在 **模型配置** 区域：

1. 点击 **+ 新建模型**
2. 选择模型类型：
   - **OpenAI**: GPT-4o、GPT-4o Mini 等
   - **Claude**: Claude Opus 4.5、Claude Sonnet 等
   - **Gemini**: Gemini 3 Pro、Gemini 2.0 Flash 等
   - **兼容模型**: 支持 OpenAI 兼容 API（如 Ollama、DeepSeek、UCloud ModelVerse 等）
3. 填写 **API Key**
4. 如果使用第三方平台，填写 **API Base URL** 和 **模型名称**
5. 点击 **测试连接** 验证配置
6. 点击 **保存**

### 3. 选择默认模型

在模型列表中点击你想使用的模型，使其处于选中状态（蓝色边框）

## 📝 使用方法

### 基本流程

1. **扫描文本**
   - 选中 Figma 中的元素 → 点击 **扫描选中**
   - 或直接点击 **扫描整页** 扫描当前页面所有文本

2. **优化文本**
   - 点击单个文本项的 **优化** 按钮
   - 或点击底部的 **优化全部** 批量优化

3. **应用优化**
   - 点击 **应用** 将优化结果写入 Figma
   - 或点击 **应用全部** 批量应用

### 高级功能

- **调整**：对优化结果进行多轮对话调整
- **编辑**：手动修改优化结果
- **设为参考**：将某个文案设为风格参考，同类型文案会模仿其风格
- **历史记录**：查看和撤销历史优化

## ❓ 常见问题

### Q: 提示"请先配置 AI 模型"？
A: 进入设置页面，按上述步骤配置 AI 模型和 API Key。

### Q: API 调用失败？
A: 检查：
- API Key 是否正确
- 网络是否能访问 AI 服务
- 如果使用第三方平台，确认 API Base URL 填写正确

### Q: 网页版 Figma 能用吗？
A: 本地开发版插件只能在 Figma 桌面版中使用。

### Q: 插件找不到了？
A: 重新从 **Plugins** → **Development** → **Import plugin from manifest...** 导入。

## 📋 支持的 AI 模型

| 平台 | 推荐模型 |
|------|----------|
| OpenAI | GPT-4o, GPT-4o Mini |
| Claude | Claude Opus 4.5, Claude Sonnet 4 |
| Gemini | Gemini 3 Pro, Gemini 2.0 Flash |
| 兼容 API | DeepSeek, Ollama, UCloud ModelVerse 等 |

---

如有问题，请联系插件开发者。
