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
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 md:pb-0">
      <div className="text-center max-w-2xl mx-auto animate-slide-up">
        <Logo size="xl" showText={false} className="justify-center mb-4 md:mb-6" />
        
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          How can I help you today?
        </h2>
        <p className="text-muted-foreground text-base md:text-lg md:mb-10">
          Start a conversation or try one of these suggestions
        </p>

        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className="glass p-4 rounded-xl text-left hover:border-primary/50 hover:glow-subtle transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <suggestion.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">{suggestion.title}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {suggestion.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
