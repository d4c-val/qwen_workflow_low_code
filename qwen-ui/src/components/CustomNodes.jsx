import React, { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useTheme } from '../theme.jsx';

// === 节点类型配置 ===
const NODE_CONFIGS = {
  prompt: { color: '#6366f1', icon: '✏️', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  chat: { color: '#7c3aed', icon: '💬', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
  chatForImage: { color: '#a855f7', icon: '🎯', gradient: 'linear-gradient(135deg, #a855f7, #c084fc)' },
  image: { color: '#ec4899', icon: '🎨', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
  imageEdit: { color: '#f472b6', icon: '🖌️', gradient: 'linear-gradient(135deg, #f472b6, #fb7185)' },
  vision: { color: '#3b82f6', icon: '👁️', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  video: { color: '#06b6d4', icon: '🎬', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
  filter: { color: '#f59e0b', icon: '⚡', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  debug: { color: '#10b981', icon: '🐛', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
};

// === 工具函数 ===
const createUpdateData = (id, updateNodeData, setNodes) => (field, val) => {
  if (updateNodeData) {
    updateNodeData(id, field, val);
  } else {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, [field]: val } } : n));
  }
};

// === 基础节点组件（ComfyUI 风格 - 更紧凑） ===
const BaseNode = ({ data, id, children, icon, title, nodeType }) => {
  const { themes } = useTheme();
  const { setNodes } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);

  const status = data.status || 'idle';
  const config = NODE_CONFIGS[nodeType] || { color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' };
  
  // 判断是否有结果可以查看
  const hasResult = data.result && !String(data.result).startsWith('❌');

  // 状态徽章
  const StatusBadge = useMemo(() => {
    if (status === 'idle') return null;
    
    const badges = {
      running: { icon: '⚡', bg: themes.warning, animate: true },
      completed: { icon: '✓', bg: themes.success },
      error: { icon: '!', bg: themes.error }
    };
    
    const badge = badges[status];
    if (!badge) return null;

    return (
      <div style={{
        position: 'absolute', top: '-8px', right: '-8px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: badge.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 2px 8px ${badge.bg}80, 0 0 0 2px ${themes.node}`,
        animation: badge.animate ? 'pulse 1.5s infinite' : 'none',
        zIndex: 10
      }}>
        <span style={{ fontSize: '10px', color: '#ffffff', fontWeight: 'bold' }}>{badge.icon}</span>
      </div>
    );
  }, [status, themes]);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        background: themes.node,
        border: `1px solid ${themes.nodeBorder}`,
        borderRadius: '8px',
        width: '220px',
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s',
        boxShadow: isHovered ? `0 4px 12px rgba(0,0,0,0.15)` : '0 2px 6px rgba(0,0,0,0.08)',
      }}
    >
      {/* 顶部彩色条 */}
      <div style={{ 
        height: '3px', 
        background: config.gradient,
        borderRadius: '8px 8px 0 0'
      }} />

      {StatusBadge}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ 
          background: config.color, 
          width: '10px', 
          height: '10px', 
          border: `2px solid ${themes.node}`,
          top: '-6px',
        }} 
      />
      
      {/* 标题栏（紧凑） */}
      <div style={{ 
        padding: '8px 10px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${themes.border}`,
        background: themes.nodeHeader,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px' }}>{icon}</span>
          <span style={{ 
            fontWeight: '600', 
            fontSize: '11px', 
            color: themes.text, 
            letterSpacing: '0.2px',
            textTransform: 'uppercase',
          }}>
            {title}
          </span>
        </div>
        {/* 双击查看提示 */}
        {isHovered && (
          <span style={{
            fontSize: '9px',
            color: themes.textMuted,
            padding: '2px 6px',
            background: themes.input,
            borderRadius: '4px',
          }}>
            双击调试
          </span>
        )}
      </div>

      {/* 内容区（紧凑） */}
      <div style={{ padding: '10px' }}>{children}</div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ 
          background: config.color, 
          width: '10px', 
          height: '10px', 
          border: `2px solid ${themes.node}`,
          bottom: '-6px',
        }} 
      />
    </div>
  );
};

