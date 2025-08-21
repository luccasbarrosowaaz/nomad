import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Calendar, MapPin, Link as LinkIcon, Loader2, Image as ImageIcon } from 'lucide-react';
import EventModal from '@/components/EventModal';

const eventSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  start_time: z.string().min(1, 'A data de início é obrigatória.'),
  end_time: z.string().optional(),
  location_text: z.string().min(3, 'O local é obrigatório.'),
  website_url: z.string().url('URL inválida.').optional().or(z.literal('')),
  image: z.any().optional(),
});

const EventCard = ({ event, onClick }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full"
      onClick={() => onClick(event)}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <div className="h-40 bg-secondary overflow-hidden">
          <img className="w-full h-full object-cover" alt={event.title} src={event.image_url || "https://images.unsplash.com/photo-1509930854872-0f61005b282e"} />
        </div>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(event.start_time)}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{event.location_text}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">
            Ver detalhes
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const CreateEventForm = ({ onFinished }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(eventSchema)
  });
  
  const imageFile = watch('image');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (imageFile && imageFile[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(imageFile[0]);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (data.image && data.image[0]) {
        const file = data.image[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
      
      const eventData = {
        ...data,
        user_id: user.id,
        image_url: imageUrl,
      };
      delete eventData.image;

      const { error } = await supabase.from('events').insert(eventData);

      if (error) throw error;

      toast({
        title: 'Evento enviado!',
        description: 'Seu evento foi enviado para aprovação. Obrigado!',
      });
      reset();
      onFinished();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar evento',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex-grow overflow-y-auto -mx-6 px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Título do Evento</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label htmlFor="image" className="cursor-pointer">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
                ) : (
                  <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="flex text-sm text-muted-foreground">
                      <span>Foto do Evento (Opcional)</span>
                      <Input id="image" type="file" className="sr-only" {...register('image')} accept="image/png, image/jpeg, image/webp" />
                    </div>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP até 5MB</p>
                  </div>
                )}
              </div>
            </Label>
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Início do Evento</Label>
              <Input id="start_time" type="datetime-local" {...register('start_time')} />
              {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time.message}</p>}
            </div>
            <div>
              <Label htmlFor="end_time">Fim do Evento (Opcional)</Label>
              <Input id="end_time" type="datetime-local" {...register('end_time')} />
            </div>
          </div>
          <div>
            <Label htmlFor="location_text">Local</Label>
            <Input id="location_text" {...register('location_text')} placeholder="Ex: Praia Mole, Florianópolis, SC" />
            {errors.location_text && <p className="text-red-500 text-xs mt-1">{errors.location_text.message}</p>}
          </div>
          <div>
            <Label htmlFor="website_url">Link do Evento (Opcional)</Label>
            <Input id="website_url" {...register('website_url')} placeholder="https://exemplo.com/evento" />
            {errors.website_url && <p className="text-red-500 text-xs mt-1">{errors.website_url.message}</p>}
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar para Aprovação
            </Button>
          </DialogFooter>
        </form>
      </div>
    </>
  );
};

const EventsCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*, profile:user_id(username, avatar_url)')
      .eq('status', 'approved')
      .order('start_time', { ascending: true });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar eventos',
        description: error.message,
      });
    } else {
      setEvents(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEventFormComponent = useMemo(() => {
    return <CreateEventForm onFinished={() => { setIsCreateModalOpen(false); fetchEvents(); }} />;
  }, [fetchEvents]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };
  
  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  return (
    <>
      <Helmet>
        <title>Agenda de Eventos - Nomad Connect</title>
        <meta name="description" content="Confira os próximos eventos, encontros e festivais da comunidade de viajantes." />
      </Helmet>
      <div className="relative">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Agenda de Eventos</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {events.length > 0 ? (
                events.map(event => <EventCard key={event.id} event={event} onClick={handleEventClick} />)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-16 bg-secondary/50 rounded-lg"
                >
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-xl font-semibold">Nenhum evento por aqui... ainda!</h3>
                  <p className="text-muted-foreground mt-2">Seja o primeiro a criar um evento e reunir a comunidade.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 rounded-full h-16 w-16 shadow-lg nomad-gradient text-white">
              <Plus className="h-8 w-8" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Evento</DialogTitle>
              <DialogDescription>
                Preencha os detalhes abaixo. Seu evento será revisado por um administrador antes de ser publicado.
              </DialogDescription>
            </DialogHeader>
            {createEventFormComponent}
          </DialogContent>
        </Dialog>

        <EventModal event={selectedEvent} isOpen={!!selectedEvent} onClose={handleCloseModal} />
      </div>
    </>
  );
};

export default EventsCalendar;