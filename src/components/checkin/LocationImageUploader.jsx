import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, X } from 'lucide-react';

const LocationImageUploader = ({ imagePreview, onImageChange, onRemoveImage, fileInputRef }) => {
  return (
    <div className="space-y-2">
      <Label>Foto do Local (opcional)</Label>
      {imagePreview ? (
        <div className="relative group aspect-video">
          <img src={imagePreview} alt="Pré-visualização" className="rounded-lg w-full h-full object-cover" />
          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onRemoveImage}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label htmlFor="location-image-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-secondary hover:bg-muted transition-colors">
          <Camera className="h-8 w-8 text-muted-foreground" />
          <span className="mt-2 text-sm text-muted-foreground">Adicionar foto</span>
        </label>
      )}
      <input type="file" id="location-image-upload" accept="image/*" className="hidden" onChange={onImageChange} ref={fileInputRef} />
    </div>
  );
};

export default LocationImageUploader;