import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '../theme/colors';

const lightColors = {
  ...COLORS,
  text: COLORS.text,
  bg: COLORS.bg,
  bgLight: COLORS.bgLight,
  border: COLORS.border,
  surface: COLORS.white,
  surfaceAlt: '#FFFFFF',
  textMuted: COLORS.textMuted,
};

const darkColors = {
  ...COLORS,
  text: '#FFFFFF',
  bg: '#0a0a0a',
  bgLight: '#111111',
  border: '#1f1f1f',
  surface: '#161616',
  surfaceAlt: '#1f1f1f',
  textMuted: '#9ca3af',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState('system'); // 'light' | 'dark' | 'system'

  useEffect(() => {
    (async () => {
      const savedTheme = await SecureStore.getItemAsync('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    })();
  }, []);

  const toggleTheme = async (newTheme) => {
    setTheme(newTheme);
    await SecureStore.setItemAsync('theme', newTheme);
  };

  const colors = theme === 'system' 
    ? (systemTheme === 'dark' ? darkColors : lightColors) 
    : (theme === 'dark' ? darkColors : lightColors);

  const isDark = colors === darkColors;

  return (
    <ThemeContext.Provider value={{ colors, theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
