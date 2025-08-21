import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield } from 'lucide-react';

const SecuritySettings = ({ isPrivate, setIsPrivate }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 border-b pb-2 flex items-center"><Shield className="mr-2 h-6 w-6 text-primary"/> Privacidade e Segurança</h2>
      <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
        <div>
          <Label htmlFor="private-profile" className="font-semibold">Perfil Privado</Label>
          <p className="text-sm text-muted-foreground">Se ativado, apenas seus seguidores poderão ver seus posts.</p>
        </div>
        <Switch id="private-profile" checked={isPrivate} onCheckedChange={setIsPrivate} />
      </div>
    </div>
  );
};

export default SecuritySettings;