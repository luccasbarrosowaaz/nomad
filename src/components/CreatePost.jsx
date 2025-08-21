import React, { useState, useRef, useEffect } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useToast } from '@/components/ui/use-toast';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Camera, Video, MapPin, X, Loader2 } from 'lucide-react';
    import EmojiPicker from '@/components/EmojiPicker';
    import ReactPlayer from 'react-player/lazy';
    import LocationSearchModal from '@/components/LocationSearchModal';
    import { useProfileStore } from '@/hooks/useProfile';

    const sanitizeFileName = (fileName) => {
      return fileName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/\s+/g, '_');
    };

    const CreatePost = ({ onPostCreated, initialLocation }) => {
      const { user } = useAuth();
      const { profile, fetchProfile } = useProfileStore();
      const { toast } = useToast();
      const [content, setContent] = useState('');
      const [mediaFiles, setMediaFiles] = useState([]);
      const [mediaPreviews, setMediaPreviews] = useState([]);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [location, setLocation] = useState(null);
      const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

      const imageInputRef = useRef(null);
      const videoInputRef = useRef(null);
      const textareaRef = useRef(null);

      useEffect(() => {
        if (user && !profile) {
          fetchProfile(user.id);
        }
      }, [user, profile, fetchProfile]);

      useEffect(() => {
        if (initialLocation) {
          setLocation(initialLocation);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
      }, [initialLocation]);

      const handleContentChange = (e) => {
        const text = e.target.value;
        setContent(text);
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = text.match(youtubeRegex);
        if (match && match[1]) {
          const youtubeUrl = `https://www.youtube.com/watch?v=${match[1]}`;
          const existingYoutube = mediaPreviews.find(preview => preview.type === 'youtube');
          if (!existingYoutube) {
            setMediaFiles(prev => [...prev, { type: 'youtube', url: youtubeUrl }]);
            setMediaPreviews(prev => [...prev, { type: 'youtube', url: youtubeUrl }]);
          }
        } else if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
          // Remove YouTube links if text no longer contains them
          setMediaFiles(prev => prev.filter(file => file.type !== 'youtube'));
          setMediaPreviews(prev => prev.filter(preview => preview.type !== 'youtube'));
        }
      };

      const handleFileChange = (e, type) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Limit total media to 4 items
        const currentCount = mediaFiles.length;
        const availableSlots = 4 - currentCount;
        
        if (availableSlots <= 0) {
          toast({
            variant: 'destructive',
            title: 'Limite atingido',
            description: 'Você pode adicionar no máximo 4 mídias por post.',
          });
          return;
        }

        const filesToAdd = files.slice(0, availableSlots);
        
        filesToAdd.forEach(file => {
          const preview = URL.createObjectURL(file);
          setMediaFiles(prev => [...prev, { type, file }]);
          setMediaPreviews(prev => [...prev, { type, url: preview, file }]);
        });

        if (files.length > availableSlots) {
          toast({
            title: 'Alguns arquivos não foram adicionados',
            description: `Apenas ${availableSlots} arquivo(s) foram adicionados devido ao limite de 4 mídias.`,
          });
        }

        // Clear the input
        e.target.value = '';
      };

      const removeMedia = (index) => {
        const mediaToRemove = mediaPreviews[index];
        if (mediaToRemove && mediaToRemove.url && mediaToRemove.url.startsWith('blob:')) {
          URL.revokeObjectURL(mediaToRemove.url);
        }
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
      };

      const uploadFile = async (file) => {
        const sanitizedFileName = sanitizeFileName(file.name);
        const fileName = `${user.id}/${Date.now()}-${sanitizedFileName}`;
        
        const { data, error } = await supabase.storage
            .from('post-images')
            .upload(fileName, file);

        if (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
        
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
        if (!urlData.publicUrl) {
            throw new Error('Upload succeeded but did not return a public URL.');
        }

        return urlData.publicUrl;
      };

      const handleSubmit = async () => {
        if (!content && mediaFiles.length === 0 && !location) {
          toast({
            variant: 'destructive',
            title: 'Nada para postar!',
            description: 'Escreva algo, adicione uma mídia ou faça check-in.',
          });
          return;
        }

        setIsSubmitting(true);
        const mediaUrls = [];
        
        try {
          for (const mediaItem of mediaFiles) {
            if (mediaItem.file) {
              const uploadedUrl = await uploadFile(mediaItem.file);
              mediaUrls.push({ url: uploadedUrl, type: mediaItem.type });
            } else if (mediaItem.type === 'youtube') {
              mediaUrls.push({ url: mediaItem.url, type: 'youtube' });
            }
          }

          const postData = {
            user_id: user.id,
            content,
            media_urls: mediaUrls.length > 0 ? mediaUrls : null,
            location_id: location ? location.id : null,
          };

          const { data, error } = await supabase
            .from('posts')
            .insert(postData)
            .select(`
              *,
              profile: user_id(*),
              check_in_locations(*),
              likes(user_id),
              comments(id)
            `)
            .single();

          if (error) {
            throw error;
          }
          toast({ title: 'Post criado com sucesso!' });
          if(onPostCreated) onPostCreated(data);
          setContent('');
          // Clear all media
          mediaPreviews.forEach(preview => {
            if (preview.url && preview.url.startsWith('blob:')) {
              URL.revokeObjectURL(preview.url);
            }
          });
          setMediaFiles([]);
          setMediaPreviews([]);
          setLocation(null);

        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Erro ao criar post',
            description: error.message,
          });
        } finally {
          setIsSubmitting(false);
        }
      };

      return (
        <>
          <LocationSearchModal
            isOpen={isLocationModalOpen}
            onClose={() => setIsLocationModalOpen(false)}
            onLocationSelect={(selectedLoc) => {
              setLocation(selectedLoc);
              setIsLocationModalOpen(false);
            }}
          />
          <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
            <div className="flex space-x-4">
              <Avatar>
                <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                <AvatarFallback>{profile?.username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder={`No que você está pensando, ${profile?.full_name || 'aventureiro'}?`}
                  className="w-full bg-input border-border text-foreground text-base resize-none"
                  rows={2}
                />
                {mediaPreviews.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {mediaPreviews.length === 1 ? (
                      <div className="relative">
                        {mediaPreviews[0].type === 'image' ? (
                          <img src={mediaPreviews[0].url} alt="Preview" className="rounded-lg max-h-80 w-full object-cover" />
                        ) : (
                          <div className="rounded-lg overflow-hidden max-h-80 aspect-video">
                            <ReactPlayer url={mediaPreviews[0].url} controls width="100%" height="100%" />
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => removeMedia(0)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {mediaPreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square">
                            {preview.type === 'image' ? (
                              <img src={preview.url} alt={`Preview ${index + 1}`} className="rounded-lg w-full h-full object-cover" />
                            ) : preview.type === 'youtube' ? (
                              <div className="rounded-lg overflow-hidden w-full h-full bg-black flex items-center justify-center">
                                <ReactPlayer url={preview.url} width="100%" height="100%" light={true} />
                              </div>
                            ) : (
                              <div className="rounded-lg overflow-hidden w-full h-full">
                                <ReactPlayer url={preview.url} width="100%" height="100%" light={true} />
                              </div>
                            )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => removeMedia(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {location && (
                  <div className="mt-4 flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-primary">
                        <MapPin className="h-4 w-4" />
                        <span>Check-in em <strong>{location.place_name}</strong></span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLocation(null)}>
                        <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => imageInputRef.current.click()}
                      disabled={mediaFiles.length >= 4}
                    >
                      <Camera className="h-5 w-5 text-green-500" />
                    </Button>
                    <input 
                      type="file" 
                      ref={imageInputRef} 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'image')} 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => videoInputRef.current.click()}
                      disabled={mediaFiles.length >= 4}
                    >
                      <Video className="h-5 w-5 text-blue-500" />
                    </Button>
                    <input 
                      type="file" 
                      ref={videoInputRef} 
                      accept="video/*" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'video')} 
                    />
                    <Button variant="ghost" size="icon" onClick={() => setIsLocationModalOpen(true)}>
                      <MapPin className="h-5 w-5 text-orange-500" />
                    </Button>
                    <EmojiPicker onEmojiSelect={(emoji) => setContent(content + emoji)} />
                  </div>
                  <Button
                    className="nomad-gradient text-white"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Postando...</> : 'Postar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    };

    export default CreatePost;