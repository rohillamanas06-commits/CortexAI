import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  LogOut, 
  Settings, 
  ChevronLeft,
  User,
  Search,
  Image,
  Grid3x3,
  FolderOpen,
  Edit
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-72 md:w-72"
      )}
    >
      {/* Header with Search */}
      <div className={cn(
        "p-3 border-b border-sidebar-border shrink-0",
        isCollapsed && "px-2"
      )}>
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Logo size="sm" clickable showText />
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="text-sidebar-foreground hover:bg-sidebar-accent hidden md:flex"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-sidebar-accent/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 h-10 rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Logo size="sm" clickable showText={false} />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </Button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={cn("p-2 shrink-0 space-y-1", isCollapsed && "px-1")}>
        <Button
          onClick={onNewConversation}
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-11",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Edit className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">New chat</span>}
        </Button>
        
        {!isCollapsed && (
          <>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
            >
              <Image className="w-5 h-5" />
              <span>Images</span>
              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">NEW</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
            >
              <Grid3x3 className="w-5 h-5" />
              <span>Apps</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11"
            >
              <FolderOpen className="w-5 h-5" />
              <span>New project</span>
            </Button>
          </>
        )}
      </div>

      {/* Conversations List */}
      <div className={cn(
        "flex-1 overflow-y-auto px-2 py-1 space-y-0.5",
        "scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent"
      )}>
        {filteredConversations.map((conv) => (
          <div
            key={conv.id}
            onMouseEnter={() => setHoveredId(conv.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group cursor-pointer",
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

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1.5 shrink-0">
        {/* User info */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer transition-colors",
          isCollapsed && "justify-center px-0"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
