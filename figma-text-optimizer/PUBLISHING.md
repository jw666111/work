# Figma 社区发布指南

本文档包含发布到 Figma 社区所需的所有信息。

---

## 插件基本信息

### 名称
**中文**: 文本智能优化助手  
**英文**: Text Optimizer Assistant

### 标语 (Tagline)
**中文**: AI 驱动的界面文案智能优化工具  
**英文**: AI-powered UI copy optimization tool

### 描述 (Description)

```
文本智能优化助手是一款面向 UI/UX 设计师的 Figma 插件，通过 AI 技术自动识别、分类和优化界面文案。

✨ 主要功能：
• 智能扫描 - 一键扫描选中区域或整个页面的所有文本
• 自动分类 - 识别按钮、标题、描述、占位符等 8 种文本类型
• AI 优化 - 根据文本类型和上下文智能生成优化建议
• 多模型支持 - 支持 OpenAI、Claude、Gemini 等主流 AI 模型
• 自定义 Agent - 创建专属优化助手，自定义优化风格
• 品牌词库 - 确保品牌用语的一致性
• 历史记录 - 支持一键还原，放心优化

🎯 适用场景：
• 设计稿文案审核和优化
• 品牌文案规范化
• 多语言界面文案优化
• 提升用户体验的文案打磨

💡 使用说明：
1. 首次使用请在设置中创建 Agent 并配置 API Key
2. 选择 Figma 中的元素，点击"扫描选中"
3. 查看优化建议，点击"应用"更新文案

⚠️ 注意：本插件需要您自行提供 AI 服务的 API Key
```

### 分类 (Categories)
- Design tools
- Productivity
- AI

### 标签 (Tags)
- text
- copy
- writing
- AI
- optimization
- UX writing
- copywriting
- localization

---

## 视觉资源

### 插件图标
- 文件: `assets/plugin-icon.png`
- 尺寸要求: 128x128 像素
- 格式: PNG

### 封面图
- 文件: `assets/plugin-cover.png`
- 尺寸要求: 1920x960 像素
- 格式: PNG/JPG

---

## 发布检查清单

### 功能测试
- [x] 文本扫描功能正常
- [x] 智能分类准确
- [x] AI 优化功能正常
- [x] 应用/还原功能正常
- [x] 设置保存/加载正常
- [x] 历史记录功能正常
- [x] 导出功能正常

### UI/UX
- [x] 支持 Figma 主题色
- [x] 响应式布局
- [x] 加载状态显示
- [x] 错误提示友好
- [x] 空状态引导

### 安全与隐私
- [x] API Key 本地存储
- [x] 无数据上传到第三方服务器
- [x] 隐私政策完整

### 文档
- [x] README.md
- [x] PRIVACY_POLICY.md
- [x] CHANGELOG.md

---

## 发布步骤

### 1. 准备工作
```bash
# 确保代码是最新的
cd figma-text-optimizer
npm run build

# 检查构建产物
ls -la dist/
```

### 2. 在 Figma 中测试
1. 打开 Figma 桌面版
2. 右键 → Plugins → Development → Import plugin from manifest
3. 选择 `manifest.json`
4. 完整测试所有功能

### 3. 提交到 Figma 社区
1. 打开 Figma 桌面版
2. 点击左上角 Figma 菜单
3. 选择 **Plugins** → **Manage plugins**
4. 找到开发中的插件
5. 点击 **Publish**
6. 填写插件信息：
   - 名称
   - 标语
   - 描述
   - 分类和标签
   - 上传图标和封面图
   - 链接隐私政策
7. 提交审核

### 4. 审核等待
- Figma 团队通常在 1-3 个工作日内完成审核
- 如有问题，会通过邮件通知

---

## 更新发布

当需要发布新版本时：

1. 更新 `package.json` 中的版本号
2. 更新 `CHANGELOG.md`
3. 重新构建: `npm run build`
4. 在 Figma 中更新插件
5. 提交新版本审核

---

## 常见问题

### Q: 审核被拒绝怎么办？
A: Figma 会提供具体原因，根据反馈修改后重新提交。

### Q: 如何查看插件数据？
A: 发布后可在 Figma Community 页面查看安装数、评分等数据。

### Q: 可以设置付费吗？
A: 目前 Figma 插件不支持直接付费，可以考虑使用外部订阅服务。

---

## 联系方式

发布过程中如有问题，可以参考：
- [Figma Plugin Documentation](https://www.figma.com/plugin-docs/)
- [Figma Community Guidelines](https://www.figma.com/community-guidelines/)
