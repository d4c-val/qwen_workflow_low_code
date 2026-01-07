import React, { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';

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

// === 基础节点组件 ===
const BaseNode = ({ data, id, children, color = '#000', icon, title, nodeType }) => {
  const { setNodes } = useReactFlow();
  const nodeRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const status = data.status || 'idle';
  const config = NODE_CONFIGS[nodeType] || { color, gradient: color };

  // 动态阴影
  const shadowStyle = useMemo(() => {
    if (status === 'running') {
      return {
        boxShadow: `0 0 0 3px ${config.color}40, 0 0 30px ${config.color}25, 0 20px 40px rgba(0,0,0,0.08)`,
        animation: 'pulse 2s ease-in-out infinite'
      };
    }
    if (status === 'completed') {
      return { boxShadow: `0 0 0 3px #10b98150, 0 0 20px rgba(16, 185, 129, 0.15), 0 20px 40px rgba(0,0,0,0.08)` };
    }
    if (status === 'error') {
      return { boxShadow: `0 0 0 3px #ef444450, 0 0 20px rgba(239, 68, 68, 0.15), 0 20px 40px rgba(0,0,0,0.08)` };
    }
    if (isHovered) {
      return { boxShadow: '0 25px 50px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)', transform: 'translateY(-2px)' };
    }
    return { boxShadow: '0 8px 30px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)' };
  }, [status, isHovered, config.color]);

  // 状态徽章
  const StatusBadge = useMemo(() => {
    if (status === 'idle') return null;
    
    const badges = {
      running: { icon: '⚡', bg: config.gradient, animate: true },
      completed: { icon: '✓', bg: 'linear-gradient(135deg, #10b981, #059669)' },
      error: { icon: '!', bg: 'linear-gradient(135deg, #ef4444, #dc2626)' }
    };
    
    const badge = badges[status];
    if (!badge) return null;

    return (
      <div style={{
        position: 'absolute', top: '-10px', right: '-10px',
        width: '24px', height: '24px', borderRadius: '50%',
        background: badge.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2), 0 0 0 3px rgba(255,255,255,0.9)',
        animation: badge.animate ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        zIndex: 10
      }}>
        <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{badge.icon}</span>
      </div>
    );
  }, [status, config.gradient]);

  // 调整大小
  const handleResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX, startY = e.clientY;
    const startWidth = nodeRef.current?.offsetWidth || 320;
    const startHeight = nodeRef.current?.offsetHeight || 200;

    const onMove = (moveEvent) => {
      const newWidth = Math.max(280, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(150, startHeight + (moveEvent.clientY - startY));
      if (nodeRef.current) {
        nodeRef.current.style.width = `${newWidth}px`;
        nodeRef.current.style.minHeight = `${newHeight}px`;
      }
    };

    const onUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (nodeRef.current && data.updateNodeData) {
        data.updateNodeData(id, 'width', nodeRef.current.offsetWidth);
        data.updateNodeData(id, 'height', nodeRef.current.offsetHeight);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [id, data]);

  return (
    <div 
      ref={nodeRef} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
        borderRadius: '16px',
        width: `${data.width || 320}px`, 
        minHeight: data.height ? `${data.height}px` : 'auto',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        overflow: 'hidden',
        ...shadowStyle
      }}
    >
      {/* 顶部渐变条 */}
      <div style={{ 
        height: '4px', 
        background: config.gradient,
        borderRadius: '16px 16px 0 0'
      }} />

      {StatusBadge}
      
      <Handle type="target" position={Position.Top} style={{ 
        background: config.color, 
        width: '12px', height: '12px', 
        border: '3px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
      }} />
      
      {/* 标题栏 */}
      <div style={{ 
        padding: '14px 18px 10px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '28px', height: '28px', borderRadius: '8px', 
            background: config.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '14px',
            boxShadow: `0 4px 8px ${config.color}30`
          }}>{icon}</div>
          <span style={{ fontWeight: '700', fontSize: '12px', color: '#1f2937', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{title}</span>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(`{{${id}}}`)} 
          style={{ 
            background: 'rgba(0,0,0,0.03)', border: 'none', cursor: 'pointer', 
            fontSize: '11px', color: '#6b7280', padding: '5px 8px', borderRadius: '6px',
            transition: 'all 0.2s'
          }} 
          title="复制节点ID"
          onMouseOver={(e) => e.target.style.background = 'rgba(0,0,0,0.06)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(0,0,0,0.03)'}
        >📋</button>
      </div>

      {/* 内容区 */}
      <div style={{ padding: '14px 18px 18px', flex: 1 }}>{children}</div>

      {/* 调整手柄 */}
      <div 
        className="nodrag" 
        style={{ 
          position: 'absolute', bottom: '2px', right: '2px', 
          width: '18px', height: '18px', cursor: 'nwse-resize', 
          zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: isHovered ? 0.6 : 0.2, transition: 'opacity 0.2s'
        }} 
        onMouseDown={handleResize}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M9 1L1 9M9 5L5 9M9 9H9" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ 
        background: config.color, 
        width: '12px', height: '12px', 
        border: '3px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
      }} />
    </div>
  );
};

