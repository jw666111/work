import React, { useState } from 'react';
import { 
  PluginSettings, 
  AgentConfig, 
  BrandTerm, 
  OptimizationRule,
  AIModelProvider,
  SavedModelConfig
} from '../../types';
import { MODEL_OPTIONS, testConnection } from '../../services/ai';
import { generateId, createDefaultAgent, BUILTIN_AGENT_ID } from '../../services/storage';

interface SettingsProps {
  settings: PluginSettings;
  onSave: (settings: PluginSettings) => void;
  onBack: () => void;
}

type SettingsView = 'main' | 'agent-edit' | 'model-edit';

const Settings: React.FC<SettingsProps> = ({ settings, onSave, onBack }) => {
  // 确保数据兼容
  const safeSettings: PluginSettings = {
    ...settings,
    savedModels: settings.savedModels || [],
    activeModelId: settings.activeModelId || null
  };
  
  const [localSettings, setLocalSettings] = useState<PluginSettings>(safeSettings);
  const [view, setView] = useState<SettingsView>('main');
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [editingModel, setEditingModel] = useState<SavedModelConfig | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // 新建品牌词条
  const [newTermWrong, setNewTermWrong] = useState('');
  const [newTermCorrect, setNewTermCorrect] = useState('');

  // 新建规则
  const [newRuleContent, setNewRuleContent] = useState('');

  // 保存并返回
  const handleSave = () => {
    onSave(localSettings);
    onBack();
  };

  // === 模型管理 ===
  const handleCreateModel = () => {
    const newModel: SavedModelConfig = {
      id: generateId(),
      name: '',
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: '',
      baseUrl: '',
      customModel: '',
      createdAt: Date.now()
    };
    setEditingModel(newModel);
    setTestResult(null);
    setView('model-edit');
  };

  const handleEditModel = (model: SavedModelConfig) => {
    setEditingModel({ ...model });
    setTestResult(null);
    setView('model-edit');
  };

  const handleSaveModel = () => {
    if (!editingModel || !editingModel.apiKey) return;

    const isCustomProvider = editingModel.provider === 'compatible';
    if (isCustomProvider && !editingModel.baseUrl) return;

    // 自动生成名称：自定义模型用 customModel，否则用模型选项名称
    const modelOption = MODEL_OPTIONS.find(m => m.provider === editingModel.provider && m.model === editingModel.model);
    const autoName = isCustomProvider 
      ? (editingModel.customModel || '自定义模型')
      : (modelOption?.name || editingModel.model);
    
    const modelToSave = {
      ...editingModel,
      name: autoName
    };

    const models = [...localSettings.savedModels];
    const existingIndex = models.findIndex(m => m.id === modelToSave.id);

    if (existingIndex >= 0) {
      models[existingIndex] = modelToSave;
    } else {
      models.push(modelToSave);
    }

    // 如果没有激活的模型，自动激活新创建的
    const newSettings = {
      ...localSettings,
      savedModels: models,
      activeModelId: localSettings.activeModelId || modelToSave.id
    };

    setLocalSettings(newSettings);
    setEditingModel(null);
    setView('main');
  };

  const handleDeleteModel = (modelId: string) => {
    const newModels = localSettings.savedModels.filter(m => m.id !== modelId);
    setLocalSettings({
      ...localSettings,
      savedModels: newModels,
      activeModelId: localSettings.activeModelId === modelId 
        ? (newModels[0]?.id || null)
        : localSettings.activeModelId
    });
  };

  const handleTestConnection = async () => {
    if (!editingModel) return;

    setIsTesting(true);
    setTestResult(null);

    const result = await testConnection({
      provider: editingModel.provider,
      model: editingModel.model,
      apiKey: editingModel.apiKey,
      baseUrl: editingModel.baseUrl,
      customModel: editingModel.customModel
    });
    setTestResult(result);
    setIsTesting(false);
  };

  // === Agent 管理 ===
  const handleCreateAgent = () => {
    const newAgent = createDefaultAgent();
    setEditingAgent(newAgent);
    setView('agent-edit');
  };

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent({ ...agent });
    setView('agent-edit');
  };

  const handleSaveAgent = () => {
    if (!editingAgent) return;

    const agents = [...localSettings.agents];
    const existingIndex = agents.findIndex(a => a.id === editingAgent.id);

    if (existingIndex >= 0) {
      agents[existingIndex] = { ...editingAgent, updatedAt: Date.now() };
    } else {
      agents.push(editingAgent);
    }

    const newSettings = {
      ...localSettings,
      agents,
      activeAgentId: localSettings.activeAgentId || editingAgent.id
    };

    setLocalSettings(newSettings);
    setEditingAgent(null);
    setView('main');
  };

  const handleDeleteAgent = (agentId: string) => {
    if (agentId === BUILTIN_AGENT_ID) return;
    
    const newAgents = localSettings.agents.filter(a => a.id !== agentId);
    setLocalSettings({
      ...localSettings,
      agents: newAgents,
      activeAgentId: localSettings.activeAgentId === agentId 
        ? BUILTIN_AGENT_ID
        : localSettings.activeAgentId
    });
  };

  // === 品牌词和规则 ===
  const handleAddBrandTerm = () => {
    if (!newTermWrong.trim() || !newTermCorrect.trim()) return;

    const newTerm: BrandTerm = {
      id: generateId(),
      wrong: newTermWrong.trim(),
      correct: newTermCorrect.trim(),
      enabled: true
    };

    setLocalSettings({
      ...localSettings,
      globalBrandTerms: [...localSettings.globalBrandTerms, newTerm]
    });

    setNewTermWrong('');
    setNewTermCorrect('');
  };

  const handleRemoveBrandTerm = (termId: string) => {
    setLocalSettings({
      ...localSettings,
      globalBrandTerms: localSettings.globalBrandTerms.filter(t => t.id !== termId)
    });
  };

  const handleAddRule = () => {
    if (!newRuleContent.trim()) return;

    const newRule: OptimizationRule = {
      id: generateId(),
      content: newRuleContent.trim(),
      enabled: true
    };

    setLocalSettings({
      ...localSettings,
      globalRules: [...localSettings.globalRules, newRule]
    });

    setNewRuleContent('');
  };

  const handleRemoveRule = (ruleId: string) => {
    setLocalSettings({
      ...localSettings,
      globalRules: localSettings.globalRules.filter(r => r.id !== ruleId)
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setLocalSettings({
      ...localSettings,
      globalRules: localSettings.globalRules.map(r =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      )
    });
  };

  // 渲染主设置页
  const renderMainSettings = () => (
    <>
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>
        <h2>设置</h2>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          保存
        </button>
      </div>

      <div className="settings-content">
        {/* AI 模型配置 */}
        <div className="settings-section">
          <div className="section-header">
            <h3>AI 模型</h3>
            <button className="btn btn-sm btn-secondary" onClick={handleCreateModel}>
              + 新建
            </button>
          </div>
          <p className="hint">配置 API Key 后才能使用优化功能</p>

          {localSettings.savedModels.length === 0 ? (
            <div className="empty-hint">
              还没有配置模型，点击"新建"添加一个
            </div>
          ) : (
            <div className="agent-list">
              {localSettings.savedModels.map(model => {
                const modelOption = MODEL_OPTIONS.find(m => m.provider === model.provider && m.model === model.model);
                const isCustom = model.provider === 'compatible';
                const displayName = isCustom ? (model.customModel || '自定义模型') : (modelOption?.name || model.model);
                const displayDesc = isCustom ? (model.baseUrl || '自定义 API') : (modelOption?.description || model.provider);
                
                return (
                  <div 
                    key={model.id} 
                    className={`agent-item ${localSettings.activeModelId === model.id ? 'active' : ''}`}
                  >
                    <div 
                      className="agent-info"
                      onClick={() => setLocalSettings({ ...localSettings, activeModelId: model.id })}
                    >
                      <div className="agent-name">{displayName}</div>
                      <div className="agent-desc">{displayDesc}</div>
                    </div>
                    <div className="agent-actions">
                      <button 
                        className="icon-btn"
                        onClick={() => handleEditModel(model)}
                        title="编辑"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                        </svg>
                      </button>
                      <button 
                        className="icon-btn danger"
                        onClick={() => handleDeleteModel(model.id)}
                        title="删除"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Agent 管理 */}
        <div className="settings-section">
          <div className="section-header">
            <h3>优化 Agent</h3>
            <button className="btn btn-sm btn-secondary" onClick={handleCreateAgent}>
              + 新建
            </button>
          </div>
          <p className="hint">Agent 定义优化风格和提示词，点击选中激活</p>

          <div className="agent-list">
            {localSettings.agents.map(agent => (
              <div 
                key={agent.id} 
                className={`agent-item ${localSettings.activeAgentId === agent.id ? 'active' : ''}`}
              >
                <div 
                  className="agent-info"
                  onClick={() => setLocalSettings({ ...localSettings, activeAgentId: agent.id })}
                >
                  <div className="agent-name">
                    {agent.isBuiltin && <span className="builtin-badge">内置</span>}
                    {agent.name}
                  </div>
                  <div className="agent-desc">{agent.description}</div>
                </div>
                <div className="agent-actions">
                  <button 
                    className="icon-btn"
                    onClick={() => handleEditAgent(agent)}
                    title="编辑"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                    </svg>
                  </button>
                  {!agent.isBuiltin && (
                    <button 
                      className="icon-btn danger"
                      onClick={() => handleDeleteAgent(agent.id)}
                      title="删除"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 全局品牌词库 */}
        <div className="settings-section">
          <div className="section-header">
            <h3>全局品牌词库</h3>
          </div>

          <div className="term-list">
            {localSettings.globalBrandTerms.map(term => (
              <div key={term.id} className="term-item">
                <span className="term-wrong">{term.wrong}</span>
                <span className="term-arrow">→</span>
                <span className="term-correct">{term.correct}</span>
                <button 
                  className="icon-btn danger"
                  onClick={() => handleRemoveBrandTerm(term.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="add-term-form">
            <input
              type="text"
              placeholder="错误写法"
              value={newTermWrong}
              onChange={(e) => setNewTermWrong(e.target.value)}
            />
            <span>→</span>
            <input
              type="text"
              placeholder="正确写法"
              value={newTermCorrect}
              onChange={(e) => setNewTermCorrect(e.target.value)}
            />
            <button 
              className="btn btn-sm btn-secondary"
              onClick={handleAddBrandTerm}
            >
              添加
            </button>
          </div>
        </div>

        {/* 全局优化规则 */}
        <div className="settings-section">
          <div className="section-header">
            <h3>全局优化规则</h3>
          </div>

          <div className="rule-list">
            {localSettings.globalRules.map(rule => (
              <div key={rule.id} className="rule-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggleRule(rule.id)}
                  />
                  <span>{rule.content}</span>
                </label>
                <button 
                  className="icon-btn danger"
                  onClick={() => handleRemoveRule(rule.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="add-rule-form">
            <input
              type="text"
              placeholder="输入规则内容，如：按钮文案不超过6个字"
              value={newRuleContent}
              onChange={(e) => setNewRuleContent(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRule()}
            />
            <button 
              className="btn btn-sm btn-secondary"
              onClick={handleAddRule}
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // 渲染模型编辑页
  const renderModelEdit = () => {
    if (!editingModel) return null;

    const isCustomProvider = editingModel.provider === 'compatible';
    const modelOption = MODEL_OPTIONS.find(m => m.provider === editingModel.provider && m.model === editingModel.model);

    return (
      <>
        <div className="settings-header">
          <button className="back-btn" onClick={() => {
            setEditingModel(null);
            setView('main');
            setTestResult(null);
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
          </button>
          <h2>{editingModel.createdAt ? '编辑模型' : '新建模型'}</h2>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleSaveModel}
            disabled={!editingModel.apiKey || (isCustomProvider && !editingModel.baseUrl)}
          >
            保存
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>模型配置</h3>

            <div className="form-group">
              <label>选择模型</label>
              <select
                value={`${editingModel.provider}:${editingModel.model}`}
                onChange={(e) => {
                  const [provider, model] = e.target.value.split(':');
                  setEditingModel({
                    ...editingModel,
                    provider: provider as AIModelProvider,
                    model,
                    // 切换到非自定义模型时清空自定义字段
                    baseUrl: provider === 'compatible' ? editingModel.baseUrl : '',
                    customModel: provider === 'compatible' ? editingModel.customModel : ''
                  });
                }}
              >
                {MODEL_OPTIONS.map(opt => (
                  <option key={`${opt.provider}:${opt.model}`} value={`${opt.provider}:${opt.model}`}>
                    {opt.name} - {opt.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>API Key *</label>
              <input
                type="password"
                value={editingModel.apiKey}
                onChange={(e) => setEditingModel({ ...editingModel, apiKey: e.target.value })}
                placeholder="输入你的 API Key"
              />
            </div>

            {/* 只有自定义/兼容模型才显示这些配置 */}
            {isCustomProvider && (
              <>
                <div className="form-group">
                  <label>API Base URL *</label>
                  <input
                    type="text"
                    value={editingModel.baseUrl || ''}
                    onChange={(e) => setEditingModel({ ...editingModel, baseUrl: e.target.value })}
                    placeholder="如: https://api.modelverse.cn/v1"
                  />
                </div>

                <div className="form-group">
                  <label>模型名称 *</label>
                  <input
                    type="text"
                    value={editingModel.customModel || ''}
                    onChange={(e) => setEditingModel({ ...editingModel, customModel: e.target.value })}
                    placeholder="输入平台支持的模型名称"
                  />
                  <p className="hint">UCloud ModelVerse 示例: anthropic/claude-opus-4-1-20250805</p>
                </div>
              </>
            )}

            <button 
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={isTesting || !editingModel.apiKey || (isCustomProvider && !editingModel.baseUrl)}
            >
              {isTesting ? '测试中...' : '测试连接'}
            </button>

            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // 渲染 Agent 编辑页
  const renderAgentEdit = () => {
    if (!editingAgent) return null;

    return (
      <>
        <div className="settings-header">
          <button className="back-btn" onClick={() => {
            setEditingAgent(null);
            setView('main');
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
          </button>
          <h2>{editingAgent.isBuiltin ? '编辑内置 Agent' : (editingAgent.createdAt ? '编辑 Agent' : '新建 Agent')}</h2>
          <button className="btn btn-primary btn-sm" onClick={handleSaveAgent}>
            保存
          </button>
        </div>

        <div className="settings-content">
          {/* 基本信息 */}
          <div className="settings-section">
            <h3>基本信息</h3>
            
            <div className="form-group">
              <label>Agent 名称</label>
              <input
                type="text"
                value={editingAgent.name}
                onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                placeholder="如：品牌A专属助手"
                disabled={editingAgent.isBuiltin}
              />
            </div>

            <div className="form-group">
              <label>描述</label>
              <input
                type="text"
                value={editingAgent.description}
                onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                placeholder="简单描述这个 Agent 的用途"
              />
            </div>
          </div>

          {/* 自定义 System Prompt */}
          <div className="settings-section">
            <div className="section-header">
              <h3>自定义 System Prompt</h3>
              <div className="prompt-actions">
                <input
                  type="file"
                  id="prompt-file-input"
                  accept=".md,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        setEditingAgent({ ...editingAgent, systemPrompt: content });
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => document.getElementById('prompt-file-input')?.click()}
                >
                  导入文档
                </button>
                {editingAgent.systemPrompt && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setEditingAgent({ ...editingAgent, systemPrompt: '' })}
                  >
                    清空
                  </button>
                )}
              </div>
            </div>
            <p className="hint">定义 AI 的角色和优化风格。支持直接输入或导入 .md/.txt 文件</p>
            
            <div className="form-group">
              <textarea
                value={editingAgent.systemPrompt}
                onChange={(e) => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                placeholder="你是一个专业的 UI 文案优化专家..."
                rows={10}
              />
              {editingAgent.systemPrompt && (
                <div className="prompt-stats">
                  {editingAgent.systemPrompt.length} 字符
                </div>
              )}
            </div>
          </div>

          {/* Agent 专属品牌词 */}
          <div className="settings-section">
            <h3>Agent 专属品牌词（可选）</h3>
            <p className="hint">仅此 Agent 使用的品牌词，会与全局品牌词合并</p>

            <div className="term-list">
              {editingAgent.brandTerms.map(term => (
                <div key={term.id} className="term-item">
                  <span className="term-wrong">{term.wrong}</span>
                  <span className="term-arrow">→</span>
                  <span className="term-correct">{term.correct}</span>
                  <button 
                    className="icon-btn danger"
                    onClick={() => setEditingAgent({
                      ...editingAgent,
                      brandTerms: editingAgent.brandTerms.filter(t => t.id !== term.id)
                    })}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="add-term-form">
              <input type="text" placeholder="错误写法" id="agent-term-wrong" />
              <span>→</span>
              <input type="text" placeholder="正确写法" id="agent-term-correct" />
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  const wrongInput = document.getElementById('agent-term-wrong') as HTMLInputElement;
                  const correctInput = document.getElementById('agent-term-correct') as HTMLInputElement;
                  if (wrongInput.value && correctInput.value) {
                    setEditingAgent({
                      ...editingAgent,
                      brandTerms: [...editingAgent.brandTerms, {
                        id: generateId(),
                        wrong: wrongInput.value,
                        correct: correctInput.value,
                        enabled: true
                      }]
                    });
                    wrongInput.value = '';
                    correctInput.value = '';
                  }
                }}
              >
                添加
              </button>
            </div>
          </div>

          {/* Agent 专属规则 */}
          <div className="settings-section">
            <h3>Agent 专属规则（可选）</h3>
            <p className="hint">仅此 Agent 使用的规则，会与全局规则合并</p>

            <div className="rule-list">
              {editingAgent.rules.map(rule => (
                <div key={rule.id} className="rule-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => setEditingAgent({
                        ...editingAgent,
                        rules: editingAgent.rules.map(r =>
                          r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                        )
                      })}
                    />
                    <span>{rule.content}</span>
                  </label>
                  <button 
                    className="icon-btn danger"
                    onClick={() => setEditingAgent({
                      ...editingAgent,
                      rules: editingAgent.rules.filter(r => r.id !== rule.id)
                    })}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="add-rule-form">
              <input
                type="text"
                placeholder="输入规则内容"
                id="agent-rule-content"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value) {
                      setEditingAgent({
                        ...editingAgent,
                        rules: [...editingAgent.rules, {
                          id: generateId(),
                          content: input.value,
                          enabled: true
                        }]
                      });
                      input.value = '';
                    }
                  }
                }}
              />
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  const input = document.getElementById('agent-rule-content') as HTMLInputElement;
                  if (input.value) {
                    setEditingAgent({
                      ...editingAgent,
                      rules: [...editingAgent.rules, {
                        id: generateId(),
                        content: input.value,
                        enabled: true
                      }]
                    });
                    input.value = '';
                  }
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="settings-page">
      {view === 'main' && renderMainSettings()}
      {view === 'model-edit' && renderModelEdit()}
      {view === 'agent-edit' && renderAgentEdit()}
    </div>
  );
};

export default Settings;
