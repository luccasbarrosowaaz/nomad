import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bed, Zap, Droplet, ChevronsUpDown, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { states, getCitiesByState } from '@/lib/brazilian-locations';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const LocationFilters = ({ filters, onFilterChange, onApply, onClear }) => {
  const [cities, setCities] = useState([]);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (filters.state) {
      setCities(getCitiesByState(filters.state).map(city => ({ value: city, label: city })));
    } else {
      setCities([]);
    }
  }, [filters.state]);

  const handleStateChange = (stateValue) => {
    onFilterChange({ ...filters, state: stateValue, city: '', address: filters.address });
    setStateOpen(false);
  };

  const handleCityChange = (cityValue) => {
    onFilterChange({ ...filters, city: cityValue });
    setCityOpen(false);
  };
  
  const handleInputChange = (e) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value === 'all' ? '' : value });
  };
  
  const handleToggleChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value });
  };

  const locationTypes = [
    { value: 'camping_selvagem', label: 'Camping Selvagem' },
    { value: 'ponto_de_apoio', label: 'Ponto de Apoio' },
    { value: 'estacionamento', label: 'Estacionamento' },
    { value: 'posto_combustivel', label: 'Posto de Combustível' },
    { value: 'outro', label: 'Outro' },
  ];

  const LocationPicker = ({ type, isOpen, setIsOpen, onSelect, selectedValue, disabled = false }) => {
    const title = type === 'state' ? 'Selecione um Estado' : 'Selecione uma Cidade';
    const searchPlaceholder = type === 'state' ? 'Buscar estado...' : 'Buscar cidade...';
    const notFoundText = type === 'state' ? 'Nenhum estado encontrado.' : 'Nenhuma cidade encontrada.';
    const data = type === 'state' ? states : cities;
    
    const PickerContent = () => (
      <>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[300px] sm:max-h-[400px]">
            <CommandEmpty>{notFoundText}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem key={item.value} value={item.label} onSelect={() => onSelect(item.value)}>
                  <Check className={cn("mr-2 h-4 w-4", selectedValue === item.value ? "opacity-100" : "opacity-0")} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </>
    );

    const triggerLabel = type === 'state' 
      ? (selectedValue ? states.find(s => s.value === selectedValue)?.label : "Selecione o estado")
      : (selectedValue || "Selecione a cidade");

    if (isDesktop) {
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between" disabled={disabled}>
              {triggerLabel}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-0">
              <PickerContent />
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between" disabled={disabled}>
            {triggerLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pt-0">
            <PickerContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  };


  return (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label>Estado</Label>
          <LocationPicker 
            type="state" 
            isOpen={stateOpen} 
            setIsOpen={setStateOpen}
            onSelect={handleStateChange}
            selectedValue={filters.state}
          />
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <LocationPicker 
            type="city"
            isOpen={cityOpen}
            setIsOpen={setCityOpen}
            onSelect={handleCityChange}
            selectedValue={filters.city}
            disabled={!filters.state}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input 
            id="address" 
            name="address" 
            placeholder="Digite parte do endereço" 
            value={filters.address || ''} 
            onChange={handleInputChange} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_type">Tipo de Local</Label>
        <Select
          name="location_type"
          value={filters.location_type || 'all'}
          onValueChange={(value) => handleSelectChange('location_type', value)}
        >
          <SelectTrigger id="location_type" className="bg-input text-foreground">
            <SelectValue placeholder="Selecione um tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {locationTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Comodidades</Label>
        <ToggleGroup type="multiple" className="flex-wrap justify-start" value={filters.amenities || []} onValueChange={(value) => handleToggleChange('amenities', value)}>
          <ToggleGroupItem value="allow_sleep" aria-label="Permite dormir" className="flex items-center gap-2">
            <Bed className="h-4 w-4" /> Dormir
          </ToggleGroupItem>
          <ToggleGroupItem value="has_power" aria-label="Tem energia" className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Energia
          </ToggleGroupItem>
          <ToggleGroupItem value="has_water" aria-label="Tem água" className="flex items-center gap-2">
            <Droplet className="h-4 w-4" /> Água
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <div className="flex justify-between items-center pt-4 border-t border-border">
         <Button variant="ghost" onClick={onClear} size="sm">
          Limpar
        </Button>
        <Button onClick={onApply} size="sm" className="nomad-gradient text-white">
          Aplicar Filtros
        </Button>
      </div>
    </div>
  );
};

export default LocationFilters;