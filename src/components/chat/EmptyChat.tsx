import { Logo } from '@/components/Logo';
import { Sparkles, Code, BookOpen, Lightbulb } from 'lucide-react';

interface EmptyChatProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: Code,
    title: "Write code",
    prompt: "Help me write a Python function to sort a list of objects by multiple properties",
  },
  {
    icon: BookOpen,
    title: "Explain concept",
    prompt: "Explain quantum computing in simple terms",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    prompt: "Give me 5 creative startup ideas for the AI industry",
  },
  {
    icon: Sparkles,
    title: "Creative writing",
    prompt: "Write a short poem about the beauty of technology",
  },
];

export function EmptyChat({ onSuggestionClick }: EmptyChatProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8">
      <div className="text-center max-w-2xl mx-auto animate-slide-up w-full">
        <Logo size="sm" showText={false} className="justify-center mb-3 sm:mb-6" />
        
        <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 px-2">
          How can I help you today?
        </h2>
        <p className="text-muted-foreground text-sm sm:text-lg mb-4 sm:mb-10 px-2">
          Start a conversation or try one of these suggestions
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className="glass p-2.5 sm:p-4 rounded-xl text-left hover:border-primary/50 hover:glow-subtle transition-all duration-300 group animate-slide-up active:scale-95"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                  <suggestion.icon className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                <span className="font-medium text-xs sm:text-base">{suggestion.title}</span>
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2">
                {suggestion.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
