import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  Settings, 
  ChevronLeft,
  User
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
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const { user, logout } = useAuth();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64 sm:w-72"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center p-4 border-b border-sidebar-border",
        isCollapsed ? "flex-col gap-3" : "justify-between"
      )}>
        <Logo size="sm" clickable showText={!isCollapsed} />
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          variant="glass"
          className={cn(
            "w-full justify-start gap-3 border-dashed",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Conversations List */}
      <div className="max-h-[50vh] overflow-y-auto scrollbar-thin px-3 py-2 space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onMouseEnter={() => setHoveredId(conv.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer",
              activeConversationId === conv.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              isCollapsed && "justify-center px-0"
            )}
            onClick={() => onSelectConversation(conv.id)}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-sm truncate">
                  {conv.title}
                </span>
                {hoveredId === conv.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Spacer to push footer down */}
      <div className="flex-1 min-h-0" />

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* User info */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/50",
          isCollapsed && "justify-center px-0"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
