import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar as AvatarComponent, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';

const ProfileSettings = ({ coverFile, avatarFile, handleFileChange, register, errors }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Perfil Público</h2>
      <div className="space-y-4">
        <div className="relative">
          <input type="file" onChange={(e) => handleFileChange(e, 'cover')} accept="image/*" className="hidden" id="cover-upload" />
          <Label htmlFor="cover-upload" className="cursor-pointer group">
            <div className="h-48 bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-all relative">
              {coverFile ? (
                <img src={coverFile} alt="Pré-visualização da capa" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-muted-foreground">Clique para adicionar uma imagem de capa</span>
              )}
              <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8" />
              </div>
            </div>
          </Label>
        </div>
        <div className="flex items-end -mt-16 ml-8">
          <div className="relative">
            <input type="file" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" className="hidden" id="avatar-upload" />
            <Label htmlFor="avatar-upload" className="cursor-pointer group">
              <AvatarComponent className="h-32 w-32 border-4 border-background">
                <AvatarImage src={avatarFile} />
                <AvatarFallback />
              </AvatarComponent>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8" />
              </div>
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div>
          <Label htmlFor="username">Nome de Usuário</Label>
          <Input id="username" {...register('username', { required: 'Nome de usuário é obrigatório', pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Apenas letras, números e underscores' } })} />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
        </div>
        <div>
          <Label htmlFor="full_name">Nome Completo</Label>
          <Input id="full_name" {...register('full_name')} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" {...register('bio')} placeholder="Conte um pouco sobre suas aventuras..." />
        </div>
        <div>
          <Label htmlFor="location">Localização</Label>
          <Input id="location" {...register('location')} placeholder="Ex: Florianópolis, SC" />
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;