import { useState, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const formRef = useRef<HTMLDivElement>(null);

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

  // Scroll input into view when keyboard appears on mobile
  useEffect(() => {
    if (isFocused && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }
  }, [isFocused]);

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

  const handleSubmit = () => {
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
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = window.innerWidth < 768 ? 100 : 200;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [message]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage('');
    if (texformRef}
      className="border-t border-border bg-background sticky bottom-0 z-20"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-3 md:p-4 pb-4 md:pb-4">
        <div 
          className={cn(
            "relative flex items-end gap-2 p-2 rounded-2xl bg-secondary/50 border transition-colors",
            isFocused ? "border-primary/50" : "border-border/50",
            isListening && "border-red-500/50"
          )t.value)}
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
              size="icon"4 py-3 text-foreground placeholder:text-muted-foreground",
              "focus:outline-none min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{ fontSize: '16px'     <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
<div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              disabled={isLoading}
              className={cn(
                "h-11 w-11 rounded-xl",
                isListening && "text-red-500 bg-red-500/10"
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              type="submit"
              variant={message.trim() ? "glow" : "ghost"}
              size="icon"
              disabled={!message.trim() || isLoading}
              className={cn(
                "h-11 w-11 rounded-xl",
                !message.trim() && "opacity-50"
              )}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />        
        <p className="hidden md:block text-xs text-muted-foreground/60 text-center mt-2