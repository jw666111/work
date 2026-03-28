import { 
  PluginSettings, 
  HistoryRecord, 
  AgentConfig, 
  BrandTerm, 
  OptimizationRule,
  SavedModelConfig,
  AIModelConfig
} from '../types';

// 存储键名
const STORAGE_KEYS = {
  SETTINGS: 'figma-text-optimizer-settings',
  HISTORY: 'figma-text-optimizer-history'
};

// 内置 Agent ID
export const BUILTIN_AGENT_ID = 'builtin-default-optimizer';

// 内置默认 Agent - 通用文案优化助手
const BUILTIN_DEFAULT_AGENT: AgentConfig = {
  id: BUILTIN_AGENT_ID,
  name: '通用文案优化助手',
  description: '适用于各类 UI 文案的智能优化',
  systemPrompt: `你是一个专业的 UI/UX 文案优化专家，专注于中文互联网产品的文案优化。

## 你的专业能力
1. 熟悉各类 UI 组件的文案特点（按钮、标题、描述、提示等）
2. 了解用户心理和交互设计原则
3. 掌握简洁、清晰、有说服力的文案技巧

## 优化原则
- **简洁明了**：去除冗余词汇，保持信息密度
- **用户视角**：使用用户熟悉的语言，避免技术黑话
- **行动导向**：按钮和 CTA 要有明确的行动指引
- **情感共鸣**：适当使用能引起用户共鸣的表达
- **一致性**：保持品牌调性和术语的一致性`,
  brandTerms: [],
  rules: [],
  isBuiltin: true,
  createdAt: 0,
  updatedAt: 0
};

// 默认设置
export const DEFAULT_SETTINGS: PluginSettings = {
  activeAgentId: BUILTIN_AGENT_ID,
  agents: [BUILTIN_DEFAULT_AGENT],
  activeModelId: null,
  savedModels: [],
  globalBrandTerms: [],
  globalRules: [],
  historyLimit: 100
};

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建新的自定义 Agent
 */
