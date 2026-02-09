import React from 'react';
import { TextItem, TextCategory } from '../../types';
import { ReferenceExample } from '../../services/ai';
import TextItemComponent from './TextItem';

// 对话消息类型
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 按类别存储的参考样例
type ReferencesByCategory = Partial<Record<TextCategory, ReferenceExample>>;

interface TextListProps {
  texts: TextItem[];
  optimizingId: string | null;
  onOptimize: (item: TextItem) => void;
  onApply: (item: TextItem) => void;
  onIgnore: (item: TextItem) => void;
  onEdit: (item: TextItem, newOptimized: string) => void;
  onChat?: (item: TextItem, message: string, history: ChatMessage[]) => Promise<string>;
  onSetAsReference?: (item: TextItem) => void;
  referencesByCategory?: ReferencesByCategory;
}

const TextList: React.FC<TextListProps> = ({
  texts,
  optimizingId,
  onOptimize,
  onApply,
  onIgnore,
  onEdit,
  onChat,
  onSetAsReference,
  referencesByCategory = {}
}) => {
  if (texts.length === 0) {
    return (
      <div className="empty-state">
        <p>没有找到文本</p>
      </div>
    );
  }

  return (
    <div className="text-list">
      {texts.map(text => {
        // 判断是否为参考样例：检查原文匹配，且优化结果匹配（或者原文作为参考时 optimized === characters）
        const ref = referencesByCategory[text.category];
        const isRef = !!ref && ref.original === text.characters && (
          ref.optimized === text.optimized || // 优化结果作为参考
          (ref.optimized === text.characters && !text.optimized) // 原文作为参考
        );
        
        return (
          <TextItemComponent
            key={text.id}
            item={text}
            isOptimizing={optimizingId === text.id}
            onOptimize={() => onOptimize(text)}
            onApply={() => onApply(text)}
            onIgnore={() => onIgnore(text)}
            onEdit={(newOptimized) => onEdit(text, newOptimized)}
            onChat={onChat ? (message, history) => onChat(text, message, history) : undefined}
            onSetAsReference={onSetAsReference ? () => onSetAsReference(text) : undefined}
            isReference={isRef}
          />
        );
      })}
    </div>
  );
};

export default TextList;
