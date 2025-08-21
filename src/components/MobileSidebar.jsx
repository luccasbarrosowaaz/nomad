import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Compass as ExploreIcon, MessageSquare, ShoppingBag, X, MapPin, LogOut, Settings as SettingsIcon, Heart, LifeBuoy, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import CheckInModal from '@/components/CheckInModal';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
const MobileSidebar = ({
  isOpen,
  onClose
}) => {
  const {
    user,
    profile,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const navItems = [{
    icon: Home,
    label: 'Início',
    path: '/'
  }, {
    icon: ExploreIcon,
    label: 'Explorar',
    path: '/explore'
  }, {
    icon: MessageSquare,
    label: 'Mensagens',
    path: '/messages'
  }, {
    icon: ShoppingBag,
    label: 'Classificados',
    path: '/marketplace'
  }, {
    icon: CalendarDays,
    label: 'Agenda de Eventos',
    path: '/events'
  }, {
    icon: SettingsIcon,
    label: 'Configurações',
    path: '/settings'
  },
  { icon: LifeBuoy, label: 'Feedback e Suporte', path: '/feedback' },
];
  const handleNavigate = path => {
    if (path && path !== '#') {
      navigate(path);
      onClose();
    }
  };
  const handleCheckInClick = () => {
    onClose();
    setIsCheckInModalOpen(true);
  };
  const handleSignOut = async () => {
    onClose();
    const {
      error
    } = await supabase.auth.signOut();
    if (error && (error.message.includes('Session from session_id claim in JWT does not exist') || error.message.includes("invalid JWT"))) {
      console.warn("Stale session detected. Forcing local logout.");
    } else if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message
      });
      return;
    }
    navigate('/auth');
    toast({
      title: 'Até logo!',
      description: 'Sua sessão foi encerrada com sucesso.'
    });
  };
  return <>
          <CheckInModal isOpen={isCheckInModalOpen} setIsOpen={setIsCheckInModalOpen} onCheckInSuccess={location => navigate('/', {
      state: {
        newLocation: location
      }
    })} />
          <AnimatePresence>
            {isOpen && <>
                <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} exit={{
          opacity: 0
        }} transition={{
          duration: 0.3
        }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden" onClick={onClose} />
                <motion.aside initial={{
          x: '100%'
        }} animate={{
          x: 0
        }} exit={{
          x: '100%'
        }} transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }} className="fixed top-0 right-0 h-full w-64 bg-card text-card-foreground p-6 flex flex-col z-50">
                  <div>
                    <div className="flex items-center justify-between mb-10">
                      <Link to="/" className="flex items-center" onClick={onClose}>
                        <div className="w-10 h-10">
                          <img src="https://waaz.com.br/nomad/nomad.gif" alt="Nomad Connect Logo" className="rounded-full logo-fast" />
                        </div>
                        <h1 className="text-xl font-bold ml-3 nomad-gradient-text">Nomad Connect</h1>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                    
                    <Button className="w-full nomad-gradient text-white font-bold mb-6" onClick={handleCheckInClick}>
                      <MapPin className="h-5 w-5 mr-2" />
                      Check-in
                    </Button>

                    <nav className="flex flex-col space-y-2">
                      {navItems.map(item => {
                return <button key={item.label} onClick={() => handleNavigate(item.path)} className={`flex items-center py-2.5 px-4 rounded-lg transition-colors duration-200 w-full text-left ${window.location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
                            <item.icon className="h-5 w-5 mr-3" />
                            <span>{item.label}</span>
                          </button>;
              })}
                      <a href="https://apoia.se/nomadconnect" target="_blank" rel="noopener noreferrer" className="flex items-center py-2.5 px-4 rounded-lg transition-colors duration-200 w-full text-left text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <Heart className="h-5 w-5 mr-3" />
                        <span>Apoia-se</span>
                      </a>
                    </nav>
                  </div>
                  <div className="mt-auto">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={handleSignOut}>
                      <LogOut className="h-5 w-5 mr-3" />
                      Sair
                    </Button>
                  </div>
                </motion.aside>
              </>}
          </AnimatePresence>
        </>;
};
export default MobileSidebar;