import React from 'react';
import { useTheme } from '../theme.jsx';

export default function TopBar({ onRun, onStop, isRunning, onSettings, onExport, onImport }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '50px',
      background: 'var(--theme-backgroundSecondary)',
      borderBottom: '1px solid var(--theme-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '16px',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      {/* Logo 和标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '16px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
        }}>
          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>Q</span>
        </div>
        <span style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--theme-text)',
          letterSpacing: '-0.3px',
        }}>QwenFlow</span>
      </div>

      {/* 分隔线 */}
      <div style={{ width: '1px', height: '24px', background: 'var(--theme-border)' }} />

      {/* 工作流控制 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onRun}
          disabled={isRunning}
          style={{
            padding: '6px 16px',
            background: isRunning ? 'var(--theme-buttonSecondary)' : 'var(--theme-buttonPrimary)',
            color: isRunning ? 'var(--theme-textMuted)' : 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            if (!isRunning) e.currentTarget.style.background = 'var(--theme-buttonPrimaryHover)';
          }}
          onMouseOut={(e) => {
            if (!isRunning) e.currentTarget.style.background = 'var(--theme-buttonPrimary)';
          }}
        >
          {isRunning ? (
            <>
              <span style={{
                width: '12px',
                height: '12px',
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              运行中
            </>
          ) : (
            <>▶ 运行</>
          )}
        </button>

        {isRunning && (
          <button
            onClick={onStop}
            style={{
              padding: '6px 12px',
              background: 'var(--theme-error)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            ■ 停止
          </button>
        )}
      </div>

      {/* 右侧工具 */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* 导入/导出 */}
        <button
          onClick={onImport}
          title="导入工作流 (Ctrl+O)"
          style={{
            padding: '6px 10px',
            background: 'transparent',
            color: 'var(--theme-textSecondary)',
            border: '1px solid var(--theme-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
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
          📂 导入
        </button>

        <button
          onClick={onExport}
          title="导出工作流 (Ctrl+S)"
          style={{
            padding: '6px 10px',
            background: 'transparent',
            color: 'var(--theme-textSecondary)',
            border: '1px solid var(--theme-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
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
          💾 导出
        </button>

        {/* 分隔线 */}
        <div style={{ width: '1px', height: '20px', background: 'var(--theme-border)' }} />

        {/* 主题切换 */}
        <button
          onClick={toggleTheme}
          title={`切换到${theme === 'dark' ? '浅色' : '深色'}主题`}
          style={{
            padding: '6px 10px',
            background: 'transparent',
            color: 'var(--theme-textSecondary)',
            border: '1px solid var(--theme-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--theme-buttonSecondaryHover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* 设置 */}
        <button
          onClick={onSettings}
          title="设置"
          style={{
            padding: '6px 10px',
            background: 'transparent',
            color: 'var(--theme-textSecondary)',
            border: '1px solid var(--theme-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--theme-buttonSecondaryHover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}
