import React, { useState, useEffect, useRef } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Heart, MessageSquare, MapPin, X, Send, Loader2, Trash2 } from 'lucide-react';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Link } from 'react-router-dom';
    import ReactPlayer from 'react-player/lazy';
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

    const PostModal = ({ post, isOpen, onClose }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [isLiked, setIsLiked] = useState(false);
      const [likeCount, setLikeCount] = useState(0);
      const [comments, setComments] = useState([]);
      const [commentCount, setCommentCount] = useState(0);
      const [newComment, setNewComment] = useState('');
      const [isSubmittingComment, setIsSubmittingComment] = useState(false);
      const commentsEndRef = useRef(null);

      useEffect(() => {
        if (post) {
          setIsLiked(post.likes.some(like => like.user_id === user.id));
          setLikeCount(post.likes.length);
          setCommentCount(post.comments.length);
          fetchComments();
        }
      }, [post, user.id]);

      const fetchComments = async () => {
        if (!post) return;
        const { data, error } = await supabase
          .from('comments')
          .select('*, profile:user_id(*)')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true });
        if (!error) {
          setComments(data);
        }
      };

      const handleLike = async () => {
        if (!user) return;
        const currentlyLiked = isLiked;
        setIsLiked(!currentlyLiked);
        setLikeCount(prev => currentlyLiked ? prev - 1 : prev + 1);

        if (currentlyLiked) {
          await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
        } else {
          const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
           if (!error && post.user_id !== user.id) {
              await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'like', post_id: post.id });
          }
        }
      };

      const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);

        const { data, error } = await supabase
          .from('comments')
          .insert({ post_id: post.id, user_id: user.id, content: newComment })
          .select('*, profile:user_id(*)')
          .single();

        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao comentar', description: error.message });
        } else {
          setComments(prev => [...prev, data]);
          setCommentCount(prev => prev + 1);
          
          if (post.user_id !== user.id) {
            await supabase.from('notifications').insert({
              user_id: post.user_id,
              actor_id: user.id,
              type: 'comment',
              post_id: post.id,
              comment_id: data.id,
            });
          }

          setNewComment('');
          setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        setIsSubmittingComment(false);
      };

      const handleDeleteComment = async (commentId) => {
        const { error } = await supabase.from('comments').delete().eq('id', commentId);
        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao apagar comentário', description: error.message });
        } else {
          setComments(prev => prev.filter(c => c.id !== commentId));
          setCommentCount(prev => prev - 1);
          toast({ title: 'Comentário apagado!' });
        }
      };

      const timeAgo = (date) => {
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

      if (!isOpen || !post) return null;
      
      const mainMedia = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null;

      const renderMedia = () => {
        if (!mainMedia) return null;

        if (mainMedia.type === 'youtube') {
          return (
            <div className="w-full h-full aspect-video">
              <ReactPlayer
                url={mainMedia.url}
                width="100%"
                height="100%"
                controls={true}
                playing={true}
              />
            </div>
          );
        }

        if (mainMedia.type === 'video') {
          return <video src={mainMedia.url} className="w-full h-full object-contain" controls autoPlay muted loop />;
        }

        return <img src={mainMedia.url} alt="Post media" className="w-full h-full object-contain" />;
      };


      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full h-full md:rounded-2xl md:max-w-6xl md:h-[90vh] flex flex-col md:flex-row overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:w-3/5 lg:w-2/3 bg-black flex items-center justify-center relative flex-shrink-0">
                {renderMedia()}
              </div>
              <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col h-full">
                <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0 sticky top-0 bg-card z-10">
                  <Link to={`/profile/${post.profile.username}`} className="flex items-center space-x-3 group" onClick={onClose}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profile.avatar_url} alt={post.profile.username} />
                      <AvatarFallback>{post.profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{post.profile.full_name || post.profile.username}</p>
                      <p className="text-xs text-muted-foreground">@{post.profile.username}</p>
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full" onClick={onClose}>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                  {post.content && <p className="text-foreground/90 whitespace-pre-wrap">{post.content}</p>}
                  {post.check_in_locations && (
                    <Link to={`/location/${post.check_in_locations.id}`} className="inline-flex items-center space-x-2 bg-secondary px-3 py-1.5 rounded-full text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      <MapPin className="h-4 w-4" />
                      <span>{post.check_in_locations.place_name}</span>
                    </Link>
                  )}
                  <div className="border-t border-border pt-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex items-start space-x-3 mb-4 group">
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={comment.profile?.avatar_url} />
                           <AvatarFallback>{comment.profile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p>
                            <Link to={`/profile/${comment.profile?.username || ''}`} className="font-semibold text-foreground mr-2 hover:underline">{comment.profile?.username || 'Usuário desconhecido'}</Link>
                            <span className="text-foreground/80">{comment.content}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{timeAgo(comment.created_at)}</p>
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
                                <AlertDialogAction onClick={() => handleDeleteComment(comment.id)} className="bg-destructive hover:bg-destructive/90">Apagar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                </div>

                <div className="p-4 border-t border-border flex-shrink-0 bg-card z-10">
                  <div className="flex space-x-4 mb-2">
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:text-destructive" onClick={handleLike}>
                      <Heart className={`h-5 w-5 ${isLiked ? 'text-destructive fill-current' : ''}`} />
                      <span>{likeCount}</span>
                    </Button>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MessageSquare className="h-5 w-5" />
                      <span>{commentCount}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
                    <Textarea
                      placeholder="Adicione um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-secondary border-none focus:ring-0 focus:ring-offset-0 h-10 resize-none"
                      rows={1}
                    />
                    <Button type="submit" size="icon" className="rounded-full nomad-gradient" disabled={isSubmittingComment}>
                      {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      );
    };

    export default PostModal;