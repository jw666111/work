import { 
  PluginSettings, 
  HistoryRecord, 
  AgentConfig, 
  BrandTerm, 
  OptimizationRule 
} from '../types';

// 存储键名
const STORAGE_KEYS = {
  SETTINGS: 'figma-text-optimizer-settings',
  HISTORY: 'figma-text-optimizer-history'
};

// 默认设置
export const DEFAULT_SETTINGS: PluginSettings = {
  activeAgentId: null,
  agents: [],
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
 * 创建默认 Agent
 */
export function createDefaultAgent(): AgentConfig {
  return {
    id: generateId(),
    name: '默认优化助手',
    description: '通用文案优化 Agent',
    systemPrompt: '',
    modelConfig: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: ''
    },
    brandTerms: [],
    rules: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
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
          this.settings = msg.payload.settings;
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
