import React from 'react';
import { TextItem } from '../../types';
import TextItemComponent from './TextItem';

interface TextListProps {
  texts: TextItem[];
  optimizingId: string | null;
  onOptimize: (item: TextItem) => void;
  onApply: (item: TextItem) => void;
  onIgnore: (item: TextItem) => void;
  onEdit: (item: TextItem, newOptimized: string) => void;
}

const TextList: React.FC<TextListProps> = ({
  texts,
  optimizingId,
  onOptimize,
  onApply,
  onIgnore,
  onEdit
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
      {texts.map(text => (
        <TextItemComponent
          key={text.id}
          item={text}
          isOptimizing={optimizingId === text.id}
          onOptimize={() => onOptimize(text)}
          onApply={() => onApply(text)}
          onIgnore={() => onIgnore(text)}
          onEdit={(newOptimized) => onEdit(text, newOptimized)}
        />
      ))}
    </div>
  );
};

export default TextList;
