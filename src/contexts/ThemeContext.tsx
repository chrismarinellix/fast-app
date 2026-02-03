import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Theme colors - can be imported by components
export const themeColors = {
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceHover: '#f9fafb',
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#888888',
    border: '#e5e7eb',
    borderLight: '#f0f0f0',
    primary: '#22c55e',
    primaryHover: '#16a34a',
  },
  dark: {
    background: '#0f0f0f',
    surface: '#1a1a1a',
    surfaceHover: '#252525',
    text: '#f5f5f5',
    textSecondary: '#b0b0b0',
    textMuted: '#888888',
    border: '#333333',
    borderLight: '#2a2a2a',
    primary: '#22c55e',
    primaryHover: '#16a34a',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('fast-app-theme');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('fast-app-theme', theme);
    // Update document for global CSS if needed
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
