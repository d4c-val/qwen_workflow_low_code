import React, { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export default function ContextMenu({ type, id, top, left, ...props }) {
  const { getNode, setNodes, addNodes, setEdges } = useReactFlow();

  const deleteItem = useCallback(() => {
    if (type === 'node') {
      setNodes((nodes) => nodes.filter((node) => node.id !== id));
      setEdges((edges) => edges.filter((edge) => edge.source !== id && edge.target !== id));
    } else if (type === 'edge') {
      setEdges((edges) => edges.filter((edge) => edge.id !== id));
    }
  }, [id, type, setNodes, setEdges]);

  const duplicateNode = useCallback(() => {
    if (type !== 'node') return;
    const node = getNode(id);
    if (!node) return;

    const newData = JSON.parse(JSON.stringify(node.data));
    newData.result = '';

    addNodes({
      ...node,
      id: `${node.type}_${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      data: newData,
      selected: false,
    });
  }, [id, type, getNode, addNodes]);

  const menuItems = [
    ...(type === 'node' ? [
      { icon: '📋', label: '复制节点', action: duplicateNode, color: '#6366f1' },
    ] : []),
    { icon: '🗑️', label: `删除${type === 'node' ? '节点' : '连线'}`, action: deleteItem, color: '#ef4444' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top, left,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.02)',
        borderRadius: '12px',
        padding: '6px',
        minWidth: '160px',
        animation: 'scale-in 0.15s ease-out',
      }}
      {...props}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.action}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '10px 14px',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '13px',
            color: item.color === '#ef4444' ? '#ef4444' : '#374151',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = item.color === '#ef4444' ? '#fef2f2' : '#f3f4f6';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: '14px' }}>{item.icon}</span>
          <span style={{ fontWeight: '500' }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
