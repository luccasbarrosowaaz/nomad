import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from '@/components/LoginForm';
import { SignUpForm } from '@/components/SignUpForm';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const backgroundImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80', // Mountain landscape
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1920&q=80', // Road by the lake
  'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?auto=format&fit=crop&w=1920&q=80', // Airport
  'https://images.unsplash.com/photo-1507525428034-b723a996f3ea?auto=format&fit=crop&w=1920&q=80', // Beach
  'https://images.unsplash.com/photo-1444703686981-a3abbc4d42e2?auto=format&fit=crop&w=1920&q=80', // Camping under stars
  'https://images.unsplash.com/photo-1499591934133-2e56b4161843?auto=format&fit=crop&w=1920&q=80', // Bus station vibe
];

const BackgroundSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 7000); // Change image every 7 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImages[index]})` }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/40"></div>
    </div>
  );
};

const Auth = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <Helmet>
        <title>Acesso | Nomad Connect</title>
        <meta name="description" content="Entre ou crie sua conta no Nomad Connect e comece sua aventura." />
      </Helmet>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <BackgroundSlider />
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md z-10"
        >
          <div className="bg-card/80 dark:bg-card/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                <img alt="Nomad Connect Logo" src="https://waaz.com.br/nomad/nomad.gif" className="rounded-full logo-fast" />
              </div>
              <h1 className="text-3xl font-bold nomad-gradient-text">NOMAD CONNECT</h1>
              <p className="text-muted-foreground mt-2">A rede social dos Viajantes</p>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/60 dark:bg-secondary/50 text-muted-foreground">
                <TabsTrigger value="login" className="data-[state=active]:bg-background/80 data-[state=active]:text-foreground">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-background/80 data-[state=active]:text-foreground">Cadastrar</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm />
              </TabsContent>
              <TabsContent value="signup">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Auth;