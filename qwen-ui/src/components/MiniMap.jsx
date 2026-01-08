import React, { useState } from 'react';
import { MiniMap as ReactFlowMiniMap } from '@xyflow/react';
import { useTheme } from '../theme';

const MiniMap = () => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          width: '40px',
          height: '40px',
          background: theme.colors.panelBackground,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          color: theme.colors.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 10,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.colors.buttonSecondaryHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.colors.panelBackground;
        }}
        title="显示小地图"
      >
        🗺️
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '12px',
      right: '12px',
      zIndex: 10,
    }}>
      <div style={{
        position: 'relative',
        background: theme.colors.panelBackground,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        {/* 关闭按钮 */}
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '20px',
            height: '20px',
            background: theme.colors.buttonSecondary,
            border: 'none',
            borderRadius: '4px',
            color: theme.colors.textSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            zIndex: 100,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.buttonSecondaryHover;
            e.currentTarget.style.color = theme.colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.buttonSecondary;
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
          title="隐藏小地图"
        >
          ✕
        </button>

        <ReactFlowMiniMap
          nodeColor={(node) => {
            // 根据节点类型返回颜色
            const colors = {
              prompt: '#6366f1',
              chat: '#7c3aed',
              image: '#ec4899',
              imageEdit: '#f472b6',
              vision: '#3b82f6',
              filter: '#f59e0b',
              debug: '#10b981',
            };
            return colors[node.type] || theme.colors.nodeBorder;
          }}
          maskColor={theme.colors.canvasBackground + '90'}
          style={{
            width: 200,
            height: 150,
            background: theme.colors.nodeBackground,
          }}
          pannable
          zoomable
        />
      </div>
    </div>
  );
};

export default MiniMap;
