import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  clickable?: boolean;
}

export function Logo({ size = 'md', showText = true, className, clickable = false }: LogoProps) {
  const sizes = {
    sm: 'w-6 h-6 md:w-8 md:h-8',
    md: 'w-8 h-8 md:w-10 md:h-10',
    lg: 'w-10 h-10 md:w-14 md:h-14',
    xl: 'w-14 h-14 md:w-20 md:h-20',
  };

  const textSizes = {
    sm: 'text-base md:text-lg',
    md: 'text-lg md:text-xl',
    lg: 'text-2xl md:text-3xl',
    xl: 'text-3xl md:text-5xl',
  };

  const logoContent = (
    <>
      <div className={cn("relative", sizes[size])}>
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-accent opacity-50 blur-lg animate-pulse-glow" />
        
        {/* Main logo container */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-primary to-accent p-[2px]">
          <div className="w-full h-full rounded-[10px] bg-background flex items-center justify-center">
            {/* Sparkles/AI icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-3/5 h-3/5"
              stroke="url(#logoGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              <path d="M12 3l2 7h7l-5.5 4.5L18 22l-6-4.5L6 22l2.5-7.5L3 10h7z" fill="url(#logoGradient)" stroke="none" />
              <circle cx="12" cy="12" r="1.5" fill="hsl(var(--background))" />
            </svg>
          </div>
        </div>
      </div>
      
      {showText && (
        <span className={cn(
          "font-bold tracking-tight gradient-text",
          textSizes[size]
        )}>
          Cortex
        </span>
      )}
    </>
  );

  if (clickable) {
    return (
      <Link to="/" className={cn("flex items-center gap-3", className)}>
        {logoContent}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {logoContent}
    </div>
  );
}
