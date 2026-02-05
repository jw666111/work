import React, { useState } from 'react';
import { TextItem as TextItemType } from '../../types';
import { CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from '../../services/classifier';

interface TextItemProps {
  item: TextItemType;
  isOptimizing: boolean;
  onOptimize: () => void;
  onApply: () => void;
  onIgnore: () => void;
  onEdit: (newOptimized: string) => void;
}

const TextItemComponent: React.FC<TextItemProps> = ({
  item,
  isOptimizing,
  onOptimize,
  onApply,
  onIgnore,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.optimized || '');

  const handleEditSave = () => {
    onEdit(editValue);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(item.optimized || '');
    setIsEditing(false);
  };

  const categoryColor = CATEGORY_COLORS[item.category];
  const categoryName = CATEGORY_DESCRIPTIONS[item.category];

  return (
    <div className={`text-item ${item.isApplied ? 'applied' : ''}`}>
      {/* 头部：分类标签和上下文 */}
      <div className="text-item-header">
        <span 
          className="category-tag"
          style={{ backgroundColor: categoryColor }}
        >
          {categoryName}
        </span>
        <span className="context">{item.context}</span>
      </div>

      {/* 原始文本 */}
      <div className="text-content">
        <div className="text-label">原文</div>
        <div className="text-original">{item.characters}</div>
      </div>

      {/* 优化后的文本 */}
      {item.optimized && !isEditing && (
        <div className="text-content">
          <div className="text-label">优化</div>
          <div className="text-optimized">{item.optimized}</div>
        </div>
      )}

      {/* 编辑模式 */}
      {isEditing && (
        <div className="text-content">
          <div className="text-label">编辑</div>
          <textarea
            className="edit-textarea"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
          />
          <div className="edit-actions">
            <button className="btn btn-sm btn-primary" onClick={handleEditSave}>
              保存
            </button>
            <button className="btn btn-sm btn-secondary" onClick={handleEditCancel}>
              取消
            </button>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="text-item-actions">
        {!item.optimized && !isOptimizing && (
          <button 
            className="btn btn-sm btn-primary"
            onClick={onOptimize}
          >
            优化
          </button>
        )}
        
        {isOptimizing && (
          <button className="btn btn-sm btn-primary" disabled>
            <span className="spinner-sm"></span>
            优化中...
          </button>
        )}

        {item.optimized && !item.isApplied && !isEditing && (
          <>
            <button 
              className="btn btn-sm btn-primary"
              onClick={onApply}
            >
              应用
            </button>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setEditValue(item.optimized || '');
                setIsEditing(true);
              }}
            >
              编辑
            </button>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={onIgnore}
            >
              忽略
            </button>
          </>
        )}

        {item.isApplied && (
          <span className="applied-badge">已应用</span>
        )}
      </div>
    </div>
  );
};

export default TextItemComponent;
