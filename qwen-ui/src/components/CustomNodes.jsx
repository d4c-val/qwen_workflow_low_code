import React, { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { useTheme } from '../theme.jsx';

// === 节点类型配置 ===
const NODE_CONFIGS = {
  prompt: { color: '#6366f1', icon: '✏️', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  chat: { color: '#7c3aed', icon: '💬', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
  image: { color: '#ec4899', icon: '🎨', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
  imageEdit: { color: '#f472b6', icon: '🖌️', gradient: 'linear-gradient(135deg, #f472b6, #fb7185)' },
  vision: { color: '#3b82f6', icon: '👁️', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
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
  const { theme } = useTheme();
  const { setNodes } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);

  const status = data.status || 'idle';
  const config = NODE_CONFIGS[nodeType] || { color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' };

  // 状态徽章
  const StatusBadge = useMemo(() => {
    if (status === 'idle') return null;
    
    const badges = {
      running: { icon: '⚡', bg: theme.colors.running, animate: true },
      completed: { icon: '✓', bg: theme.colors.success },
      error: { icon: '!', bg: theme.colors.error }
    };
    
    const badge = badges[status];
    if (!badge) return null;

    return (
      <div style={{
        position: 'absolute', top: '-8px', right: '-8px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: badge.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 2px 8px ${badge.bg}80, 0 0 0 2px ${theme.colors.nodeBackground}`,
        animation: badge.animate ? 'pulse 1.5s infinite' : 'none',
        zIndex: 10
      }}>
        <span style={{ fontSize: '10px', color: theme.colors.textInverse, fontWeight: 'bold' }}>{badge.icon}</span>
      </div>
    );
  }, [status, theme]);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        background: theme.colors.nodeBackground,
        border: `1px solid ${theme.colors.nodeBorder}`,
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
          border: `2px solid ${theme.colors.nodeBackground}`,
          top: '-6px',
        }} 
      />
      
      {/* 标题栏（紧凑） */}
      <div style={{ 
        padding: '8px 10px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.nodeHeader,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px' }}>{icon}</span>
          <span style={{ 
            fontWeight: '600', 
            fontSize: '11px', 
            color: theme.colors.textPrimary, 
            letterSpacing: '0.2px',
            textTransform: 'uppercase',
          }}>
            {title}
          </span>
        </div>
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
          border: `2px solid ${theme.colors.nodeBackground}`,
          bottom: '-6px',
        }} 
      />
    </div>
  );
};

// === 输入组件（紧凑） ===
const NodeInput = ({ label, value = '', onChange, placeholder, rows = 1, type = 'text' }) => {
  const { theme } = useTheme();
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '10px', 
        fontWeight: '600', 
        color: theme.colors.textSecondary, 
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
          border: `1px solid ${theme.colors.inputBorder}`, 
          borderRadius: '6px', 
          outline: 'none', 
          backgroundColor: theme.colors.inputBackground, 
          color: theme.colors.inputText, 
          resize: rows > 1 ? 'vertical' : 'none', 
          fontFamily: 'inherit', 
          lineHeight: '1.4', 
          transition: 'all 0.2s',
        }} 
        onFocus={(e) => {
          e.target.style.borderColor = theme.colors.inputBorderFocus;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme.colors.inputBorder;
        }}
      />
    </div>
  );
};