// === 下拉选择组件 ===
const NodeSelect = ({ label, value, onChange, options }) => {
  const { themes } = useTheme();
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '10px', 
        fontWeight: '600', 
        color: themes.textSecondary, 
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </label>
      <select 
        value={value} 
        onChange={onChange} 
        className="nodrag" 
        style={{ 
          width: '100%', 
          padding: '6px 8px', 
          fontSize: '11px', 
          border: `1px solid ${themes.inputBorder}`, 
          borderRadius: '6px', 
          outline: 'none', 
          backgroundColor: themes.input, 
          color: themes.text, 
          cursor: 'pointer',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

// === 输入组件（紧凑） ===
const NodeInput = ({ label, value = '', onChange, placeholder, rows = 1, type = 'text' }) => {
  const { themes } = useTheme();
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '10px', 
        fontWeight: '600', 
        color: themes.textSecondary, 
        marginBottom: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </label>
      <textarea 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
        rows={rows} 
        className="nodrag" 
        style={{ 
          width: '100%', 
          padding: '6px 8px', 
          fontSize: '11px', 
          border: `1px solid ${themes.inputBorder}`, 
          borderRadius: '6px', 
          outline: 'none', 
          backgroundColor: themes.input, 
          color: themes.text, 
          resize: rows > 1 ? 'vertical' : 'none', 
          fontFamily: 'inherit', 
          lineHeight: '1.4', 
          transition: 'all 0.2s',
        }} 
        onFocus={(e) => {
          e.target.style.borderColor = themes.inputFocus;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = themes.inputBorder;
        }}
      />
    </div>
  );
};

// === 结果展示组件（可调整大小） ===
const ResultDisplay = ({ result, type }) => {
  const { themes } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [textHeight, setTextHeight] = useState(100);
  const [isResizing, setIsResizing] = useState(false);
  const startYRef = React.useRef(0);
  const startHeightRef = React.useRef(0);

  // 判断结果类型
  const isImage = result && (type === 'image' || (typeof result === 'string' && result.startsWith('http') && (result.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i) || result.includes('dashscope'))));
  const isVideo = result && typeof result === 'string' && result.startsWith('http') && result.match(/\.(mp4|webm|mov|avi)(\?|$)/i);
  const isMediaUrl = isImage || isVideo;

  // 拖拽调整高度
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = textHeight;
  }, [textHeight]);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - startYRef.current;
      const newHeight = Math.max(60, Math.min(400, startHeightRef.current + deltaY));
      setTextHeight(newHeight);
    };

    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!result) return null;
  
  // 错误状态
  if (typeof result === 'string' && result.startsWith('❌')) {
    return (
      <div style={{ 
        marginTop: '8px', 
        padding: '8px', 
        background: themes.error + '20', 
        borderRadius: '6px', 
        border: `1px solid ${themes.error}40`,
        fontSize: '10px', 
        color: themes.error,
        lineHeight: '1.4',
      }}>
        {result}
      </div>
    );
  }

  return (
    <div style={{ 
      marginTop: '8px', 
      background: themes.input, 
      borderRadius: '6px', 
      border: `1px solid ${themes.border}`,
      overflow: 'hidden',
    }}>
      {/* 标题栏 */}
      <div style={{ 
        padding: '6px 8px', 
        background: themes.nodeHeader, 
        borderBottom: `1px solid ${themes.border}`,
        fontSize: '9px', 
        color: themes.textSecondary, 
        fontWeight: '600', 
        letterSpacing: '0.5px', 
        textTransform: 'uppercase',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <span>✨ Output</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isMediaUrl && (
            <span style={{ fontSize: '8px', color: themes.textMuted, fontWeight: '400', textTransform: 'none' }}>
              拖拽底部↕
            </span>
          )}
          {isMediaUrl && (
            <a 
              href={result} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                fontSize: '9px', 
                color: themes.buttonPrimary, 
                textDecoration: 'none', 
                fontWeight: '500' 
              }}
            >
              ↗
            </a>
          )}
        </div>
      </div>

      {/* 内容区 */}
      <div style={{ padding: isMediaUrl ? '0' : '0' }}>
        {isImage ? (
          // 图片展示
          <div style={{ position: 'relative', minHeight: '60px', background: themes.input }}>
            {!imageLoaded && !imageError && (
              <div style={{ padding: '20px', textAlign: 'center', color: themes.textMuted, fontSize: '10px' }}>
                🖼️ 加载中...
              </div>
            )}
            {imageError && (
              <div style={{ padding: '20px', textAlign: 'center', color: themes.error, fontSize: '10px' }}>
                ❌ 加载失败
              </div>
            )}
            <img 
              src={result} 
              alt="Result" 
              style={{ width: '100%', display: imageLoaded ? 'block' : 'none', cursor: 'pointer' }} 
              onLoad={() => setImageLoaded(true)} 
              onError={() => setImageError(true)} 
              onClick={() => window.open(result, '_blank')} 
            />
          </div>
        ) : isVideo ? (
          // 视频展示
          <div style={{ padding: '8px' }}>
            <video 
              src={result} 
              controls 
              style={{ width: '100%', borderRadius: '4px' }}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          // 文本/JSON展示（可调整大小）
          <div style={{ position: 'relative' }}>
            <div 
              className="nodrag nowheel"
              style={{ 
                height: `${textHeight}px`, 
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '8px',
              }}
            >
              <pre style={{ 
                fontSize: '10px', 
                color: themes.text, 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word', 
                fontFamily: '"JetBrains Mono", "Fira Code", monospace', 
                lineHeight: '1.5',
                userSelect: 'text',
              }}>
                {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
              </pre>
            </div>
            {/* 拖拽手柄 */}
            <div
              className="nodrag"
              onMouseDown={handleMouseDown}
              style={{
                height: '10px',
                background: isResizing ? themes.buttonPrimary + '30' : 'transparent',
                cursor: 'ns-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderTop: `1px solid ${themes.border}`,
                transition: isResizing ? 'none' : 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!isResizing) e.currentTarget.style.background = themes.nodeHover; }}
              onMouseLeave={(e) => { if (!isResizing) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: '24px', height: '2px', background: themes.textMuted, borderRadius: '1px' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// === 提示框组件 ===
const HintBox = ({ children }) => {
  const { themes } = useTheme();
  
  return (
    <div style={{ 
      fontSize: '9px', 
      color: themes.textMuted, 
      marginBottom: '8px', 
      padding: '6px 8px', 
      background: themes.input, 
      borderRadius: '4px', 
      lineHeight: '1.4', 
      borderLeft: `2px solid ${themes.buttonPrimary}`
    }}>
      {children}
    </div>
  );
};

// === 变量替换预览函数 ===
const replaceVariablesPreview = (text, context) => {
  if (!text) return "";
  return text.replace(/\{\{(.*?)\}\}/g, (match, nodeId) => {
    const val = context[nodeId.trim()];
    return val === undefined ? match : (typeof val === 'object' ? JSON.stringify(val) : val);
  });
};

// === 检查文本中是否包含某个节点ID的引用 ===
const containsNodeReference = (text, nodeId) => {
  if (!text) return false;
  const regex = new RegExp(`\\{\\{\\s*${nodeId}\\s*\\}\\}`, 'g');
  return regex.test(text);
};

// === 上游输入显示组件 ===
const UpstreamInputDisplay = ({ nodeId }) => {
  const { themes } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true); // 默认展开
  const { getNodes, getEdges } = useReactFlow();
  
  // 直接在渲染时计算，不使用 useMemo（确保实时更新）
  const edges = getEdges();
  const nodes = getNodes();
  const current = nodes.find(n => n.id === nodeId);
  const upstreamEdges = edges.filter(e => e.target === nodeId);
  const upstreamData = {};
  const context = {};
  
  // 收集上游节点数据
  upstreamEdges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    if (sourceNode) {
      upstreamData[edge.source] = {
        id: edge.source,
        label: sourceNode.data.label || sourceNode.type,
        type: sourceNode.type,
        result: sourceNode.data.result,
        hasResult: !!sourceNode.data.result && !String(sourceNode.data.result).startsWith('❌'),
      };
      if (sourceNode.data.result) {
        context[edge.source] = sourceNode.data.result;
      }
    }
  });
  
  // 分析参数映射关系
  const parameterMappings = [];
  if (current && current.data) {
    const paramFields = [
      { key: 'prompt', label: 'Prompt' },
      { key: 'system_prompt', label: 'System Prompt' },
      { key: 'negative_prompt', label: 'Negative Prompt' },
      { key: 'image_url', label: '图片URL' },
      { key: 'images', label: '图片列表' },
      { key: 'code', label: '代码' },
    ];
    
    Object.keys(upstreamData).forEach(sourceId => {
      const upstream = upstreamData[sourceId];
      
      // 特殊处理：chatForImage 节点传递 JSON 到 Image 节点
      if (current.type === 'image' && upstream.type === 'chatForImage' && 
          upstream.result && typeof upstream.result === 'object') {
        // 正向提示词映射
        if (upstream.result.prompt) {
          const hasManualPrompt = current.data.prompt && current.data.prompt.trim() && 
                                 !current.data.prompt.includes('{{');
          parameterMappings.push({
            sourceId,
            sourceLabel: upstream.label,
            sourceResult: upstream.result.prompt,
            targetField: '✨ Prompt (正向提示词)',
            targetFieldKey: 'prompt',
            originalValue: hasManualPrompt ? current.data.prompt : null,
            replacedValue: upstream.result.prompt,
            hasResult: upstream.hasResult,
            isAutomatic: true,
            isJsonField: true,
            hasManualInput: hasManualPrompt,
          });
        }
        
        // 负向提示词映射
        if (upstream.result.negative_prompt) {
          const hasManualNegPrompt = current.data.negative_prompt && 
                                     current.data.negative_prompt.trim() && 
                                     !current.data.negative_prompt.includes('{{');
          parameterMappings.push({
            sourceId,
            sourceLabel: upstream.label,
            sourceResult: upstream.result.negative_prompt,
            targetField: '🚫 Negative Prompt (负向提示词)',
            targetFieldKey: 'negative_prompt',
            originalValue: hasManualNegPrompt ? current.data.negative_prompt : null,
            replacedValue: upstream.result.negative_prompt,
            hasResult: upstream.hasResult,
            isAutomatic: true,
            isJsonField: true,
            hasManualInput: hasManualNegPrompt,
          });
        }
      } else {
        // 常规模板引用检查
        paramFields.forEach(field => {
          const fieldValue = current.data[field.key];
          if (fieldValue && containsNodeReference(fieldValue, sourceId)) {
            const replacedValue = replaceVariablesPreview(fieldValue, context);
            parameterMappings.push({
              sourceId,
              sourceLabel: upstream.label,
              sourceResult: upstream.result,
              targetField: field.label,
              targetFieldKey: field.key,
              originalValue: fieldValue,
              replacedValue,
              hasResult: upstream.hasResult,
            });
          }
        });
      }
      
      // 如果没有显式引用，但有连接且有结果，标记为隐式传递
      const hasExplicitMapping = parameterMappings.some(m => m.sourceId === sourceId);
      if (!hasExplicitMapping) {
        // 即使没有结果也显示连接关系
        parameterMappings.push({
          sourceId,
          sourceLabel: upstream.label,
          sourceResult: upstream.result,
          targetField: '(自动获取)',
          targetFieldKey: '_auto',
          originalValue: null,
          replacedValue: upstream.result || '(待执行)',
          hasResult: upstream.hasResult,
          isAutomatic: true,
        });
      }
    });
  }

  const upstreamKeys = Object.keys(upstreamData);
  
  if (upstreamKeys.length === 0) return null;

  return (
    <div style={{ 
      marginBottom: '8px',
      background: themes.info + '08',
      borderRadius: '6px',
      border: `1px solid ${themes.info}25`,
      overflow: 'hidden',
    }}>
      {/* 标题栏 */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '6px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: themes.info + '12',
        }}
      >
        <span style={{ 
          fontSize: '10px', 
          fontWeight: '600',
          color: themes.info,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          🔗 参数传递 ({parameterMappings.length})
        </span>
        <span style={{ 
          fontSize: '10px', 
          color: themes.info,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
        }}>
          ▼
        </span>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div style={{ padding: '8px' }} className="nodrag nowheel">
          {parameterMappings.length === 0 ? (
            <div style={{ 
              fontSize: '10px', 
              color: themes.textMuted,
              textAlign: 'center',
              padding: '8px',
            }}>
              已连接 {upstreamKeys.length} 个上游节点，等待执行...
            </div>
          ) : (
            parameterMappings.map((mapping, index) => {
              const result = mapping.sourceResult;
              const isImage = result && typeof result === 'string' && result.startsWith('http') && 
                (result.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i) || result.includes('dashscope'));
              const isError = typeof result === 'string' && result.startsWith('❌');
              
              return (
                <div key={index} style={{ 
                  marginBottom: index < parameterMappings.length - 1 ? '10px' : 0,
                  padding: '8px',
                  background: themes.backgroundTertiary,
                  borderRadius: '6px',
                  border: `1px solid ${themes.border}`,
                }}>
                  {/* 映射关系标题 */}
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ 
                      fontSize: '9px',
                      padding: '2px 6px', 
                      background: themes.buttonPrimary + '20',
                      borderRadius: '4px',
                      color: themes.buttonPrimary,
                      fontWeight: '600',
                    }}>
                      {mapping.sourceLabel}
                    </span>
                    <span style={{ fontSize: '10px', color: themes.success }}>→</span>
                    <span style={{ 
                      fontSize: '9px',
                      padding: '2px 6px', 
                      background: mapping.isAutomatic ? themes.warning + '20' : themes.success + '20',
                      borderRadius: '4px',
                      color: mapping.isAutomatic ? themes.warning : themes.success,
                      fontWeight: '600',
                    }}>
                      {mapping.targetField}
                    </span>
                    {mapping.hasResult ? (
                      <span style={{ 
                        fontSize: '8px', 
                        color: themes.success,
                        marginLeft: 'auto',
                      }}>✓ 已传递</span>
                    ) : (
                      <span style={{ 
                        fontSize: '8px', 
                        color: themes.textMuted,
                        marginLeft: 'auto',
                      }}>⏳ 待执行</span>
                    )}
                  </div>

                  {/* 原始模板（如果有显式引用） */}
                  {mapping.originalValue && !mapping.isAutomatic && !mapping.isJsonField && (
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ 
                        fontSize: '8px', 
                        color: themes.textMuted,
                        marginBottom: '2px',
                        textTransform: 'uppercase',
                      }}>
                        模板引用:
                      </div>
                      <code style={{
                        fontSize: '9px',
                        color: themes.warning,
                        background: themes.warning + '15',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontFamily: '"JetBrains Mono", monospace',
                      }}>
                        {`{{${mapping.sourceId}}}`}
                      </code>
                    </div>
                  )}

                  {/* JSON 字段说明 */}
                  {mapping.isJsonField && (
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ 
                        fontSize: '8px', 
                        color: mapping.hasManualInput ? themes.warning : themes.info,
                        background: mapping.hasManualInput ? themes.warning + '15' : themes.info + '15',
                        padding: '4px 6px',
                        borderRadius: '3px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <span>{mapping.hasManualInput ? '✍️' : '📋'}</span>
                        <span>{mapping.hasManualInput ? '手动输入优先，上游值被忽略' : '从 JSON 对象自动提取'}</span>
                      </div>
                      {mapping.hasManualInput && mapping.originalValue && (
                        <div style={{ 
                          marginTop: '4px',
                          fontSize: '9px',
                          color: themes.text,
                          background: themes.input,
                          padding: '4px 6px',
                          borderRadius: '3px',
                          border: `1px solid ${themes.border}`,
                        }}>
                          <div style={{ 
                            fontSize: '7px', 
                            color: themes.textMuted,
                            marginBottom: '2px',
                            textTransform: 'uppercase',
                          }}>
                            手动输入的内容:
                          </div>
                          {mapping.originalValue}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 实际传递的值 */}
                  {mapping.hasResult && (
                    <div>
                      <div style={{ 
                        fontSize: '8px', 
                        color: themes.textMuted,
                        marginBottom: '2px',
                        textTransform: 'uppercase',
                      }}>
                        {mapping.isAutomatic ? '上游输出:' : '替换结果:'}
                      </div>
                      {isImage ? (
                        <img 
                          src={result} 
                          alt="Input"
                          style={{ 
                            width: '100%', 
                            maxHeight: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          onClick={() => window.open(result, '_blank')}
                        />
                      ) : (
                        <div style={{
                          fontSize: '9px',
                          color: isError ? themes.error : themes.text,
                          background: isError ? themes.error + '10' : themes.input,
                          padding: '6px',
                          borderRadius: '4px',
                          maxHeight: '50px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: typeof result === 'object' ? '"JetBrains Mono", monospace' : 'inherit',
                          border: `1px solid ${themes.border}`,
                        }}>
                          {typeof result === 'object' ? JSON.stringify(result, null, 2) : 
                           (String(result).length > 100 ? String(result).substring(0, 100) + '...' : String(result))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// === 各类节点 ===
export const PromptNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="✏️" title="Prompt" nodeType="prompt">
      <NodeInput 
        label="文本输入" 
        value={data.prompt} 
        onChange={(e) => updateData('prompt', e.target.value)} 
        placeholder="输入文本..." 
        rows={3} 
      />
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

export const ChatNode = memo(({ data, id }) => {
  const { themes } = useTheme();
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="💬" title={`Chat · ${data.model || 'qwen-plus'}`} nodeType="chat">
      <UpstreamInputDisplay nodeId={id} />
      <div style={{ marginBottom: '8px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '10px', 
          fontWeight: '600', 
          color: themes.textSecondary, 
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          模型
        </label>
        <select 
          value={data.model || 'qwen-plus'} 
          onChange={(e) => updateData('model', e.target.value)} 
          className="nodrag" 
          style={{ 
            width: '100%', 
            padding: '6px 8px', 
            fontSize: '11px', 
            border: `1px solid ${themes.inputBorder}`, 
            borderRadius: '6px', 
            outline: 'none', 
            backgroundColor: themes.input, 
            color: themes.text, 
            cursor: 'pointer',
          }}
        >
          <option value="qwen-plus">Qwen Plus</option>
          <option value="qwen-turbo">Qwen Turbo</option>
          <option value="qwen-max">Qwen Max</option>
        </select>
      </div>
      <NodeInput 
        label="System" 
        value={data.system_prompt} 
        onChange={(e) => updateData('system_prompt', e.target.value)} 
        placeholder="系统提示词..." 
        rows={2} 
      />
      <NodeInput 
        label="Prompt" 
        value={data.prompt} 
        onChange={(e) => updateData('prompt', e.target.value)} 
        placeholder="用户输入或 {{node_id}}..." 
        rows={3} 
      />
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

// ChatForImage 节点 - 专门用于生成图像提示词（返回 JSON 格式）
export const ChatForImageNode = memo(({ data, id }) => {
  const { themes } = useTheme();
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="🎯" title={`Prompt Gen · ${data.model || 'qwen-plus'}`} nodeType="chatForImage">
      <UpstreamInputDisplay nodeId={id} />
      <HintBox>
        生成正负提示词 JSON，可直接连接 Image 节点
      </HintBox>
      <NodeSelect
        label="模型"
        value={data.model || 'qwen-plus'}
        onChange={(e) => updateData('model', e.target.value)}
        options={[
          { value: 'qwen-plus', label: 'Qwen Plus' },
          { value: 'qwen-turbo', label: 'Qwen Turbo' },
          { value: 'qwen-max', label: 'Qwen Max' },
        ]}
      />
      <NodeInput 
        label="System" 
        value={data.system_prompt} 
        onChange={(e) => updateData('system_prompt', e.target.value)} 
        placeholder="图片风格要求（如：写实风格、动漫风格）..." 
        rows={2} 
      />
      <NodeInput 
        label="Prompt" 
        value={data.prompt} 
        onChange={(e) => updateData('prompt', e.target.value)} 
        placeholder="描述你想要的图片..." 
        rows={3} 
      />
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

// Image 节点配置选项
const IMAGE_MODELS = [
  { value: 'qwen-image-max', label: 'Qwen Image Max' },
  { value: 'qwen-image-plus', label: 'Qwen Image Plus' },
];

const IMAGE_SIZES = [
  { value: '1664*928', label: '16:9 (1664×928)' },
  { value: '1472*1104', label: '4:3 (1472×1104)' },
  { value: '1328*1328', label: '1:1 (1328×1328)' },
  { value: '1104*1472', label: '3:4 (1104×1472)' },
  { value: '928*1664', label: '9:16 (928×1664)' },
];

export const ImageNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="🎨" title={`Image · ${(data.model || 'qwen-image-max').replace('qwen-image-', '')}`} nodeType="image">
      <UpstreamInputDisplay nodeId={id} />
      <HintBox>
        支持从 Prompt Gen 节点获取提示词
      </HintBox>
      <NodeSelect
        label="模型"
        value={data.model || 'qwen-image-max'}
        onChange={(e) => updateData('model', e.target.value)}
        options={IMAGE_MODELS}
      />
      <NodeSelect
        label="尺寸"
        value={data.size || '1104*1472'}
        onChange={(e) => updateData('size', e.target.value)}
        options={IMAGE_SIZES}
      />
      <NodeInput 
        label="正向提示词" 
        value={data.prompt} 
        onChange={(e) => updateData('prompt', e.target.value)} 
        placeholder="描述图片内容（或使用 {{node_id}}）..." 
        rows={2} 
      />
      <NodeInput 
        label="负向提示词" 
        value={data.negative_prompt} 
        onChange={(e) => updateData('negative_prompt', e.target.value)} 
        placeholder="不想要的元素..." 
        rows={1} 
      />
      <ResultDisplay result={data.result} type="image" />
    </BaseNode>
  );
});

export const ImageEditNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="🖌️" title="Image Edit" nodeType="imageEdit">
      <UpstreamInputDisplay nodeId={id} />
      <HintBox>
        连接图片节点或输入 URL
      </HintBox>
      <NodeInput 
        label="图片URL" 
        value={data.images} 
        onChange={(e) => updateData('images', e.target.value)} 
        placeholder="留空自动获取..." 
        rows={1} 
      />
      <NodeInput 
        label="指令" 
        value={data.prompt} 
        onChange={(e) => updateData('prompt', e.target.value)} 
        placeholder="编辑指令..." 
        rows={2} 
      />
      <NodeInput 
        label="负向提示" 
        value={data.negative_prompt} 
        onChange={(e) => updateData('negative_prompt', e.target.value)} 
        placeholder="不想要的元素..." 
        rows={1} 
      />
      <ResultDisplay result={data.result} type="image" />
    </BaseNode>
  );
});

export const VisionNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="👁️" title="Vision" nodeType="vision">
      <UpstreamInputDisplay nodeId={id} />
      <HintBox>
        格式: 图片URL | 问题
      </HintBox>
      <NodeInput 
        label="输入" 
        value={data.prompt} 
        onChange={(e) => updateData('prompt', e.target.value)} 
        placeholder="URL | 问题..." 
        rows={2} 
      />
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

// Video 节点配置选项
const VIDEO_RESOLUTIONS = [
  { value: '720P', label: '720P' },
  { value: '1080P', label: '1080P' },
];

const VIDEO_DURATIONS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' },
  { value: 15, label: '15秒' },
];

const VIDEO_SHOT_TYPES = [
  { value: 'single', label: '单镜头' },
  { value: 'multi', label: '多镜头' },
];

const VIDEO_PROMPT_EXTEND = [
  { value: 'false', label: '关闭' },
  { value: 'true', label: '开启' },
];

export const VideoNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="🎬" title="Video" nodeType="video">
      <UpstreamInputDisplay nodeId={id} />
      <HintBox>
        图生视频，支持异步生成和轮询
      </HintBox>
      <NodeInput 
        label="图片URL" 
        value={data.image_url} 
        onChange={(e) => updateData('image_url', e.target.value)} 
        placeholder="输入图片URL或 {{node_id}}..." 
        rows={1} 
      />
      <NodeInput 
        label="提示词" 
        value={data.prompt} 
        onChange={(e) => updateData('prompt', e.target.value)} 
        placeholder="描述视频动作..." 
        rows={2} 
      />
      <NodeSelect
        label="分辨率"
        value={data.resolution || '1080P'}
        onChange={(e) => updateData('resolution', e.target.value)}
        options={VIDEO_RESOLUTIONS}
      />
      <NodeSelect
        label="时长"
        value={data.duration || 5}
        onChange={(e) => updateData('duration', parseInt(e.target.value))}
        options={VIDEO_DURATIONS}
      />
      <NodeSelect
        label="镜头类型"
        value={data.shot_type || 'single'}
        onChange={(e) => updateData('shot_type', e.target.value)}
        options={VIDEO_SHOT_TYPES}
      />
      <NodeSelect
        label="提示词扩展"
        value={String(data.prompt_extend ?? false)}
        onChange={(e) => updateData('prompt_extend', e.target.value === 'true')}
        options={VIDEO_PROMPT_EXTEND}
      />
      <NodeInput 
        label="音频URL（可选）" 
        value={data.audio_url} 
        onChange={(e) => updateData('audio_url', e.target.value)} 
        placeholder="可选，音频文件URL..." 
        rows={1} 
      />
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

export const FilterNode = memo(({ data, id }) => {
  const { themes } = useTheme();
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="⚡" title="Script" nodeType="filter">
      <UpstreamInputDisplay nodeId={id} />
      <HintBox>
        使用 context['node_id'] 访问上游
      </HintBox>
      <div style={{ marginBottom: '8px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '10px', 
          fontWeight: '600', 
          color: themes.textSecondary, 
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          JavaScript
        </label>
        <textarea 
          value={data.code} 
          onChange={(e) => updateData('code', e.target.value)} 
          placeholder="const input = context['node_id'];\nreturn input.toUpperCase();" 
          rows={5} 
          className="nodrag" 
          style={{ 
            width: '100%', 
            padding: '8px', 
            fontSize: '10px', 
            border: `1px solid ${themes.nodeBorder}`, 
            borderRadius: '6px', 
            fontFamily: '"JetBrains Mono", "Fira Code", monospace', 
            backgroundColor: themes.input, 
            color: themes.text, 
            outline: 'none', 
            lineHeight: '1.5',
            resize: 'vertical',
          }} 
        />
      </div>
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

export const DebugNode = memo(({ data, id }) => (
  <BaseNode data={data} id={id} icon="🐛" title="Debug" nodeType="debug">
    <UpstreamInputDisplay nodeId={id} />
    <HintBox>
      自动显示上游节点输出
    </HintBox>
    <ResultDisplay result={data.result} />
  </BaseNode>
));

export const nodeTypes = {
  prompt: PromptNode,
  chat: ChatNode,
  chatForImage: ChatForImageNode,
  image: ImageNode,
  imageEdit: ImageEditNode,
  vision: VisionNode,
  video: VideoNode,
  filter: FilterNode,
  debug: DebugNode
};
