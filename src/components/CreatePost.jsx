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
      const [mediaFile, setMediaFile] = useState(null);
      const [mediaPreview, setMediaPreview] = useState(null);
      const [mediaType, setMediaType] = useState(null);
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
          setMediaType('youtube');
          setMediaPreview(`https://www.youtube.com/watch?v=${match[1]}`);
        } else if (mediaType === 'youtube' && !text.includes('youtube.com') && !text.includes('youtu.be')) {
          removeMedia();
        }
      };

      const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
          setMediaFile(file);
          setMediaType(type);
          setMediaPreview(URL.createObjectURL(file));
        }
      };

      const removeMedia = () => {
        if (mediaPreview && mediaPreview.startsWith('blob:')) {
            URL.revokeObjectURL(mediaPreview);
        }
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
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
        if (!content && !mediaFile && !location && mediaType !== 'youtube') {
          toast({
            variant: 'destructive',
            title: 'Nada para postar!',
            description: 'Escreva algo, adicione uma mídia ou faça check-in.',
          });
          return;
        }

        setIsSubmitting(true);
        let mediaUrl = null;
        let finalMediaType = mediaType;
        
        try {
          if (mediaFile) {
            mediaUrl = await uploadFile(mediaFile);
          } else if (mediaType === 'youtube' && mediaPreview) {
            mediaUrl = mediaPreview;
          }

          const postData = {
            user_id: user.id,
            content,
            media_urls: mediaUrl ? [{ url: mediaUrl, type: finalMediaType }] : null,
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
          removeMedia();
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
                {mediaPreview && (
                  <div className="mt-4 relative">
                    {mediaType === 'image' ? (
                      <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-80 w-auto" />
                    ) : (
                      <div className="rounded-lg overflow-hidden max-h-80 aspect-video">
                        <ReactPlayer url={mediaPreview} controls width="100%" height="100%" />
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={removeMedia}
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
                    <Button variant="ghost" size="icon" onClick={() => imageInputRef.current.click()}>
                      <Camera className="h-5 w-5 text-green-500" />
                    </Button>
                    <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
                    <Button variant="ghost" size="icon" onClick={() => videoInputRef.current.click()}>
                      <Video className="h-5 w-5 text-blue-500" />
                    </Button>
                    <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={(e) => handleFileChange(e, 'video')} />
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