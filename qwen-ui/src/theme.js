// 主题配置系统
import React, { createContext, useContext, useState, useEffect } from 'react';

// 主题配置
export const themes = {
  dark: {
    name: 'dark',
    // 背景色
    background: '#1e1e1e',
    backgroundSecondary: '#2a2a2a',
    backgroundTertiary: '#353535',
    
    // 画布
    canvas: '#1a1a1a',
    canvasGrid: '#2a2a2a',
    
    // 节点
    node: '#2a2a2a',
    nodeHeader: '#353535',
    nodeBorder: '#404040',
    nodeHover: '#333333',
    
    // 文字
    text: '#e5e5e5',
    textSecondary: '#b0b0b0',
    textMuted: '#808080',
    
    // 输入框
    input: '#2a2a2a',
    inputBorder: '#404040',
    inputFocus: '#505050',
    
    // 边框
    border: '#404040',
    borderLight: '#353535',
    
    // 侧边栏
    sidebar: 'rgba(30, 30, 30, 0.95)',
    sidebarBorder: '#353535',
    
    // 按钮
    buttonPrimary: '#4a9eff',
    buttonPrimaryHover: '#6bb0ff',
    buttonSecondary: '#404040',
    buttonSecondaryHover: '#505050',
    
    // 状态色
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    // 连线
    edge: '#6b7280',
    edgeHover: '#9ca3af',
    
    // 阴影
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowLight: 'rgba(0, 0, 0, 0.3)',
  },
  
  light: {
    name: 'light',
    // 背景色
    background: '#f8fafc',
    backgroundSecondary: '#ffffff',
    backgroundTertiary: '#f1f5f9',
    
    // 画布
    canvas: '#f8fafc',
    canvasGrid: '#e2e8f0',
    
    // 节点
    node: '#ffffff',
    nodeHeader: '#f8fafc',
    nodeBorder: '#e5e7eb',
    nodeHover: '#f9fafb',
    
    // 文字
    text: '#1f2937',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    
    // 输入框
    input: '#f9fafb',
    inputBorder: '#e5e7eb',
    inputFocus: '#d1d5db',
    
    // 边框
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    
    // 侧边栏
    sidebar: 'rgba(255, 255, 255, 0.95)',
    sidebarBorder: '#e5e7eb',
    
    // 按钮
    buttonPrimary: '#3b82f6',
    buttonPrimaryHover: '#2563eb',
    buttonSecondary: '#f3f4f6',
    buttonSecondaryHover: '#e5e7eb',
    
    // 状态色
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6',
    
    // 连线
    edge: '#94a3b8',
    edgeHover: '#64748b',
    
    // 阴影
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
  }
};

// 主题 Context
const ThemeContext = createContext();

// 主题 Provider
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 从 localStorage 读取主题偏好
    const saved = localStorage.getItem('qwenflow-theme');
    return saved || 'dark';
  });

  useEffect(() => {
    // 保存主题偏好
    localStorage.setItem('qwenflow-theme', theme);
    
    // 设置 CSS 变量
    const currentTheme = themes[theme];
    const root = document.documentElement;
    
    Object.entries(currentTheme).forEach(([key, value]) => {
      if (key !== 'name') {
        root.style.setProperty(`--theme-${key}`, value);
      }
    });
    
    // 设置 data-theme 属性
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, themes: themes[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 使用主题的 Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
