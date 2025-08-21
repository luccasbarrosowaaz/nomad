import React, { useEffect } from 'react';
    import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { Toaster } from '@/components/ui/toaster';
    import Layout from '@/components/Layout';
    import Home from '@/pages/Home';
    import Profile from '@/pages/Profile';
    import Explore from '@/pages/Explore';
    import LocationPage from '@/pages/LocationPage';
    import Messages from '@/pages/Messages';
    import Marketplace from '@/pages/Marketplace';
    import Settings from '@/pages/Settings';
    import Auth from '@/pages/Auth';
    import SearchPage from '@/pages/SearchPage';
    import Feedback from '@/pages/Feedback';
    import EventsCalendar from '@/pages/EventsCalendar';
    import CmsPage from '@/pages/CmsPage';
    import { useAuth, AuthProvider } from '@/contexts/SupabaseAuthContext';
    import { ThemeProvider } from '@/contexts/ThemeContext';
    import { useToast } from './components/ui/use-toast';
    import { supabase } from './lib/customSupabaseClient';
    import { TooltipProvider } from './components/ui/tooltip';

    const PrivateRoute = ({ children }) => {
      const { user, profile, loading } = useAuth();
      const location = useLocation();

      if (loading) {
        return (
          <div className="flex justify-center items-center h-screen bg-background">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
          </div>
        );
      }

      if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
      }

      if (user && profile && !profile.username && location.pathname !== '/settings') {
        return <Navigate to="/settings" state={{ from: location, message: 'Complete seu perfil para continuar.' }} replace />;
      }

      return children;
    };

    const SessionGuardian = () => {
      const navigate = useNavigate();
      const { toast } = useToast();

      useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "TOKEN_REFRESHED" && !session) {
            console.error("Token refresh failed, session is null. Forcing logout.");
            supabase.auth.signOut();
            navigate('/auth');
            toast({
              variant: 'destructive',
              title: 'Sessão Expirada',
              description: 'Sua sessão expirou. Por favor, faça login novamente.',
            });
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      }, [navigate, toast]);

      return null;
    };

    const AppContent = () => {
      return (
        <>
          <Helmet>
            <title>Nomad Connect - Rede Social para Viajantes Aventureiros</title>
            <meta name="description" content="Conecte-se com viajantes aventureiros, compartilhe suas jornadas, descubra novos destinos e encontre companheiros de estrada no Nomad Connect!" />
            <link rel="icon" type="image/gif" href="https://waaz.com.br/nomad/nomad.gif" />
            <meta name="theme-color" content="#00A9E0" />
          </Helmet>
          
          <SessionGuardian />
          <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/cms" element={<CmsPage />} />
              <Route 
                path="/*"
                element={
                  <PrivateRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/profile/:username" element={<Profile />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/location/:locationId" element={<LocationPage />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/feedback" element={<Feedback />} />
                        <Route path="/events" element={<EventsCalendar />} />
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>
                    </Layout>
                  </PrivateRoute>
                }
              />
            </Routes>
            <Toaster />
          </div>
        </>
      )
    }

    function App() {
      return (
        <ThemeProvider>
            <TooltipProvider>
              <Router>
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
              </Router>
            </TooltipProvider>
        </ThemeProvider>
      );
    }

    export default App;