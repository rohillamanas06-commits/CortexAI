import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'obsidian' | 'emerald' | 'amethyst';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: { id: Theme; name: string; color: string }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = [
  { id: 'obsidian' as Theme, name: 'Obsidian', color: 'hsl(210, 100%, 60%)' },
  { id: 'emerald' as Theme, name: 'Emerald', color: 'hsl(160, 100%, 45%)' },
  { id: 'amethyst' as Theme, name: 'Amethyst', color: 'hsl(270, 100%, 65%)' },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('cortex-theme');
    return (saved as Theme) || 'obsidian';
  });

  useEffect(() => {
    localStorage.setItem('cortex-theme', theme);
    
    // Remove all theme classes
    document.documentElement.classList.remove('theme-emerald', 'theme-amethyst');
    
    // Add current theme class (obsidian is default, no class needed)
    if (theme !== 'obsidian') {
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
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
