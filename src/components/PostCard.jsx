import React, { useState } from 'react';
    import { Link } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Heart, MessageSquare, MapPin, MoreHorizontal, Trash2, Edit, AlertTriangle, PlayCircle } from 'lucide-react';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuTrigger,
    } from "@/components/ui/dropdown-menu";
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
    } from "@/components/ui/alert-dialog";
    import ReactPlayer from 'react-player/lazy';

    const MediaItem = ({ media }) => {
        const isVideo = media.type === 'video' || media.type === 'youtube';

        if (isVideo) {
          return (
            <div className="relative w-full h-full pt-[56.25%] bg-black">
              <ReactPlayer
                url={media.url}
                width="100%"
                height="100%"
                className="absolute top-0 left-0"
                light={true}
                playing={false}
                controls={false}
                playIcon={<PlayCircle className="w-16 h-16 text-white/80" />}
              />
            </div>
          );
        }
        
        return <img src={media.url} alt="Post media" className="w-full h-full object-cover" />;
    };


    const PostCard = ({ post, onPostDeleted, onPostUpdated, onCommentClick }) => {
      const { user } = useAuth();
      const { toast } = useToast();
      const [isLiked, setIsLiked] = useState(post?.likes?.some(like => like.user_id === user?.id) || false);
      const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);
      const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

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

      const handleLike = async () => {
        if (!user) return;
        const currentlyLiked = isLiked;
        setIsLiked(!currentlyLiked);
        setLikeCount(prev => currentlyLiked ? prev - 1 : prev + 1);

        if (currentlyLiked) {
          const { error } = await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
          if (error) {
            setIsLiked(true);
            setLikeCount(prev => prev + 1);
            toast({ variant: 'destructive', title: 'Erro ao descurtir' });
          }
        } else {
          const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
          if (error) {
            setIsLiked(false);
            setLikeCount(prev => prev - 1);
            toast({ variant: 'destructive', title: 'Erro ao curtir' });
          } else {
            if (post.user_id !== user.id) {
                await supabase.from('notifications').insert({ user_id: post.user_id, actor_id: user.id, type: 'like', post_id: post.id });
            }
          }
        }
      };

      const handleDeletePost = async () => {
        if (post.media_urls && post.media_urls.length > 0) {
          const filesToDelete = post.media_urls
            .filter(media => media.type === 'image' || media.type === 'video')
            .map(media => {
                const urlParts = new URL(media.url);
                const pathParts = urlParts.pathname.split('/');
                return pathParts.slice(pathParts.indexOf('post-images') + 1).join('/');
            });
          
          if (filesToDelete.length > 0) {
              const { error: storageError } = await supabase.storage.from('post-images').remove(filesToDelete);
              if (storageError) {
                console.error("Erro ao deletar mídias do storage:", storageError);
                toast({ variant: "destructive", title: "Erro ao deletar mídias", description: storageError.message });
              }
          }
        }

        const { error } = await supabase.from('posts').delete().eq('id', post.id);
        if (error) {
          toast({ variant: "destructive", title: "Erro ao apagar post", description: error.message });
        } else {
          toast({ title: "Post apagado com sucesso!" });
          if (onPostDeleted) {
            onPostDeleted(post.id);
          }
        }
        setIsDeleteAlertOpen(false);
      };

      const handleEdit = () => {
        toast({
          title: "🚧 Em construção!",
          description: "A funcionalidade de editar o post ainda não foi implementada."
        });
      };

      const postProfile = post.profile;
      const hasMedia = post.media_urls && post.media_urls.length > 0;
      
      return (
        <>
          <motion.div
            layout
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl shadow-sm border border-border mb-6"
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <Link to={postProfile ? `/profile/${postProfile.username}` : '#'} className="flex items-center space-x-3 group">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={postProfile?.avatar_url} alt={postProfile?.username} />
                    <AvatarFallback>{postProfile?.username?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{postProfile?.full_name || postProfile?.username || 'Usuário desconhecido'}</p>
                    <p className="text-xs text-muted-foreground">@{postProfile?.username || '...'} · {timeAgo(post.created_at)}</p>
                  </div>
                </Link>
                {user && post.user_id === user.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsDeleteAlertOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Apagar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {(post.content || post.check_in_locations) && (
                  <div className="my-4">
                      {post.content && <p className="text-foreground/90 whitespace-pre-wrap">{post.content}</p>}
                      {post.check_in_locations && (
                        <Link to={`/location/${post.check_in_locations.id}`} className="inline-flex items-center space-x-2 bg-secondary px-3 py-1.5 rounded-full text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors mt-3">
                          <MapPin className="h-4 w-4" />
                          <span>{post.check_in_locations.place_name}</span>
                        </Link>
                      )}
                  </div>
              )}
            </div>
            {hasMedia && (
              <div className="bg-black cursor-pointer overflow-hidden" onClick={() => onCommentClick(post)}>
                {post.media_urls.length > 1 ? (
                    <div className="grid grid-cols-2 gap-0.5">
                        {post.media_urls.map((media, index) => (
                           media && <div key={index} className="w-full h-48 overflow-hidden flex items-center justify-center"><MediaItem media={media} /></div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-auto max-h-[600px] flex items-center justify-center">
                        <MediaItem media={post.media_urls[0]} />
                    </div>
                )}
              </div>
            )}
            <div className="p-4 flex justify-between items-center">
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:text-destructive" onClick={handleLike}>
                  <Heart className={`h-5 w-5 ${isLiked ? 'text-destructive fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground hover:text-primary" onClick={() => onCommentClick(post)}>
                  <MessageSquare className="h-5 w-5" />
                  <span>{post?.comments?.length || 0}</span>
                </Button>
              </div>
            </div>
          </motion.div>

          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 mr-2 text-destructive" />
                    Tem certeza?
                  </div>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso apagará permanentemente seu post e todos os dados associados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sim, apagar post
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    };

    export default PostCard;