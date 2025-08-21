import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

const DangerZone = ({ profile }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== profile?.username) {
      toast({ variant: 'destructive', title: 'Confirmação incorreta', description: 'Por favor, digite seu nome de usuário corretamente para confirmar.' });
      return;
    }
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id },
      });

      if (error) throw new Error(error.message);

      toast({ title: 'Conta excluída', description: 'Sua conta foi excluída com sucesso. Sentiremos sua falta!' });
      await signOut();
      navigate('/auth');

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir conta', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center text-destructive"><AlertTriangle className="mr-2 h-6 w-6"/> Zona de Perigo</h2>
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
        <div>
          <h3 className="font-bold text-destructive">Excluir esta conta</h3>
          <p className="text-sm text-destructive/80">Esta ação é irreversível. Todos os seus dados serão permanentemente apagados.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Excluir Conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tem certeza absoluta?</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta, posts, comentários e todos os outros dados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Para confirmar, digite seu nome de usuário: <span className="font-bold">{profile?.username}</span></Label>
              <Input 
                id="delete-confirm" 
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Seu nome de usuário"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== profile?.username || isDeleting}
              >
                {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Excluindo...</> : 'Eu entendo, excluir minha conta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DangerZone;