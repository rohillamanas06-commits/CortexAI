import { useTheme } from '@/contexts/ThemeContext';
import { Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  
  const currentTheme = themes.find(t => t.id === theme);
  
  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.id === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].id);
  };

  return (
    <button
      onClick={cycleTheme}
      className="relative w-10 h-10 rounded-full glass border border-border/50 backdrop-blur-md shadow-lg hover:scale-110 transition-all duration-300 hover:border-primary/50 group"
      title={`Current: ${currentTheme?.name} (click to change)`}
    >
      <div 
        className="absolute inset-1 rounded-full transition-all duration-300"
        style={{ backgroundColor: currentTheme?.color }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Palette className="w-5 h-5 text-white drop-shadow-lg relative z-10 group-hover:rotate-180 transition-transform duration-300" />
      </div>
      <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: currentTheme?.color }} />
    </button>
  );
}
