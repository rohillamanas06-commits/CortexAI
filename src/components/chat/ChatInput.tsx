import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Mic, MicOff, Plus, X, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AVAILABLE_MODELS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)' },
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-2.5-pro-preview-tts', label: 'Gemini 2.5 Pro (TTS)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-exp-image-generation', label: 'Gemini 2.0 Flash (Image Gen)' },
  { value: 'deep-research-pro-preview-12-2025', label: 'Deep Research Pro (Dec 2025)' },
];

interface ChatInputProps {
  onSend: (message: string, image?: string, model?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, isLoading, placeholder = "Ask anything...", autoFocus = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Toggle speech recognition
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

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;
    onSend(message.trim(), selectedImage || undefined, selectedModel);
    setMessage('');
    setSelectedImage(null);
    setImageFile(null);
    // Reset file input to allow uploading another image
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div
      ref={formRef}
      className="border-t border-border bg-background sticky bottom-0 z-20"
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-3 md:p-4 pb-4 md:pb-4">
        {/* Model Selector */}
        <div className="mb-2 flex items-center gap-2">
          <Bot className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[220px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value} className="text-xs">
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModel === 'gemini-2.0-flash-exp-image-generation' && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Image Generation Enabled
            </span>
          )}
        </div>
        
        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img 
              src={selectedImage} 
              alt="Upload preview" 
              className="max-h-32 rounded-lg border border-border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={removeImage}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div 
          className={cn(
            "relative flex items-end gap-2 p-2 rounded-2xl bg-secondary/50 border transition-colors",
            isFocused ? "border-primary/50" : "border-border/50",
            isListening && "border-red-500/50"
          )}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {/* Image upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="h-11 w-11 rounded-xl flex-shrink-0 hover:bg-primary/10 transition-colors"
            title="Upload image"
          >
            <Plus className="w-5 h-5" />
          </Button>
          
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
          <div className="flex items-center gap-1.5 pb-1 md:pb-0">
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
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        <p className="hidden md:block text-xs text-muted-foreground/60 text-center mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </form>
    </div>
  );
}