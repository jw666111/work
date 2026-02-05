// 文本分类类型
export type TextCategory = 
  | 'button'
  | 'title'
  | 'description'
  | 'placeholder'
  | 'feedback'
  | 'label'
  | 'link'
  | 'general';

// 文本项接口
export interface TextItem {
  id: string;           // Figma 节点 ID
  name: string;         // 节点名称
  characters: string;   // 原始文本内容
  context: string;      // 上下文（父节点名称）
  category: TextCategory; // 分类结果
  fontSize: number | symbol;
  position: { x: number; y: number };
  optimized?: string;   // 优化后的文本
  isApplied?: boolean;  // 是否已应用
}

// 历史记录接口
export interface HistoryRecord {
  id: string;
  nodeId: string;
  nodeName: string;
  original: string;
  optimized: string;
  category: TextCategory;
  timestamp: number;
  applied: boolean;
}

// AI 模型类型
export type AIModelProvider = 'openai' | 'claude' | 'gemini' | 'compatible';

// AI 模型配置
export interface AIModelConfig {
  provider: AIModelProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;       // 自定义 API 地址
  customModel?: string;   // 自定义模型名称（用于第三方平台）
}

// 预设的模型选项
export interface ModelOption {
  provider: AIModelProvider;
  model: string;
  name: string;
  description: string;
}

// Agent 配置
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  modelConfig: AIModelConfig;
  brandTerms: BrandTerm[];
  rules: OptimizationRule[];
  createdAt: number;
  updatedAt: number;
}

// 品牌词条
export interface BrandTerm {
  id: string;
  wrong: string;    // 错误写法
  correct: string;  // 正确写法
  enabled: boolean;
}

// 优化规则
export interface OptimizationRule {
  id: string;
  content: string;
  category?: TextCategory; // 可选，针对特定分类
  enabled: boolean;
}

// 插件设置
export interface PluginSettings {
  activeAgentId: string | null;
  agents: AgentConfig[];
  globalBrandTerms: BrandTerm[];
  globalRules: OptimizationRule[];
  historyLimit: number;
}

// 导出格式
export type ExportFormat = 'json' | 'csv' | 'markdown';

// 导出数据
export interface ExportData {
  projectName: string;
  exportTime: string;
  totalTexts: number;
  optimizedTexts: number;
  texts: TextItem[];
}

// 消息类型 - Plugin Code <-> UI 通信
export type MessageType = 
  | 'scan-texts'
  | 'texts-scanned'
  | 'apply-optimization'
  | 'optimization-applied'
  | 'get-settings'
  | 'settings-loaded'
  | 'save-settings'
  | 'settings-saved'
  | 'get-history'
  | 'history-loaded'
  | 'add-history'
  | 'revert-text'
  | 'text-reverted'
  | 'clear-history'
  | 'close';

// 消息接口
export interface PluginMessage {
  type: MessageType;
  payload?: any;
}
