import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import LocationImageUploader from './LocationImageUploader';
import LocationSelectors from './LocationSelectors';

const sanitizeFileName = (fileName) => {
  return fileName
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '') 
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') 
    .replace(/\s+/g, '_'); 
};

const CheckInForm = ({ existingLocation, onCheckInSuccess, setIsOpen }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset, control } = useForm();
  
  const watchAllowSleep = watch('allow_sleep');
  const fileInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const isUpdateMode = !!existingLocation;

  useEffect(() => {
    if (isUpdateMode) {
      Object.keys(existingLocation).forEach(key => {
        setValue(key, existingLocation[key]);
      });
      if (existingLocation.image_url) {
        setImagePreview(existingLocation.image_url);
      }
    } else {
      reset();
      setImagePreview(null);
      setImageFile(null);
    }
  }, [isUpdateMode, existingLocation, setValue, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const onSubmit = async (data) => {
    let imageUrl = existingLocation?.image_url || null;

    if (imageFile) {
        const sanitizedFileName = sanitizeFileName(imageFile.name);
        const fileName = `${user.id}/${Date.now()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('location-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          toast({ variant: 'destructive', title: 'Erro no Upload', description: `Falha ao enviar imagem: ${uploadError.message}` });
          return;
        }

        const { data: urlData } = supabase.storage.from('location-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
    }

    const finalData = { ...data, image_url: imageUrl };

    if (isUpdateMode) {
      // Retain original creator and location if not provided in update
      finalData.user_id = existingLocation.user_id;
      finalData.latitude = existingLocation.latitude;
      finalData.longitude = existingLocation.longitude;
    } else {
      finalData.user_id = user.id;
      finalData.latitude = 0; // Or get from geolocation
      finalData.longitude = 0; // Or get from geolocation
    }

    if (!finalData.place_name || !finalData.state || !finalData.city) {
      return toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Por favor, preencha o nome do local, estado e cidade.' });
    }
    
    const query = isUpdateMode
      ? supabase.from('check_in_locations').update(finalData).eq('id', existingLocation.id)
      : supabase.from('check_in_locations').insert(finalData);

    const { data: locationData, error } = await query.select().single();

    if (error) {
      toast({ variant: 'destructive', title: `Erro ao ${isUpdateMode ? 'atualizar' : 'fazer check-in'}`, description: error.message });
    } else {
      toast({ title: `Local ${isUpdateMode ? 'atualizado' : 'registrado'} com sucesso!` });
      onCheckInSuccess(locationData);
      reset();
      setImageFile(null);
      setImagePreview(null);
      setIsOpen(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
      <LocationImageUploader 
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onRemoveImage={removeImage}
        fileInputRef={fileInputRef}
      />
      
      <div className="space-y-2">
        <Label htmlFor="place_name">Nome do Local (Ex: Praia do Rosa)</Label>
        <Input id="place_name" {...register('place_name', { required: 'Nome do local é obrigatório' })} />
        {errors.place_name && <p className="text-red-500 text-xs">{errors.place_name.message}</p>}
      </div>

      <LocationSelectors control={control} errors={errors} watch={watch} setValue={setValue} isUpdateMode={isUpdateMode} existingLocation={existingLocation} />

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register('description')} placeholder="Como é o lugar? Dicas de acesso, etc."/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="address">Endereço (opcional)</Label>
            <Input id="address" {...register('address')} />
        </div>
         <div className="space-y-2">
            <Label htmlFor="website">Website (opcional)</Label>
            <Input id="website" {...register('website')} placeholder="https://..." />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Local</Label>
          <Controller name="location_type" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger><SelectContent>
              <SelectItem value="camping_selvagem">Camping Selvagem</SelectItem><SelectItem value="ponto_de_apoio">Ponto de Apoio</SelectItem>
              <SelectItem value="estacionamento">Estacionamento</SelectItem><SelectItem value="posto_combustivel">Posto de Combustível</SelectItem>
              <SelectItem value="outro">Outro</SelectItem></SelectContent></Select>
          )} />
        </div>
        <div className="space-y-2">
          <Label>Nível de Segurança</Label>
          <Controller name="security_level" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Como você se sentiu?" /></SelectTrigger><SelectContent>
              <SelectItem value="alto">Alto</SelectItem><SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="baixo">Baixo</SelectItem></SelectContent></Select>
          )} />
        </div>
      </div>

      <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center space-x-2"><Controller name="allow_sleep" control={control} render={({ field }) => <Switch id="allow_sleep" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="allow_sleep">Permite dormir?</Label></div>
            <div className="flex items-center space-x-2"><Controller name="has_power" control={control} render={({ field }) => <Switch id="has_power" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="has_power">Energia?</Label></div>
            <div className="flex items-center space-x-2"><Controller name="has_water" control={control} render={({ field }) => <Switch id="has_water" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="has_water">Água?</Label></div>
            <div className="flex items-center space-x-2"><Controller name="accepts_motorhome" control={control} render={({ field }) => <Switch id="accepts_motorhome" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="accepts_motorhome">Aceita motorhome?</Label></div>
            <div className="flex items-center space-x-2"><Controller name="accepts_pets" control={control} render={({ field }) => <Switch id="accepts_pets" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="accepts_pets">Aceita pets?</Label></div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchAllowSleep && (
            <div className="space-y-2">
                <Label>Banheiro</Label>
                <Controller name="bathroom_details" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Tem banheiro disponível?" /></SelectTrigger><SelectContent>
                      <SelectItem value="sem_banheiro">Não tem</SelectItem><SelectItem value="banheiro_simples">Sim, simples</SelectItem>
                      <SelectItem value="banheiro_com_chuveiro">Sim, com chuveiro</SelectItem></SelectContent></Select>
                )} />
            </div>
          )}
           <div className="space-y-2">
            <Label>Cozinha</Label>
             <Controller name="kitchen_details" control={control} render={({ field }) => (
                 <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Tem cozinha disponível?" /></SelectTrigger><SelectContent>
                    <SelectItem value="nao_tem">Não tem</SelectItem><SelectItem value="particular">Sim, particular</SelectItem>
                    <SelectItem value="compartilhada">Sim, compartilhada</SelectItem></SelectContent></Select>
             )} />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label htmlFor="contact_name">Nome do Contato (opcional)</Label><Input id="contact_name" {...register('contact_name')} placeholder="Ex: Sr. João (dono do sítio)"/></div>
        <div className="space-y-2"><Label htmlFor="phone">Telefone (opcional)</Label><Input id="phone" {...register('phone')} /></div>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
        <Button type="submit" className="nomad-gradient text-white" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUpdateMode ? 'Atualizar Local' : 'Salvar Local'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default CheckInForm;