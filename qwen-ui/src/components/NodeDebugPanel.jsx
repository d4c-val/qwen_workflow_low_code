import React, { useState, useMemo } from 'react';
import { useTheme } from '../theme.jsx';

/**
 * 节点调试面板 - 显示节点的输入输出详情
 */
export default function NodeDebugPanel({ 
  isOpen, 
  onClose, 
  selectedNode, 
  nodeInputs, 
  nodeOutputs,
  allNodes,
  edges,
  onRunSingleNode, // 单独运行某个节点
  isRunning,
}) {
  const { themes } = useTheme();
  const [activeTab, setActiveTab] = useState('output');

  // 获取上游节点信息
  const upstreamNodes = useMemo(() => {
    if (!selectedNode || !edges) return [];
    const upstreamIds = edges
      .filter(e => e.target === selectedNode.id)
      .map(e => e.source);
    return allNodes?.filter(n => upstreamIds.includes(n.id)) || [];
  }, [selectedNode, edges, allNodes]);

  if (!isOpen || !selectedNode) return null;

  const nodeData = selectedNode.data || {};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }} onClick={onClose}>
      <div 
        style={{
          width: '90%',
          maxWidth: '800px',
          maxHeight: '85vh',
          background: themes.node,
          borderRadius: '12px',
          border: `1px solid ${themes.border}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          padding: '16px 20px',
          background: themes.nodeHeader,
          borderBottom: `1px solid ${themes.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: themes.text 
              }}>
                节点调试 - {nodeData.label || selectedNode.type}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: themes.textMuted,
                marginTop: '2px',
              }}>
                ID: {selectedNode.id} | 类型: {selectedNode.type}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onRunSingleNode && (
              <button
                onClick={() => onRunSingleNode(selectedNode.id)}
                disabled={isRunning}
                style={{
                  padding: '8px 16px',
                  background: isRunning ? themes.buttonSecondary : themes.buttonPrimary,
                  color: isRunning ? themes.textMuted : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isRunning ? '⏳ 运行中...' : '▶ 运行此节点'}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                color: themes.textSecondary,
                border: `1px solid ${themes.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab 切换 */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${themes.border}`,
          background: themes.backgroundSecondary,
        }}>
          {['input', 'output', 'config'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === tab ? themes.backgroundTertiary : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${themes.buttonPrimary}` : '2px solid transparent',
                color: activeTab === tab ? themes.text : themes.textSecondary,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'input' && '📥 输入'}
              {tab === 'output' && '📤 输出'}
              {tab === 'config' && '⚙️ 配置'}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px 20px',
        }}>
          {activeTab === 'input' && (
            <div>
              {/* 节点本身的输入配置 */}
              <Section title="节点配置输入">
                <DataItem label="Prompt" value={nodeData.prompt} />
                {nodeData.system_prompt && <DataItem label="System Prompt" value={nodeData.system_prompt} />}
                {nodeData.model && <DataItem label="模型" value={nodeData.model} />}
                {nodeData.code && <DataItem label="代码" value={nodeData.code} isCode />}
                {nodeData.image_url && <DataItem label="图片URL" value={nodeData.image_url} />}
                {nodeData.images && <DataItem label="图片列表" value={nodeData.images} />}
              </Section>

              {/* 上游节点输入 */}
              {upstreamNodes.length > 0 && (
                <Section title="上游节点输出（作为输入）">
                  {upstreamNodes.map(node => (
                    <DataItem 
                      key={node.id}
                      label={`${node.data?.label || node.type} (${node.id})`}
                      value={nodeInputs?.[node.id] || node.data?.result || '(尚未执行)'}
                    />
                  ))}
                </Section>
              )}

              {upstreamNodes.length === 0 && !nodeData.prompt && !nodeData.system_prompt && (
                <EmptyState message="此节点没有输入配置" />
              )}
            </div>
          )}

          {activeTab === 'output' && (
            <div>
              <Section title="节点输出结果">
                {nodeData.result ? (
                  <ResultDisplay result={nodeData.result} themes={themes} />
                ) : (
                  <EmptyState message="此节点尚未执行，没有输出结果" />
                )}
              </Section>

              {nodeData.status && (
                <Section title="执行状态">
                  <StatusBadge status={nodeData.status} themes={themes} />
                </Section>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div>
              <Section title="节点基本信息">
                <DataItem label="节点 ID" value={selectedNode.id} />
                <DataItem label="节点类型" value={selectedNode.type} />
                <DataItem label="位置" value={`X: ${Math.round(selectedNode.position?.x || 0)}, Y: ${Math.round(selectedNode.position?.y || 0)}`} />
              </Section>

              <Section title="完整配置数据">
                <pre style={{
                  padding: '12px',
                  background: themes.input,
                  borderRadius: '8px',
                  border: `1px solid ${themes.border}`,
                  fontSize: '11px',
                  color: themes.text,
                  overflow: 'auto',
                  maxHeight: '300px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                }}>
                  {JSON.stringify(nodeData, null, 2)}
                </pre>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 区块组件
const Section = ({ title, children }) => {
  const { themes } = useTheme();
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: themes.textSecondary,
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{ 
          width: '4px', 
          height: '16px', 
          background: themes.buttonPrimary,
          borderRadius: '2px',
        }} />
        {title}
      </div>
      {children}
    </div>
  );
};

// 数据项组件
const DataItem = ({ label, value, isCode = false }) => {
  const { themes } = useTheme();
  
  if (!value && value !== 0) return null;

  const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '500',
        color: themes.textMuted,
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        padding: '10px 12px',
        background: themes.input,
        borderRadius: '6px',
        border: `1px solid ${themes.border}`,
        fontSize: '12px',
        color: themes.text,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: isCode ? '"JetBrains Mono", "Fira Code", monospace' : 'inherit',
        maxHeight: '200px',
        overflowY: 'auto',
      }}>
        {displayValue}
      </div>
    </div>
  );
};

// 结果显示组件
const ResultDisplay = ({ result, themes }) => {
  const isImage = result && typeof result === 'string' && result.startsWith('http') && 
    (result.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i) || result.includes('dashscope'));
  const isVideo = result && typeof result === 'string' && result.startsWith('http') && 
    result.match(/\.(mp4|webm|mov|avi)(\?|$)/i);

  if (isImage) {
    return (
      <div style={{ textAlign: 'center' }}>
        <img 
          src={result} 
          alt="Result" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '400px', 
            borderRadius: '8px',
            border: `1px solid ${themes.border}`,
          }}
          onClick={() => window.open(result, '_blank')}
        />
        <div style={{ 
          marginTop: '8px', 
          fontSize: '11px', 
          color: themes.textMuted 
        }}>
          <a href={result} target="_blank" rel="noopener noreferrer" style={{ color: themes.buttonPrimary }}>
            🔗 在新标签页打开
          </a>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div style={{ textAlign: 'center' }}>
        <video 
          src={result} 
          controls 
          style={{ 
            maxWidth: '100%', 
            borderRadius: '8px',
          }}
        />
        <div style={{ 
          marginTop: '8px', 
          fontSize: '11px', 
          color: themes.textMuted 
        }}>
          <a href={result} target="_blank" rel="noopener noreferrer" style={{ color: themes.buttonPrimary }}>
            🔗 下载视频
          </a>
        </div>
      </div>
    );
  }

  // 文本或 JSON
  const displayValue = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
  
  return (
    <pre style={{
      padding: '16px',
      background: themes.input,
      borderRadius: '8px',
      border: `1px solid ${themes.border}`,
      fontSize: '12px',
      color: themes.text,
      overflow: 'auto',
      maxHeight: '400px',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      lineHeight: '1.6',
    }}>
      {displayValue}
    </pre>
  );
};

// 状态徽章
const StatusBadge = ({ status, themes }) => {
  const statusConfig = {
    idle: { label: '空闲', color: themes.textMuted, bg: themes.input },
    running: { label: '运行中', color: themes.warning, bg: themes.warning + '20' },
    completed: { label: '已完成', color: themes.success, bg: themes.success + '20' },
    error: { label: '错误', color: themes.error, bg: themes.error + '20' },
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: config.bg,
      borderRadius: '20px',
      border: `1px solid ${config.color}40`,
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: config.color,
      }} />
      <span style={{
        fontSize: '12px',
        fontWeight: '500',
        color: config.color,
      }}>
        {config.label}
      </span>
    </div>
  );
};

// 空状态
const EmptyState = ({ message }) => {
  const { themes } = useTheme();
  
  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      color: themes.textMuted,
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
      <div style={{ fontSize: '13px' }}>{message}</div>
    </div>
  );
};

/**
 * 历史记录详情面板 - 显示某次执行的所有节点输入输出
 */
export function ExecutionDetailPanel({ 
  isOpen, 
  onClose, 
  execution,
  onRerun,
}) {
  const { themes } = useTheme();
  const [expandedNodes, setExpandedNodes] = useState({});

  if (!isOpen || !execution) return null;

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const nodeResults = execution.nodeResults || {};
  const nodeInputsRecord = execution.nodeInputs || {};
  const nodeList = Object.keys(nodeResults);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }} onClick={onClose}>
      <div 
        style={{
          width: '90%',
          maxWidth: '900px',
          maxHeight: '85vh',
          background: themes.node,
          borderRadius: '12px',
          border: `1px solid ${themes.border}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          padding: '16px 20px',
          background: themes.nodeHeader,
          borderBottom: `1px solid ${themes.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>
              {execution.status === 'success' ? '✅' : execution.status === 'error' ? '❌' : '⚠️'}
            </span>
            <div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: themes.text 
              }}>
                执行记录 #{execution.id}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: themes.textMuted,
                marginTop: '2px',
              }}>
                {new Date(execution.timestamp).toLocaleString('zh-CN')} | 
                耗时: {execution.duration}ms | 
                共 {nodeList.length} 个节点
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onRerun && (
              <button
                onClick={() => onRerun(execution)}
                style={{
                  padding: '8px 16px',
                  background: themes.buttonPrimary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                🔄 重新运行
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                color: themes.textSecondary,
                border: `1px solid ${themes.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 节点列表 */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px 20px',
        }}>
          {nodeList.length === 0 ? (
            <EmptyState message="没有节点执行记录" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nodeList.map((nodeId, index) => {
                const result = nodeResults[nodeId];
                const inputs = nodeInputsRecord[nodeId];
                const isExpanded = expandedNodes[nodeId];
                const isError = typeof result === 'string' && result.startsWith('❌');

                return (
                  <div
                    key={nodeId}
                    style={{
                      background: themes.backgroundTertiary,
                      borderRadius: '8px',
                      border: `1px solid ${isError ? themes.error + '40' : themes.border}`,
                      overflow: 'hidden',
                    }}
                  >
                    {/* 节点头部 */}
                    <div
                      onClick={() => toggleNode(nodeId)}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isExpanded ? themes.nodeHover : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          color: themes.textMuted,
                          width: '20px',
                        }}>
                          #{index + 1}
                        </span>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: '500', 
                          color: themes.text 
                        }}>
                          {nodeId}
                        </span>
                        {isError && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: themes.error,
                            background: themes.error + '20',
                            padding: '2px 8px',
                            borderRadius: '10px',
                          }}>
                            错误
                          </span>
                        )}
                      </div>
                      <span style={{ 
                        color: themes.textMuted, 
                        fontSize: '12px',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                      }}>
                        ▼
                      </span>
                    </div>

                    {/* 展开内容 */}
                    {isExpanded && (
                      <div style={{
                        padding: '16px',
                        borderTop: `1px solid ${themes.border}`,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                      }}>
                        {/* 输入 */}
                        <div>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: themes.textSecondary,
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                          }}>
                            📥 输入
                          </div>
                          <pre style={{
                            padding: '10px',
                            background: themes.input,
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: themes.text,
                            overflow: 'auto',
                            maxHeight: '200px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                          }}>
                            {inputs ? (typeof inputs === 'object' ? JSON.stringify(inputs, null, 2) : String(inputs)) : '(无输入数据)'}
                          </pre>
                        </div>

                        {/* 输出 */}
                        <div>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: themes.textSecondary,
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                          }}>
                            📤 输出
                          </div>
                          {typeof result === 'string' && result.startsWith('http') ? (
                            result.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) || result.includes('dashscope') ? (
                              <img 
                                src={result} 
                                alt="Output"
                                style={{ 
                                  maxWidth: '100%', 
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => window.open(result, '_blank')}
                              />
                            ) : (
                              <pre style={{
                                padding: '10px',
                                background: themes.input,
                                borderRadius: '6px',
                                fontSize: '11px',
                                color: themes.text,
                                overflow: 'auto',
                                maxHeight: '200px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}>
                                {result}
                              </pre>
                            )
                          ) : (
                            <pre style={{
                              padding: '10px',
                              background: isError ? themes.error + '10' : themes.input,
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: isError ? themes.error : themes.text,
                              overflow: 'auto',
                              maxHeight: '200px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            }}>
                              {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
