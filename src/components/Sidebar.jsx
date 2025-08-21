import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Home, Compass as ExploreIcon, MessageSquare, ShoppingBag, LogOut, MapPin, Settings as SettingsIcon, Heart, LifeBuoy, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import CheckInModal from '@/components/CheckInModal';
import { supabase } from '@/lib/customSupabaseClient';

const Sidebar = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && (error.message.includes('Session from session_id claim in JWT does not exist') || error.message.includes("invalid JWT"))) {
        console.warn("Stale session detected. Forcing local logout.");
    } else if (error) {
        toast({
            variant: "destructive",
            title: "Erro ao sair",
            description: error.message,
        });
        return;
    }
    
    navigate('/auth');
    toast({
        title: 'Até logo!',
        description: 'Sua sessão foi encerrada com sucesso.',
    });
  };

  const handleCheckInClick = () => {
    setIsCheckInModalOpen(true);
  };

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: ExploreIcon, label: 'Explorar', path: '/explore' },
    { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
    { icon: ShoppingBag, label: 'Classificados', path: '/marketplace' },
    { icon: CalendarDays, label: 'Agenda de Eventos', path: '/events' },
    { icon: SettingsIcon, label: 'Configurações', path: '/settings' },
    { icon: LifeBuoy, label: 'Feedback e Suporte', path: '/feedback' },
  ];

  if (authLoading || (user && !profile)) {
    return (
      <aside className="w-64 bg-card text-card-foreground p-6 flex-col justify-between hidden border-r border-border h-full">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-secondary rounded-full"></div>
            <div className="h-6 w-32 bg-secondary rounded-md"></div>
          </div>
          <div className="h-10 w-full bg-secondary rounded-md mb-6"></div>
          <div className="space-y-2">
            <div className="h-10 w-full bg-secondary rounded-lg"></div>
            <div className="h-10 w-full bg-secondary rounded-lg"></div>
            <div className="h-10 w-full bg-secondary rounded-lg"></div>
            <div className="h-10 w-full bg-secondary rounded-lg"></div>
            <div className="h-10 w-full bg-secondary rounded-lg"></div>
          </div>
        </div>
        <div className="animate-pulse mt-auto">
            <div className="h-16 bg-secondary rounded-lg mb-4"></div>
            <div className="h-10 w-full bg-secondary rounded-lg"></div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <CheckInModal 
        isOpen={isCheckInModalOpen} 
        setIsOpen={setIsCheckInModalOpen}
        onCheckInSuccess={(location) => navigate('/', { state: { newLocation: location } })}
      />
      <aside className="w-64 bg-card text-card-foreground p-6 flex-col justify-between hidden border-r border-border h-full">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10">
              <img src="https://waaz.com.br/nomad/nomad.gif" alt="Nomad Connect Logo" className="rounded-full logo-fast" />
            </div>
            <h1 className="text-xl font-bold ml-1 nomad-gradient-text">Nomad Connect</h1>
          </Link>
          
          <Button className="w-full nomad-gradient text-white font-bold mb-6" onClick={handleCheckInClick}>
            <MapPin className="h-5 w-5 mr-2" />
            Check-in
          </Button>

          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => {
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center py-2.5 px-4 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <a 
              href="https://apoia.se/nomadconnect" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center py-2.5 px-4 rounded-lg transition-colors duration-200 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Heart className="h-5 w-5 mr-3" />
              <span>Apoia-se</span>
            </a>
          </nav>
        </div>
        
        <div className="mt-auto">
          {user && profile && (
             <Link to={`/profile/${profile.username}`} className="block p-3 bg-secondary rounded-lg mb-4 hover:bg-primary/10 transition-colors">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 rounded-full">
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                  <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-3 overflow-hidden">
                  <p className="font-semibold text-sm text-foreground truncate">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                </div>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;