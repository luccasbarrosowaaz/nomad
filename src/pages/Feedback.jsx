import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const feedbackSchema = z.object({
  type: z.enum(['suggestion', 'support', 'report'], { required_error: 'Por favor, selecione um tipo.' }),
  message: z.string().min(10, { message: 'A mensagem deve ter pelo menos 10 caracteres.' }).max(2000, { message: 'A mensagem não pode exceder 2000 caracteres.' }),
  reported_username: z.string().optional(),
}).refine(data => {
  if (data.type === 'report') {
    return !!data.reported_username && data.reported_username.length > 0;
  }
  return true;
}, {
  message: 'O nome do usuário a ser denunciado é obrigatório.',
  path: ['reported_username'],
});

const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors }, setValue, trigger, reset } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: '',
      message: '',
      reported_username: '',
    }
  });

  const feedbackType = watch('type');

  const onSubmit = async (data) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'Você precisa estar logado para enviar feedback.',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      type: data.type,
      message: data.message,
      reported_username: data.type === 'report' ? data.reported_username : null,
      status: 'new'
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar',
        description: 'Não foi possível enviar seu feedback. Tente novamente.',
      });
    } else {
      toast({
        title: 'Feedback Enviado!',
        description: 'Obrigado por sua contribuição. Sua mensagem foi recebida com sucesso.',
      });
      reset();
    }
  };

  return (
    <>
      <Helmet>
        <title>Feedback e Suporte - Nomad Connect</title>
        <meta name="description" content="Envie suas sugestões, peça suporte ou denuncie um problema. A sua opinião é importante para nós!" />
      </Helmet>
      <motion.div 
        className="container mx-auto max-w-4xl py-10 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full bg-card/80 backdrop-blur-sm border-border/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold nomad-gradient-text">Feedback e Suporte</CardTitle>
            <CardDescription className="text-muted-foreground">Sua voz é fundamental para construirmos uma comunidade melhor. Use este espaço para nos ajudar a evoluir.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Contato</Label>
                <Select onValueChange={(value) => {
                  setValue('type', value, { shouldValidate: true });
                  if (value !== 'report') {
                    setValue('reported_username', '');
                    trigger('reported_username');
                  }
                }}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Selecione o motivo do seu contato..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suggestion">Sugestão de Melhoria</SelectItem>
                    <SelectItem value="support">Pedido de Suporte</SelectItem>
                    <SelectItem value="report">Denunciar Usuário ou Conteúdo</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm font-medium text-destructive">{errors.type.message}</p>}
              </div>

              <AnimatePresence>
                {feedbackType === 'report' && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="reported_username">Nome do Usuário a ser Denunciado</Label>
                    <Input 
                      id="reported_username" 
                      placeholder="@nomadedigital" 
                      {...register('reported_username')}
                    />
                     {errors.reported_username && <p className="text-sm font-medium text-destructive">{errors.reported_username.message}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="message">Sua Mensagem</Label>
                <Textarea 
                  id="message"
                  placeholder="Descreva com detalhes sua sugestão, problema ou denúncia..." 
                  className="min-h-[150px]"
                  {...register('message')}
                />
                 {errors.message && <p className="text-sm font-medium text-destructive">{errors.message.message}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full nomad-gradient text-white font-bold">
                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default Feedback;