import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.style.background = theme === 'dark' ? '#0f172a' : '#F8FAF7';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'dark' ? {
    // Dark theme colors
    background: '#0f172a',
    cardBg: '#1e293b',
    text: '#EEF2E6',
    textSecondary: '#94a3b8',
    border: '#334155',
    hover: '#334155',
    primary: '#CEF17B',
    primaryLight: '#084734',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    success: '#10b981',
    inputBg: '#1e293b',
    inputBorder: '#334155',
    shadow: 'rgba(0,0,0,0.3)',
  } : {
    // Light theme colors
    background: '#F8FAF7',
    cardBg: '#ffffff',
    text: '#111827',
    textSecondary: '#98A2B3',
    border: '#DCEFB8',
    hover: '#EEF2E6',
    primary: '#CEF17B',
    primaryLight: '#DCEFB8',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    success: '#10b981',
    inputBg: '#ffffff',
    inputBorder: '#DCEFB8',
    shadow: 'rgba(0,0,0,0.05)',
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
