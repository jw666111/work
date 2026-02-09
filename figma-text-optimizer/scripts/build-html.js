const fs = require('fs');
const path = require('path');

// 读取构建后的 JS 文件
const jsPath = path.join(__dirname, '..', 'dist', 'ui.js');
const cssPath = path.join(__dirname, '..', 'src', 'ui', 'styles', 'main.css');

const jsContent = fs.readFileSync(jsPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// 生成 HTML
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>文本智能优化助手</title>
  <style>
${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
${jsContent}
  </script>
</body>
</html>`;

// 写入 HTML 文件
const outputPath = path.join(__dirname, '..', 'dist', 'ui.html');
fs.writeFileSync(outputPath, html);

console.log('✅ UI HTML 构建完成: dist/ui.html');
