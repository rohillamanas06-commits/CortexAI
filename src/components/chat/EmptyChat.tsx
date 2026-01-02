import { Logo } from '@/components/Logo';
import { Sparkles, Code, BookOpen, Lightbulb, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface EmptyChatProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: Code,
    title: "Write code",
    prompt: "Help me write a Python function to sort a list of objects by multiple properties",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BookOpen,
    title: "Explain concept",
    prompt: "Explain quantum computing in simple terms",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    prompt: "Give me 5 creative startup ideas for the AI industry",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Sparkles,
    title: "Creative writing",
    prompt: "Write a short poem about the beauty of technology",
    color: "from-green-500 to-emerald-500",
  },
];

export function EmptyChat({ onSuggestionClick }: EmptyChatProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Handle scroll snap for mobile carousel
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const cardWidth = scrollContainerRef.current.offsetWidth * 0.75; // 75% card width
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(newIndex, suggestions.length - 1));
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      <div className="text-center w-full max-w-2xl mx-auto">
        {/* Logo and Title */}
        <div className="animate-slide-up">
          {/* Sparkles Icon */}
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent opacity-50 blur-lg animate-pulse-glow" />
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary to-accent p-[2px]">
                <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center">
                  <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3">
            How can I help you today?
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg mb-6 md:mb-10 px-4">
            Start a conversation or try one of these suggestions
          </p>
        </div>

        {/* Mobile: Horizontal scrollable cards */}
        <div className="md:hidden w-full">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={cn(
              "flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 px-2",
              "scrollbar-none -mx-4",
              // Hide scrollbar
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            )}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion.prompt)}
                className={cn(
                  "flex-shrink-0 w-[75%] snap-center first:ml-4 last:mr-4",
                  "glass p-4 rounded-2xl text-left",
                  "active:scale-[0.98] transition-transform duration-150",
                  "border border-border/50 hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    "bg-gradient-to-br",
                    suggestion.color
                  )}>
                    <suggestion.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-base">{suggestion.title}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {suggestion.prompt}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                  <span>Try this</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>

          {/* Carousel indicators */}
          <div className="flex justify-center gap-1.5 mt-2">
            {suggestions.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === activeIndex 
                    ? "w-6 bg-primary" 
                    : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className={cn(
                "glass p-5 rounded-2xl text-left",
                "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
                "transition-all duration-300 group",
                "border border-border/50"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br transition-transform group-hover:scale-110",
                  suggestion.color
                )}>
                  <suggestion.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold">{suggestion.title}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {suggestion.prompt}
              </p>
            </button>
          ))}
        </div>

        {/* Keyboard shortcut hint - desktop only */}
        <p className="hidden md:block text-xs text-muted-foreground/60 mt-8">
          Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-[10px]">/</kbd> to focus input
        </p>
      </div>
    </div>
  );
}
