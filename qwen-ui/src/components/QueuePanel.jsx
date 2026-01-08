import React, { useState } from 'react';

export default function QueuePanel({ history = [], currentExecution, onRerun, isCollapsed, onToggle }) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'

  if (isCollapsed) {
    return (
      <div style={{
        position: 'absolute',
        right: '10px',
        top: '60px',
        width: '40px',
        height: '40px',
        background: 'var(--theme-backgroundSecondary)',
        border: '1px solid var(--theme-border)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        zIndex: 100,
      }}
      onClick={onToggle}
      onMouseOver={(e) => e.currentTarget.style.background = 'var(--theme-buttonSecondaryHover)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'var(--theme-backgroundSecondary)'}
      title="展开队列面板"
      >
        <span style={{ fontSize: '18px' }}>📊</span>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      right: '10px',
      top: '60px',
      bottom: '10px',
      width: '280px',
      background: 'var(--theme-sidebar)',
      border: '1px solid var(--theme-sidebarBorder)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px var(--theme-shadowLight)',
      zIndex: 100,
    }}>
      {/* 标题栏 */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--theme-backgroundTertiary)',
        borderBottom: '1px solid var(--theme-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)' }}>
          队列管理
        </span>
        <button
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--theme-textSecondary)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--theme-buttonSecondaryHover)';
            e.currentTarget.style.color = 'var(--theme-text)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--theme-textSecondary)';
          }}
          title="折叠"
        >
          ✕
        </button>
      </div>

      {/* Tab 切换 */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--theme-border)',
        background: 'var(--theme-backgroundSecondary)',
      }}>
        <button
          onClick={() => setActiveTab('current')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'current' ? 'var(--theme-backgroundTertiary)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'current' ? '2px solid var(--theme-buttonPrimary)' : '2px solid transparent',
            color: activeTab === 'current' ? 'var(--theme-text)' : 'var(--theme-textSecondary)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
        >
          当前队列
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'history' ? 'var(--theme-backgroundTertiary)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'history' ? '2px solid var(--theme-buttonPrimary)' : '2px solid transparent',
            color: activeTab === 'history' ? 'var(--theme-text)' : 'var(--theme-textSecondary)',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
        >
          历史记录 {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {activeTab === 'current' ? (
          // 当前执行
          <div>
            {currentExecution ? (
              <div style={{
                padding: '12px',
                background: 'var(--theme-backgroundTertiary)',
                borderRadius: '8px',
                border: '1px solid var(--theme-border)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>
                    运行中
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--theme-textSecondary)', marginBottom: '8px' }}>
                  Workflow #{currentExecution.id}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--theme-textMuted)', marginBottom: '8px' }}>
                  {currentExecution.completed}/{currentExecution.total} 节点完成
                </div>
                {/* 进度条 */}
                <div style={{
                  height: '6px',
                  background: 'var(--theme-input)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(currentExecution.completed / currentExecution.total) * 100}%`,
                    background: 'linear-gradient(90deg, var(--theme-buttonPrimary), var(--theme-info))',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            ) : (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--theme-textMuted)',
                fontSize: '12px',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>💤</div>
                无正在执行的工作流
              </div>
            )}
          </div>
        ) : (
          // 历史记录
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--theme-textMuted)',
                fontSize: '12px',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>📝</div>
                暂无执行历史
              </div>
            ) : (
              history.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px',
                    background: 'var(--theme-backgroundTertiary)',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--theme-nodeHover)';
                    e.currentTarget.style.borderColor = 'var(--theme-buttonPrimary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--theme-backgroundTertiary)';
                    e.currentTarget.style.borderColor = 'var(--theme-border)';
                  }}
                  onClick={() => onRerun && onRerun(item)}
                  title="点击重新运行"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--theme-text)' }}>
                      Workflow #{item.id}
                    </span>
                    <span style={{ fontSize: '14px' }}>
                      {item.status === 'success' ? '✅' : item.status === 'error' ? '❌' : '⚠️'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--theme-textMuted)' }}>
                    {new Date(item.timestamp).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {item.duration && (
                    <div style={{ fontSize: '10px', color: 'var(--theme-textMuted)', marginTop: '4px' }}>
                      耗时: {item.duration}ms
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 底部操作 */}
      {history.length > 0 && activeTab === 'history' && (
        <div style={{
          padding: '12px',
          borderTop: '1px solid var(--theme-border)',
          background: 'var(--theme-backgroundSecondary)',
        }}>
          <button
            onClick={() => {
              if (window.confirm('确定清空所有历史记录？')) {
                // 清空逻辑
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: '1px solid var(--theme-border)',
              borderRadius: '6px',
              color: 'var(--theme-textSecondary)',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--theme-buttonSecondaryHover)';
              e.currentTarget.style.color = 'var(--theme-text)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--theme-textSecondary)';
            }}
          >
            清空历史
          </button>
        </div>
      )}
    </div>
  );
}
