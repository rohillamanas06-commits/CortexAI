import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { EmptyChat } from '@/components/chat/EmptyChat';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Menu } from 'lucide-react';
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

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cortex-conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Don't load conversations from backend - they're stored locally
  // Backend stores them in memory which gets lost on restart
  // useEffect(() => {
  //   if (isAuthenticated && !conversationsLoaded) {
  //     loadConversations();
  //   }
  // }, [isAuthenticated, conversationsLoaded]);

  const loadConversations = async () => {
    try {
      const backendConversations = await chatAPI.getConversations();
      
      // Transform backend conversations to frontend format
      const transformedConversations: Conversation[] = backendConversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        messages: [], // Messages will be loaded when conversation is selected
        createdAt: new Date(conv.created_at),
      }));

      setConversations(transformedConversations);
      setConversationsLoaded(true);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Load conversation messages when a conversation is selected
  const loadConversationMessages = async (conversationId: string) => {
    try {
      const conversation = await chatAPI.getConversation(conversationId);
      
      // Transform messages from backend format
      const messages: Message[] = (conversation.messages || []).map((msg, index) => ({
        id: `${conversationId}-${index}`,
        role: msg.role === 'model' ? 'assistant' : msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Update the conversation with loaded messages
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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
    
    // Load messages for this conversation if not already loaded
    const conversation = conversations.find(c => c.id === id);
    if (conversation && conversation.messages.length === 0) {
      loadConversationMessages(id);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      // Only try to delete from backend if it's a UUID (backend conversation)
      // Otherwise it's a local timestamp ID that only exists in frontend
      const isBackendConversation = id.includes('-');
      
      if (isBackendConversation) {
        await chatAPI.deleteConversation(id);
      }
      
      // Always remove from local state
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      // Still remove from local state even if backend delete fails
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
      
      // Create new conversation if needed
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
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
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
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300",
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
        />
      </div>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-2 px-3 py-3 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            className="shrink-0 h-9 w-9"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 text-base font-semibold truncate">
            {activeConversation?.title || 'New Chat'}
          </h1>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto chat-scroll">
          {!activeConversation?.messages.length ? (
            <EmptyChat onSuggestionClick={handleSendMessage} />
          ) : (
            <div className="max-w-4xl mx-auto">
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput 
          onSend={handleSendMessage} 
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
