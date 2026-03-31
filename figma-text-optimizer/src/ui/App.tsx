import React, { useState, useEffect, useCallback } from 'react';
import { TextItem, PluginSettings, HistoryRecord, TextCategory } from '../types';
import { storage, DEFAULT_SETTINGS, generateId } from '../services/storage';
import { optimizeText, chatOptimize, ChatMessage, ReferenceExample } from '../services/ai';
import { CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from '../services/classifier';
import TextList from './components/TextList';
import Settings from './components/Settings';
import History from './components/History';

type ViewType = 'main' | 'settings' | 'history';

// 按类别存储的参考样例
type ReferencesByCategory = Partial<Record<TextCategory, ReferenceExample>>;

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
  
  // 按类别存储的参考样例（用于保持同类型文案风格一致）
  const [referencesByCategory, setReferencesByCategory] = useState<ReferencesByCategory>({});

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
    const modelConfig = storage.getModelConfig();
    
    if (!modelConfig?.apiKey) {
      setError('请先在设置中配置 AI 模型和 API Key');
      return;
    }

    if (!activeAgent) {
      setError('请先选择一个 Agent');
      return;
    }

    setOptimizingId(textItem.id);
    setError(null);

    try {
      // 获取该类别的参考样例
      const reference = referencesByCategory[textItem.category];
      const referenceExamples = reference ? [reference] : undefined;
      
      const optimized = await optimizeText(
        textItem.characters,
        textItem.category,
        textItem.context,
        modelConfig,
        [...settings.globalBrandTerms, ...activeAgent.brandTerms],
        [...settings.globalRules, ...activeAgent.rules],
        activeAgent.systemPrompt || undefined,
        referenceExamples
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
  }, [settings, referencesByCategory]);

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

  // 批量优化所有
  const [isBatchOptimizing, setIsBatchOptimizing] = useState(false);
  const handleOptimizeAll = useCallback(async () => {
    const activeAgent = storage.getActiveAgent();
    const modelConfig = storage.getModelConfig();
    
    if (!modelConfig?.apiKey) {
      setError('请先在设置中配置 AI 模型和 API Key');
      return;
    }

    if (!activeAgent) {
      setError('请先选择一个 Agent');
      return;
    }

    const textsToOptimize = texts.filter(t => !t.optimized && !t.isApplied);
    if (textsToOptimize.length === 0) return;

    setIsBatchOptimizing(true);
    setError(null);

    for (const textItem of textsToOptimize) {
      setOptimizingId(textItem.id);
      try {
        // 获取该类别的参考样例
        const reference = referencesByCategory[textItem.category];
        const referenceExamples = reference ? [reference] : undefined;
        
        const optimized = await optimizeText(
          textItem.characters,
          textItem.category,
          textItem.context,
          modelConfig,
          [...settings.globalBrandTerms, ...activeAgent.brandTerms],
          [...settings.globalRules, ...activeAgent.rules],
          activeAgent.systemPrompt || undefined,
          referenceExamples
        );

        setTexts(prev => prev.map(t =>
          t.id === textItem.id ? { ...t, optimized } : t
        ));
      } catch (err) {
        console.error('优化失败:', textItem.id, err);
      }
    }

    setOptimizingId(null);
    setIsBatchOptimizing(false);
  }, [texts, settings, referencesByCategory]);

  // 一键应用所有已优化项
  const handleApplyAll = useCallback(() => {
    const textsToApply = texts.filter(t => t.optimized && !t.isApplied);
    
    textsToApply.forEach(textItem => {
      const record: HistoryRecord = {
        id: generateId(),
        nodeId: textItem.id,
        nodeName: textItem.name,
        original: textItem.characters,
        optimized: textItem.optimized!,
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
    });

    setTexts(prev => prev.map(t =>
      t.optimized && !t.isApplied ? { ...t, isApplied: true } : t
    ));
    setHistory(storage.getHistory());
  }, [texts]);

  // 编辑优化结果
  const handleEdit = useCallback((textItem: TextItem, newOptimized: string) => {
    setTexts(prev => prev.map(t =>
      t.id === textItem.id
        ? { ...t, optimized: newOptimized }
        : t
    ));
  }, []);

  // 设为参考样例（用于保持同类型文案风格一致）
  // 支持两种模式：1. 原文直接作为参考（表示原文风格就是理想的）2. 优化结果作为参考
  const handleSetAsReference = useCallback((textItem: TextItem) => {
    // 如果有优化结果，用优化结果；否则用原文作为参考风格
    const referenceText = textItem.optimized || textItem.characters;
    
    setReferencesByCategory(prev => ({
      ...prev,
      [textItem.category]: {
        original: textItem.characters,
        optimized: referenceText
      }
    }));
  }, []);

  // 清除某类别的参考样例
  const handleClearReference = useCallback((category: TextCategory) => {
    setReferencesByCategory(prev => {
      const newRefs = { ...prev };
      delete newRefs[category];
      return newRefs;
    });
  }, []);

  // 对话式调整
  const handleChat = useCallback(async (
    textItem: TextItem, 
    message: string, 
    history: ChatMessage[]
  ): Promise<string> => {
    const activeAgent = storage.getActiveAgent();
    const modelConfig = storage.getModelConfig();
    
    if (!modelConfig?.apiKey) {
      throw new Error('请先在设置中配置 AI 模型和 API Key');
    }

    const response = await chatOptimize(
      textItem.characters,
      textItem.category,
      textItem.context,
      message,
      history,
      modelConfig,
      [...settings.globalBrandTerms, ...(activeAgent?.brandTerms || [])],
      [...settings.globalRules, ...(activeAgent?.rules || [])]
    );

    return response;
  }, [settings]);

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

      {/* 操作区 */}
      <div className="scan-section">
        <div className="section-title">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 1-1 0v-3A1.5 1.5 0 0 1 1.5 0h3a.5.5 0 0 1 0 1h-3zM11 .5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 16 1.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 1-.5-.5zM.5 11a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 1 0 1h-3A1.5 1.5 0 0 1 0 14.5v-3a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 .5-.5z"/>
            <path d="M3 4.5a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0v-7zm2 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0v-7zm2 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0v-7zm2 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-7z"/>
          </svg>
          <span>扫描文本</span>
        </div>
        <div className="scan-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => handleScan('selection')}
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner-sm"></span> : null}
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
        <div className="scan-hint">选择 Figma 元素后点击扫描，或扫描整页</div>
      </div>

      {/* 模型配置提示 */}
      {!storage.isModelConfigured() && (
        <div className="warning-banner">
          请先在设置中配置 AI 模型和 API Key
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="error-banner">
          {error}
          <button className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* 结果区域 */}
      {texts.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <div className="results-title">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z"/>
                <path d="M9.5 3a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v0a.5.5 0 0 1 .5-.5h3zm0 2a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v0a.5.5 0 0 1 .5-.5h3zm0 2a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v0a.5.5 0 0 1 .5-.5h3z"/>
              </svg>
              <span>扫描结果</span>
              <span className="results-count">{texts.length} 个文本</span>
              <button 
                className="clear-results-btn"
                onClick={() => { setTexts([]); setFilter('all'); }}
                title="清空结果"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                </svg>
              </button>
            </div>
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                全部
              </button>
              {Object.entries(CATEGORY_DESCRIPTIONS).map(([cat, name]) => {
                const count = texts.filter(t => t.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    className={`filter-tab ${filter === cat ? 'active' : ''}`}
                    onClick={() => setFilter(cat as TextCategory)}
                  >
                    {name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 参考样例提示 */}
      {Object.keys(referencesByCategory).length > 0 && (
        <div className="reference-banner">
          <div className="reference-banner-title">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
            </svg>
            <span>已设置参考样例：</span>
          </div>
          <div className="reference-tags">
            {Object.entries(referencesByCategory).map(([cat, ref]) => (
              <span key={cat} className="reference-tag">
                {CATEGORY_DESCRIPTIONS[cat as TextCategory]}
                <button 
                  className="reference-tag-remove"
                  onClick={() => handleClearReference(cat as TextCategory)}
                  title="移除参考"
                >×</button>
              </span>
            ))}
          </div>
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
          onChat={handleChat}
          onSetAsReference={handleSetAsReference}
          referencesByCategory={referencesByCategory}
        />
      ) : (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z"/>
            <path d="M9.5 3a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v0a.5.5 0 0 1 .5-.5h3zm0 2a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v0a.5.5 0 0 1 .5-.5h3zm0 2a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v0a.5.5 0 0 1 .5-.5h3z"/>
          </svg>
          <p>暂无扫描结果</p>
        </div>
      )}

      {/* 底部操作栏 */}
      {texts.length > 0 && (
        <div className="bottom-bar">
          <div className="status-info">
            <span>已优化 {optimizedCount}/{texts.length}</span>
            <span>·</span>
            <span>已应用 {appliedCount}</span>
          </div>
          <div className="batch-actions">
            {optimizedCount < texts.length && (
              <button 
                className="btn btn-sm btn-secondary"
                onClick={handleOptimizeAll}
                disabled={isBatchOptimizing || !storage.isModelConfigured()}
              >
                {isBatchOptimizing ? (
                  <>
                    <span className="spinner-sm"></span>
                    优化中...
                  </>
                ) : (
                  `优化全部 (${texts.length - optimizedCount})`
                )}
              </button>
            )}
            {optimizedCount > appliedCount && (
              <button 
                className="btn btn-sm btn-primary"
                onClick={handleApplyAll}
                disabled={isBatchOptimizing}
              >
                应用全部 ({optimizedCount - appliedCount})
              </button>
            )}
          </div>
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
