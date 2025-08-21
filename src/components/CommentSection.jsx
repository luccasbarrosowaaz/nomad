import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Comment = ({ comment, onReply, onDelete }) => {
  const { user } = useAuth();

  const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex items-start space-x-3 py-3 group"
    >
      <Link to={`/profile/${comment.profiles.username}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.profiles.avatar_url} />
          <AvatarFallback>{comment.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1">
        <div className="bg-slate-200/70 dark:bg-slate-700/70 rounded-lg px-3 py-2">
          <Link to={`/profile/${comment.profiles.username}`} className="font-semibold text-sm text-slate-800 dark:text-white hover:underline">
            {comment.profiles.full_name}
          </Link>
          <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{timeAgo(comment.created_at)}</p>
          <button onClick={() => onReply(comment)} className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline">Responder</button>
        </div>
      </div>
      {user.id === comment.user_id && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar comentário?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Seu comentário será removido permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(comment.id)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  );
};

const CommentSection = ({ post, initialComments = [], onCommentAdded }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const handleReply = (comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.profiles.username} `);
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    
    const commentData = { 
      post_id: post.id, 
      user_id: user.id, 
      content: newComment,
      parent_comment_id: replyingTo ? replyingTo.id : null,
    };
    
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select('*, profiles(username, avatar_url, full_name)')
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao comentar',
        description: 'Não foi possível enviar seu comentário. Tente novamente.',
      });
    } else {
      setComments(prev => [...prev, data]);
      if(onCommentAdded) {
        onCommentAdded(post.id, data);
      }
      
      if (replyingTo && replyingTo.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: replyingTo.user_id,
          actor_id: user.id,
          type: 'reply',
          post_id: post.id,
          comment_id: replyingTo.id,
        });
      } else if (!replyingTo && post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'comment',
          post_id: post.id,
          comment_id: data.id,
        });
      }

      setNewComment('');
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao apagar comentário', description: error.message });
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: 'Comentário apagado!' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="bg-slate-100/80 dark:bg-slate-800/30 p-4 rounded-b-xl -mt-6 mb-6 overflow-hidden"
    >
      <div className="divide-y divide-slate-200/80 dark:divide-slate-700/80">
        <AnimatePresence>
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} onReply={handleReply} onDelete={handleDeleteComment} />
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3 pt-4 mt-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="relative w-full">
          <Textarea
            placeholder={replyingTo ? `Respondendo a ${replyingTo.profiles.username}...` : "Escreva sua resposta..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-slate-200/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600 pr-12 text-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCommentSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 h-8 w-8"
            disabled={isSubmitting || !newComment.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default CommentSection;