import React, { useState, useEffect, useCallback } from 'react';
import { TextItem, PluginSettings, HistoryRecord, TextCategory } from '../types';
import { storage, DEFAULT_SETTINGS, generateId } from '../services/storage';
import { optimizeText } from '../services/ai';
import { CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from '../services/classifier';
import TextList from './components/TextList';
import Settings from './components/Settings';
import History from './components/History';

type ViewType = 'main' | 'settings' | 'history';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('main');
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [settings, setSettings] = useState<PluginSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TextCategory | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // 初始化
  useEffect(() => {
    const init = async () => {
      await storage.initialize();
      setSettings(storage.getSettings());
      setHistory(storage.getHistory());
    };
    init();

    // 监听来自 Plugin Code 的消息
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;

      switch (msg.type) {
        case 'texts-scanned':
          setTexts(msg.payload.texts);
          setIsLoading(false);
          break;
        case 'optimization-applied':
          if (msg.payload.success) {
            setTexts(prev => prev.map(t => 
              t.id === msg.payload.nodeId 
                ? { ...t, isApplied: true }
                : t
            ));
          }
          break;
        case 'settings-loaded':
          setSettings(msg.payload.settings);
          break;
        case 'history-loaded':
          setHistory(msg.payload.history);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 扫描文本
  const handleScan = useCallback((scope: 'selection' | 'page') => {
    setIsLoading(true);
    setTexts([]);
    setError(null);
    parent.postMessage({ 
      pluginMessage: { type: 'scan-texts', payload: { scope } } 
    }, '*');
  }, []);

  // 优化单个文本
  const handleOptimize = useCallback(async (textItem: TextItem) => {
    const activeAgent = storage.getActiveAgent();
    
    if (!activeAgent?.modelConfig.apiKey) {
      setError('请先在设置中配置 Agent 和 API Key');
      return;
    }

    setOptimizingId(textItem.id);
    setError(null);

    try {
      const optimized = await optimizeText(
        textItem.characters,
        textItem.category,
        textItem.context,
        activeAgent.modelConfig,
        [...settings.globalBrandTerms, ...activeAgent.brandTerms],
        [...settings.globalRules, ...activeAgent.rules],
        activeAgent.systemPrompt || undefined
      );

      setTexts(prev => prev.map(t =>
        t.id === textItem.id
          ? { ...t, optimized }
          : t
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '优化失败');
    } finally {
      setOptimizingId(null);
    }
  }, [settings]);

  // 应用优化
  const handleApply = useCallback((textItem: TextItem) => {
    if (!textItem.optimized) return;

    const record: HistoryRecord = {
      id: generateId(),
      nodeId: textItem.id,
      nodeName: textItem.name,
      original: textItem.characters,
      optimized: textItem.optimized,
      category: textItem.category,
      timestamp: Date.now(),
      applied: true
    };

    parent.postMessage({
      pluginMessage: {
        type: 'apply-optimization',
        payload: {
          nodeId: textItem.id,
          newText: textItem.optimized,
          record
        }
      }
    }, '*');

    storage.addHistory(record);
    setHistory(storage.getHistory());
  }, []);

  // 忽略
  const handleIgnore = useCallback((textItem: TextItem) => {
    setTexts(prev => prev.filter(t => t.id !== textItem.id));
  }, []);

  // 编辑优化结果
  const handleEdit = useCallback((textItem: TextItem, newOptimized: string) => {
    setTexts(prev => prev.map(t =>
      t.id === textItem.id
        ? { ...t, optimized: newOptimized }
        : t
    ));
  }, []);

  // 还原文本
  const handleRevert = useCallback((record: HistoryRecord) => {
    parent.postMessage({
      pluginMessage: {
        type: 'revert-text',
        payload: {
          nodeId: record.nodeId,
          originalText: record.original
        }
      }
    }, '*');
  }, []);

  // 清空历史
  const handleClearHistory = useCallback(async () => {
    await storage.clearHistory();
    setHistory([]);
  }, []);

  // 保存设置
  const handleSaveSettings = useCallback(async (newSettings: PluginSettings) => {
    await storage.saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  // 过滤文本
  const filteredTexts = filter === 'all' 
    ? texts 
    : texts.filter(t => t.category === filter);

  // 统计
  const optimizedCount = texts.filter(t => t.optimized).length;
  const appliedCount = texts.filter(t => t.isApplied).length;

  // 渲染主界面
  const renderMainView = () => (
    <>
      {/* 头部 */}
      <div className="header">
        <h1>文本智能优化助手</h1>
        <div className="header-actions">
          <button 
            className="icon-btn" 
            onClick={() => setView('history')}
            title="历史记录"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>
          </button>
          <button 
            className="icon-btn" 
            onClick={() => setView('settings')}
            title="设置"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="actions">
        <button 
          className="btn btn-primary" 
          onClick={() => handleScan('selection')}
          disabled={isLoading}
        >
          扫描选中
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => handleScan('page')}
          disabled={isLoading}
        >
          扫描整页
        </button>
      </div>

      {/* Agent 提示 */}
      {!storage.getActiveAgent()?.modelConfig.apiKey && (
        <div className="warning-banner">
          请先在设置中创建 Agent 并配置 API Key
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="error-banner">
          {error}
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* 筛选器 */}
      {texts.length > 0 && (
        <div className="filter-bar">
          <span>筛选:</span>
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部 ({texts.length})
          </button>
          {Object.entries(CATEGORY_DESCRIPTIONS).map(([cat, name]) => {
            const count = texts.filter(t => t.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                className={`filter-btn ${filter === cat ? 'active' : ''}`}
                onClick={() => setFilter(cat as TextCategory)}
                style={{ 
                  borderColor: filter === cat ? CATEGORY_COLORS[cat as TextCategory] : undefined 
                }}
              >
                {name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 文本列表 */}
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span>扫描中...</span>
        </div>
      ) : texts.length > 0 ? (
        <TextList
          texts={filteredTexts}
          optimizingId={optimizingId}
          onOptimize={handleOptimize}
          onApply={handleApply}
          onIgnore={handleIgnore}
          onEdit={handleEdit}
        />
      ) : (
        <div className="empty-state">
          <p>选择 Figma 中的元素后点击"扫描选中"</p>
          <p>或点击"扫描整页"扫描当前页面的所有文本</p>
        </div>
      )}

      {/* 底部状态栏 */}
      {texts.length > 0 && (
        <div className="status-bar">
          <span>已优化 {optimizedCount}/{texts.length} 项</span>
          <span>已应用 {appliedCount} 项</span>
        </div>
      )}
    </>
  );

  return (
    <div className="app">
      {view === 'main' && renderMainView()}
      {view === 'settings' && (
        <Settings
          settings={settings}
          onSave={handleSaveSettings}
          onBack={() => setView('main')}
        />
      )}
      {view === 'history' && (
        <History
          history={history}
          onRevert={handleRevert}
          onClear={handleClearHistory}
          onBack={() => setView('main')}
        />
      )}
    </div>
  );
};

export default App;