export function createDefaultAgent(): AgentConfig {
  return {
    id: generateId(),
    name: '新建 Agent',
    description: '',
    systemPrompt: '',
    brandTerms: [],
    rules: [],
    isBuiltin: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * 获取内置 Agent（确保始终存在）
 */
export function getBuiltinAgent(): AgentConfig {
  return { ...BUILTIN_DEFAULT_AGENT };
}

/**
 * 存储管理类 - 用于 UI 层
 */
export class StorageManager {
  private settings: PluginSettings = DEFAULT_SETTINGS;
  private history: HistoryRecord[] = [];
  private listeners: Set<() => void> = new Set();

  /**
   * 初始化 - 从 Plugin Code 获取数据
   */
  async initialize(): Promise<void> {
    return new Promise((resolve) => {
      // 请求设置
      parent.postMessage({ pluginMessage: { type: 'get-settings' } }, '*');
      parent.postMessage({ pluginMessage: { type: 'get-history' } }, '*');
      
      // 等待响应
      const handler = (event: MessageEvent) => {
        const msg = event.data.pluginMessage;
        if (!msg) return;
        
        if (msg.type === 'settings-loaded') {
          // 合并默认设置，确保旧数据兼容
          const loadedSettings = msg.payload.settings || {};
          
          // 迁移旧版本的 modelConfig 到新的 savedModels 结构
          let savedModels = loadedSettings.savedModels || [];
          let activeModelId = loadedSettings.activeModelId || null;
          
          if (loadedSettings.modelConfig?.apiKey && savedModels.length === 0) {
            // 旧版本数据迁移
            const migratedModel: SavedModelConfig = {
              id: 'migrated-' + Date.now(),
              name: '迁移的模型配置',
              provider: loadedSettings.modelConfig.provider || 'openai',
              model: loadedSettings.modelConfig.model || 'gpt-4o-mini',
              apiKey: loadedSettings.modelConfig.apiKey,
              baseUrl: loadedSettings.modelConfig.baseUrl,
              customModel: loadedSettings.modelConfig.customModel,
              createdAt: Date.now()
            };
            savedModels = [migratedModel];
            activeModelId = migratedModel.id;
          }
          
          this.settings = {
            ...DEFAULT_SETTINGS,
            ...loadedSettings,
            savedModels,
            activeModelId,
            agents: loadedSettings.agents?.length > 0 
              ? loadedSettings.agents 
              : DEFAULT_SETTINGS.agents
          };
        }
        if (msg.type === 'history-loaded') {
          this.history = msg.payload.history;
          window.removeEventListener('message', handler);
          this.notifyListeners();
          resolve();
        }
      };
      
      window.addEventListener('message', handler);
    });
  }

  /**
   * 获取设置
   */
  getSettings(): PluginSettings {
    return this.settings;
  }

  /**
   * 保存设置
   */
  async saveSettings(settings: PluginSettings): Promise<void> {
    this.settings = settings;
    parent.postMessage({ 
      pluginMessage: { 
        type: 'save-settings', 
        payload: { settings } 
      } 
    }, '*');
    this.notifyListeners();
  }

  /**
   * 获取当前激活的 Agent
   */
  getActiveAgent(): AgentConfig | null {
    if (!this.settings.activeAgentId) return null;
    return this.settings.agents.find(a => a.id === this.settings.activeAgentId) || null;
  }

  /**
   * 获取当前激活的模型配置
   */
  getActiveModel(): SavedModelConfig | null {
    if (!this.settings.activeModelId) return null;
    return this.settings.savedModels?.find(m => m.id === this.settings.activeModelId) || null;
  }

  /**
   * 获取模型配置（用于 API 调用）
   */
  getModelConfig(): AIModelConfig | null {
    const activeModel = this.getActiveModel();
    if (!activeModel) return null;
    
    return {
      provider: activeModel.provider,
      model: activeModel.model,
      apiKey: activeModel.apiKey,
      baseUrl: activeModel.baseUrl,
      customModel: activeModel.customModel
    };
  }

  /**
   * 检查模型是否已配置
   */
  isModelConfigured(): boolean {
    const activeModel = this.getActiveModel();
    return !!activeModel?.apiKey;
  }

  /**
   * 设置激活的 Agent
   */
  async setActiveAgent(agentId: string | null): Promise<void> {
    this.settings.activeAgentId = agentId;
    await this.saveSettings(this.settings);
  }

  /**
   * 添加 Agent
   */
  async addAgent(agent: AgentConfig): Promise<void> {
    this.settings.agents.push(agent);
    await this.saveSettings(this.settings);
  }

  /**
   * 更新 Agent
   */
  async updateAgent(agent: AgentConfig): Promise<void> {
    const index = this.settings.agents.findIndex(a => a.id === agent.id);
    if (index !== -1) {
      agent.updatedAt = Date.now();
      this.settings.agents[index] = agent;
      await this.saveSettings(this.settings);
    }
  }

  /**
   * 删除 Agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    this.settings.agents = this.settings.agents.filter(a => a.id !== agentId);
    if (this.settings.activeAgentId === agentId) {
      this.settings.activeAgentId = null;
    }
    await this.saveSettings(this.settings);
  }

  /**
   * 获取历史记录
   */
  getHistory(): HistoryRecord[] {
    return this.history;
  }

  /**
   * 添加历史记录
   */
  async addHistory(record: HistoryRecord): Promise<void> {
    this.history.unshift(record);
    if (this.history.length > this.settings.historyLimit) {
      this.history = this.history.slice(0, this.settings.historyLimit);
    }
    this.notifyListeners();
  }

  /**
   * 清空历史记录
   */
  async clearHistory(): Promise<void> {
    this.history = [];
    parent.postMessage({ pluginMessage: { type: 'clear-history' } }, '*');
    this.notifyListeners();
  }

  /**
   * 添加全局品牌词条
   */
  async addGlobalBrandTerm(term: BrandTerm): Promise<void> {
    this.settings.globalBrandTerms.push(term);
    await this.saveSettings(this.settings);
  }

  /**
   * 删除全局品牌词条
   */
  async removeGlobalBrandTerm(termId: string): Promise<void> {
    this.settings.globalBrandTerms = this.settings.globalBrandTerms.filter(t => t.id !== termId);
    await this.saveSettings(this.settings);
  }

  /**
   * 添加全局规则
   */
  async addGlobalRule(rule: OptimizationRule): Promise<void> {
    this.settings.globalRules.push(rule);
    await this.saveSettings(this.settings);
  }

  /**
   * 删除全局规则
   */
  async removeGlobalRule(ruleId: string): Promise<void> {
    this.settings.globalRules = this.settings.globalRules.filter(r => r.id !== ruleId);
    await this.saveSettings(this.settings);
  }

  /**
   * 订阅变化
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// 单例实例
export const storage = new StorageManager();
