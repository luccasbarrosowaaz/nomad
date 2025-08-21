import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { MapPin, Star, Users, ArrowLeft, Compass, Globe, Phone, Bed, Power, Droplets, Utensils as CookingPot, Dog, Car, ShowerHead, Ban, MessageCircle, Languages, Loader2, Edit } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import PostModal from '@/components/PostModal';
import CheckInModal from '@/components/CheckInModal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const LocationPage = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locationData, setLocationData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const fetchLocationData = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
        .from('check_in_locations')
        .select('*, profile:profiles(username, full_name, avatar_url)')
        .eq('id', locationId)
        .single();

    if (error || !data) {
        toast({ variant: 'destructive', title: 'Local não encontrado' });
        navigate('/explore');
        return;
    }

    setLocationData(data);

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`*, profile:user_id(*), likes(user_id), comments(id), check_in_locations(*)`)
      .eq('location_id', data.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      toast({ variant: 'destructive', title: 'Erro ao carregar posts do local' });
    } else {
      setPosts(postsData);
    }

    setLoading(false);
  }, [locationId, navigate, toast]);

  useEffect(() => {
    fetchLocationData();
  }, [fetchLocationData]);
  
  const handleCheckIn = () => {
    navigate('/', { state: { newLocation: locationData } });
  };

  const handleUpdateLocation = () => {
    setIsCheckInModalOpen(true);
  };
  
  const handleTranslate = async () => {
    if (!locationData?.description) {
      toast({ variant: 'destructive', title: 'Nada para traduzir.' });
      return;
    }
    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text: locationData.description, target_lang: 'PT-BR' },
      });

      if (error) {
          throw new Error(`Function Error: ${error.message}`);
      }
      if (data.error) {
          throw new Error(`Translation API Error: ${data.error}`);
      }

      const { error: updateError } = await supabase
        .from('check_in_locations')
        .update({ translated_description: data.translatedText })
        .eq('id', locationId);

      if (updateError) {
        throw updateError;
      }
      
      setLocationData(prev => ({ ...prev, translated_description: data.translatedText }));
      toast({ title: 'Sucesso!', description: 'A descrição foi traduzida.' });

    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro ao Traduzir', description: e.message });
    } finally {
      setIsTranslating(false);
    }
  };


  const handleCloseModal = () => {
    setSelectedPost(null);
  };
  
  const getKitchenText = (details) => {
    switch (details) {
      case 'particular': return 'Cozinha particular';
      case 'compartilhada': return 'Cozinha compartilhada';
      default: return null;
    }
  };
  
  const getBathroomText = (details) => {
    switch (details) {
      case 'banheiro_simples': return 'Banheiro simples';
      case 'banheiro_com_chuveiro': return 'Banheiro com chuveiro';
      case 'sem_banheiro': return 'Sem banheiro';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full pt-20">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  if (!locationData) {
    return null; 
  }

  const descriptionToDisplay = locationData.translated_description || locationData.description;
  const needsTranslation = locationData.description && !locationData.translated_description;

  return (
    <>
      <Helmet>
        <title>{locationData.place_name} - Nomad Connect</title>
        <meta name="description" content={`Descubra tudo sobre ${locationData.place_name}, veja fotos, dicas e posts da comunidade.`} />
      </Helmet>

      <CheckInModal
        isOpen={isCheckInModalOpen}
        setIsOpen={setIsCheckInModalOpen}
        existingLocation={locationData}
        onCheckInSuccess={(updatedLocation) => {
          setLocationData(updatedLocation);
          fetchLocationData(); // Re-fetch to ensure all data is fresh
        }}
      />

      <div>
        <div className="relative h-80 md:h-96 rounded-xl overflow-hidden mb-[-8rem]">
            {locationData.image_url ? (
                <img src={locationData.image_url} alt={`Paisagem de ${locationData.place_name}`} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                    <MapPin className="h-24 w-24 text-white/50" />
                </div>
            )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl md:text-5xl font-bold">{locationData.place_name}</motion.h1>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center space-x-2 mt-2">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">{locationData.city}, {locationData.state}</span>
            </motion.div>
          </div>
          <Link to="/explore" className="absolute top-6 left-6">
            <Button variant="secondary" className="rounded-full h-10 w-10 p-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="relative bg-card p-6 rounded-t-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-foreground">Sobre o Local</h2>
                  {needsTranslation && (
                    <Button onClick={handleTranslate} disabled={isTranslating} variant="outline" size="sm">
                      {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                      Traduzir Descrição
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">{descriptionToDisplay || "Nenhuma descrição detalhada fornecida."}</p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {locationData.allow_sleep && <div className="flex items-center"><Bed className="h-5 w-5 mr-3 text-primary" /> <span>Permite dormir</span></div>}
                    {locationData.has_power && <div className="flex items-center"><Power className="h-5 w-5 mr-3 text-primary" /> <span>Ponto de energia</span></div>}
                    {locationData.has_water && <div className="flex items-center"><Droplets className="h-5 w-5 mr-3 text-primary" /> <span>Fonte de água</span></div>}
                    {locationData.accepts_motorhome && <div className="flex items-center"><Car className="h-5 w-5 mr-3 text-primary" /> <span>Aceita motorhome</span></div>}
                    {locationData.accepts_pets && <div className="flex items-center"><Dog className="h-5 w-5 mr-3 text-primary" /> <span>Aceita pets</span></div>}
                    {getKitchenText(locationData.kitchen_details) && <div className="flex items-center"><CookingPot className="h-5 w-5 mr-3 text-primary" /> <span>{getKitchenText(locationData.kitchen_details)}</span></div>}
                    {getBathroomText(locationData.bathroom_details) && (
                        <div className="flex items-center">
                            {locationData.bathroom_details === 'sem_banheiro' ? <Ban className="h-5 w-5 mr-3 text-muted-foreground" /> : <ShowerHead className="h-5 w-5 mr-3 text-primary" />}
                            <span>{getBathroomText(locationData.bathroom_details)}</span>
                        </div>
                    )}
                </div>
                 {locationData.address && (
                  <div className="mt-6 border-t pt-6">
                    <h3 className="font-semibold text-lg text-foreground mb-2">Endereço</h3>
                    <p className="text-muted-foreground">{locationData.address}</p>
                  </div>
                 )}
              </motion.div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold text-foreground mb-4">Quem já esteve aqui?</h2>
                {posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map(post => (
                      <div key={post.id} className="flex items-start space-x-4 p-4 bg-secondary/50 rounded-lg">
                        <Link to={`/profile/${post.profile.username}`}>
                          <Avatar>
                            <AvatarImage src={post.profile.avatar_url} alt={post.profile.username} />
                            <AvatarFallback>{post.profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <p className="text-foreground">
                            <Link to={`/profile/${post.profile.username}`} className="font-semibold hover:underline">@{post.profile.username}</Link>
                            <span className="text-muted-foreground"> {post.profile.full_name} fez check-in aqui e disse:</span>
                          </p>
                          <blockquote className="mt-2 pl-4 border-l-2 border-primary italic text-foreground/80">
                            {post.content || "[Fez check-in neste local]"}
                          </blockquote>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Ninguém fez check-in aqui ainda.</p>
                    <p className="text-sm text-muted-foreground/80">Seja o primeiro a compartilhar sua aventura!</p>
                  </div>
                )}
              </div>
            </div>

            <aside className="md:col-span-1">
              <div className="sticky top-24 space-y-6">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-secondary p-6 rounded-xl border border-border">
                  <h3 className="font-bold text-lg text-foreground mb-4">Detalhes do Local</h3>
                   <div className="space-y-3 text-sm">
                        <div className="flex items-center">
                            <Star className="h-4 w-4 mr-3 text-muted-foreground" />
                            <span>Segurança: <span className="font-medium text-foreground capitalize">{locationData.security_level || 'Não avaliada'}</span></span>
                        </div>
                        {locationData.contact_name && (
                            <div className="flex items-center">
                                <Users className="h-4 w-4 mr-3 text-muted-foreground" />
                                <span>Contato: <span className="font-medium text-foreground">{locationData.contact_name}</span></span>
                            </div>
                        )}
                        {locationData.phone && (
                            <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                                <a href={`tel:${locationData.phone}`} className="font-medium text-primary hover:underline">{locationData.phone}</a>
                            </div>
                        )}
                        {locationData.website && (
                             <div className="flex items-center">
                                <Globe className="h-4 w-4 mr-3 text-muted-foreground" />
                                <a href={locationData.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate">{locationData.website}</a>
                            </div>
                        )}
                         <div className="flex items-center pt-2 border-t border-border/50">
                            <Users className="h-4 w-4 mr-3 text-muted-foreground" />
                            <span>Registrado por: <Link to={`/profile/${locationData.profile.username}`} className="font-medium text-primary hover:underline">{locationData.profile.username}</Link></span>
                        </div>
                   </div>
                </motion.div>
                <div className="space-y-2">
                    <Button onClick={handleCheckIn} className="w-full nomad-gradient text-white text-lg py-6">
                      <Compass className="h-5 w-5 mr-3" />
                      Fazer Check-in
                    </Button>
                    <Button onClick={handleUpdateLocation} variant="outline" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Sugerir Edição
                    </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <PostModal post={selectedPost} isOpen={!!selectedPost} onClose={handleCloseModal} />
    </>
  );
};

export default LocationPage;