// === 结果展示组件（紧凑） ===
const ResultDisplay = ({ result, type }) => {
  const { theme } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = result && (type === 'image' || (typeof result === 'string' && result.startsWith('http') && (result.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i) || result.includes('dashscope'))));

  if (!result) return null;
  
  if (typeof result === 'string' && result.startsWith('❌')) {
    return (
      <div style={{ 
        marginTop: '8px', 
        padding: '8px', 
        background: theme.colors.error + '20', 
        borderRadius: '6px', 
        border: `1px solid ${theme.colors.error}40`,
        fontSize: '10px', 
        color: theme.colors.error,
        lineHeight: '1.4',
      }}>
        {result}
      </div>
    );
  }

  return (
    <div style={{ 
      marginTop: '8px', 
      background: theme.colors.inputBackground, 
      borderRadius: '6px', 
      border: `1px solid ${theme.colors.border}`,
      overflow: 'hidden',
    }}>
      <div style={{ 
        padding: '6px 8px', 
        background: theme.colors.nodeHeader, 
        borderBottom: `1px solid ${theme.colors.border}`,
        fontSize: '9px', 
        color: theme.colors.textSecondary, 
        fontWeight: '600', 
        letterSpacing: '0.5px', 
        textTransform: 'uppercase',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <span>✨ Output</span>
        {isImage && (
          <a 
            href={result} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              fontSize: '9px', 
              color: theme.colors.buttonPrimary, 
              textDecoration: 'none', 
              fontWeight: '500' 
            }}
          >
            ↗
          </a>
        )}
      </div>
      <div style={{ padding: isImage ? '0' : '8px' }}>
        {isImage ? (
          <div style={{ position: 'relative', minHeight: '60px', background: theme.colors.inputBackground }}>
            {!imageLoaded && !imageError && (
              <div style={{ 
                padding: '20px',
                textAlign: 'center',
                color: theme.colors.textTertiary,
                fontSize: '10px'
              }}>
                🖼️ 加载中...
              </div>
            )}
            {imageError && (
              <div style={{ padding: '20px', textAlign: 'center', color: theme.colors.error, fontSize: '10px' }}>
                ❌ 加载失败
              </div>
            )}
            <img 
              src={result} 
              alt="Result" 
              style={{ 
                width: '100%', 
                display: imageLoaded ? 'block' : 'none', 
                cursor: 'pointer' 
              }} 
              onLoad={() => setImageLoaded(true)} 
              onError={() => setImageError(true)} 
              onClick={() => window.open(result, '_blank')} 
            />
          </div>
        ) : (
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            <pre style={{ 
              fontSize: '10px', 
              color: theme.colors.textPrimary, 
              margin: 0, 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-all', 
              fontFamily: '"JetBrains Mono", "Fira Code", monospace', 
              lineHeight: '1.5' 
            }}>
              {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// === 提示框组件 ===
const HintBox = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div style={{ 
      fontSize: '9px', 
      color: theme.colors.textTertiary, 
      marginBottom: '8px', 
      padding: '6px 8px', 
      background: theme.colors.inputBackground, 
      borderRadius: '4px', 
      lineHeight: '1.4', 
      borderLeft: `2px solid ${theme.colors.buttonPrimary}`
    }}>
      {children}
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
  const { theme } = useTheme();
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="💬" title={`Chat · ${data.model || 'qwen-plus'}`} nodeType="chat">
      <div style={{ marginBottom: '8px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '10px', 
          fontWeight: '600', 
          color: theme.colors.textSecondary, 
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
            border: `1px solid ${theme.colors.inputBorder}`, 
            borderRadius: '6px', 
            outline: 'none', 
            backgroundColor: theme.colors.inputBackground, 
            color: theme.colors.inputText, 
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

export const ImageNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="🎨" title="Image" nodeType="image">
      <NodeInput 
        label="描述" 
        value={data.prompt} 
        onChange={(e) => updateData('prompt', e.target.value)} 
        placeholder="描述图片内容..." 
        rows={2} 
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

export const FilterNode = memo(({ data, id }) => {
  const { theme } = useTheme();
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  
  return (
    <BaseNode data={data} id={id} icon="⚡" title="Script" nodeType="filter">
      <HintBox>
        使用 context['node_id'] 访问上游
      </HintBox>
      <div style={{ marginBottom: '8px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '10px', 
          fontWeight: '600', 
          color: theme.colors.textSecondary, 
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
            border: `1px solid ${theme.colors.nodeBorder}`, 
            borderRadius: '6px', 
            fontFamily: '"JetBrains Mono", "Fira Code", monospace', 
            backgroundColor: theme.colors.inputBackground, 
            color: theme.colors.inputText, 
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
    <HintBox>
      自动显示上游节点输出
    </HintBox>
    <ResultDisplay result={data.result} />
  </BaseNode>
));

export const nodeTypes = {
  prompt: PromptNode,
  chat: ChatNode,
  image: ImageNode,
  imageEdit: ImageEditNode,
  vision: VisionNode,
  filter: FilterNode,
  debug: DebugNode
};
