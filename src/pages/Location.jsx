import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { MapPin, Star, Image as ImageIcon, ThumbsUp, MessageCircle } from 'lucide-react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import PostCard from '@/components/PostCard';
import { Button } from '@/components/ui/button';

// Mock data, to be replaced by API calls
const locationsData = {
    'Chapada Diamantina': { id: 1, name: 'Chapada Diamantina', state: 'Bahia', rating: 4.8, reviews: 234, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop', description: 'Um paraíso para os amantes de trilhas, com cachoeiras estonteantes, grutas misteriosas e paisagens de tirar o fôlego. O Vale do Pati é um trekking imperdível.', tags: ['Trilha', 'Cachoeira', 'Camping', 'Aventura'] },
    'Fernando de Noronha': { id: 2, name: 'Fernando de Noronha', state: 'Pernambuco', rating: 4.9, reviews: 189, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=400&fit=crop', description: 'Santuário ecológico com as praias mais bonitas do Brasil. Mergulhe em águas cristalinas e nade com golfinhos e tartarugas marinhas.', tags: ['Mergulho', 'Praia', 'Natureza', 'Luxo'] },
    'Lençóis Maranhenses': { id: 3, name: 'Lençóis Maranhenses', state: 'Maranhão', rating: 4.7, reviews: 156, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=400&fit=crop', description: 'Um deserto de dunas de areia branca que, na época das chuvas, se enche de lagoas de água doce e cristalina. Uma paisagem única no mundo.', tags: ['Dunas', 'Lagoas', '4x4', 'Exótico'] },
    'Bonito': { id: 4, name: 'Bonito', state: 'Mato Grosso do Sul', rating: 4.6, reviews: 143, image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop', description: 'A capital do ecoturismo no Brasil. Flutue em rios de águas transparentes, explore grutas com lagos azuis e desfrute da natureza exuberante.', tags: ['Flutuação', 'Cavernas', 'Ecoturismo', 'Família'] },
    'Jalapão': { id: 5, name: 'Jalapão', state: 'Tocantins', rating: 4.5, reviews: 98, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop', description: 'O coração do Brasil selvagem. Explore o cerrado, nade em fervedouros onde é impossível afundar e admire o dourado das dunas ao pôr do sol.', tags: ['Cerrado', 'Aventura', 'Camping', 'Off-road'] },
    'Pantanal': { id: 6, name: 'Pantanal', state: 'Mato Grosso', rating: 4.4, reviews: 87, image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=400&fit=crop', description: 'A maior planície inundável do planeta, um santuário de vida selvagem. Faça um safári fotográfico e observe onças-pintadas, jacarés e tuiuiús.', tags: ['Fauna', 'Pesca', 'Safari', 'Observação de Aves'] }
};


const LocationPage = () => {
  const { locationName } = useParams();
  const { toast } = useToast();
  const [locationData, setLocationData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const data = locationsData[locationName];
    setLocationData(data);
    
    const fetchPosts = async () => {
      if (!data) {
          setLoading(false);
          return;
      }
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`*, profiles:profiles!posts_user_id_fkey(*), likes(user_id), comments!left(id, content, created_at, profiles(username, avatar_url, full_name))`)
        .ilike('location_text', `%${data.name}%`)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar posts do local' });
      } else {
        setPosts(postsData);
      }
      setLoading(false);
    };

    fetchPosts();

  }, [locationName, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full pt-20">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  if (!locationData) {
    return (
      <div className="text-center pt-20">
        <h1 className="text-3xl font-bold text-foreground">Local não encontrado</h1>
        <p className="text-muted-foreground mt-2">Este destino ainda é um mistério para nós.</p>
        <Button asChild className="mt-6 nomad-gradient text-white">
          <Link to="/explore">Explorar outros lugares</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{locationData.name} - Nomad Connect</title>
        <meta name="description" content={`Descubra tudo sobre ${locationData.name}: posts, dicas e fotos de outros aventureiros.`} />
      </Helmet>
      
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative h-80 rounded-xl overflow-hidden shadow-lg">
          <img src={locationData.image} alt={`Paisagem de ${locationData.name}`} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-4xl font-bold">{locationData.name}</h1>
            <p className="text-lg flex items-center"><MapPin className="h-5 w-5 mr-2" /> {locationData.state}</p>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{delay: 0.2}} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-card p-6 rounded-xl border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-3">Sobre o Destino</h2>
                <p className="text-muted-foreground leading-relaxed">{locationData.description}</p>
                 <div className="flex flex-wrap gap-2 mt-4">
                      {locationData.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">{tag}</span>
                      ))}
                </div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-center items-center space-y-3">
                <div className="flex items-center space-x-2">
                    <Star className="h-8 w-8 text-yellow-400 fill-current" />
                    <span className="text-4xl font-bold text-foreground">{locationData.rating}</span>
                </div>
                <p className="text-muted-foreground">Avaliação da comunidade</p>
                <p className="text-sm text-foreground">({locationData.reviews} reviews)</p>
            </div>
        </motion.div>

        <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Aventuras em {locationData.name}</h2>
            {posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <div className="text-center py-10 adventure-card rounded-xl">
                    <p className="text-muted-foreground">Ninguém fez check-in aqui ainda.</p>
                    <p className="text-muted-foreground/80 mt-1">Seja o primeiro a compartilhar sua aventura!</p>
                </div>
            )}
        </div>
      </div>
    </>
  );
};

export default LocationPage;