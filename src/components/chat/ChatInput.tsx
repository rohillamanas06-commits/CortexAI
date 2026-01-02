import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, isLoading, placeholder = "Ask anything...", autoFocus = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          setMessage((prev) => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handle mobile keyboard visibility with throttling
  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;
    const throttleMs = 100; // Throttle updates to 10fps max

    const handleResize = () => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      // Detect virtual keyboard on mobile
      if (window.visualViewport) {
        rafId = requestAnimationFrame(() => {
          const viewportHeight = window.visualViewport!.height;
          const windowHeight = window.innerHeight;
          const diff = windowHeight - viewportHeight;
          setKeyboardHeight(diff > 100 ? diff : 0);
        });
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  // Auto-resize textarea with RAF for better performance
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        const maxHeight = window.innerWidth < 768 ? 120 : 200;
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
      });
    }
  }, [message]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, isLoading, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // On mobile, Enter should add a new line, not submit
    // On desktop, Enter submits, Shift+Enter adds a new line
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "border-t border-border bg-background/95 shrink-0",
        // Safe area padding for mobile devices with notches
        "pb-4 md:pb-0"
      )}
      style={{
        paddingBottom: keyboardHeight > 0 ? `${Math.max(keyboardHeight, 16)}px` : undefined,
        transform: 'translateZ(0)', // Hardware acceleration
        willChange: isFocused ? 'padding-bottom' : 'auto'
      }}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-3 md:p-4">
        <div 
          className={cn(
            "relative flex items-end gap-1.5 md:gap-2 p-2 rounded-2xl",
            "bg-secondary/50 border",
            isFocused 
              ? "border-primary/50" 
              : "border-border/50",
            isListening && "border-red-500/50",
            "transition-colors duration-150" // Faster, simpler transition
          )}
          style={{ transform: 'translateZ(0)' }}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isListening ? "Listening..." : placeholder}
            rows={1}
            disabled={isLoading}
            className={cn(
              "flex-1 resize-none bg-transparent px-3 md:px-4 py-2.5 md:py-3",
              "text-base md:text-base text-foreground placeholder:text-muted-foreground",
              "focus:outline-none min-h-[44px] md:min-h-[48px]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              // Ensure text is readable size on mobile (prevents auto-zoom)
              "text-[16px] md:text-base"
            )}
            style={{
              // Prevent iOS zoom on focus
              fontSize: '16px',
            }}
          />
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 pb-1 md:pb-0">
            {/* Voice input button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              disabled={isLoading}
              className={cn(
                "shrink-0 h-11 w-11 rounded-xl touch-manipulation",
                isListening && "text-red-500 bg-red-500/10"
              )}
              title={isListening ? "Stop recording" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            {/* Send button */}
            <Button
              type="submit"
              variant={message.trim() ? "glow" : "ghost"}
              size="icon"
              disabled={!message.trim() || isLoading}
              className={cn(
                "shrink-0 h-11 w-11 rounded-xl touch-manipulation",
                !message.trim() && "opacity-50"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile hint - tap send button */}
        <p className="md:hidden text-[11px] text-muted-foreground/70 text-center mt-2">
          Tap send or use voice input
        </p>
        
        {/* Desktop hint */}
        <p className="hidden md:block text-xs text-muted-foreground text-center mt-3">
          Press Enter to send • Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
