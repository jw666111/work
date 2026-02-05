import React, { useState } from 'react';
import { 
  PluginSettings, 
  AgentConfig, 
  BrandTerm, 
  OptimizationRule,
  AIModelProvider 
} from '../../types';
import { MODEL_OPTIONS, testConnection } from '../../services/ai';
import { generateId, createDefaultAgent } from '../../services/storage';

interface SettingsProps {
  settings: PluginSettings;
  onSave: (settings: PluginSettings) => void;
  onBack: () => void;
}

type SettingsView = 'main' | 'agent-edit' | 'brand-terms' | 'rules';

const Settings: React.FC<SettingsProps> = ({ settings, onSave, onBack }) => {
  const [localSettings, setLocalSettings] = useState<PluginSettings>(settings);
  const [view, setView] = useState<SettingsView>('main');
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
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

  // 创建新 Agent
  const handleCreateAgent = () => {
    const newAgent = createDefaultAgent();
    setEditingAgent(newAgent);
    setView('agent-edit');
  };

  // 编辑 Agent
  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent({ ...agent });
    setView('agent-edit');
  };

  // 保存 Agent
  const handleSaveAgent = () => {
    if (!editingAgent) return;

    const agents = [...localSettings.agents];
    const existingIndex = agents.findIndex(a => a.id === editingAgent.id);

    if (existingIndex >= 0) {
      agents[existingIndex] = { ...editingAgent, updatedAt: Date.now() };
    } else {
      agents.push(editingAgent);
    }

    // 如果没有激活的 Agent，自动激活新创建的
    const newSettings = {
      ...localSettings,
      agents,
      activeAgentId: localSettings.activeAgentId || editingAgent.id
    };

    setLocalSettings(newSettings);
    setEditingAgent(null);
    setView('main');
  };

  // 删除 Agent
  const handleDeleteAgent = (agentId: string) => {
    const newAgents = localSettings.agents.filter(a => a.id !== agentId);
    setLocalSettings({
      ...localSettings,
      agents: newAgents,
      activeAgentId: localSettings.activeAgentId === agentId 
        ? (newAgents[0]?.id || null)
        : localSettings.activeAgentId
    });
  };

  // 测试连接
  const handleTestConnection = async () => {
    if (!editingAgent) return;

    setIsTesting(true);
    setTestResult(null);

    const result = await testConnection(editingAgent.modelConfig);
    setTestResult(result);
    setIsTesting(false);
  };

  // 添加全局品牌词条
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

  // 删除品牌词条
  const handleRemoveBrandTerm = (termId: string) => {
    setLocalSettings({
      ...localSettings,
      globalBrandTerms: localSettings.globalBrandTerms.filter(t => t.id !== termId)
    });
  };

  // 添加全局规则
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

  // 删除规则
  const handleRemoveRule = (ruleId: string) => {
    setLocalSettings({
      ...localSettings,
      globalRules: localSettings.globalRules.filter(r => r.id !== ruleId)
    });
  };

  // 切换规则启用状态
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
        {/* Agent 管理 */}
        <div className="settings-section">
          <div className="section-header">
            <h3>优化 Agent</h3>
            <button className="btn btn-sm btn-secondary" onClick={handleCreateAgent}>
              + 新建
            </button>
          </div>

          {localSettings.agents.length === 0 ? (
            <div className="empty-hint">
              还没有 Agent，点击"新建"创建一个
            </div>
          ) : (
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
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-model">
                      {MODEL_OPTIONS.find(m => m.model === agent.modelConfig.model)?.name || agent.modelConfig.model}
                    </div>
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
                  </div>
                </div>
              ))}
            </div>
          )}
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

  // 渲染 Agent 编辑页
  const renderAgentEdit = () => {
    if (!editingAgent) return null;

    const selectedModel = MODEL_OPTIONS.find(
      m => m.provider === editingAgent.modelConfig.provider && m.model === editingAgent.modelConfig.model
    );

    return (
      <>
        <div className="settings-header">
          <button className="back-btn" onClick={() => {
            setEditingAgent(null);
            setView('main');
            setTestResult(null);
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
            </svg>
          </button>
          <h2>{editingAgent.name ? '编辑 Agent' : '新建 Agent'}</h2>
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

          {/* AI 模型配置 */}
          <div className="settings-section">
            <h3>AI 模型配置</h3>

            <div className="form-group">
              <label>选择模型</label>
              <select
                value={`${editingAgent.modelConfig.provider}:${editingAgent.modelConfig.model}`}
                onChange={(e) => {
                  const [provider, model] = e.target.value.split(':');
                  setEditingAgent({
                    ...editingAgent,
                    modelConfig: {
                      ...editingAgent.modelConfig,
                      provider: provider as AIModelProvider,
                      model
                    }
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
              <label>API Key</label>
              <input
                type="password"
                value={editingAgent.modelConfig.apiKey}
                onChange={(e) => setEditingAgent({
                  ...editingAgent,
                  modelConfig: { ...editingAgent.modelConfig, apiKey: e.target.value }
                })}
                placeholder="输入你的 API Key"
              />
            </div>

            <div className="form-group">
              <label>API Base URL（可选，用于第三方平台）</label>
              <input
                type="text"
                value={editingAgent.modelConfig.baseUrl || ''}
                onChange={(e) => setEditingAgent({
                  ...editingAgent,
                  modelConfig: { ...editingAgent.modelConfig, baseUrl: e.target.value }
                })}
                placeholder={
                  editingAgent.modelConfig.provider === 'openai' ? '默认: https://api.openai.com/v1' :
                  editingAgent.modelConfig.provider === 'claude' ? '默认: https://api.anthropic.com' :
                  editingAgent.modelConfig.provider === 'gemini' ? '默认: https://generativelanguage.googleapis.com' :
                  '输入 API 地址，如: https://api.modelverse.cn/v1'
                }
              />
            </div>

            <div className="form-group">
              <label>自定义模型名称（可选）</label>
              <input
                type="text"
                value={editingAgent.modelConfig.customModel || ''}
                onChange={(e) => setEditingAgent({
                  ...editingAgent,
                  modelConfig: { ...editingAgent.modelConfig, customModel: e.target.value }
                })}
                placeholder="留空使用上方选择的模型，或输入平台支持的模型名称"
              />
              <p className="hint">UCloud ModelVerse 示例: anthropic/claude-opus-4-1-20250805</p>
            </div>

            <button 
              className="btn btn-secondary"
              onClick={handleTestConnection}
              disabled={isTesting || !editingAgent.modelConfig.apiKey}
            >
              {isTesting ? '测试中...' : '测试连接'}
            </button>

            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* 自定义 System Prompt */}
          <div className="settings-section">
            <h3>自定义 System Prompt（可选）</h3>
            <p className="hint">留空则使用默认提示词，填写后将完全替代默认提示词</p>
            
            <div className="form-group">
              <textarea
                value={editingAgent.systemPrompt}
                onChange={(e) => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                placeholder="你是一个专业的 UI 文案优化专家..."
                rows={6}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="settings-page">
      {view === 'main' && renderMainSettings()}
      {view === 'agent-edit' && renderAgentEdit()}
    </div>
  );
};

export default Settings;
