import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { User, FileText, MapPin, Loader2, Frown } from 'lucide-react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState({ profiles: [], posts: [], locations: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const debounceTimeout = useRef(null);

  const performSearch = useCallback(async (query) => {
    setLoading(true);
    if(query && query.length > 0) setSearchParams({ q: query }, { replace: true });

    try {
        let profilesQuery = supabase.from('profiles').select('*').order('created_at', { ascending: false });
        let postsQuery = supabase.from('posts').select('*, profile:user_id(username, avatar_url)').order('created_at', { ascending: false });
        let locationsQuery = supabase.from('check_in_locations').select('*').order('created_at', { ascending: false });

        if (query) {
            profilesQuery = profilesQuery.or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
            postsQuery = postsQuery.ilike('content', `%${query}%`);
            locationsQuery = locationsQuery.or(`place_name.ilike.%${query}%,description.ilike.%${query}%`);
        }

        const [profilesRes, postsRes, locationsRes] = await Promise.all([
            profilesQuery,
            postsQuery,
            locationsQuery
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (postsRes.error) throw postsRes.error;
        if (locationsRes.error) throw locationsRes.error;

        setResults({
            profiles: profilesRes.data,
            posts: postsRes.data.map(p => ({...p, avatar_url: p.profile?.avatar_url, username: p.profile?.username })),
            locations: locationsRes.data
        });

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na busca',
        description: error.message,
      });
      setResults({ profiles: [], posts: [], locations: [] });
    } finally {
      setLoading(false);
    }
  }, [setSearchParams, toast]);

  useEffect(() => {
    const initialQuery = searchParams.get('q') || '';
    setSearchTerm(initialQuery);
    performSearch(initialQuery);
  }, []); 


  const handleInputChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
        performSearch(newSearchTerm);
    }, 500);
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }
    performSearch(searchTerm);
  };
  
  const handlePostClick = (postId) => {
    navigate('/', { state: { openPostId: parseInt(postId, 10) } });
  };

  const renderEmptyState = (type) => (
    <div className="flex flex-col items-center justify-center h-64 text-center bg-card p-8 rounded-lg border border-dashed">
      <Frown className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground">Nenhum resultado encontrado</h3>
      <p className="text-muted-foreground">Tente uma busca diferente para encontrar {type}.</p>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Busca - Nomad Connect</title>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleFormSubmit} className="relative mb-8">
            <Input
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Buscar por perfis, posts ou locais..."
              className="h-14 text-lg pl-5 pr-12"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </form>
        </motion.div>
        
        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profiles">
              <User className="mr-2 h-4 w-4" />
              Perfis ({results.profiles.length})
            </TabsTrigger>
            <TabsTrigger value="posts">
              <FileText className="mr-2 h-4 w-4" />
              Posts ({results.posts.length})
            </TabsTrigger>
            <TabsTrigger value="locations">
              <MapPin className="mr-2 h-4 w-4" />
              Locais ({results.locations.length})
            </TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={searchTerm}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="profiles" className="mt-6">
                {results.profiles.length > 0 ? (
                  <div className="space-y-4">
                    {results.profiles.map(profile => (
                      <Link to={`/profile/${profile.username}`} key={profile.id} className="block">
                        <div className="flex items-center p-4 bg-card rounded-lg border hover:bg-secondary transition-colors">
                          <Avatar className="h-12 w-12 mr-4">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback>{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-foreground">{profile.full_name}</p>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : !loading && renderEmptyState('perfis')}
              </TabsContent>
              <TabsContent value="posts" className="mt-6">
                 {results.posts.length > 0 ? (
                  <div className="space-y-4">
                    {results.posts.map(post => (
                      <div key={post.id} onClick={() => handlePostClick(post.id)} className="cursor-pointer">
                        <div className="p-4 bg-card rounded-lg border hover:bg-secondary transition-colors">
                          <div className="flex items-center mb-2">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src={post.avatar_url} />
                              <AvatarFallback>{post.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm">@{post.username}</span>
                          </div>
                          <p className="text-foreground line-clamp-2">{post.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !loading && renderEmptyState('posts')}
              </TabsContent>
              <TabsContent value="locations" className="mt-6">
                 {results.locations.length > 0 ? (
                  <div className="space-y-4">
                    {results.locations.map(location => (
                      <Link to={`/location/${location.id}`} key={location.id} className="block">
                         <div className="p-4 bg-card rounded-lg border hover:bg-secondary transition-colors">
                          <p className="font-bold text-foreground">{location.place_name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{location.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : !loading && renderEmptyState('locais')}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </>
  );
};

export default SearchPage;