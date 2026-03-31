/// <reference types="@figma/plugin-typings" />

import { TextItem, TextCategory, PluginMessage, PluginSettings, HistoryRecord } from './types';

// 显示 UI
figma.showUI(__html__, { 
  width: 420, 
  height: 600,
  themeColors: true
});

// 默认设置
const DEFAULT_SETTINGS: PluginSettings = {
  activeAgentId: null,
  agents: [],
  globalBrandTerms: [],
  globalRules: [],
  historyLimit: 100
};

// 分类规则映射
const CATEGORY_PATTERNS: Record<TextCategory, string[]> = {
  button: ['btn', 'button', 'cta', 'action'],
  title: ['title', 'header', 'heading', 'headline', 'h1', 'h2', 'h3'],
  description: ['desc', 'description', 'subtitle', 'tip', 'hint', 'caption'],
  placeholder: ['input', 'placeholder', 'search', 'field'],
  feedback: ['toast', 'error', 'success', 'warning', 'alert', 'message', 'notification'],
  label: ['label', 'form', 'field-label'],
  link: ['link', 'nav', 'menu', 'navigation', 'anchor'],
  general: []
};

/**
 * 根据节点上下文分类文本类型
 */
function categorizeText(node: TextNode): TextCategory {
  // 获取节点及其祖先的名称
  const names: string[] = [];
  let current: BaseNode | null = node;
  
  while (current && names.length < 5) {
    names.push(current.name.toLowerCase());
    current = current.parent;
  }
  
  const combinedNames = names.join(' ');
  
  // 遍历分类规则
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'general') continue;
    
    for (const pattern of patterns) {
      if (combinedNames.includes(pattern)) {
        return category as TextCategory;
      }
    }
  }
  
  return 'general';
}

/**
 * 获取文本节点的上下文信息
 */
function getTextContext(node: TextNode): string {
  const contextParts: string[] = [];
  let current: BaseNode | null = node.parent;
  let depth = 0;
  
  while (current && depth < 3) {
    if (current.type === 'FRAME' || current.type === 'COMPONENT' || current.type === 'INSTANCE') {
      contextParts.push(current.name);
    }
    current = current.parent;
    depth++;
  }
  
  return contextParts.reverse().join(' > ') || '未知位置';
}

/**
 * 递归获取所有文本节点
 */
function getTextNodes(node: SceneNode): TextNode[] {
  const textNodes: TextNode[] = [];
  
  if (node.type === 'TEXT') {
    textNodes.push(node);
  } else if ('children' in node) {
    for (const child of node.children) {
      textNodes.push(...getTextNodes(child));
    }
  }
  
  return textNodes;
}

/**
 * 扫描文本节点
 */
function scanTexts(scope: 'selection' | 'page'): TextItem[] {
  let textNodes: TextNode[] = [];
  
  if (scope === 'selection') {
    // 扫描选中区域
    for (const node of figma.currentPage.selection) {
      textNodes.push(...getTextNodes(node));
    }
  } else {
    // 扫描整个页面
    for (const node of figma.currentPage.children) {
      textNodes.push(...getTextNodes(node));
    }
  }
  
  // 转换为 TextItem 格式
  return textNodes.map(node => ({
    id: node.id,
    name: node.name,
    characters: node.characters,
    context: getTextContext(node),
    category: categorizeText(node),
    fontSize: node.fontSize,
    position: { x: node.x, y: node.y }
  }));
}

/**
 * 应用优化后的文本
 */
async function applyOptimization(nodeId: string, newText: string): Promise<boolean> {
  const node = figma.getNodeById(nodeId) as TextNode;
  
  if (!node || node.type !== 'TEXT') {
    return false;
  }
  
  try {
    // 加载字体
    await figma.loadFontAsync(node.fontName as FontName);
    node.characters = newText;
    return true;
  } catch (error) {
    console.error('Failed to apply optimization:', error);
    return false;
  }
}

/**
 * 还原文本
 */
async function revertText(nodeId: string, originalText: string): Promise<boolean> {
  return applyOptimization(nodeId, originalText);
}

/**
 * 加载设置
 */
async function loadSettings(): Promise<PluginSettings> {
  try {
    const settings = await figma.clientStorage.getAsync('settings');
    return settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 保存设置
 */
async function saveSettings(settings: PluginSettings): Promise<boolean> {
  try {
    await figma.clientStorage.setAsync('settings', settings);
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * 加载历史记录
 */
async function loadHistory(): Promise<HistoryRecord[]> {
  try {
    const history = await figma.clientStorage.getAsync('history');
    return history || [];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

/**
 * 添加历史记录
 */
async function addHistory(record: HistoryRecord): Promise<boolean> {
  try {
    const history = await loadHistory();
    const settings = await loadSettings();
    
    // 添加新记录到开头
    history.unshift(record);
    
    // 限制记录数量
    if (history.length > settings.historyLimit) {
      history.splice(settings.historyLimit);
    }
    
    await figma.clientStorage.setAsync('history', history);
    return true;
  } catch (error) {
    console.error('Failed to add history:', error);
    return false;
  }
}

/**
 * 清空历史记录
 */
async function clearHistory(): Promise<boolean> {
  try {
    await figma.clientStorage.setAsync('history', []);
    return true;
  } catch (error) {
    console.error('Failed to clear history:', error);
    return false;
  }
}

// 监听来自 UI 的消息
figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case 'scan-texts': {
      const scope = msg.payload?.scope || 'selection';
      const texts = scanTexts(scope);
      figma.ui.postMessage({ type: 'texts-scanned', payload: { texts } });
      break;
    }
    
    case 'apply-optimization': {
      const { nodeId, newText, record } = msg.payload;
      const success = await applyOptimization(nodeId, newText);
      
      if (success && record) {
        await addHistory(record);
      }
      
      figma.ui.postMessage({ 
        type: 'optimization-applied', 
        payload: { nodeId, success } 
      });
      break;
    }
    
    case 'revert-text': {
      const { nodeId, originalText } = msg.payload;
      const success = await revertText(nodeId, originalText);
      figma.ui.postMessage({ 
        type: 'text-reverted', 
        payload: { nodeId, success } 
      });
      break;
    }
    
    case 'get-settings': {
      const settings = await loadSettings();
      figma.ui.postMessage({ type: 'settings-loaded', payload: { settings } });
      break;
    }
    
    case 'save-settings': {
      const success = await saveSettings(msg.payload.settings);
      figma.ui.postMessage({ type: 'settings-saved', payload: { success } });
      break;
    }
    
    case 'get-history': {
      const history = await loadHistory();
      figma.ui.postMessage({ type: 'history-loaded', payload: { history } });
      break;
    }
    
    case 'clear-history': {
      const success = await clearHistory();
      figma.ui.postMessage({ type: 'history-loaded', payload: { history: [] } });
      break;
    }
    
    case 'close': {
      figma.closePlugin();
      break;
    }
  }
};
