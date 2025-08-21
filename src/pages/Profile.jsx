import React, { useEffect, useState, useCallback } from 'react';
    import { useParams, Link, useNavigate } from 'react-router-dom';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Calendar, MapPin, Edit, UserPlus, Mail, UserMinus, Link as LinkIcon, Youtube, Instagram, Lock } from 'lucide-react';

    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useProfileStore } from '@/hooks/useProfile';
    import { useToast } from '@/components/ui/use-toast';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import PostCard from '@/components/PostCard';
    import PostModal from '@/components/PostModal';
    import UserListModal from '@/components/UserListModal';
    import { FaTiktok, FaFacebook } from 'react-icons/fa';

    const Profile = () => {
      const { username } = useParams();
      const { user: currentUser, loading: authLoading } = useAuth();
      const { profile: currentProfile } = useProfileStore();
      const { toast } = useToast();
      const navigate = useNavigate();

      const [profileData, setProfileData] = useState(null);
      const [posts, setPosts] = useState([]);
      const [pageLoading, setPageLoading] = useState(true);
      const [isFollowing, setIsFollowing] = useState(false);
      const [followers, setFollowers] = useState([]);
      const [following, setFollowing] = useState([]);
      const [activeTab, setActiveTab] = useState("aventuras");
      const [selectedPost, setSelectedPost] = useState(null);
      const [isOwnProfile, setIsOwnProfile] = useState(false);
      const [userListModal, setUserListModal] = useState({ isOpen: false, title: '', users: [] });
      const [canViewProfile, setCanViewProfile] = useState(false);

      const fetchProfileData = useCallback(async (profileUsername) => {
        if (!profileUsername) {
          setPageLoading(false);
          return;
        }
        setPageLoading(true);

        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, location, created_at, cover_url, website_url, youtube_url, instagram_url, tiktok_url, facebook_url, is_private')
          .eq('username', profileUsername)
          .single();

        if (profileError || !profileResult) {
          toast({ variant: 'destructive', title: 'Perfil não encontrado' });
          setProfileData(null);
          setPageLoading(false);
          navigate('/');
          return;
        }
        
        setProfileData(profileResult);
        const ownProfile = currentUser?.id === profileResult.id;
        setIsOwnProfile(ownProfile);

        const [
            followersResponse,
            followingResponse,
            followStatusResponse
        ] = await Promise.all([
            supabase.from('followers').select(`profile:follower_id(id, username, full_name, avatar_url)`).eq('following_id', profileResult.id),
            supabase.from('followers').select(`profile:following_id(id, username, full_name, avatar_url)`).eq('follower_id', profileResult.id),
            currentUser && !ownProfile
                ? supabase.from('followers').select('*', { count: 'exact' }).eq('follower_id', currentUser.id).eq('following_id', profileResult.id)
                : Promise.resolve({ data: [], error: null })
        ]);
        
        const followingUser = followStatusResponse.data?.length > 0;
        setIsFollowing(followingUser);

        const canView = !profileResult.is_private || ownProfile || followingUser;
        setCanViewProfile(canView);

        if (canView) {
            const { data: postsResponse, error: postsError } = await supabase.from('posts').select(`*, profile:user_id(*), likes(user_id), comments(id), check_in_locations(*)`).eq('user_id', profileResult.id).order('created_at', { ascending: false });
            if (postsError) toast({ variant: 'destructive', title: 'Erro ao carregar posts', description: postsError.message });
            else setPosts(postsResponse || []);
        } else {
            setPosts([]);
        }

        if (followersResponse.error) toast({ variant: 'destructive', title: 'Erro ao carregar seguidores' });
        else setFollowers(followersResponse.data.map(f => f.profile).filter(Boolean));
        
        if (followingResponse.error) toast({ variant: 'destructive', title: 'Erro ao carregar quem o usuário segue' });
        else setFollowing(followingResponse.data.map(f => f.profile).filter(Boolean));

        setPageLoading(false);
      }, [toast, navigate, currentUser]);

      useEffect(() => {
        if (authLoading) return;
        const targetUsername = username || currentProfile?.username;

        if (targetUsername) {
          fetchProfileData(targetUsername);
        } else if (!authLoading && !currentUser) {
          navigate('/auth');
        }
      }, [username, currentProfile, currentUser, authLoading, fetchProfileData, navigate]);

      const handleFollowToggle = async () => {
        if (!profileData || !currentUser) return;
        if (isFollowing) {
          const { error } = await supabase
            .from('followers')
            .delete()
            .match({ follower_id: currentUser.id, following_id: profileData.id });
          if (!error) {
            setIsFollowing(false);
            setFollowers(f => f.filter(follower => follower.id !== currentUser.id));
            fetchProfileData(profileData.username); // Re-fetch to update view status
          }
        } else {
          const { error } = await supabase
            .from('followers')
            .insert({ follower_id: currentUser.id, following_id: profileData.id });
          if (!error) {
            setIsFollowing(true);
            if (currentProfile) {
                setFollowers(f => [...f, currentProfile]);
            }
            await supabase.from('notifications').insert({ user_id: profileData.id, actor_id: currentUser.id, type: 'follow' });
            fetchProfileData(profileData.username); // Re-fetch to update view status
          }
        }
      };
      
      const showUserList = (type) => {
        if (type === 'followers') {
          setUserListModal({ isOpen: true, title: 'Seguidores', users: followers });
        } else {
          setUserListModal({ isOpen: true, title: 'Seguindo', users: following });
        }
      };
      
      const handlePostUpdated = (post) => {
        toast({
          title: "🚧 Em construção!",
          description: "A funcionalidade de editar o post ainda não foi implementada. Você pode solicitar esse recurso no próximo prompt!"
        });
      };

      const handleMessage = async () => {
        if (!profileData || !currentUser) return;
    
        const { data: existingConversation, error: existingError } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participant_one.eq.${currentUser.id},participant_two.eq.${profileData.id}),and(participant_one.eq.${profileData.id},participant_two.eq.${currentUser.id})`)
          .maybeSingle();
    
        if (existingError) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível iniciar a conversa.' });
          return;
        }
    
        if (existingConversation) {
          navigate('/messages', { state: { conversationId: existingConversation.id } });
        } else {
          const { data: newConversation, error: newError } = await supabase
            .from('conversations')
            .insert({
              participant_one: currentUser.id,
              participant_two: profileData.id,
            })
            .select('id')
            .single();
    
          if (newError) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar a conversa.' });
            return;
          }
    
          navigate('/messages', { state: { conversationId: newConversation.id } });
        }
      };
      const handlePostDeleted = (postId) => setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
      const handleCommentClick = (post) => setSelectedPost(post);
      const handleCloseModal = () => setSelectedPost(null);

      if (pageLoading || (authLoading && !profileData)) {
        return (
          <div className="flex justify-center items-center h-full pt-20">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
          </div>
        );
      }

      if (!profileData) {
        return (
          <div className="text-center pt-20">
            <h1 className="text-3xl font-bold text-foreground">Perfil não encontrado</h1>
          </div>
        );
      }

      return (
        <>
          <Helmet>
            <title>{`${profileData.full_name || profileData.username} - Perfil Nomad Connect`}</title>
          </Helmet>
          
          <div className="relative">
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 250, opacity: 1 }}
              className="h-64 rounded-xl bg-cover bg-center relative overflow-hidden bg-secondary"
            >
              <img className="w-full h-full object-cover rounded-xl" alt={`Capa de ${profileData.username}`} src={profileData.cover_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1770'} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </motion.div>

            <div className="relative px-4 md:px-6 -mt-20">
                <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between">
                        <div className="flex flex-col md:flex-row items-center text-center md:text-left">
                        <Avatar className="h-32 w-32 border-4 border-background -mt-24 md:-mt-20">
                            <AvatarImage src={profileData.avatar_url} alt={profileData.username} />
                            <AvatarFallback />
                        </Avatar>
                        <div className="md:ml-6 mt-4 md:mt-0">
                            <h1 className="text-3xl font-bold text-foreground flex items-center">
                                {profileData.full_name}
                                {profileData.is_private && <Lock className="h-5 w-5 ml-2 text-muted-foreground" title="Perfil Privado"/>}
                            </h1>
                            <p className="text-muted-foreground">@{profileData.username}</p>
                             <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
                                <button onClick={() => showUserList('followers')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <span className="font-bold text-foreground">{followers.length}</span> Seguidores
                                </button>
                                <button onClick={() => showUserList('following')} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <span className="font-bold text-foreground">{following.length}</span> Seguindo
                                </button>
                            </div>
                        </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4 md:mt-0">
                        {isOwnProfile ? (
                            <Button asChild variant="outline">
                            <Link to="/settings">
                                <Edit className="h-4 w-4 mr-2" /> Editar Perfil
                            </Link>
                            </Button>
                        ) : (
                            <>
                            <Button className={`${isFollowing ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "nomad-gradient text-white"} transition-colors`} onClick={handleFollowToggle}>
                                {isFollowing ? <UserMinus className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                {isFollowing ? 'Seguindo' : 'Seguir'}
                            </Button>
                            <Button variant="secondary" onClick={handleMessage}>
                                <Mail className="h-4 w-4 mr-2" /> Mensagem
                            </Button>
                            </>
                        )}
                        </div>
                    </div>
                    
                    {canViewProfile && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 max-w-2xl text-center md:text-left"
                        >
                            <p className="text-foreground/80">{profileData.bio || 'Este aventureiro ainda não escreveu sua bio.'}</p>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 mt-4 text-muted-foreground text-sm">
                                {profileData.location && <div className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> {profileData.location}</div>}
                                <div className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Entrou em {new Date(profileData.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 mt-4 text-muted-foreground text-sm">
                                {profileData.website_url && <a href={profileData.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary"><LinkIcon className="h-4 w-4 mr-1" /> Website</a>}
                                {profileData.youtube_url && <a href={profileData.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-red-500"><Youtube className="h-4 w-4 mr-1" /> YouTube</a>}
                                {profileData.instagram_url && <a href={profileData.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-pink-500"><Instagram className="h-4 w-4 mr-1" /> Instagram</a>}
                                {profileData.tiktok_url && <a href={profileData.tiktok_url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-white"><FaTiktok className="h-4 w-4 mr-1" /> TikTok</a>}
                                {profileData.facebook_url && <a href={profileData.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-600"><FaFacebook className="h-4 w-4 mr-1" /> Facebook</a>}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
            
            <div className="mt-8 border-t border-border pt-8 px-4 md:px-6">
                {canViewProfile ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="aventuras"><span className="mr-2">🏞️</span>Aventuras ({posts.length})</TabsTrigger>
                                {profileData.youtube_url && <TabsTrigger value="youtube"><span className="mr-2">📺</span>YouTube</TabsTrigger>}
                            </TabsList>
                        </div>
                        <TabsContent value="aventuras" className="mt-6">
                            <AnimatePresence>
                            {posts.length > 0 ? posts.map(post => (
                                <PostCard 
                                    key={post.id} 
                                    post={post} 
                                    onPostDeleted={handlePostDeleted}
                                    onPostUpdated={handlePostUpdated}
                                    onCommentClick={handleCommentClick}
                                />
                            )) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 adventure-card rounded-xl">
                                <p className="text-muted-foreground">Ainda não há nenhuma aventura para mostrar.</p>
                                {isOwnProfile && <p className="text-muted-foreground/80 mt-1">Que tal compartilhar sua primeira história?</p>}
                            </motion.div>
                            )}
                            </AnimatePresence>
                        </TabsContent>
                        {profileData.youtube_url && (
                            <TabsContent value="youtube" className="mt-6">
                                <div className="text-center py-10 adventure-card rounded-xl">
                                    <h3 className="text-xl font-bold">Feed do YouTube</h3>
                                    <p className="text-muted-foreground">A integração para exibir os vídeos aqui está em construção!</p>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                ) : (
                    <div className="text-center py-16 adventure-card rounded-xl">
                        <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h2 className="mt-4 text-xl font-semibold">Este perfil é privado</h2>
                        <p className="mt-2 text-muted-foreground">Siga esta pessoa para ver todas as suas aventuras.</p>
                    </div>
                )}
            </div>
          </div>
          <PostModal post={selectedPost} isOpen={!!selectedPost} onClose={handleCloseModal} />
          <UserListModal 
            isOpen={userListModal.isOpen} 
            onClose={() => setUserListModal({ isOpen: false, title: '', users: [] })}
            title={userListModal.title}
            users={userListModal.users}
          />
        </>
      );
    };

    export default Profile;