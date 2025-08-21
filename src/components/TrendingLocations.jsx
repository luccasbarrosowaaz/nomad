import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TrendingLocations = () => {
  const { toast } = useToast();

  const locations = [
    { name: 'Chapada Diamantina', state: 'BA', posts: 234, trend: '+12%' },
    { name: 'Fernando de Noronha', state: 'PE', posts: 189, trend: '+8%' },
    { name: 'Lençóis Maranhenses', state: 'MA', posts: 156, trend: '+15%' },
    { name: 'Bonito', state: 'MS', posts: 143, trend: '+5%' },
    { name: 'Jalapão', state: 'TO', posts: 98, trend: '+22%' }
  ];

  const handleLocationClick = (location) => {
    toast({
      title: "🚧 Funcionalidade em desenvolvimento!",
      description: "Explorar locais estará disponível em breve - solicite na próxima conversa! 🚀",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50"
    >
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold nomad-gradient-text">
          Destinos em Alta
        </h3>
      </div>
      
      <div className="space-y-3">
        {locations.map((location, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 5 }}
            onClick={() => handleLocationClick(location)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/70 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800 dark:text-white">{location.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{location.state} • {location.posts} posts</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-green-500 dark:text-green-400">{location.trend}</span>
            </div>
          </motion.button>
        ))}
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => handleLocationClick({ name: 'Ver mais' })}
        className="w-full mt-4 py-2 text-center text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors text-sm font-medium"
      >
        Ver todos os destinos →
      </motion.button>
    </motion.div>
  );
};

export default TrendingLocations;