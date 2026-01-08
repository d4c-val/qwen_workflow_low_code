import React, { useState } from 'react';

export default function SettingsPanel({ isOpen, onClose, settings, onSave }) {
  const [localSettings, setLocalSettings] = useState(settings || {
    apiKey: '',
    defaultModel: 'qwen-plus',
    gridSize: 20,
    snapToGrid: true,
    autoSave: true,
  });

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s',
        }}
        onClick={onClose}
      />

      {/* 设置面板 */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        background: 'var(--theme-backgroundSecondary)',
        border: '1px solid var(--theme-border)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px var(--theme-shadow)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        animation: 'scaleIn 0.2s',
      }}>
        {/* 标题栏 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--theme-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--theme-text)',
          }}>
            设置
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--theme-textSecondary)',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px 8px',
              borderRadius: '6px',
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
            ✕
          </button>
        </div>

        {/* 内容区 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          {/* API Key 设置 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--theme-text)',
              marginBottom: '8px',
            }}>
              DashScope API Key
            </label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
              placeholder="sk-xxxxxxxxxxxxxxxx"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--theme-input)',
                border: '1px solid var(--theme-inputBorder)',
                borderRadius: '8px',
                color: 'var(--theme-text)',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--theme-buttonPrimary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--theme-inputBorder)'}
            />
            <div style={{
              fontSize: '11px',
              color: 'var(--theme-textMuted)',
              marginTop: '6px',
            }}>
              在 <a href="https://dashscope.console.aliyun.com/apiKey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-buttonPrimary)', textDecoration: 'none' }}>阿里云控制台</a> 获取
            </div>
          </div>

          {/* 默认模型 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--theme-text)',
              marginBottom: '8px',
            }}>
              默认对话模型
            </label>
            <select
              value={localSettings.defaultModel}
              onChange={(e) => setLocalSettings({ ...localSettings, defaultModel: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--theme-input)',
                border: '1px solid var(--theme-inputBorder)',
                borderRadius: '8px',
                color: 'var(--theme-text)',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="qwen-plus">Qwen Plus</option>
              <option value="qwen-turbo">Qwen Turbo</option>
              <option value="qwen-max">Qwen Max</option>
            </select>
          </div>

          {/* 画布设置 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--theme-text)',
              marginBottom: '12px',
            }}>
              画布设置
            </h3>

            {/* 网格大小 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                color: 'var(--theme-textSecondary)',
                marginBottom: '8px',
              }}>
                网格大小: {localSettings.gridSize}px
              </label>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={localSettings.gridSize}
                onChange={(e) => setLocalSettings({ ...localSettings, gridSize: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* 吸附网格 */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              marginBottom: '12px',
            }}>
              <input
                type="checkbox"
                checked={localSettings.snapToGrid}
                onChange={(e) => setLocalSettings({ ...localSettings, snapToGrid: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--theme-text)' }}>
                节点吸附到网格
              </span>
            </label>

            {/* 自动保存 */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={localSettings.autoSave}
                onChange={(e) => setLocalSettings({ ...localSettings, autoSave: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--theme-text)' }}>
                自动保存工作流
              </span>
            </label>
          </div>

          {/* 快捷键说明 */}
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--theme-text)',
              marginBottom: '12px',
            }}>
              快捷键
            </h3>
            <div style={{
              fontSize: '12px',
              color: 'var(--theme-textSecondary)',
              lineHeight: '1.8',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>运行工作流</span>
                <code style={{
                  background: 'var(--theme-backgroundTertiary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}>Ctrl + Enter</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>保存/导出</span>
                <code style={{
                  background: 'var(--theme-backgroundTertiary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}>Ctrl + S</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>打开/导入</span>
                <code style={{
                  background: 'var(--theme-backgroundTertiary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}>Ctrl + O</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>删除选中</span>
                <code style={{
                  background: 'var(--theme-backgroundTertiary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}>Delete</code>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--theme-border)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--theme-border)',
              borderRadius: '8px',
              color: 'var(--theme-textSecondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
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
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: 'var(--theme-buttonPrimary)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--theme-buttonPrimaryHover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--theme-buttonPrimary)'}
          >
            保存设置
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