// === 输入组件 ===
const NodeInput = ({ label, value = '', onChange, placeholder, rows = 1 }) => (
  <div style={{ marginBottom: '12px' }}>
    <label style={{ 
      display: 'block', fontSize: '10px', fontWeight: '600', 
      color: '#6b7280', marginBottom: '6px', 
      textTransform: 'uppercase', letterSpacing: '0.5px' 
    }}>{label}</label>
    <textarea 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      rows={rows} 
      className="nodrag" 
      style={{ 
        width: '100%', padding: '10px 12px', fontSize: '13px', 
        border: '1px solid #e5e7eb', borderRadius: '10px', 
        outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', 
        resize: rows > 1 ? 'vertical' : 'none', 
        fontFamily: 'inherit', lineHeight: '1.5', 
        transition: 'all 0.2s',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
      }} 
      onFocus={(e) => {
        e.target.style.backgroundColor = '#fff';
        e.target.style.borderColor = '#a5b4fc';
        e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1), inset 0 1px 2px rgba(0,0,0,0.04)';
      }}
      onBlur={(e) => {
        e.target.style.backgroundColor = '#f9fafb';
        e.target.style.borderColor = '#e5e7eb';
        e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.04)';
      }}
    />
  </div>
);

// === 结果展示组件 ===
const ResultDisplay = ({ result, type, fullHeight }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isImage = result && (type === 'image' || (typeof result === 'string' && result.startsWith('http') && (result.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i) || result.includes('dashscope'))));

  useEffect(() => {
    if (isImage) { setImageLoaded(false); setImageError(false); }
  }, [result, isImage]);

  if (!result) return null;
  
  if (typeof result === 'string' && result.startsWith('❌')) {
    return (
      <div style={{ 
        marginTop: '14px', padding: '12px 14px', 
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
        borderRadius: '10px', border: '1px solid #fecaca',
        fontSize: '12px', color: '#dc2626',
        animation: 'scale-in 0.2s ease-out'
      }}>{result}</div>
    );
  }

  return (
    <div style={{ 
      marginTop: '14px', 
      background: '#fff', borderRadius: '10px', 
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      animation: 'scale-in 0.2s ease-out'
    }}>
      <div style={{ 
        padding: '8px 12px', 
        background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)', 
        borderBottom: '1px solid #e5e7eb',
        fontSize: '10px', color: '#6b7280', fontWeight: '600', 
        letterSpacing: '0.5px', textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>✨ Output</span>
        {isImage && <a href={result} target="_blank" rel="noopener noreferrer" style={{ fontSize: '10px', color: '#6366f1', textDecoration: 'none', fontWeight: '500' }}>↗ 查看原图</a>}
      </div>
      <div style={{ padding: isImage ? '0' : '12px' }}>
        {isImage ? (
          <div style={{ position: 'relative', minHeight: '80px', background: '#f9fafb' }}>
            {!imageLoaded && !imageError && (
              <div style={{ 
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9ca3af', fontSize: '12px'
              }}>
                <span style={{ animation: 'pulse 1.5s infinite' }}>🖼️ 加载中...</span>
              </div>
            )}
            {imageError && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '12px' }}>
                ❌ 加载失败
                <button onClick={() => window.open(result, '_blank')} style={{ display: 'block', margin: '10px auto 0', padding: '6px 12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>在新窗口打开</button>
              </div>
            )}
            <img 
              src={result} alt="Result" 
              style={{ width: '100%', display: imageLoaded ? 'block' : 'none', cursor: 'pointer' }} 
              onLoad={() => setImageLoaded(true)} 
              onError={() => setImageError(true)} 
              onClick={() => window.open(result, '_blank')} 
            />
          </div>
        ) : (
          <div style={{ maxHeight: fullHeight ? '300px' : '150px', overflowY: 'auto' }}>
            <pre style={{ fontSize: '12px', color: '#374151', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: '"JetBrains Mono", "Fira Code", monospace', lineHeight: '1.6' }}>
              {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// === 提示框组件 ===
const HintBox = ({ children, color = '#6366f1', bgColor = '#eef2ff' }) => (
  <div style={{ 
    fontSize: '11px', color: '#4b5563', marginBottom: '12px', 
    padding: '10px 12px', background: bgColor, borderRadius: '8px', 
    lineHeight: '1.5', borderLeft: `3px solid ${color}`
  }}>{children}</div>
);

// === 各类节点 ===
export const PromptNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  return (
    <BaseNode data={data} id={id} color="#6366f1" icon="✏️" title="Prompt" nodeType="prompt">
      <NodeInput label="文本输入" value={data.prompt} onChange={(e) => updateData('prompt', e.target.value)} placeholder="输入文本内容..." rows={3} />
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

export const ChatNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  return (
    <BaseNode data={data} id={id} color="#7c3aed" icon="💬" title={`Chat${data.model ? ` · ${data.model}` : ''}`} nodeType="chat">
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>模型选择</label>
        <select 
          value={data.model || 'qwen-plus'} 
          onChange={(e) => updateData('model', e.target.value)} 
          className="nodrag" 
          style={{ 
            width: '100%', padding: '10px 12px', fontSize: '13px', 
            border: '1px solid #e5e7eb', borderRadius: '10px', 
            outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', 
            cursor: 'pointer', appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center'
          }}
        >
          <option value="qwen-plus">Qwen Plus</option>
          <option value="qwen-turbo">Qwen Turbo</option>
          <option value="qwen-max">Qwen Max</option>
        </select>
      </div>
      <NodeInput label="系统提示词" value={data.system_prompt} onChange={(e) => updateData('system_prompt', e.target.value)} placeholder="你是一个有用的助手..." rows={2} />
      <NodeInput label="用户提示词" value={data.prompt} onChange={(e) => updateData('prompt', e.target.value)} placeholder="输入问题或使用 {{node_id}}..." rows={3} />
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

export const ImageNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  return (
    <BaseNode data={data} id={id} color="#ec4899" icon="🎨" title="Image" nodeType="image">
      <NodeInput label="图像描述" value={data.prompt} onChange={(e) => updateData('prompt', e.target.value)} placeholder="描述你想生成的图片..." rows={2} />
      <ResultDisplay result={data.result} type="image" />
    </BaseNode>
  );
});

export const ImageEditNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  return (
    <BaseNode data={data} id={id} color="#f472b6" icon="🖌️" title="Image Edit" nodeType="imageEdit">
      <HintBox color="#ec4899" bgColor="#fdf2f8">
        💡 可直接连接上游图片节点自动获取URL，或使用 <code style={{ background: '#fce7f3', padding: '1px 4px', borderRadius: '3px' }}>{'{{node_id}}'}</code>
      </HintBox>
      <NodeInput label="图片URL（可选）" value={data.images} onChange={(e) => updateData('images', e.target.value)} placeholder="留空则自动使用上游图片" rows={2} />
      <NodeInput label="编辑指令" value={data.prompt} onChange={(e) => updateData('prompt', e.target.value)} placeholder="图1中的人物穿着图2中的衣服..." rows={2} />
      <NodeInput label="负向提示词" value={data.negative_prompt} onChange={(e) => updateData('negative_prompt', e.target.value)} placeholder="低质量, 模糊..." rows={1} />
      <ResultDisplay result={data.result} type="image" />
    </BaseNode>
  );
});

export const VisionNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  return (
    <BaseNode data={data} id={id} color="#3b82f6" icon="👁️" title="Vision" nodeType="vision">
      <HintBox color="#3b82f6" bgColor="#eff6ff">💡 输入格式: <code style={{ background: '#dbeafe', padding: '1px 4px', borderRadius: '3px' }}>图片URL | 问题</code></HintBox>
      <NodeInput label="输入" value={data.prompt} onChange={(e) => updateData('prompt', e.target.value)} placeholder="https://example.com/image.png | 图片中有什么?" rows={2} />
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

export const FilterNode = memo(({ data, id }) => {
  const { setNodes } = useReactFlow();
  const updateData = createUpdateData(id, data.updateNodeData, setNodes);
  return (
    <BaseNode data={data} id={id} color="#f59e0b" icon="⚡" title="Script" nodeType="filter">
      <HintBox color="#f59e0b" bgColor="#fffbeb">💡 使用 <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>context['node_id']</code> 访问上游输出，<code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>return</code> 返回结果</HintBox>
      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>JavaScript 代码</label>
        <textarea 
          value={data.code} 
          onChange={(e) => updateData('code', e.target.value)} 
          placeholder="const input = context['upstream_node'];\nreturn input.toUpperCase();" 
          rows={6} 
          className="nodrag" 
          style={{ 
            width: '100%', padding: '12px', fontSize: '12px', 
            border: '1px solid #374151', borderRadius: '10px', 
            minHeight: '120px', fontFamily: '"JetBrains Mono", "Fira Code", monospace', 
            backgroundColor: '#1f2937', color: '#f9fafb', 
            outline: 'none', lineHeight: '1.6',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }} 
        />
      </div>
      <ResultDisplay result={data.result} />
    </BaseNode>
  );
});

export const DebugNode = memo(({ data, id }) => (
  <BaseNode data={data} id={id} color="#10b981" icon="🐛" title="Debug" nodeType="debug">
    <HintBox color="#10b981" bgColor="#ecfdf5">💡 自动显示上游节点的输出，连接任意节点即可</HintBox>
    <ResultDisplay result={data.result} fullHeight />
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
