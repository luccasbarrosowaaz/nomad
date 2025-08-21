import React, { useState, useEffect, useRef } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { createEvent } from 'ics';
    import { Heart, MessageSquare, MapPin, X, Send, Loader2, Trash2, CalendarPlus, Link as LinkIcon, Share2 } from 'lucide-react';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Link } from 'react-router-dom';
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
    import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

    const EventModal = ({ event, isOpen, onClose }) => {
      const { user, profile } = useAuth();
      const { toast } = useToast();
      const [isLiked, setIsLiked] = useState(false);
      const [likeCount, setLikeCount] = useState(0);
      const [comments, setComments] = useState([]);
      const [commentCount, setCommentCount] = useState(0);
      const [newComment, setNewComment] = useState('');
      const [isSubmittingComment, setIsSubmittingComment] = useState(false);
      const commentsEndRef = useRef(null);

      const fetchEventDetails = async () => {
        if (!event) return;

        const { data: likeData } = await supabase.from('event_likes').select('user_id').eq('event_id', event.id);
        const { data: commentData, count } = await supabase.from('event_comments').select('*, profile:user_id(*)', { count: 'exact' }).eq('event_id', event.id).order('created_at', { ascending: true });

        setIsLiked(likeData?.some(l => l.user_id === user.id) || false);
        setLikeCount(likeData?.length || 0);
        setComments(commentData || []);
        setCommentCount(count || 0);
      };

      useEffect(() => {
        if (isOpen) {
          fetchEventDetails();
        }
      }, [event, isOpen, user.id]);

      const handleLike = async () => {
        if (!user) return;
        const currentlyLiked = isLiked;
        setIsLiked(!currentlyLiked);
        setLikeCount(prev => currentlyLiked ? prev - 1 : prev + 1);

        if (currentlyLiked) {
          await supabase.from('event_likes').delete().match({ event_id: event.id, user_id: user.id });
        } else {
          await supabase.from('event_likes').insert({ event_id: event.id, user_id: user.id });
        }
      };

      const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);

        const { data, error } = await supabase
          .from('event_comments')
          .insert({ event_id: event.id, user_id: user.id, content: newComment })
          .select('*, profile:user_id(*)')
          .single();

        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao comentar', description: error.message });
        } else {
          setComments(prev => [...prev, data]);
          setCommentCount(prev => prev + 1);
          setNewComment('');
          setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        setIsSubmittingComment(false);
      };

      const handleDeleteComment = async (commentId) => {
        const { error } = await supabase.from('event_comments').delete().eq('id', commentId);
        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao apagar comentário' });
        } else {
          setComments(prev => prev.filter(c => c.id !== commentId));
          setCommentCount(prev => prev - 1);
          toast({ title: 'Comentário apagado!' });
        }
      };
      
      const handleAddToCalendar = () => {
        const start = new Date(event.start_time);
        const end = event.end_time ? new Date(event.end_time) : new Date(start.getTime() + (60 * 60 * 1000)); // Default 1 hour duration

        const calendarEvent = {
            title: event.title,
            description: event.description,
            location: event.location_text,
            start: [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()],
            end: [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()],
            url: event.website_url,
        };

        createEvent(calendarEvent, (error, value) => {
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao gerar arquivo do calendário.' });
                return;
            }
            const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
      };

      const handleShare = async () => {
        const eventUrl = `${window.location.origin}/events?eventId=${event.id}`;
        const shareData = {
          title: event.title,
          text: `Confira este evento: ${event.title}`,
          url: eventUrl,
        };

        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (err) {
            console.error("Erro ao compartilhar:", err);
          }
        } else {
          try {
            await navigator.clipboard.writeText(eventUrl);
            toast({ title: "Link do evento copiado!" });
          } catch (err) {
            toast({ variant: "destructive", title: "Falha ao copiar o link" });
          }
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

      if (!isOpen || !event) return null;

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
              <div className="w-full h-64 md:h-full md:w-3/5 lg:w-2/3 bg-black flex items-center justify-center relative flex-shrink-0">
                <img src={event.image_url || 'https://images.unsplash.com/photo-1509930854872-0f61005b282e'} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col h-full">
                <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0 sticky top-0 bg-card z-10">
                  <div>
                     <h1 className="text-xl font-bold">{event.title}</h1>
                     <div className="text-sm text-muted-foreground flex items-center mt-1">
                       <MapPin className="w-4 h-4 mr-1.5"/> {event.location_text}
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full" onClick={onClose}>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                
                <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                  {event.description && <p className="text-foreground/90 whitespace-pre-wrap">{event.description}</p>}
                  <div className="border-t border-border pt-4">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex items-start space-x-3 mb-4 group">
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={comment.profile?.avatar_url} />
                           <AvatarFallback>{comment.profile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p>
                            <Link to={`/profile/${comment.profile?.username || ''}`} className="font-semibold text-foreground mr-2 hover:underline">{comment.profile?.username || 'Usuário'}</Link>
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex space-x-4">
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:text-destructive" onClick={handleLike}>
                        <Heart className={`h-5 w-5 ${isLiked ? 'text-destructive fill-current' : ''}`} />
                        <span>{likeCount}</span>
                      </Button>
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <MessageSquare className="h-5 w-5" />
                        <span>{commentCount}</span>
                      </div>
                    </div>
                     <div className="flex items-center space-x-2">
                        {event.website_url && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a href={event.website_url} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="rounded-full"><LinkIcon className="h-5 w-5" /></Button>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent><p>Visitar site do evento</p></TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleAddToCalendar}><CalendarPlus className="h-5 w-5" /></Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Adicionar à agenda</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleShare}><Share2 className="h-5 w-5" /></Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Compartilhar</p></TooltipContent>
                        </Tooltip>
                     </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{new Date(event.start_time).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
                     <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
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

    export default EventModal;