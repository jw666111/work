import { 
  AIModelConfig, 
  AIModelProvider, 
  TextCategory, 
  BrandTerm, 
  OptimizationRule,
  ModelOption 
} from '../types';

// 预设的模型选项
export const MODEL_OPTIONS: ModelOption[] = [
  // OpenAI - 最新模型
  { provider: 'openai', model: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', description: '最新预览版，能力最强' },
  { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰模型' },
  { provider: 'openai', model: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '性价比高，速度快' },
  { provider: 'openai', model: 'o1', name: 'o1', description: '深度推理模型' },
  { provider: 'openai', model: 'o1-mini', name: 'o1 Mini', description: '轻量推理模型' },
  // Claude - 最新模型
  { provider: 'claude', model: 'claude-opus-4-5', name: 'Claude Opus 4.5', description: '最强旗舰，顶级能力' },
  { provider: 'claude', model: 'claude-opus-4', name: 'Claude Opus 4', description: '旗舰模型，能力强' },
  { provider: 'claude', model: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: '平衡性能与速度' },
  { provider: 'claude', model: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '稳定可靠' },
  { provider: 'claude', model: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: '快速响应' },
  // Gemini - 最新模型
  { provider: 'gemini', model: 'gemini-3-pro', name: 'Gemini 3 Pro', description: '最新旗舰，能力最强' },
  { provider: 'gemini', model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '快速高效' },
  { provider: 'gemini', model: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: '轻量版本' },
  { provider: 'gemini', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '长上下文支持' },
  { provider: 'gemini', model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '稳定快速' },
  // 兼容模型
  { provider: 'compatible', model: 'custom', name: '自定义模型', description: '支持 OpenAI 兼容 API（Ollama/DeepSeek 等）' },
];

// 文本类型的优化提示
const CATEGORY_PROMPTS: Record<TextCategory, string> = {
  button: '这是一个按钮文案。要求：简短有力，最好以动词开头，不超过8个字。',
  title: '这是一个标题文案。要求：清晰准确，突出核心信息，吸引注意力。',
  description: '这是一个描述/说明文案。要求：通俗易懂，站在用户视角，简洁明了。',
  placeholder: '这是一个输入框占位符。要求：简洁引导，如"请输入..."格式，帮助用户理解输入内容。',
  feedback: '这是一个反馈/提示文案。要求：友好、有帮助、提供可操作的建议。',
  label: '这是一个标签/表单项名称。要求：简洁准确，使用名词形式。',
  link: '这是一个链接/导航文案。要求：明确指向，使用动宾结构，让用户知道点击后会发生什么。',
  general: '这是一个通用界面文案。要求：简洁清晰，符合界面设计规范。'
};

/**
 * 构建优化 Prompt
 */
function buildPrompt(
  text: string,
  category: TextCategory,
  context: string,
  brandTerms: BrandTerm[],
  rules: OptimizationRule[],
  customSystemPrompt?: string
): { systemPrompt: string; userPrompt: string } {
  // 构建品牌词库说明
  const enabledTerms = brandTerms.filter(t => t.enabled);
  const brandTermsText = enabledTerms.length > 0
    ? `\n\n品牌词库规范：\n${enabledTerms.map(t => `- "${t.wrong}" 应写为 "${t.correct}"`).join('\n')}`
    : '';

  // 构建自定义规则说明
  const enabledRules = rules.filter(r => r.enabled && (!r.category || r.category === category));
  const rulesText = enabledRules.length > 0
    ? `\n\n额外优化规则：\n${enabledRules.map(r => `- ${r.content}`).join('\n')}`
    : '';

  // 系统提示
  const defaultSystemPrompt = `你是一个专业的 UI 文案优化专家。你的任务是直接输出优化后的文案。

当前任务信息：
- 文本类型：${category}（${CATEGORY_PROMPTS[category]}）
- 上下文场景：${context}${brandTermsText}${rulesText}

【重要规则 - 必须遵守】
1. 直接输出优化后的文案文本，不要有任何其他内容
2. 不要提问、不要解释、不要说明理由
3. 不要输出"优化后："或类似前缀
4. 如果原文已经很好，可以输出相同或略微优化的版本
5. 保持原意，符合中文互联网产品风格`;

  const systemPrompt = customSystemPrompt || defaultSystemPrompt;

  const userPrompt = `原文案：${text}

请直接输出优化后的文案（只输出文案本身，不要任何其他内容）：`;

  return { systemPrompt, userPrompt };
}

/**
 * 调用 OpenAI 兼容 API
 * 支持 OpenAI 官方、UCloud ModelVerse、DeepSeek 等兼容平台
 */
async function callOpenAI(
  config: AIModelConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  // 优先使用自定义模型名称，否则使用预设模型
  const modelName = config.customModel || config.model;
  
  // 确保 URL 格式正确
  const apiUrl = baseUrl.endsWith('/') 
    ? `${baseUrl}chat/completions`
    : `${baseUrl}/chat/completions`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API 调用失败 (${response.status})`;
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.error?.message || error.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * 调用 Claude API
 * 支持官方 API 和第三方平台（如 UCloud ModelVerse）
 */
async function callClaude(
  config: AIModelConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.anthropic.com';
  const apiPath = baseUrl.includes('/v1') ? '/messages' : '/v1/messages';
  
  const response = await fetch(`${baseUrl}${apiPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Claude API 调用失败 (${response.status})`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

/**
 * 调用 Gemini API
 * 支持官方 API 和第三方平台
 */
async function callGemini(
  config: AIModelConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com';
  const url = `${baseUrl}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        parts: [{ text: userPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API 调用失败');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

/**
 * 优化文本
 */
export async function optimizeText(
  text: string,
  category: TextCategory,
  context: string,
  modelConfig: AIModelConfig,
  brandTerms: BrandTerm[] = [],
  rules: OptimizationRule[] = [],
  customSystemPrompt?: string
): Promise<string> {
  const { systemPrompt, userPrompt } = buildPrompt(
    text, 
    category, 
    context, 
    brandTerms, 
    rules,
    customSystemPrompt
  );

  switch (modelConfig.provider) {
    case 'openai':
      return callOpenAI(modelConfig, systemPrompt, userPrompt);
    
    case 'claude':
      return callClaude(modelConfig, systemPrompt, userPrompt);
    
    case 'gemini':
      return callGemini(modelConfig, systemPrompt, userPrompt);
    
    case 'compatible':
      // 兼容模型使用 OpenAI 格式
      return callOpenAI(modelConfig, systemPrompt, userPrompt);
    
    default:
      throw new Error(`不支持的模型提供商: ${modelConfig.provider}`);
  }
}

/**
 * 测试 API 连接
 */
export async function testConnection(config: AIModelConfig): Promise<{ success: boolean; message: string }> {
  try {
    const result = await optimizeText(
      '测试',
      'general',
      '连接测试',
      config,
      [],
      []
    );
    
    return {
      success: true,
      message: `连接成功！响应: "${result}"`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '连接失败'
    };
  }
}

/**
 * 批量优化文本
 */
export async function batchOptimize(
  items: Array<{ text: string; category: TextCategory; context: string }>,
  modelConfig: AIModelConfig,
  brandTerms: BrandTerm[] = [],
  rules: OptimizationRule[] = [],
  customSystemPrompt?: string,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ original: string; optimized: string; error?: string }>> {
  const results: Array<{ original: string; optimized: string; error?: string }> = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      const optimized = await optimizeText(
        item.text,
        item.category,
        item.context,
        modelConfig,
        brandTerms,
        rules,
        customSystemPrompt
      );
      
      results.push({
        original: item.text,
        optimized
      });
    } catch (error) {
      results.push({
        original: item.text,
        optimized: item.text,
        error: error instanceof Error ? error.message : '优化失败'
      });
    }
    
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
    
    // 添加延迟避免速率限制
    if (i < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}
