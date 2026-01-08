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
import NodeDebugPanel, { ExecutionDetailPanel } from './components/NodeDebugPanel';
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
    name: 'AI 文本',
    collapsed: false,
    nodes: [
      { type: 'chat', label: 'Chat', icon: '💬', color: '#7c3aed', desc: '文本生成' },
      { type: 'chatForImage', label: 'Prompt Gen', icon: '🎯', color: '#a855f7', desc: '图像提示词生成' },
    ]
  },
  {
    name: 'AI 图像',
    collapsed: false,
    nodes: [
      { type: 'image', label: 'Image', icon: '🎨', color: '#ec4899', desc: '图像生成' },
      { type: 'imageEdit', label: 'Edit', icon: '🖌️', color: '#f472b6', desc: '图像编辑' },
      { type: 'vision', label: 'Vision', icon: '👁️', color: '#3b82f6', desc: '视觉分析' },
    ]
  },
  {
    name: 'AI 视频',
    collapsed: false,
    nodes: [
      { type: 'video', label: 'Video', icon: '🎬', color: '#06b6d4', desc: '图生视频' },
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
  // 调试模式相关状态
  const [debugMode, setDebugMode] = useState(false);
  const [debugPaused, setDebugPaused] = useState(false);
  const [pendingLayers, setPendingLayers] = useState([]);
  const [executionContext, setExecutionContext] = useState({});
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  // 节点调试面板
  const [selectedNodeForDebug, setSelectedNodeForDebug] = useState(null);
  const [showNodeDebugPanel, setShowNodeDebugPanel] = useState(false);
  // 历史记录详情面板
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [showExecutionDetail, setShowExecutionDetail] = useState(false);
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
  const runWorkflow = async (startFromDebug = false) => {
    if (nodes.length === 0) return alert("画布是空的！");
    
    const execId = Date.now();
    const startTime = Date.now();
    setIsRunning(true);
    setMenu(null);
    setCurrentExecution({ id: execId, completed: 0, total: nodes.length });

    // 用于记录所有节点的输入输出
    const nodeResults = {};
    const nodeInputs = {};

    try {
      const layers = startFromDebug ? pendingLayers : getExecutionLayers(nodes, edges);
      const context = startFromDebug ? { ...executionContext } : {};
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      let completedCount = startFromDebug ? currentLayerIndex : 0;
      let layerIdx = startFromDebug ? currentLayerIndex : 0;

      for (let i = layerIdx; i < layers.length; i++) {
        const layer = layers[i];
        
        // 调试模式：在每层执行前暂停
        if (debugMode && !startFromDebug) {
          setDebugPaused(true);
          setPendingLayers(layers);
          setExecutionContext(context);
          setCurrentLayerIndex(i);
          setCurrentExecution({ 
            id: execId, 
            completed: completedCount, 
            total: nodes.length,
            currentLayer: layer,
            layerIndex: i,
            totalLayers: layers.length,
          });
          setIsRunning(false);
          return; // 暂停执行，等待用户点击"下一步"
        }

        setNodes(nds => nds.map(n => layer.includes(n.id) ? { ...n, data: { ...n.data, status: 'running' } } : n));
        await new Promise(resolve => setTimeout(resolve, 50));

        const results = await Promise.all(layer.map(async (nodeId) => {
          const node = nodeMap.get(nodeId);
          if (!node) return { nodeId, result: null, error: null, inputs: null };
          
          // 收集该节点的输入（来自上游节点的输出）
          const upstreamEdges = edges.filter(e => e.target === nodeId);
          const inputs = {};
          upstreamEdges.forEach(e => {
            inputs[e.source] = context[e.source];
          });
          // 也包含节点自身的配置
          inputs._config = {
            prompt: node.data.prompt,
            system_prompt: node.data.system_prompt,
            model: node.data.model,
          };
          
          try {
            const result = await executeNode(node, context, edges);
            return { nodeId, result, error: null, inputs };
          } catch (err) {
            return { nodeId, result: null, error: err.message, inputs };
          }
        }));

        let hasError = false;
        const updates = {};
        for (const { nodeId, result, error, inputs } of results) {
          completedCount++;
          setCurrentExecution({ 
            id: execId, 
            completed: completedCount, 
            total: nodes.length,
            layerIndex: i + 1,
            totalLayers: layers.length,
          });
          
          // 保存输入输出记录
          nodeInputs[nodeId] = inputs;
          
          if (error) {
            hasError = true;
            updates[nodeId] = { result: `❌ Error: ${error}`, status: 'error' };
            nodeResults[nodeId] = `❌ Error: ${error}`;
          } else {
            context[nodeId] = result;
            updates[nodeId] = { result, status: 'completed' };
            nodeResults[nodeId] = result;
          }
        }

        setNodes(nds => nds.map(n => updates[n.id] ? { ...n, data: { ...n.data, ...updates[n.id] } } : n));
        
        // 调试模式：在每层执行后暂停
        if (debugMode && i < layers.length - 1) {
          setDebugPaused(true);
          setPendingLayers(layers);
          setExecutionContext(context);
          setCurrentLayerIndex(i + 1);
          setCurrentExecution({ 
            id: execId, 
            completed: completedCount, 
            total: nodes.length,
            currentLayer: layers[i + 1],
            layerIndex: i + 1,
            totalLayers: layers.length,
          });
          setIsRunning(false);
          return; // 暂停执行
        }
        
        if (hasError) throw new Error("部分节点执行失败");
      }

      // 成功
      const duration = Date.now() - startTime;
      setExecutionHistory(prev => [{
        id: execId,
        status: 'success',
        timestamp: Date.now(),
        duration,
        nodeResults, // 保存所有节点的输出
        nodeInputs,  // 保存所有节点的输入
      }, ...prev.slice(0, 19)]); // 保留最近20条
      
      // 重置调试状态
      setDebugPaused(false);
      setPendingLayers([]);
      setExecutionContext({});
      setCurrentLayerIndex(0);
    } catch (error) {
      console.error("Workflow Error:", error);
      const duration = Date.now() - startTime;
      setExecutionHistory(prev => [{
        id: execId,
        status: 'error',
        timestamp: Date.now(),
        duration,
        nodeResults,
        nodeInputs,
      }, ...prev.slice(0, 19)]);
      
      // 重置调试状态
      setDebugPaused(false);
      setPendingLayers([]);
      setExecutionContext({});
      setCurrentLayerIndex(0);
    } finally {
      setIsRunning(false);
      setCurrentExecution(null);
      setTimeout(() => setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle' } }))), 2000);
    }
  };

  // 调试模式：执行下一步
  const debugStepNext = async () => {
    if (!debugPaused || pendingLayers.length === 0) return;
    
    setDebugPaused(false);
    const execId = Date.now();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const context = { ...executionContext };
    const layer = pendingLayers[currentLayerIndex];
    
    if (!layer) {
      // 没有更多层了
      setDebugPaused(false);
      setPendingLayers([]);
      setExecutionContext({});
      setCurrentLayerIndex(0);
      return;
    }
    
    setIsRunning(true);
    setNodes(nds => nds.map(n => layer.includes(n.id) ? { ...n, data: { ...n.data, status: 'running' } } : n));
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const results = await Promise.all(layer.map(async (nodeId) => {
      const node = nodeMap.get(nodeId);
      if (!node) return { nodeId, result: null, error: null };
      try {
        const result = await executeNode(node, context, edges);
        return { nodeId, result, error: null };
      } catch (err) {
        return { nodeId, result: null, error: err.message };
      }
    }));
    
    const updates = {};
    for (const { nodeId, result, error } of results) {
      if (error) {
        updates[nodeId] = { result: `❌ Error: ${error}`, status: 'error' };
      } else {
        context[nodeId] = result;
        updates[nodeId] = { result, status: 'completed' };
      }
    }
    
    setNodes(nds => nds.map(n => updates[n.id] ? { ...n, data: { ...n.data, ...updates[n.id] } } : n));
    setExecutionContext(context);
    
    // 检查是否还有下一层
    if (currentLayerIndex + 1 < pendingLayers.length) {
      setCurrentLayerIndex(currentLayerIndex + 1);
      setDebugPaused(true);
      setCurrentExecution({
        id: execId,
        completed: currentLayerIndex + 1,
        total: pendingLayers.length,
        currentLayer: pendingLayers[currentLayerIndex + 1],
        layerIndex: currentLayerIndex + 1,
        totalLayers: pendingLayers.length,
      });
    } else {
      // 执行完成
      setDebugPaused(false);
      setPendingLayers([]);
      setExecutionContext({});
      setCurrentLayerIndex(0);
      setCurrentExecution(null);
    }
    
    setIsRunning(false);
  };

  // 单独运行某个节点
  const runSingleNode = async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setIsRunning(true);
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n));
    
    try {
      // 构建上下文（从已有的节点结果中）
      const context = {};
      nodes.forEach(n => {
        if (n.data.result && !String(n.data.result).startsWith('❌')) {
          context[n.id] = n.data.result;
        }
      });
      
      const result = await executeNode(node, context, edges);
      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, result, status: 'completed' } } : n));
    } catch (err) {
      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, result: `❌ Error: ${err.message}`, status: 'error' } } : n));
    } finally {
      setIsRunning(false);
      setTimeout(() => setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'idle' } } : n)), 2000);
    }
  };

  // 查看节点调试信息
  const handleNodeDoubleClick = useCallback((event, node) => {
    setSelectedNodeForDebug(node);
    setShowNodeDebugPanel(true);
  }, []);

  // 查看历史记录详情
  const handleViewExecutionDetail = useCallback((execution) => {
    setSelectedExecution(execution);
    setShowExecutionDetail(true);
  }, []);

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setExecutionHistory([]);
  }, []);

  const stopWorkflow = () => {
    setIsRunning(false);
    setCurrentExecution(null);
    // 重置调试状态
    setDebugPaused(false);
    setPendingLayers([]);
    setExecutionContext({});
    setCurrentLayerIndex(0);
    // 重置所有节点状态
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle' } })));
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
      data: { label: type, type, prompt: '', code: '', result: '', updateNodeData, getUpstreamData },
    }));
  }, [reactFlowInstance, setNodes, updateNodeData]);

  // 获取上游节点数据的函数
  const getUpstreamData = useCallback((nodeId) => {
    const upstreamEdges = edges.filter(e => e.target === nodeId);
    const upstreamData = {};
    upstreamEdges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && sourceNode.data.result) {
        upstreamData[edge.source] = {
          label: sourceNode.data.label || sourceNode.type,
          type: sourceNode.type,
          result: sourceNode.data.result,
        };
      }
    });
    return upstreamData;
  }, [edges, nodes]);

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
        onRun={() => runWorkflow(false)}
        onStop={stopWorkflow}
        isRunning={isRunning}
        onSettings={() => setShowSettings(true)}
        onExport={exportWorkflow}
        onImport={importWorkflow}
        debugMode={debugMode}
        onToggleDebugMode={() => setDebugMode(!debugMode)}
        debugPaused={debugPaused}
        onDebugStepNext={debugStepNext}
        currentExecution={currentExecution}
      />

      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <QueuePanel
        history={executionHistory}
        currentExecution={currentExecution}
        onRerun={(item) => console.log('Rerun', item)}
        onViewDetail={handleViewExecutionDetail}
        onClearHistory={clearHistory}
        isCollapsed={queueCollapsed}
        onToggle={() => setQueueCollapsed(!queueCollapsed)}
        debugMode={debugMode}
        debugPaused={debugPaused}
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
            onNodeDoubleClick={handleNodeDoubleClick}
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

      {/* 节点调试面板 */}
      <NodeDebugPanel
        isOpen={showNodeDebugPanel}
        onClose={() => setShowNodeDebugPanel(false)}
        selectedNode={selectedNodeForDebug}
        nodeInputs={executionContext}
        nodeOutputs={executionContext}
        allNodes={nodes}
        edges={edges}
        onRunSingleNode={runSingleNode}
        isRunning={isRunning}
      />

      {/* 历史记录详情面板 */}
      <ExecutionDetailPanel
        isOpen={showExecutionDetail}
        onClose={() => setShowExecutionDetail(false)}
        execution={selectedExecution}
        onRerun={(item) => console.log('Rerun from detail', item)}
      />
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
