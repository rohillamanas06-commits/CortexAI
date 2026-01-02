import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="flex items-center gap-2 p-1 rounded-full bg-secondary/50 border border-border">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={cn(
            "relative w-7 h-7 rounded-full transition-all duration-300 hover:scale-110",
            theme === t.id && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
          )}
          style={{ backgroundColor: t.color }}
          title={t.name}
        >
          {theme === t.id && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: t.color }} />
          )}
        </button>
      ))}
    </div>
  );
}
