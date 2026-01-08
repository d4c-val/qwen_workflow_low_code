import React, { useState } from 'react';
import { useTheme } from '../theme.jsx';

export default function QueuePanel({ 
  history = [], 
  currentExecution, 
  onRerun, 
  onViewDetail,
  onClearHistory,
  isCollapsed, 
  onToggle,
  debugMode,
  debugPaused,
}) {
  const { themes } = useTheme();
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
      width: '300px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)' }}>
            队列管理
          </span>
          {debugMode && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: 'var(--theme-warning)',
              color: '#000',
              borderRadius: '8px',
              fontWeight: '500',
            }}>
              调试
            </span>
          )}
        </div>
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
                  <span style={{ fontSize: '16px' }}>
                    {debugPaused ? '⏸️' : '⚡'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>
                    {debugPaused ? '已暂停' : '运行中'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--theme-textSecondary)', marginBottom: '8px' }}>
                  Workflow #{currentExecution.id}
                </div>
                
                {/* 调试模式显示层级信息 */}
                {debugMode && currentExecution.totalLayers && (
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--theme-warning)', 
                    marginBottom: '8px',
                    padding: '6px 10px',
                    background: 'var(--theme-warning)15',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-warning)30',
                  }}>
                    📍 当前层: {currentExecution.layerIndex + 1} / {currentExecution.totalLayers}
                    {currentExecution.currentLayer && (
                      <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--theme-textMuted)' }}>
                        待执行节点: {currentExecution.currentLayer.join(', ')}
                      </div>
                    )}
                  </div>
                )}
                
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
                    background: debugPaused 
                      ? 'linear-gradient(90deg, var(--theme-warning), var(--theme-warning))' 
                      : 'linear-gradient(90deg, var(--theme-buttonPrimary), var(--theme-info))',
                    transition: 'width 0.3s',
                  }} />
                </div>

                {/* 调试模式提示 */}
                {debugPaused && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: 'var(--theme-info)15',
                    borderRadius: '6px',
                    border: '1px solid var(--theme-info)30',
                    fontSize: '11px',
                    color: 'var(--theme-info)',
                  }}>
                    💡 点击顶部 <strong>"下一步"</strong> 按钮执行下一层节点，或双击节点查看详情
                  </div>
                )}
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
                {debugMode && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px',
                    background: 'var(--theme-warning)15',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: 'var(--theme-warning)',
                  }}>
                    🐛 调试模式已开启，运行后将单步执行
                  </div>
                )}
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
                    transition: 'all 0.2s',
                  }}
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
                      {item.nodeResults && (
                        <span> | {Object.keys(item.nodeResults).length} 个节点</span>
                      )}
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '6px', 
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--theme-border)',
                  }}>
                    {item.nodeResults && (
                      <button
                        onClick={() => onViewDetail && onViewDetail(item)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          background: 'var(--theme-buttonPrimary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'var(--theme-buttonPrimaryHover)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'var(--theme-buttonPrimary)';
                        }}
                      >
                        🔍 查看详情
                      </button>
                    )}
                    <button
                      onClick={() => onRerun && onRerun(item)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        background: 'transparent',
                        color: 'var(--theme-textSecondary)',
                        border: '1px solid var(--theme-border)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
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
                      🔄 重跑
                    </button>
                  </div>
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
                onClearHistory && onClearHistory();
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
            🗑️ 清空历史
          </button>
        </div>
      )}
    </div>
  );
}
