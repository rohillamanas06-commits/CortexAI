import { cn } from '@/lib/utils';
import { User, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      if (!isSpeaking) {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    }
  };

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
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {isUser ? 'You' : 'Cortex'}
          </p>
          {!isUser && !isStreaming && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSpeak}
              className={cn(
                "h-7 w-7",
                isSpeaking && "text-primary"
              )}
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />
            </Button>
          )}
        </div>
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
