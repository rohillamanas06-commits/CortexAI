import { useState, useRef, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { Button } from '@/components/ui/button';
import { Menu, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatAPI, imageAPI } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function Chat() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('cortex-conversations');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; time: number } | null>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cortex-conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Handle swipe gesture to open sidebar on mobile
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only track touches starting from the left edge
    if (e.touches[0].clientX < 30) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        time: Date.now(),
      };
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // Quick swipe from left edge
    if (deltaX > 80 && deltaTime < 300) {
      setMobileSidebarOpen(true);
    }
    
    touchStartRef.current = null;
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const loadConversations = async () => {
    try {
      const backendConversations = await chatAPI.getConversations();
      
      const transformedConversations: Conversation[] = backendConversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        messages: [],
        createdAt: new Date(conv.created_at),
      }));

      setConversations(transformedConversations);
      setConversationsLoaded(true);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const conversation = await chatAPI.getConversation(conversationId);
      
      const messages: Message[] = (conversation.messages || []).map((msg, index) => ({
        id: `${conversationId}-${index}`,
        role: msg.role === 'model' ? 'assistant' : msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? { ...c, messages }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, streamingContent]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMobileSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileSidebarOpen(false);
    
    const conversation = conversations.find(c => c.id === id);
    if (conversation && conversation.messages.length === 0) {
      loadConversationMessages(id);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const isBackendConversation = id.includes('-');
      
      if (isBackendConversation) {
        await chatAPI.deleteConversation(id);
      }
      
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    }
  };

  const simulateStreaming = async (response: string) => {
    setStreamingContent('');
    const words = response.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
      setStreamingContent(prev => prev + (i === 0 ? '' : ' ') + words[i]);
    }
    
    return response;
  };

  const handleSendMessage = async (content: string) => {
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
      };

      let conversationId = activeConversationId;
      
      if (!conversationId) {
        conversationId = Date.now().toString();
        const newConversation: Conversation = {
          id: conversationId,
          title: content.slice(0, 40) + (content.length > 40 ? '...' : ''),
          messages: [userMessage],
          createdAt: new Date(),
        };
        setConversations(prev => [newConversation, ...prev]);
        setActiveConversationId(conversationId);
      } else {
        setConversations(prev =>
          prev.map(c =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, userMessage] }
              : c
          )
        );
      }

      setIsLoading(true);
      setStreamingContent('');
      
      // Send chat message with streaming
      let fullResponse = '';

      chatAPI.streamMessage(
        content,
        conversationId,
        undefined,
        undefined,
        (chunk: string) => {
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        },
        (response: string) => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
          };

          setConversations(prev =>
            prev.map(c =>
              c.id === conversationId
                ? { ...c, messages: [...c.messages, assistantMessage] }
                : c
            )
          );

          setStreamingContent('');
          setIsLoading(false);
        },
        (error: string) => {
          console.error('Chat error:', error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error}`,
          };

          setConversations(prev =>
            prev.map(c =>
              c.id === conversationId
                ? { ...c, messages: [...c.messages, errorMessage] }
                : c
            )
          );

          setStreamingContent('');
          setIsLoading(false);
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setStreamingContent('');
    }
  };

  return (
    <div className={cn(
      "h-[100dvh] flex bg-background overflow-hidden",
      // Use dynamic viewport height for mobile browsers
      "supports-[height:100dvh]:h-[100dvh]"
    )}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block h-full">
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          mobileSidebarOpen 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            mobileSidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileSidebarOpen(false)}
        />
        
        {/* Sidebar Panel */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[85%] max-w-[320px] transition-transform duration-300 ease-out",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            isCollapsed={false}
            onToggleCollapse={() => setMobileSidebarOpen(false)}
            isMobile={true}
            onClose={() => setMobileSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Header */}
        <header className={cn(
          "md:hidden flex items-center justify-between gap-3 px-4 py-4 border-b border-border shrink-0",
          "bg-background/95 backdrop-blur-xl sticky top-0 z-10",
          // Safe area for notched phones
          "pt-[calc(env(safe-area-inset-top)+0.75rem)]"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            className="h-11 w-11 shrink-0 touch-manipulation"
          >
            <Menu className="w-6 h-6" />
          </Button>
          
          <h1 className="flex-1 text-left font-semibold truncate text-base">
            {activeConversation?.title || 'New Chat'}
          </h1>
          
          {/* Spacer to balance layout */}
          <div className="w-11 shrink-0" />
        </header>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden",
            // Smooth scrolling
            "scroll-smooth",
            // Custom scrollbar
            "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          )}
        >
          {!activeConversation?.messages.length ? (
            <div className="h-full flex flex-col">
              <EmptyChat onSuggestionClick={handleSendMessage} />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto pb-4">
              {activeConversation.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {isLoading && streamingContent && (
                <ChatMessage
                  role="assistant"
                  content={streamingContent}
                  isStreaming
                />
              )}
              {isLoading && !streamingContent && (
                <div className="flex gap-3 md:gap-4 px-3 md:px-4 py-4 md:py-6">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold">Cortex</p>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area - Always visible */}
        <ChatInput 
          onSend={handleSendMessage} 
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
