import { TextCategory } from '../types';

// 分类规则
const CATEGORY_PATTERNS: Record<TextCategory, RegExp[]> = {
  button: [
    /btn/i,
    /button/i,
    /cta/i,
    /action/i,
    /submit/i,
    /cancel/i,
    /confirm/i
  ],
  title: [
    /title/i,
    /header/i,
    /heading/i,
    /headline/i,
    /^h[1-6]$/i
  ],
  description: [
    /desc/i,
    /description/i,
    /subtitle/i,
    /tip/i,
    /hint/i,
    /caption/i,
    /detail/i
  ],
  placeholder: [
    /placeholder/i,
    /input/i,
    /search/i,
    /field/i,
    /textarea/i
  ],
  feedback: [
    /toast/i,
    /error/i,
    /success/i,
    /warning/i,
    /alert/i,
    /message/i,
    /notification/i,
    /snackbar/i
  ],
  label: [
    /label/i,
    /form/i,
    /field-label/i,
    /input-label/i
  ],
  link: [
    /link/i,
    /nav/i,
    /menu/i,
    /navigation/i,
    /anchor/i,
    /breadcrumb/i
  ],
  general: []
};

// 文本内容特征识别
const TEXT_CONTENT_PATTERNS: Partial<Record<TextCategory, RegExp[]>> = {
  button: [
    /^(确定|取消|提交|保存|删除|编辑|新增|添加|创建|返回|下一步|上一步|完成|开始|继续|了解更多|立即|马上)$/,
    /^(OK|Cancel|Submit|Save|Delete|Edit|Add|Create|Back|Next|Done|Start|Continue)$/i
  ],
  placeholder: [
    /^请输入/,
    /^请选择/,
    /^搜索/,
    /^输入.*关键/
  ],
  feedback: [
    /成功|失败|错误|警告|提示|注意/,
    /已保存|已删除|已更新|已发送/
  ]
};

// 分类描述
export const CATEGORY_DESCRIPTIONS: Record<TextCategory, string> = {
  button: '按钮',
  title: '标题',
  description: '描述',
  placeholder: '占位符',
  feedback: '反馈提示',
  label: '标签',
  link: '链接',
  general: '通用'
};

// 分类颜色（用于 UI 显示）
export const CATEGORY_COLORS: Record<TextCategory, string> = {
  button: '#1a73e8',
  title: '#9c27b0',
  description: '#00897b',
  placeholder: '#ff9800',
  feedback: '#f44336',
  label: '#607d8b',
  link: '#3f51b5',
  general: '#9e9e9e'
};

/**
 * 根据上下文名称分类
 */
function classifyByContext(contextNames: string[]): TextCategory | null {
  const combinedContext = contextNames.join(' ').toLowerCase();
  
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (category === 'general') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(combinedContext)) {
        return category as TextCategory;
      }
    }
  }
  
  return null;
}

/**
 * 根据文本内容分类
 */
function classifyByContent(text: string): TextCategory | null {
  for (const [category, patterns] of Object.entries(TEXT_CONTENT_PATTERNS)) {
    for (const pattern of patterns || []) {
      if (pattern.test(text)) {
        return category as TextCategory;
      }
    }
  }
  
  return null;
}

/**
 * 根据字体大小猜测分类
 */
function classifyByFontSize(fontSize: number | symbol): TextCategory | null {
  if (typeof fontSize !== 'number') return null;
  
  if (fontSize >= 24) return 'title';
  if (fontSize <= 12) return 'description';
  
  return null;
}

/**
 * 综合分类文本
 */
export function classifyText(
  text: string,
  contextNames: string[],
  fontSize?: number | symbol
): TextCategory {
  // 1. 优先根据上下文分类
  const contextCategory = classifyByContext(contextNames);
  if (contextCategory) return contextCategory;
  
  // 2. 根据文本内容分类
  const contentCategory = classifyByContent(text);
  if (contentCategory) return contentCategory;
  
  // 3. 根据字体大小猜测
  if (fontSize !== undefined) {
    const fontSizeCategory = classifyByFontSize(fontSize);
    if (fontSizeCategory) return fontSizeCategory;
  }
  
  // 4. 默认分类
  return 'general';
}

/**
 * 获取分类的优化建议
 */
export function getCategoryTips(category: TextCategory): string[] {
  const tips: Record<TextCategory, string[]> = {
    button: [
      '使用动词开头，如"立即购买"',
      '控制在 2-6 个字以内',
      '避免使用"点击"等冗余词汇',
      '使用积极的行动词汇'
    ],
    title: [
      '突出核心信息',
      '避免过长，控制在 15 字以内',
      '使用吸引眼球的关键词',
      '保持简洁有力'
    ],
    description: [
      '使用通俗易懂的语言',
      '站在用户角度描述',
      '避免专业术语',
      '提供有价值的信息'
    ],
    placeholder: [
      '使用"请输入..."格式',
      '给出输入示例',
      '说明输入格式要求',
      '保持简短'
    ],
    feedback: [
      '说明发生了什么',
      '告诉用户下一步怎么做',
      '使用友好的语气',
      '避免技术性错误码'
    ],
    label: [
      '使用名词形式',
      '简洁准确',
      '避免缩写',
      '保持一致性'
    ],
    link: [
      '使用动宾结构',
      '明确指向目标',
      '避免"点击这里"',
      '让用户知道会发生什么'
    ],
    general: [
      '保持简洁清晰',
      '使用用户熟悉的词汇',
      '避免歧义',
      '注意语气一致性'
    ]
  };
  
  return tips[category];
}
