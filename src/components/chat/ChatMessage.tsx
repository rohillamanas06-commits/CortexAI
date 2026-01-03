import { cn } from '@/lib/utils';
import { User, Sparkles, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, image, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

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

  const handleCopy = async () => {
    try {
      // Remove image markdown for cleaner copy
      const textContent = content.replace(/!\[.*?\]\(.*?\)/g, '').trim();
      await navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Parse markdown images and text
  const renderContent = () => {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let match;

    // If there's a direct image prop (user uploaded image), show it first
    if (image) {
      parts.push(
        <img
          key="uploaded-image"
          src={image}
          alt="Uploaded"
          loading="lazy"
          className="rounded-xl max-w-full md:max-w-[80%] h-auto my-3 md:my-4 border border-border shadow-sm"
        />
      );
    }

    while ((match = imageRegex.exec(content)) !== null) {
      // Add text before image
      if (match.index > lastIndex) {
        const text = content.slice(lastIndex, match.index);
        parts.push(
          <p key={`text-${lastIndex}`} className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
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
          loading="lazy"
          className="rounded-xl max-w-full md:max-w-[80%] h-auto my-3 md:my-4 border border-border shadow-sm"
        />
      );

      lastIndex = imageRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      const text = content.slice(lastIndex);
      parts.push(
        <p key={`text-${lastIndex}`} className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
          {text}
          {isStreaming && (
            <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse rounded-sm" />
          )}
        </p>
      );
    }

    // If only image with no text
    if (parts.length === 1 && image && !content.trim()) {
      return parts;
    }

    return parts.length > 0 ? parts : (
      <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
        {content}
        {isStreaming && (
          <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse rounded-sm" />
        )}
      </p>
    );
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        "flex gap-3 md:gap-4 px-3 md:px-4 py-4 md:py-6 animate-fade-in",
        isUser ? "bg-transparent" : "bg-secondary/30",
        // Add subtle left border for assistant messages on mobile
        !isUser && "border-l-2 border-primary/20 md:border-l-0"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 md:w-9 md:h-9 rounded-xl shrink-0 flex items-center justify-center",
          isUser
            ? "bg-secondary"
            : "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground" />
        ) : (
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
        {/* Header with name and actions */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            {isUser ? 'You' : 'Cortex'}
          </p>
          
          {/* Action buttons - visible on assistant messages */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1">
              {/* Copy button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className={cn(
                  "h-8 w-8 md:h-7 md:w-7 rounded-lg touch-manipulation",
                  "opacity-60 hover:opacity-100 transition-opacity",
                  isCopied && "text-green-500 opacity-100"
                )}
                title={isCopied ? "Copied!" : "Copy message"}
              >
                {isCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              
              {/* Speak button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                className={cn(
                  "h-8 w-8 md:h-7 md:w-7 rounded-lg touch-manipulation",
                  "opacity-60 hover:opacity-100 transition-opacity",
                  isSpeaking && "text-primary opacity-100"
                )}
                title={isSpeaking ? "Stop speaking" : "Read aloud"}
              >
                {isSpeaking ? (
                  <VolumeX className={cn("w-4 h-4 animate-pulse")} />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Message text */}
        <div className={cn(
          "prose prose-sm md:prose-base max-w-none",
          "prose-p:my-1 prose-p:leading-relaxed",
          // Responsive text size
          "text-[15px] md:text-base",
          // Better word wrapping
          "[overflow-wrap:break-word] [word-break:break-word]"
        )}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
