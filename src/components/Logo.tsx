import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useId } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  clickable?: boolean;
}

export function Logo({ size = 'md', showText = true, className, clickable = false }: LogoProps) {
  const gradientId = useId();
  
  const sizes = {
    sm: 'w-8 h-8 md:w-9 md:h-9',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-12 h-12 md:w-16 md:h-16',
    xl: 'w-16 h-16 md:w-20 md:h-20',
  };

  const textSizes = {
    sm: 'text-base md:text-lg',
    md: 'text-lg md:text-xl',
    lg: 'text-2xl md:text-3xl',
    xl: 'text-3xl md:text-5xl',
  };

  const borderRadius = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  };

  const innerRadius = {
    sm: 'rounded-[6px]',
    md: 'rounded-[10px]',
    lg: 'rounded-[10px]',
    xl: 'rounded-[14px]',
  };

  const strokeWidth = {
    sm: '1.8',
    md: '1.5',
    lg: '1.5',
    xl: '1.5',
  };

  const logoContent = (
    <>
      <div className={cn("relative", sizes[size])}>
        {/* Outer glow ring */}
        <div className={cn("absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-50 blur-lg animate-pulse-glow", borderRadius[size])} />
        
        {/* Main logo container */}
        <div className={cn("relative w-full h-full bg-gradient-to-br from-primary to-accent p-[2px]", borderRadius[size])}>
          <div className={cn("w-full h-full bg-background flex items-center justify-center", innerRadius[size])}>
            {/* Brain/Neural icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-3/5 h-3/5"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth[size]}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3v1a3 3 0 0 1-1.5 2.6 3 3 0 0 1 .5 1.4v1a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-1a3 3 0 0 1 .5-1.4A3 3 0 0 1 5 11v-1a3 3 0 0 1 3-3V6a4 4 0 0 1 4-4z" />
              <circle cx="9" cy="10" r="1" fill="hsl(var(--primary))" />
              <circle cx="15" cy="10" r="1" fill="hsl(var(--accent))" />
              <path d="M9 14h6" />
              <path d="M12 6v4" />
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
