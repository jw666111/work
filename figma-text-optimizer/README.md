# Figma 文本智能优化助手

一款面向 UI/UX 设计师的 Figma 插件，通过 AI 技术自动识别、分类和优化界面文案。

## 功能特性

### 核心功能
- **文本扫描识别** - 支持扫描选中区域或整个页面的所有文本
- **智能文本分类** - 自动识别按钮、标题、描述、占位符等8种文本类型
- **AI 优化引擎** - 根据文本类型和上下文智能优化文案
- **对比预览** - 优化前后对比，支持编辑后再应用
- **历史记录** - 记录所有优化操作，支持一键还原

### AI 模型支持
- **OpenAI** - GPT-4o, GPT-4o Mini, GPT-4 Turbo
- **Anthropic Claude** - Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google Gemini** - Gemini 1.5 Pro, Gemini 1.5 Flash
- **兼容模型** - 支持任何 OpenAI 兼容 API（如 Ollama、DeepSeek 等）

### 自定义 Agent
- 创建多个优化 Agent，针对不同项目/品牌
- 自定义 System Prompt，定制优化风格
- 为每个 Agent 配置专属的品牌词库和规则

### 品牌词库
- 设置品牌专有名词的正确写法
- 自动纠正常见错误用法

### 优化规则
- 添加全局优化规则
- 针对特定文本类型设置规则

### 导出功能
- 支持 JSON、CSV、Markdown 格式
- 导出完整的文案清单

## 安装使用

### 开发环境

```bash
# 安装依赖
cd figma-text-optimizer
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build
```

### 在 Figma 中测试

1. 打开 Figma 桌面版
2. 右键点击画布空白处
3. 选择 **Plugins** → **Development** → **Import plugin from manifest...**
4. 选择项目目录中的 `manifest.json` 文件
5. 再次右键 → **Plugins** → **Development** → **文本智能优化助手**

## 使用指南

### 1. 配置 Agent

首次使用需要先配置 Agent：

1. 点击右上角设置图标
2. 点击"新建"创建一个 Agent
3. 输入 Agent 名称和描述
4. 选择 AI 模型并输入 API Key
5. 点击"测试连接"验证配置
6. 保存设置

### 2. 扫描文本

- **扫描选中** - 先在 Figma 中选择元素，然后点击此按钮
- **扫描整页** - 扫描当前页面的所有文本

### 3. 优化文本

1. 扫描完成后，点击文本项的"优化"按钮
2. 查看优化结果
3. 点击"应用"将优化后的文案更新到 Figma
4. 或点击"编辑"手动调整后再应用
5. 点击"忽略"跳过此项

### 4. 筛选和导出

- 使用分类筛选器查看特定类型的文本
- 点击导出按钮下载文案清单

## 文本分类说明

| 分类 | 识别规则 | 优化策略 |
|-----|---------|---------|
| 按钮 | 父节点含 btn/button | 简短有力，动词开头 |
| 标题 | 父节点含 title/header | 清晰准确，突出核心 |
| 描述 | 父节点含 desc/tip | 通俗易懂，用户视角 |
| 占位符 | 父节点含 input/placeholder | 简洁引导 |
| 反馈 | 父节点含 toast/error | 友好、可操作 |
| 标签 | 父节点含 label/form | 简洁准确 |
| 链接 | 父节点含 link/nav | 明确指向 |
| 通用 | 无法识别 | 通用优化 |

## 项目结构

```
figma-text-optimizer/
├── manifest.json           # Figma 插件配置
├── package.json            # 项目依赖
├── tsconfig.json           # TypeScript 配置
├── src/
│   ├── code.ts             # 插件主代码（Figma API）
│   ├── types/
│   │   └── index.ts        # 类型定义
│   ├── ui/
│   │   ├── index.tsx       # UI 入口
│   │   ├── App.tsx         # 主组件
│   │   ├── components/     # UI 组件
│   │   └── styles/         # 样式文件
│   └── services/
│       ├── ai.ts           # AI API 调用
│       ├── classifier.ts   # 文本分类
│       └── storage.ts      # 数据存储
├── scripts/
│   └── build-html.js       # HTML 构建脚本
└── dist/                   # 构建输出
```

## 技术栈

- **语言**: TypeScript
- **UI 框架**: React 18
- **构建工具**: esbuild
- **API**: Figma Plugin API

## 注意事项

- API Key 存储在本地，不会上传到任何服务器
- AI 请求直接从插件发送到对应的 AI 服务商
- 请确保遵守各 AI 服务商的使用条款

## License

MIT
