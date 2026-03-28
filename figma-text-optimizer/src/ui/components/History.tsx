import React from 'react';
import { HistoryRecord } from '../../types';
import { CATEGORY_DESCRIPTIONS, CATEGORY_COLORS } from '../../services/classifier';

interface HistoryProps {
  history: HistoryRecord[];
  onRevert: (record: HistoryRecord) => void;
  onClear: () => void;
  onBack: () => void;
}

const History: React.FC<HistoryProps> = ({ history, onRevert, onClear, onBack }) => {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60 * 1000) {
      return '刚刚';
    }
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))} 分钟前`;
    }
    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))} 小时前`;
    }
    // 其他
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="history-page">
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
        </button>
        <h2>历史记录</h2>
        {history.length > 0 && (
          <button className="btn btn-sm btn-danger" onClick={onClear}>
            清空
          </button>
        )}
      </div>

      <div className="history-content">
        {history.length === 0 ? (
          <div className="empty-state">
            <p>暂无历史记录</p>
            <p className="hint">应用优化后的文案会显示在这里</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map(record => (
              <div key={record.id} className="history-item">
                <div className="history-item-header">
                  <span 
                    className="category-tag"
                    style={{ backgroundColor: CATEGORY_COLORS[record.category] }}
                  >
                    {CATEGORY_DESCRIPTIONS[record.category]}
                  </span>
                  <span className="history-time">{formatTime(record.timestamp)}</span>
                </div>
                
                <div className="history-item-content">
                  <div className="history-text">
                    <span className="label">原文:</span>
                    <span className="original">{record.original}</span>
                  </div>
                  <div className="history-text">
                    <span className="label">优化:</span>
                    <span className="optimized">{record.optimized}</span>
                  </div>
                </div>

                <div className="history-item-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => onRevert(record)}
                  >
                    还原
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
