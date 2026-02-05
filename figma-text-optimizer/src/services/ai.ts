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
  // OpenAI
  { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o', description: '最新最强，推荐使用' },
  { provider: 'openai', model: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '性价比高，速度快' },
  { provider: 'openai', model: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '强大稳定' },
  // Claude
  { provider: 'claude', model: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '最新版本，能力强' },
  { provider: 'claude', model: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: '最强推理能力' },
  { provider: 'claude', model: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: '快速响应' },
  // Gemini
  { provider: 'gemini', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '长上下文支持' },
  { provider: 'gemini', model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '快速高效' },
  // 兼容模型
  { provider: 'compatible', model: 'custom', name: '自定义模型', description: '支持 OpenAI 兼容 API' },
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
  const defaultSystemPrompt = `你是一个专业的 UI 文案优化专家，擅长优化各类界面文案，使其更加专业、清晰、用户友好。

${CATEGORY_PROMPTS[category]}

上下文场景：${context}${brandTermsText}${rulesText}

重要要求：
1. 保持原意，只优化表达方式
2. 符合中文互联网产品的文案风格
3. 遵循品牌用语规范
4. 只返回优化后的文案，不要任何解释或额外内容`;

  const systemPrompt = customSystemPrompt || defaultSystemPrompt;

  const userPrompt = `请优化以下文案：\n\n${text}`;

  return { systemPrompt, userPrompt };
}

/**
 * 调用 OpenAI API
 */
async function callOpenAI(
  config: AIModelConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API 调用失败');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

/**
 * 调用 Claude API
 */
async function callClaude(
  config: AIModelConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
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
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API 调用失败');
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

/**
 * 调用 Gemini API
 */
async function callGemini(
  config: AIModelConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  
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
