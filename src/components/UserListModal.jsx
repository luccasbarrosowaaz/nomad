import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { X } from 'lucide-react';

const UserListModal = ({ isOpen, onClose, title, users }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="sm:max-w-[425px] p-0">
             <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
                {users && users.length > 0 ? (
                    <div className="space-y-4">
                        {users.map((user) => (
                        <Link 
                            to={`/profile/${user.username}`} 
                            key={user.id} 
                            onClick={onClose}
                            className="flex items-center space-x-4 p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.avatar_url} alt={user.username} />
                                <AvatarFallback>{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{user.full_name}</p>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                        </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhum usuário para mostrar.</p>
                )}
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default UserListModal;