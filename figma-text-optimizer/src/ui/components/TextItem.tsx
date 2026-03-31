import React, { useState, useRef, useEffect } from 'react';
import { TextItem as TextItemType } from '../../types';
import { CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from '../../services/classifier';

// 对话消息类型
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TextItemProps {
  item: TextItemType;
  isOptimizing: boolean;
  onOptimize: (customPrompt?: string) => void;
  onApply: () => void;
  onIgnore: () => void;
  onEdit: (newOptimized: string) => void;
  onChat?: (message: string, history: ChatMessage[]) => Promise<string>;
  onSetAsReference?: () => void;
  isReference?: boolean;
}

const TextItemComponent: React.FC<TextItemProps> = ({
  item,
  isOptimizing,
  onOptimize,
  onApply,
  onIgnore,
  onEdit,
  onChat,
  onSetAsReference,
  isReference = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.optimized || '');
  const [isChatMode, setIsChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // 当有优化结果时，初始化对话历史
  useEffect(() => {
    if (item.optimized && chatHistory.length === 0) {
      setChatHistory([
        { role: 'assistant', content: item.optimized }
      ]);
    }
  }, [item.optimized]);

  const handleEditSave = () => {
    onEdit(editValue);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(item.optimized || '');
    setIsEditing(false);
  };

  // 发送对话消息
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending || !onChat) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsSending(true);

    // 添加用户消息
    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: userMessage }
    ];
    setChatHistory(newHistory);

    try {
      // 调用 AI 获取回复
      const response = await onChat(userMessage, newHistory);
      
      // 添加 AI 回复
      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: response }
      ]);

      // 更新优化结果为最新的 AI 回复
      onEdit(response);
    } catch (error) {
      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: `错误: ${error instanceof Error ? error.message : '请求失败'}` }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // 快捷调整选项
  const quickOptions = [
    '更简洁一点',
    '更正式一点',
    '更活泼一点',
    '换一个版本',
    '加上引导语'
  ];

  const handleQuickOption = (option: string) => {
    setChatInput(option);
  };

  const categoryColor = CATEGORY_COLORS[item.category];
  const categoryName = CATEGORY_DESCRIPTIONS[item.category];

  return (
    <div className={`text-item ${item.isApplied ? 'applied' : ''} ${isChatMode ? 'chat-mode' : ''} ${isReference ? 'is-reference' : ''}`}>
      {/* 头部：分类标签和上下文 */}
      <div className="text-item-header">
        <span 
          className="category-tag"
          style={{ backgroundColor: categoryColor }}
        >
          {categoryName}
        </span>
        {isReference && (
          <span className="reference-badge">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
            参考样例
          </span>
        )}
        <span className="context">{item.context}</span>
      </div>

      {/* 原始文本 */}
      <div className="text-content">
        <div className="text-label">原文</div>
        <div className="text-original">{item.characters}</div>
      </div>

      {/* 对话模式 */}
      {isChatMode && chatHistory.length > 0 && (
        <div className="chat-container">
          <div className="chat-messages">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.role}`}>
                <div className="message-label">
                  {msg.role === 'user' ? '你' : 'AI'}
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isSending && (
              <div className="chat-message assistant">
                <div className="message-label">AI</div>
                <div className="message-content">
                  <span className="typing-indicator">思考中...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 快捷选项 */}
          <div className="quick-options">
            {quickOptions.map((option, index) => (
              <button
                key={index}
                className="quick-option-btn"
                onClick={() => handleQuickOption(option)}
                disabled={isSending}
              >
                {option}
              </button>
            ))}
          </div>

          {/* 输入框 */}
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入调整要求，如：更简洁一点..."
              disabled={isSending}
            />
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSendMessage}
              disabled={isSending || !chatInput.trim()}
            >
              发送
            </button>
          </div>
        </div>
      )}

      {/* 非对话模式下显示优化结果 */}
      {!isChatMode && item.optimized && !isEditing && (
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
          <>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => onOptimize()}
            >
              优化
            </button>
            {onSetAsReference && (
              <button 
                className={`btn btn-sm ${isReference ? 'btn-reference-active' : 'btn-secondary'}`}
                onClick={onSetAsReference}
                title={isReference ? '当前已设为参考样例' : '将原文风格设为参考，其他同类型文案将模仿此风格'}
              >
                {isReference ? '✓ 参考中' : '设为参考'}
              </button>
            )}
          </>
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
            {onChat && (
              <button 
                className={`btn btn-sm ${isChatMode ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsChatMode(!isChatMode)}
              >
                {isChatMode ? '收起对话' : '调整'}
              </button>
            )}
            {onSetAsReference && (
              <button 
                className={`btn btn-sm ${isReference ? 'btn-reference-active' : 'btn-secondary'}`}
                onClick={onSetAsReference}
                title={isReference ? '当前已设为参考样例' : '设为参考样例，同类型文案将参照此风格优化'}
              >
                {isReference ? '✓ 参考中' : '设为参考'}
              </button>
            )}
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setEditValue(item.optimized || '');
                setIsEditing(true);
                setIsChatMode(false);
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
          <div className="applied-actions">
            <span className="applied-badge">已应用</span>
            {onSetAsReference && item.optimized && (
              <button 
                className={`btn btn-sm ${isReference ? 'btn-reference-active' : 'btn-secondary'}`}
                onClick={onSetAsReference}
                title={isReference ? '当前已设为参考样例' : '设为参考样例，同类型文案将参照此风格优化'}
              >
                {isReference ? '✓ 参考中' : '设为参考'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextItemComponent;
