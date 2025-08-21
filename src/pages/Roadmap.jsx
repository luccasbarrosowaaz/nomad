import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Database, UserPlus, Heart, Map, ShoppingBag, MessageSquare, Rocket, CheckCircle, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Roadmap = () => {
  const { toast } = useToast();

  const phases = [
    {
      icon: Database,
      title: 'Fase 1: Fundação & Autenticação',
      description: 'Construímos a base da nossa rede social com um banco de dados real, permitindo que os usuários se cadastrem e façam login.',
      status: 'Concluído',
    },
    {
      icon: UserPlus,
      title: 'Fase 2: Funcionalidades Sociais Essenciais',
      description: 'Implementamos as funções básicas de uma rede social, conectando tudo ao nosso backend.',
      status: 'Concluído',
    },
    {
      icon: Heart,
      title: 'Fase 3: Interatividade e Engajamento',
      description: 'Demos vida à comunidade, permitindo que os usuários interajam entre si e com as publicações.',
       status: 'Concluído',
    },
    {
      icon: Map,
      title: 'Fase 4: Geolocalização e Exploração Avançada',
      description: 'Transformamos a aba "Explorar" em uma ferramenta poderosa com mapas interativos e dados reais.',
      status: 'Concluído',
    },
    {
      icon: ShoppingBag,
      title: 'Fase 5: Marketplace Funcional',
      description: 'Os classificados se tornaram um verdadeiro hub de negócios para a comunidade, com anúncios e contatos reais.',
      status: 'Concluído',
    },
    {
      icon: MessageSquare,
      title: 'Fase 6: Comunicação em Tempo Real',
      description: 'Construímos o sistema de mensagens privadas para que os nômades possam se conectar diretamente.',
      status: 'Concluído',
    },
    {
      icon: Rocket,
      title: 'Fase 7: Lançamento e Otimizações',
      description: 'Com as funcionalidades principais prontas, é hora de polir, testar e preparar para o lançamento!',
      status: 'Concluído',
    },
  ];

  const handlePublish = () => {
    toast({
      title: "🚀 Lançamento!",
      description: "Para publicar seu site, clique no botão 'Publicar' no canto superior direito da tela!",
    });
  };

  return (
    <>
      <Helmet>
        <title>Roteiro de Desenvolvimento - Nomad Connect</title>
        <meta name="description" content="Acompanhe o plano de desenvolvimento e as próximas funcionalidades do Nomad Connect." />
      </Helmet>

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-4xl font-bold nomad-gradient-text mb-2">Nossa Jornada Chegou ao Fim!</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Este foi o nosso mapa para transformar o Nomad Connect em uma plataforma completa e vibrante. Todas as fases foram concluídas com sucesso!</p>
        </motion.div>

        <div className="space-y-6">
          {phases.map((phase, index) => (
            <motion.div key={index} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl flex flex-col md:flex-row gap-6 shadow-md border border-slate-200 dark:border-slate-700/50">
                <div className="flex-shrink-0 flex flex-col items-center md:w-1/4">
                  <div className={`w-16 h-16 rounded-full nomad-gradient flex items-center justify-center mb-3`}><phase.icon className="w-8 h-8 text-white" /></div>
                  <h2 className={`text-lg font-bold text-center text-slate-800 dark:text-white`}>{phase.title}</h2>
                  <span className={`mt-2 px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-500`}>
                    Concluído
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="text-gray-600 dark:text-gray-300">{phase.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5}} className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <PartyPopper className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h4 className="font-semibold text-green-800 dark:text-green-300 text-xl mb-2">Missão Cumprida!</h4>
            <p className="text-sm text-green-700 dark:text-green-200 mb-3">O Nomad Connect está pronto! Todas as funcionalidades foram implementadas. Agora é hora de levar nossa comunidade para o mundo.</p>
            <Button onClick={handlePublish} className="bg-green-500 hover:bg-green-600 text-white">Publicar o Site</Button>
        </motion.div>

      </div>
    </>
  );
};

export default Roadmap;