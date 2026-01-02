import { useState, useRef, useEffect } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  ChevronLeft,
  User,
  X,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
  onClose,
}: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle swipe to delete on mobile
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setSwipingId(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !swipingId) return;
    
    const deltaX = touchStartRef.current.x - e.touches[0].clientX;
    const deltaY = Math.abs(touchStartRef.current.y - e.touches[0].clientY);
    
    // Only swipe if horizontal movement is greater than vertical
    if (deltaX > 10 && deltaY < 30) {
      setSwipeOffset(Math.min(Math.max(deltaX, 0), 80));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60 && swipingId) {
      onDeleteConversation(swipingId);
    }
    setSwipeOffset(0);
    setSwipingId(null);
    touchStartRef.current = null;
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, onClose]);

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "bg-sidebar flex flex-col transition-all duration-300 ease-out",
        // Desktop styles
        !isMobile && "h-full border-r border-sidebar-border",
        !isMobile && (isCollapsed ? "w-16" : "w-72"),
        // Mobile styles - full height drawer with proper overflow
        isMobile && "w-full max-w-[320px] h-[100dvh] max-h-[100dvh] shadow-2xl"
      )}
      style={isMobile ? { 
        height: '100dvh',
        maxHeight: '-webkit-fill-available'
      } : undefined}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border shrink-0",
        isMobile ? "p-4 gap-3 pt-[calc(env(safe-area-inset-top)+1rem)]" : "p-3",
        !isMobile && isCollapsed ? "flex-col gap-3 py-4" : "justify-between"
      )}>
        {isMobile ? (
          <>
            <Logo size="sm" clickable showText />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <>
            <Logo size="sm" clickable showText={!isCollapsed} />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform", isCollapsed && "rotate-180")} />
            </Button>
          </>
        )}
      </div>

      {/* Search (Mobile only or expanded desktop) */}
      {(isMobile || !isCollapsed) && (
        <div className="p-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-9 pr-3 py-2.5 rounded-xl bg-sidebar-accent/50 border border-transparent",
                "text-sm text-sidebar-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:border-primary/50 focus:bg-sidebar-accent",
                "transition-all duration-200",
                isMobile && "py-3 text-base" // Larger touch target on mobile
              )}
            />
          </div>
        </div>
      )}

      {/* New Chat Button */}
      <div className="px-3 pb-3 pt-2 shrink-0">
        <Button
          onClick={() => {
            onNewConversation();
            if (isMobile && onClose) onClose();
          }}
          variant="glass"
          className={cn(
            "w-full justify-start gap-3 border-dashed",
            isCollapsed && !isMobile && "justify-center px-0",
            isMobile && "h-12 text-base" // Larger touch target on mobile
          )}
        >
          <Plus className="w-5 h-5" />
          {(!isCollapsed || isMobile) && <span>New Chat</span>}
        </Button>
      </div>

      {/* Conversations List */}
      <div 
        className={cn(
          "flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1",
          isMobile ? "scrollbar-none touch-pan-y" : "scrollbar-thin"
        )}
        style={isMobile ? { WebkitOverflowScrolling: 'touch' } : undefined}
      >
        {filteredConversations.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No chats found</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="relative overflow-hidden rounded-xl"
              onTouchStart={isMobile ? (e) => handleTouchStart(e, conv.id) : undefined}
              onTouchMove={isMobile ? handleTouchMove : undefined}
              onTouchEnd={isMobile ? handleTouchEnd : undefined}
            >
              {/* Delete background (swipe reveal) */}
              {isMobile && (
                <div className="absolute inset-y-0 right-0 w-20 bg-destructive flex items-center justify-center rounded-r-xl">
                  <Trash2 className="w-5 h-5 text-destructive-foreground" />
                </div>
              )}
              
              <div
                className={cn(
                  "relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group cursor-pointer bg-sidebar",
                  activeConversationId === conv.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 active:bg-sidebar-accent/70",
                  isCollapsed && !isMobile && "justify-center px-0",
                  isMobile && "py-4 gap-4 px-4" // Larger touch target and spacing on mobile
                )}
                style={{
                  transform: swipingId === conv.id ? `translateX(-${swipeOffset}px)` : 'translateX(0)',
                  transition: swipingId === conv.id ? 'none' : 'transform 0.2s ease-out',
                }}
                onClick={() => {
                  onSelectConversation(conv.id);
                  if (isMobile && onClose) onClose();
                }}
              >
                <div className={cn(
                  "rounded-xl shrink-0 flex items-center justify-center shadow-sm",
                  isMobile ? "w-12 h-12" : "w-8 h-8 rounded-lg",
                  activeConversationId === conv.id
                    ? "bg-primary/20"
                    : "bg-sidebar-accent/50"
                )}>
                  <MessageSquare className={cn(isMobile ? "w-6 h-6" : "w-4 h-4")} />
                </div>
                {(!isCollapsed || isMobile) && (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "block font-semibold truncate",
                        isMobile ? "text-base" : "text-sm font-medium"
                      )}>
                        {conv.title}
                      </span>
                    </div>
                    {!isMobile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className={cn(
        "border-t border-sidebar-border p-3 space-y-2 shrink-0 mt-auto",
        isMobile && "pb-6"
      )}>
        {/* User info */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/50",
          isCollapsed && !isMobile && "justify-center px-0",
          isMobile && "py-3"
        )}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            if (isMobile && onClose) onClose();
          }}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            isCollapsed && !isMobile && "justify-center px-0",
            isMobile && "h-11"
          )}
        >
          <LogOut className="w-4 h-4" />
          {(!isCollapsed || isMobile) && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
