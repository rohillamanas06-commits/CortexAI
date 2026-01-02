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
        // Remove image markdown before speaking
        const textContent = content.replace(/!\[.*?\]\(.*?\)/g, '');
        const utterance = new SpeechSynthesisUtterance(textContent);
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

  // Parse markdown images and text
  const renderContent = () => {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      // Add text before image
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index);
        parts.push(
          <p key={`text-${lastIndex}`} className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        );
      }

      // Add image
      const [, alt, src] = match;
      parts.push(
        <img
          key={`img-${match.index}`}
          src={src}
          alt={alt}
          className="rounded-lg max-w-full h-auto my-4 border border-border"
        />
      );

      lastIndex = imageRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const text = content.slice(lastIndex);
      parts.push(
        <p key={`text-${lastIndex}`} className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse rounded-sm" />
          )}
        </p>
      );
    }

    return parts.length > 0 ? parts : (
      <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
        {content}
        {isStreaming && (
          <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse rounded-sm" />
        )}
      </p>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-4 px-2 sm:px-4 md:px-6 py-3 sm:py-6 animate-fade-in",
        isUser ? "bg-transparent" : "bg-secondary/30"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-6 h-6 sm:w-8 sm:h-8 rounded-lg shrink-0 flex items-center justify-center",
          isUser
            ? "bg-secondary"
            : "bg-gradient-to-br from-primary to-accent"
        )}
      >
        {isUser ? (
          <User className="w-3 h-3 sm:w-4 sm:h-4 text-secondary-foreground" />
        ) : (
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 space-y-1 sm:space-y-2 text-sm sm:text-base">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-medium">
            {isUser ? 'You' : 'Cortex'}
          </p>
          {!isUser && !isStreaming && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSpeak}
              className={cn(
                "h-6 w-6 sm:h-7 sm:w-7",
                isSpeaking && "text-primary"
              )}
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              <Volume2 className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isSpeaking && "animate-pulse")} />
            </Button>
          )}
        </div>
        <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
