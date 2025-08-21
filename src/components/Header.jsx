import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Moon, Sun, Search, Menu, X, LogOut, Settings, User } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/customSupabaseClient';
const Header = ({
  onMenuClick
}) => {
  const {
    theme,
    setTheme
  } = useTheme();
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const notificationsChannel = useRef(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const fetchNotifications = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('notifications').select(`*, actor:actor_id(username, avatar_url)`).eq('user_id', user.id).order('created_at', {
      ascending: false
    }).limit(10);
    if (!error) {
      setNotifications(data);
    }
  };
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const channelName = `realtime-notifications-v2`;
      const channel = supabase.channel(channelName);
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        fetchNotifications();
      }).subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${channelName}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Channel error:', err);
        }
      });
      notificationsChannel.current = channel;
      return () => {
        if (notificationsChannel.current) {
          supabase.removeChannel(notificationsChannel.current);
          notificationsChannel.current = null;
        }
      };
    }
  }, [user]);
  const getNotificationMessage = notification => {
    const actorUsername = notification.actor?.username || 'Alguém';
    switch (notification.type) {
      case 'like':
        return `${actorUsername} curtiu seu post.`;
      case 'comment':
        return `${actorUsername} comentou no seu post.`;
      case 'reply':
        return `${actorUsername} respondeu ao seu comentário.`;
      case 'follow':
        return `${actorUsername} começou a seguir você.`;
      case 'new_message':
        return `${actorUsername} enviou uma nova mensagem.`;
      default:
        return 'Você tem uma nova notificação.';
    }
  };
  const handleNotificationClick = async notification => {
    setIsPopoverOpen(false); // Close popover on click

    // Mark as read in the background
    supabase.from('notifications').update({
      read: true
    }).eq('id', notification.id).then();

    // Navigate
    if (notification.type === 'new_message') {
      navigate('/messages');
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor.username}`);
    } else if (notification.post_id) {
      // Navigate to home and pass post ID in state to open the modal
      navigate(`/`, {
        state: {
          openPostId: notification.post_id
        }
      });
    }

    // Optimistically update UI
    setNotifications(prev => prev.map(n => n.id === notification.id ? {
      ...n,
      read: true
    } : n));
  };
  const unreadCount = notifications.filter(n => !n.read).length;
  return <header className="bg-card/95 backdrop-blur-sm sticky top-0 z-40 w-full border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="https://waaz.com.br/nomad/nomad.gif" alt="Nomad Connect Logo" className="h-10 w-10" />
              <span className="hidden md:inline-block font-bold text-lg text-primary">NOMAD CONNECT</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
             <Link to="/search">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-xs text-primary-foreground items-center justify-center">{unreadCount}</span>
                    </span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                 <div className="p-4">
                  <h4 className="font-medium text-lg mb-4">Notificações</h4>
                  {notifications.length > 0 ? <div className="space-y-2 max-h-96 overflow-y-auto">
                      {notifications.map(n => <div key={n.id} onClick={() => handleNotificationClick(n)} className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${!n.read ? 'bg-primary/10' : 'hover:bg-secondary'}`}>
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage src={n.actor?.avatar_url} />
                            <AvatarFallback>{n.actor?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm flex-1">{getNotificationMessage(n)}</p>
                          {!n.read && <div className="h-2 w-2 rounded-full bg-primary ml-2"></div>}
                        </div>)}
                    </div> : <p className="text-muted-foreground text-center py-8">Nenhuma notificação nova.</p>}
                </div>
              </PopoverContent>
            </Popover>

            <Link to="/messages">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>

            {user && profile && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0 h-10 w-10">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url} alt={profile.username} />
                      <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-bold">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{profile.username}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/profile/${profile.username}`}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>}

            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>;
};
export default Header;