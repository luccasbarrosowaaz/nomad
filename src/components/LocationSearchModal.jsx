import React, { useState, useEffect, useCallback } from 'react';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Button } from '@/components/ui/button';
    import { Loader2, Search, MapPin } from 'lucide-react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';

    const LocationSearchModal = ({ isOpen, onClose, onLocationSelect }) => {
      const [searchTerm, setSearchTerm] = useState('');
      const [results, setResults] = useState([]);
      const [loading, setLoading] = useState(false);
      const { toast } = useToast();

      const searchLocations = useCallback(async () => {
        if (searchTerm.trim().length < 2) {
          setResults([]);
          return;
        }

        setLoading(true);
        const { data, error } = await supabase
          .from('check_in_locations')
          .select('id, place_name, city, state')
          .or(`place_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
          .limit(10);
        
        if (error) {
          toast({ variant: 'destructive', title: 'Erro na busca', description: error.message });
        } else {
          setResults(data);
        }
        setLoading(false);
      }, [searchTerm, toast]);

      useEffect(() => {
        const debounce = setTimeout(() => {
          searchLocations();
        }, 300);
        return () => clearTimeout(debounce);
      }, [searchTerm, searchLocations]);

      const handleSelect = (location) => {
        onLocationSelect(location);
        setSearchTerm('');
        setResults([]);
      };

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Check-in em um Local</DialogTitle>
              <DialogDescription>
                Busque por um local existente para fazer check-in ou crie um novo se não encontrar.
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome de um local ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              {loading && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              {!loading && results.length > 0 && results.map(location => (
                <button
                  key={location.id}
                  onClick={() => handleSelect(location)}
                  className="w-full text-left p-3 rounded-md hover:bg-secondary flex items-center"
                >
                  <MapPin className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">{location.place_name}</p>
                    <p className="text-sm text-muted-foreground">{location.city}, {location.state}</p>
                  </div>
                </button>
              ))}
              {!loading && searchTerm && results.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhum local encontrado.</p>
              )}
            </div>
             <div className="mt-4 border-t pt-4">
                <Button variant="outline" className="w-full" onClick={() => toast({ title: '🚧 Em breve!', description: 'A criação de novos locais por aqui será reativada em breve.'})}>
                    Criar um novo local de check-in
                </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    };

    export default LocationSearchModal;