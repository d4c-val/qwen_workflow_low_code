import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
  reconnectEdge,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ThemeProvider, useTheme } from './theme.jsx';
import { nodeTypes } from './components/CustomNodes';
import ContextMenu from './components/ContextMenu';
import TopBar from './components/TopBar';
import QueuePanel from './components/QueuePanel';
import SettingsPanel from './components/SettingsPanel';
import { getExecutionLayers, executeNode } from './WorkflowEngine';

// === 节点配置（分类） ===
const NODE_CATEGORIES = [
  {
    name: '输入节点',
    collapsed: false,
    nodes: [
      { type: 'prompt', label: 'Prompt', icon: '✏️', color: '#6366f1', desc: '文本输入' },
    ]
  },
  {
    name: 'AI 模型',
    collapsed: false,
    nodes: [
      { type: 'chat', label: 'Chat', icon: '💬', color: '#7c3aed', desc: '文本生成' },
      { type: 'image', label: 'Image', icon: '🎨', color: '#ec4899', desc: '图像生成' },
      { type: 'imageEdit', label: 'Edit', icon: '🖌️', color: '#f472b6', desc: '图像编辑' },
      { type: 'vision', label: 'Vision', icon: '👁️', color: '#3b82f6', desc: '视觉分析' },
    ]
  },
  {
    name: '处理工具',
    collapsed: false,
    nodes: [
      { type: 'filter', label: 'Script', icon: '⚡', color: '#f59e0b', desc: '代码处理' },
    ]
  },
  {
    name: '调试工具',
    collapsed: false,
    nodes: [
      { type: 'debug', label: 'Debug', icon: '🐛', color: '#10b981', desc: '调试输出' },
    ]
  },
];

