import { cn } from '@/lib/utils';
import { User, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        "flex gap-4 px-4 py-6 animate-fade-in",
        isUser ? "bg-transparent" : "bg-secondary/30"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center",
          isUser
            ? "bg-secondary"
            : "bg-gradient-to-br from-primary to-accent"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-secondary-foreground" />
        ) : (
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-medium">
          {isUser ? 'You' : 'Cortex'}
        </p>
        <div className="prose prose-invert max-w-none">
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse rounded-sm" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
