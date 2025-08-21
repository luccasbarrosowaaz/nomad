import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useProfileStore } from '@/hooks/useProfile';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Crop } from 'lucide-react';
import ProfileSettings from '@/components/settings/ProfileSettings';
import SocialLinksSettings from '@/components/settings/SocialLinksSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import DangerZone from '@/components/settings/DangerZone';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

const getCroppedImg = (image, crop, fileName) => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );
        
        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            blob.name = fileName;
            resolve(blob);
        }, 'image/jpeg');
    });
};

const Settings = () => {
    const { user } = useAuth();
    const { profile, loading: profileLoading, fetchProfile } = useProfileStore();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { register, handleSubmit, reset, setValue, formState: { isSubmitting, errors } } = useForm();
    
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [isPrivate, setIsPrivate] = useState(false);

    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [cropType, setCropType] = useState('avatar');
    const [cropAspect, setCropAspect] = useState(1);
    const imgRef = useRef(null);

    useEffect(() => {
        if (profile) {
            reset({
                username: profile.username || '',
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                location: profile.location || '',
                website_url: profile.website_url || '',
                youtube_url: profile.youtube_url || '',
                instagram_url: profile.instagram_url || '',
                tiktok_url: profile.tiktok_url || '',
                facebook_url: profile.facebook_url || '',
            });
            setAvatarFile(profile.avatar_url);
            setCoverFile(profile.cover_url);
            setIsPrivate(profile.is_private);
        }
    }, [profile, reset]);
      
    const sanitizeFileName = (name) => {
        return name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/\s+/g, '_');
    };

    const handleFileChange = (e, type) => {
        if (e.target.files && e.target.files.length > 0) {
            setCropType(type);
            setCropAspect(type === 'avatar' ? 1 / 1 : 16 / 9);
            setCrop(undefined); 
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setIsCropModalOpen(true);
        }
    };
    
    function onImageLoad(e) {
        if (cropAspect) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, cropAspect));
        }
    }

    const handleCropComplete = async () => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current) {
            try {
                const croppedImageBlob = await getCroppedImg(
                    imgRef.current,
                    completedCrop,
                    'cropped-image.jpg'
                );
                
                if(cropType === 'avatar') {
                    setAvatarFile(croppedImageBlob);
                } else {
                    setCoverFile(croppedImageBlob);
                }
                
                setIsCropModalOpen(false);
                setImgSrc('');

            } catch (e) {
                console.error(e);
                toast({ variant: 'destructive', title: 'Erro ao cortar imagem' });
            }
        }
    };

    const uploadImage = async (file, bucket) => {
        if (!file) return null;
        if (typeof file === 'string') return file;
        
        const sanitizedName = sanitizeFileName(file.name || 'image.jpg');
        const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true,
            });

        if (error) {
            toast({ variant: 'destructive', title: 'Erro de Upload', description: error.message });
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    };

    const onSubmit = async (data) => {
        if (!user) return;
        
        try {
            const avatarUrl = await uploadImage(avatarFile, 'avatars');
            const coverUrl = await uploadImage(coverFile, 'covers');
            
            const updatedProfile = {
                ...data,
                id: user.id,
                avatar_url: avatarUrl,
                cover_url: coverUrl,
                is_private: isPrivate,
            };

            const { error } = await supabase.from('profiles').upsert(updatedProfile);

            if (error) throw error;
          
            await fetchProfile(user.id, true); // Force refresh
            toast({ title: 'Sucesso!', description: 'Seu perfil foi atualizado.' });
            navigate('/', { state: { fromSettings: true } });

        } catch (error) {
            if (error.code === '23505' && error.details.includes('username')) {
                toast({ variant: 'destructive', title: 'Erro ao atualizar', description: 'Este nome de usuário já está em uso. Por favor, escolha outro.' });
            } else {
                toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
            }
        }
    };

    if (profileLoading && !profile) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
      
    const getAvatarPreview = () => {
        if (avatarFile instanceof Blob) return URL.createObjectURL(avatarFile);
        return avatarFile;
    }
    const getCoverPreview = () => {
        if (coverFile instanceof Blob) return URL.createObjectURL(coverFile);
        return coverFile;
    }

    return (
        <>
            <Helmet>
                <title>Configurações - Nomad Connect</title>
                <meta name="description" content="Gerencie suas informações de perfil, configurações de conta e mais." />
            </Helmet>

            <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Ajustar Imagem</DialogTitle>
                    </DialogHeader>
                    {imgSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={cropAspect}
                            className="max-h-[70vh]"
                        >
                            <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} />
                        </ReactCrop>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCropComplete}>
                            <Crop className="mr-2 h-4 w-4"/>
                            Cortar e Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="max-w-4xl mx-auto py-10 px-4">
                <h1 className="text-3xl font-bold mb-8">Configurações</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              
                    <ProfileSettings 
                        coverFile={getCoverPreview()}
                        avatarFile={getAvatarPreview()}
                        handleFileChange={handleFileChange}
                        register={register}
                        errors={errors}
                    />

                    <SocialLinksSettings register={register} />

                    <SecuritySettings isPrivate={isPrivate} setIsPrivate={setIsPrivate} />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting} className="nomad-gradient text-white">
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>

                <DangerZone profile={profile} />
            </div>
        </>
    );
};

export default Settings;