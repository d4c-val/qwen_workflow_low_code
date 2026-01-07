import React, { useState, useCallback, useRef } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './components/CustomNodes';
import ContextMenu from './components/ContextMenu';
import { getExecutionLayers, executeNode } from './WorkflowEngine';

// === 节点配置 ===
const NODE_MENU = [
  { type: 'prompt', label: 'Prompt', icon: '✏️', color: '#6366f1', desc: '文本输入' },
  { type: 'chat', label: 'Chat', icon: '💬', color: '#7c3aed', desc: '文本生成' },
  { type: 'image', label: 'Image', icon: '🎨', color: '#ec4899', desc: '图像生成' },
  { type: 'imageEdit', label: 'Edit', icon: '🖌️', color: '#f472b6', desc: '图像编辑' },
  { type: 'vision', label: 'Vision', icon: '👁️', color: '#3b82f6', desc: '视觉分析' },
  { type: 'filter', label: 'Script', icon: '⚡', color: '#f59e0b', desc: '代码处理' },
  { type: 'debug', label: 'Debug', icon: '🐛', color: '#10b981', desc: '调试输出' },
];

// === 侧边栏组件 ===
const Sidebar = ({ onRun, isRunning, onClear }) => (
  <aside style={{ 
    position: 'absolute', left: '20px', top: '20px', bottom: '20px', 
    width: '260px', padding: '24px', 
    background: 'rgba(255, 255, 255, 0.85)', 
    backdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '20px', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255,255,255,0.9)',
    display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 20,
  }}>
    {/* Logo */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <div style={{ 
        width: '36px', height: '36px', borderRadius: '10px', 
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
      }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>Q</span>
      </div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', letterSpacing: '-0.5px' }}>QwenFlow</div>
        <div style={{ fontSize: '10px', color: '#9ca3af', letterSpacing: '0.5px' }}>Workflow Builder</div>
      </div>
    </div>
    
    {/* 运行按钮 */}
    <button 
      onClick={onRun} 
      disabled={isRunning} 
      style={{ 
        padding: '14px 20px', 
        background: isRunning ? '#e5e7eb' : 'linear-gradient(135deg, #1f2937, #374151)', 
        color: isRunning ? '#9ca3af' : '#fff', 
        border: 'none', borderRadius: '12px', 
        cursor: isRunning ? 'not-allowed' : 'pointer',
        fontWeight: '600', fontSize: '14px',
        boxShadow: isRunning ? 'none' : '0 10px 25px -5px rgba(31, 41, 55, 0.4)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        transform: isRunning ? 'none' : 'translateY(0)',
      }}
      onMouseOver={(e) => !isRunning && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseOut={(e) => !isRunning && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {isRunning && <span style={{ width: '14px', height: '14px', border: '2px solid #9ca3af', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
      {isRunning ? '运行中...' : '▶ 运行工作流'}
    </button>

    <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)' }} />
    
    <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase' }}>组件</div>
    
    {/* 节点列表 */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
      {NODE_MENU.map(item => (
        <div 
          key={item.type} 
          draggable
          onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', item.type); e.dataTransfer.effectAllowed = 'move'; }}
          style={{ 
            padding: '12px', borderRadius: '12px', cursor: 'grab', 
            background: '#fff', display: 'flex', alignItems: 'center', gap: '12px',
            border: '1px solid #f3f4f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
            userSelect: 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            e.currentTarget.style.borderColor = item.color + '40';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            e.currentTarget.style.borderColor = '#f3f4f6';
          }}
        >
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '10px', 
            background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
            color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '16px',
            boxShadow: `inset 0 0 0 1px ${item.color}15`
          }}>{item.icon}</div>
          <div>
            <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '13px' }}>{item.label}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>

    {/* 清空按钮 */}
    <button 
      onClick={onClear} 
      style={{ 
        padding: '10px', background: 'transparent', color: '#9ca3af', 
        border: '1px solid #e5e7eb', borderRadius: '10px', 
        cursor: 'pointer', fontSize: '12px', fontWeight: '500',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#9ca3af'; }}
    >清空画布</button>
  </aside>
);

// === 主程序 ===
export default function App() {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [menu, setMenu] = useState(null);

  // 连线样式
  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ 
    ...params, 
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    interactionWidth: 20,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 18, height: 18 },
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
  const onClear = useCallback(() => { if (window.confirm('确定清空画布？')) { setNodes([]); setEdges([]); } }, [setNodes, setEdges]);

  const updateNodeData = useCallback((id, field, value) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n));
  }, [setNodes]);

  // 工作流执行
  const runWorkflow = async () => {
    if (nodes.length === 0) return alert("画布是空的！");
    setIsRunning(true);
    setMenu(null);

    try {
      const layers = getExecutionLayers(nodes, edges);
      const context = {};
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

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
    } catch (error) {
      console.error("Workflow Error:", error);
    } finally {
      setIsRunning(false);
      setTimeout(() => setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle' } }))), 2000);
    }
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

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <ReactFlowProvider>
        <Sidebar onRun={runWorkflow} isRunning={isRunning} onClear={onClear} />
        <div style={{ flex: 1, height: '100%', position: 'relative' }} ref={reactFlowWrapper}>
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
            snapToGrid
            snapGrid={[20, 20]}
          >
            <Background 
              variant="dots" 
              gap={24} 
              size={1.5}
              color="#cbd5e1"
              style={{ opacity: 0.5 }}
            />
            <Controls 
              style={{ 
                border: 'none', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)'
              }} 
            />
            {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
