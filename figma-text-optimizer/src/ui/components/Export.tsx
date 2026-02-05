import React, { useState } from 'react';
import { TextItem, ExportFormat, ExportData } from '../../types';

interface ExportProps {
  texts: TextItem[];
  projectName?: string;
  onClose: () => void;
}

const Export: React.FC<ExportProps> = ({ texts, projectName = '未命名项目', onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('json');

  // 生成导出数据
  const generateExportData = (): ExportData => {
    return {
      projectName,
      exportTime: new Date().toISOString(),
      totalTexts: texts.length,
      optimizedTexts: texts.filter(t => t.optimized).length,
      texts: texts.map(t => ({
        id: t.id,
        name: t.name,
        characters: t.characters,
        context: t.context,
        category: t.category,
        fontSize: t.fontSize,
        position: t.position,
        optimized: t.optimized,
        isApplied: t.isApplied
      }))
    };
  };

  // 生成 JSON
  const generateJSON = (): string => {
    return JSON.stringify(generateExportData(), null, 2);
  };

  // 生成 CSV
  const generateCSV = (): string => {
    const headers = ['ID', '节点名称', '分类', '上下文', '原始文本', '优化后文本', '是否已应用'];
    const rows = texts.map(t => [
      t.id,
      t.name,
      t.category,
      t.context,
      `"${t.characters.replace(/"/g, '""')}"`,
      `"${(t.optimized || '').replace(/"/g, '""')}"`,
      t.isApplied ? '是' : '否'
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // 生成 Markdown
  const generateMarkdown = (): string => {
    const data = generateExportData();
    let md = `# ${data.projectName} - 文案优化报告\n\n`;
    md += `导出时间: ${new Date(data.exportTime).toLocaleString('zh-CN')}\n\n`;
    md += `总计: ${data.totalTexts} 条文本，已优化 ${data.optimizedTexts} 条\n\n`;
    md += `---\n\n`;

    // 按分类分组
    const categories = [...new Set(texts.map(t => t.category))];
    
    for (const category of categories) {
      const categoryTexts = texts.filter(t => t.category === category);
      md += `## ${category}\n\n`;
      md += `| 上下文 | 原文 | 优化后 | 状态 |\n`;
      md += `|--------|------|--------|------|\n`;
      
      for (const t of categoryTexts) {
        md += `| ${t.context} | ${t.characters} | ${t.optimized || '-'} | ${t.isApplied ? '已应用' : '-'} |\n`;
      }
      md += `\n`;
    }

    return md;
  };

  // 下载文件
  const handleDownload = () => {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = generateJSON();
        filename = `${projectName}_texts.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        content = generateCSV();
        filename = `${projectName}_texts.csv`;
        mimeType = 'text/csv';
        break;
      case 'markdown':
        content = generateMarkdown();
        filename = `${projectName}_texts.md`;
        mimeType = 'text/markdown';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onClose();
  };

  // 复制到剪贴板
  const handleCopy = async () => {
    let content: string;

    switch (format) {
      case 'json':
        content = generateJSON();
        break;
      case 'csv':
        content = generateCSV();
        break;
      case 'markdown':
        content = generateMarkdown();
        break;
    }

    try {
      await navigator.clipboard.writeText(content);
      alert('已复制到剪贴板');
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  return (
    <div className="export-modal">
      <div className="export-content">
        <div className="export-header">
          <h3>导出文案</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="export-body">
          <div className="export-stats">
            <span>共 {texts.length} 条文本</span>
            <span>已优化 {texts.filter(t => t.optimized).length} 条</span>
          </div>

          <div className="format-selector">
            <label>导出格式:</label>
            <div className="format-options">
              <label className={`format-option ${format === 'json' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                />
                JSON
              </label>
              <label className={`format-option ${format === 'csv' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                />
                CSV
              </label>
              <label className={`format-option ${format === 'markdown' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="format"
                  value="markdown"
                  checked={format === 'markdown'}
                  onChange={() => setFormat('markdown')}
                />
                Markdown
              </label>
            </div>
          </div>

          <div className="preview-area">
            <label>预览:</label>
            <pre className="preview-content">
              {format === 'json' && generateJSON().slice(0, 500) + '...'}
              {format === 'csv' && generateCSV().slice(0, 500) + '...'}
              {format === 'markdown' && generateMarkdown().slice(0, 500) + '...'}
            </pre>
          </div>
        </div>

        <div className="export-footer">
          <button className="btn btn-secondary" onClick={handleCopy}>
            复制
          </button>
          <button className="btn btn-primary" onClick={handleDownload}>
            下载
          </button>
        </div>
      </div>
    </div>
  );
};

export default Export;
