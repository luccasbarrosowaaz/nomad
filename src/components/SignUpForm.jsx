import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Camera, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

export const SignUpForm = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const sanitizeFileName = (name) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\s+/g, '_');
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const uploadAvatar = async (file, userId) => {
    const sanitizedName = sanitizeFileName(file.name);
    const fileName = `${userId}/${sanitizedName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
          upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return publicUrl;
  };
  
  const handleSupabaseError = (error) => {
    if (error.message.includes('User already registered')) {
        return {
            title: "E-mail já cadastrado",
            description: "Este endereço de e-mail já está em uso. Tente fazer login ou use um e-mail diferente."
        };
    }
    if (error.message.includes('duplicate key value violates unique constraint "profiles_username_key"')) {
        return {
            title: "Nome de usuário indisponível",
            description: "Este nome de usuário já foi escolhido. Por favor, tente outro."
        };
    }
     if (error.message.includes('Password should be at least 6 characters')) {
        return {
            title: "Senha muito curta",
            description: "Sua senha deve ter no mínimo 6 caracteres."
        };
    }
    return {
        title: "Erro ao criar conta",
        description: "Ocorreu um problema inesperado. Por favor, tente novamente."
    };
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: signUpData, error: signUpError } = await signUp(email, password, {
      data: {
        username: username.trim(),
        full_name: fullName.trim(),
      }
    });

    if (signUpError) {
      const { title, description } = handleSupabaseError(signUpError);
      toast({ variant: 'destructive', title, description });
      setLoading(false);
      return;
    }

    if (signUpData.user && avatarFile) {
      try {
        const avatar_url = await uploadAvatar(avatarFile, signUpData.user.id);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatar_url })
          .eq('id', signUpData.user.id);

        if (updateError) throw updateError;
        
      } catch (profileError) {
         const { title, description } = handleSupabaseError(profileError);
         toast({
            variant: 'destructive',
            title: title,
            description: description
        });
        setLoading(false);
        return;
      }
    }

    toast({
      title: "Conta criada com sucesso!",
      description: "Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada para começar!",
    });

    setLoading(false);
    
    if (signUpData.user) {
      navigate('/settings');
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="space-y-4 mt-6"
    >
        <div className="flex justify-center">
            <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="relative w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-all group">
                {avatarPreview ? (
                    <img src={avatarPreview} alt="Pré-visualização do avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                </div>
                </div>
            </Label>
            <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      <div className="space-y-2">
        <Label htmlFor="full-name-signup" className="text-foreground">Nome Completo</Label>
        <Input
          id="full-name-signup"
          type="text"
          placeholder="Seu nome de aventureiro"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username-signup" className="text-foreground">Nome de Usuário</Label>
        <Input
          id="username-signup"
          type="text"
          placeholder="seu_usuario_unico"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-signup" className="text-foreground">Email</Label>
        <Input
          id="email-signup"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-signup" className="text-foreground">Senha</Label>
        <Input
          id="password-signup"
          type="password"
          placeholder="Crie uma senha forte (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength="6"
        />
      </div>
      <Button type="submit" className="w-full nomad-gradient" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</> : 'Juntar-se à Tribo'}
      </Button>
    </motion.form>
  );
};