import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Stories = () => {
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleStoryClick = () => {
    toast({
        title: "Criar um novo Story!",
        description: "Esta funcionalidade será incrível, mas ainda está em desenvolvimento.",
    });
  };

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-slate-800/50 p-4 rounded-xl mb-6 shadow-sm border border-slate-200 dark:border-slate-700/50"
    >
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStoryClick}
          className="flex flex-col items-center space-y-2 min-w-[70px]"
        >
          <div className="relative w-16 h-16">
            <Avatar className="w-16 h-16 border-2 border-dashed border-blue-500 p-0.5">
              <AvatarImage src={profile.avatar_url} alt="Seu Story" className="rounded-full" />
              <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>
          <span className="text-xs text-slate-700 dark:text-white font-medium truncate w-full text-center">
            Seu Story
          </span>
        </motion.button>
        {/* Placeholder for friends' stories can be added here when the data is available */}
      </div>
    </motion.div>
  );
};

export default Stories;