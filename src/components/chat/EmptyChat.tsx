import { Logo } from '@/components/Logo';
import { Image, FileText, Gift, MoreHorizontal } from 'lucide-react';

interface EmptyChatProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: Image,
    title: "Create image",
    prompt: "Create a beautiful landscape image with mountains and sunset",
  },
  {
    icon: FileText,
    title: "Summarize text",
    prompt: "Summarize the key points from this article or text",
  },
  {
    icon: Gift,
    title: "Surprise me",
    prompt: "Tell me something interesting or surprising",
  },
  {
    icon: MoreHorizontal,
    title: "More",
    prompt: "Show me more options and capabilities",
  },
];

export function EmptyChat({ onSuggestionClick }: EmptyChatProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="text-center max-w-2xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-8 sm:mb-12">
          What can I help with?
        </h2>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md mx-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.prompt)}
              className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/50 hover:border-border transition-all duration-200 text-left"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <suggestion.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-sm sm:text-base font-medium">{suggestion.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
