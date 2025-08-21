import React, { useState, useEffect, useCallback } from 'react';
    import { useLocation, useNavigate } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import CreatePost from '@/components/CreatePost';
    import PostCard from '@/components/PostCard';
    import PostModal from '@/components/PostModal';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2 } from 'lucide-react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useProfileStore } from '@/hooks/useProfile';
    import { Button } from '@/components/ui/button';

    const Home = () => {
        const location = useLocation();
        const navigate = useNavigate();
        const { toast } = useToast();
        const { user } = useAuth();
        const { fetchProfile } = useProfileStore();
        
        const [posts, setPosts] = useState([]);
        const [loading, setLoading] = useState(true);
        const [selectedPost, setSelectedPost] = useState(null);
        const [page, setPage] = useState(0);
        const [hasMore, setHasMore] = useState(true);
        const [initialLocation, setInitialLocation] = useState(null);

        useEffect(() => {
            if (location.state?.newLocation) {
                setInitialLocation(location.state.newLocation);
                navigate(location.pathname, { replace: true, state: {} });
            }
            if (location.state?.openPostId) {
                fetchPostById(location.state.openPostId);
            }
            if (location.state?.fromSettings) {
                if (user) {
                    fetchProfile(user.id, true); // Force refresh
                }
                navigate(location.pathname, { replace: true, state: {} });
            }
        }, [location.state, user, fetchProfile, navigate]);

        const fetchPostById = async (postId) => {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    profile:user_id(*),
                    likes(user_id),
                    comments(id),
                    check_in_locations(*)
                `)
                .eq('id', postId)
                .single();
            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao buscar post', description: error.message });
            } else {
                setSelectedPost(data);
            }
        };

        const fetchPosts = useCallback(async (followingIds, pageToFetch, isLoadMore = false) => {
            if (!isLoadMore) setLoading(true);

            const POSTS_PER_PAGE = 5;
            const from = pageToFetch * POSTS_PER_PAGE;
            const to = from + POSTS_PER_PAGE - 1;

            let query = supabase
                .from('posts')
                .select(`
                    *,
                    profile:user_id(*),
                    likes(user_id),
                    comments(id),
                    check_in_locations(*)
                `)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (followingIds && followingIds.length > 0) {
                query = query.in('user_id', [...followingIds, user.id]);
            }

            const { data, error } = await query;

            if (error) {
                toast({ variant: 'destructive', title: 'Erro ao carregar feed', description: error.message });
                setHasMore(false);
            } else {
                setPosts(prev => isLoadMore ? [...prev, ...data] : data);
                setHasMore(data.length === POSTS_PER_PAGE);
            }
            setLoading(false);
        }, [toast, user]);

        const fetchFollowingAndPosts = useCallback(async (pageToFetch, isLoadMore = false) => {
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: followingData, error: followingError } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', user.id);

            if (followingError) {
                toast({ variant: 'destructive', title: 'Erro ao buscar quem você segue' });
                fetchPosts([], pageToFetch, isLoadMore);
            } else {
                const followingIds = followingData.map(f => f.following_id);
                fetchPosts(followingIds, pageToFetch, isLoadMore);
            }
        }, [user, fetchPosts, toast]);
        
        useEffect(() => {
            if (user) {
                fetchFollowingAndPosts(0, false);
            } else {
                setLoading(false);
            }
        }, [user, fetchFollowingAndPosts]);

        const loadMorePosts = () => {
          if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchFollowingAndPosts(nextPage, true);
          }
        };

        const handlePostCreated = (newPost) => {
            setPosts(currentPosts => [newPost, ...currentPosts]);
            window.scrollTo(0, 0);
        };

        const handlePostDeleted = (postId) => {
            setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
            if (selectedPost && selectedPost.id === postId) {
                setSelectedPost(null);
            }
        };
        
        const handlePostUpdated = (updatedPost) => {
            setPosts(currentPosts => currentPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
             if (selectedPost && selectedPost.id === updatedPost.id) {
                setSelectedPost(updatedPost);
            }
        };

        const handleCommentClick = (post) => {
            setSelectedPost(post);
        };

        const handleCloseModal = () => {
            setSelectedPost(null);
            if (location.state?.openPostId) {
                navigate(location.pathname, { replace: true, state: {} });
            }
        };

        return (
            <>
                <Helmet>
                    <title>Início - Nomad Connect</title>
                    <meta name="description" content="Seu feed de aventuras no Nomad Connect. Veja as últimas postagens de seus amigos e exploradores que você segue." />
                </Helmet>
                
                <div className="w-full max-w-xl mx-auto">
                    {user && <CreatePost onPostCreated={handlePostCreated} initialLocation={initialLocation} />}

                    <div className="mt-6">
                        {posts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post}
                                onPostDeleted={handlePostDeleted}
                                onPostUpdated={handlePostUpdated}
                                onCommentClick={handleCommentClick}
                            />
                        ))}
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {!loading && posts.length === 0 && (
                        <div className="text-center py-20 px-4 border-2 border-dashed border-border rounded-xl mt-6">
                            <h2 className="text-2xl font-bold text-foreground">Bem-vindo ao seu feed!</h2>
                            <p className="mt-2 text-muted-foreground">
                                Parece um pouco vazio por aqui. Comece a seguir outros aventureiros para ver as histórias deles.
                            </p>
                        </div>
                    )}
                    
                     {!loading && hasMore && posts.length > 0 && (
                         <div className="flex justify-center my-8">
                            <Button
                                onClick={loadMorePosts}
                                disabled={loading}
                                variant="secondary"
                            >
                                {loading ? 'Carregando...' : 'Carregar mais'}
                            </Button>
                        </div>
                     )}

                </div>
                
                <PostModal 
                    post={selectedPost} 
                    isOpen={!!selectedPost} 
                    onClose={handleCloseModal} 
                />
            </>
        );
    };

    export default Home;