// === 侧边栏组件（ComfyUI 风格） ===
const Sidebar = ({ isCollapsed, onToggle }) => {
  const { themes } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState(NODE_CATEGORIES);

  const toggleCategory = (index) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, collapsed: !cat.collapsed } : cat
    ));
  };

  const allNodes = categories.flatMap(cat => cat.nodes);
  const filteredNodes = searchTerm
    ? allNodes.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.desc.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  if (isCollapsed) {
    return (
      <div style={{
        position: 'absolute',
        left: '10px',
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
      title="展开节点库"
      >
        <span style={{ fontSize: '18px' }}>📚</span>
      </div>
    );
  }

  return (
    <aside style={{
      position: 'absolute',
      left: '10px',
      top: '60px',
      bottom: '10px',
      width: '240px',
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
          节点库
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
          ◀
        </button>
      </div>

      {/* 搜索框 */}
      <div style={{ padding: '12px' }}>
        <input
          type="text"
          placeholder="🔍 搜索节点..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'var(--theme-input)',
            border: '1px solid var(--theme-inputBorder)',
            borderRadius: '6px',
            color: 'var(--theme-text)',
            fontSize: '12px',
            outline: 'none',
            transition: 'all 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--theme-buttonPrimary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--theme-inputBorder)'}
        />
      </div>

      {/* 节点列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {filteredNodes ? (
          // 搜索结果
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredNodes.map(node => (
              <NodeItem key={node.type} node={node} />
            ))}
          </div>
        ) : (
          // 分类显示
          categories.map((category, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <div
                onClick={() => toggleCategory(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  userSelect: 'none',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--theme-buttonSecondaryHover)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '12px', color: 'var(--theme-textSecondary)' }}>
                  {category.collapsed ? '▶' : '▼'}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--theme-text)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {category.name}
                </span>
              </div>
              {!category.collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', paddingLeft: '8px' }}>
                  {category.nodes.map(node => (
                    <NodeItem key={node.type} node={node} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

// 节点项组件
const NodeItem = ({ node }) => (
  <div
    draggable
    onDragStart={(e) => {
      e.dataTransfer.setData('application/reactflow', node.type);
      e.dataTransfer.effectAllowed = 'move';
    }}
    style={{
      padding: '8px 10px',
      borderRadius: '6px',
      cursor: 'grab',
      background: 'var(--theme-backgroundTertiary)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      border: '1px solid var(--theme-border)',
      transition: 'all 0.2s',
      userSelect: 'none',
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateX(4px)';
      e.currentTarget.style.background = 'var(--theme-nodeHover)';
      e.currentTarget.style.borderColor = node.color + '60';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateX(0)';
      e.currentTarget.style.background = 'var(--theme-backgroundTertiary)';
      e.currentTarget.style.borderColor = 'var(--theme-border)';
    }}
  >
    <div style={{
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      background: `${node.color}20`,
      color: node.color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      border: `1px solid ${node.color}30`,
    }}>
      {node.icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontWeight: '500',
        color: 'var(--theme-text)',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {node.label}
      </div>
      <div style={{
        fontSize: '10px',
        color: 'var(--theme-textMuted)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {node.desc}
      </div>
    </div>
  </div>
);

// === 主程序 ===
function AppContent() {
  const { themes } = useTheme();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [menu, setMenu] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [currentExecution, setCurrentExecution] = useState(null);
  const [settings, setSettings] = useState({
    apiKey: localStorage.getItem('qwenflow-api-key') || '',
    defaultModel: 'qwen-plus',
    gridSize: 20,
    snapToGrid: true,
    autoSave: true,
  });

  // 连线样式
  const onConnect = useCallback((params) => setEdges((eds) => addEdge({
    ...params,
    type: 'smoothstep',
    animated: true,
    style: { stroke: 'var(--theme-edge)', strokeWidth: 2 },
    interactionWidth: 20,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--theme-edge)', width: 16, height: 16 },
  }, eds)), [setEdges]);

  const onReconnect = useCallback((oldEdge, newConnection) => setEdges((els) => reconnectEdge(oldEdge, newConnection, els)), [setEdges]);

  // 右键菜单
  const handleContextMenu = useCallback((event, type, item) => {
    event.preventDefault();
    const pane = reactFlowWrapper.current.getBoundingClientRect();
    setMenu({ type, id: item.id, top: event.clientY - pane.top, left: event.clientX - pane.left });
  }, []);

  const onNodeContextMenu = useCallback((e, n) => handleContextMenu(e, 'node', n), [handleContextMenu]);
  const onEdgeContextMenu = useCallback((e, edge) => handleContextMenu(e, 'edge', edge), [handleContextMenu]);
  const onPaneClick = useCallback(() => setMenu(null), []);

  const updateNodeData = useCallback((id, field, value) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n));
  }, [setNodes]);

  // 工作流执行
  const runWorkflow = async () => {
    if (nodes.length === 0) return alert("画布是空的！");
    
    const execId = Date.now();
    const startTime = Date.now();
    setIsRunning(true);
    setMenu(null);
    setCurrentExecution({ id: execId, completed: 0, total: nodes.length });

    try {
      const layers = getExecutionLayers(nodes, edges);
      const context = {};
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      let completedCount = 0;

      for (const layer of layers) {
        setNodes(nds => nds.map(n => layer.includes(n.id) ? { ...n, data: { ...n.data, status: 'running' } } : n));
        await new Promise(resolve => setTimeout(resolve, 50));

        const results = await Promise.all(layer.map(async (nodeId) => {
          const node = nodeMap.get(nodeId);
          if (!node) return { nodeId, result: null, error: null };
          try {
            return { nodeId, result: await executeNode(node, context, edges), error: null };
          } catch (err) {
            return { nodeId, result: null, error: err.message };
          }
        }));

        let hasError = false;
        const updates = {};
        for (const { nodeId, result, error } of results) {
          completedCount++;
          setCurrentExecution({ id: execId, completed: completedCount, total: nodes.length });
          
          if (error) {
            hasError = true;
            updates[nodeId] = { result: `❌ Error: ${error}`, status: 'error' };
          } else {
            context[nodeId] = result;
            updates[nodeId] = { result, status: 'completed' };
          }
        }

        setNodes(nds => nds.map(n => updates[n.id] ? { ...n, data: { ...n.data, ...updates[n.id] } } : n));
        if (hasError) throw new Error("部分节点执行失败");
      }

      // 成功
      const duration = Date.now() - startTime;
      setExecutionHistory(prev => [{
        id: execId,
        status: 'success',
        timestamp: Date.now(),
        duration,
      }, ...prev.slice(0, 19)]); // 保留最近20条
    } catch (error) {
      console.error("Workflow Error:", error);
      const duration = Date.now() - startTime;
      setExecutionHistory(prev => [{
        id: execId,
        status: 'error',
        timestamp: Date.now(),
        duration,
      }, ...prev.slice(0, 19)]);
    } finally {
      setIsRunning(false);
      setCurrentExecution(null);
      setTimeout(() => setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle' } }))), 2000);
    }
  };

  const stopWorkflow = () => {
    setIsRunning(false);
    setCurrentExecution(null);
  };

  // 导出工作流
  const exportWorkflow = () => {
    const workflow = { nodes, edges };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入工作流
  const importWorkflow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const workflow = JSON.parse(event.target.result);
            setNodes(workflow.nodes || []);
            setEdges(workflow.edges || []);
          } catch (error) {
            alert('导入失败: 文件格式错误');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setNodes((nds) => nds.concat({
      id: `node_${Date.now()}`,
      type,
      position,
      data: { label: type, type, prompt: '', code: '', result: '', updateNodeData },
    }));
  }, [reactFlowInstance, setNodes, updateNodeData]);

  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter: 运行
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isRunning) {
        e.preventDefault();
        runWorkflow();
      }
      // Ctrl/Cmd + S: 导出
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        exportWorkflow();
      }
      // Ctrl/Cmd + O: 导入
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        importWorkflow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, nodes, edges]);

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: 'var(--theme-canvas)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: 'background 0.3s',
    }}>
      <TopBar
        onRun={runWorkflow}
        onStop={stopWorkflow}
        isRunning={isRunning}
        onSettings={() => setShowSettings(true)}
        onExport={exportWorkflow}
        onImport={importWorkflow}
      />

      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <QueuePanel
        history={executionHistory}
        currentExecution={currentExecution}
        onRerun={(item) => console.log('Rerun', item)}
        isCollapsed={queueCollapsed}
        onToggle={() => setQueueCollapsed(!queueCollapsed)}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          localStorage.setItem('qwenflow-api-key', newSettings.apiKey);
        }}
      />

      <div style={{ flex: 1, height: '100%', position: 'relative', paddingTop: '50px' }} ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onReconnect={onReconnect}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid={settings.snapToGrid}
            snapGrid={[settings.gridSize, settings.gridSize]}
          >
            <Background
              variant="dots"
              gap={settings.gridSize}
              size={1}
              color="var(--theme-canvasGrid)"
              style={{ opacity: 0.4 }}
            />
            <Controls
              style={{
                boxShadow: '0 4px 20px var(--theme-shadowLight)',
                borderRadius: '8px',
                background: 'var(--theme-backgroundSecondary)',
                border: '1px solid var(--theme-border)',
              }}
            />
            <MiniMap
              nodeColor={(node) => {
                const config = NODE_CATEGORIES.flatMap(c => c.nodes).find(n => n.type === node.type);
                return config?.color || '#6366f1';
              }}
              style={{
                background: 'var(--theme-backgroundSecondary)',
                border: '1px solid var(--theme-border)',
                borderRadius: '8px',
              }}
              maskColor="var(--theme-shadow)"
            />
            {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
