import React, { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { states, getCitiesByState } from '@/lib/brazilian-locations';
import { cn } from '@/lib/utils';

const LocationSelectors = ({ control, errors, watch, setValue, isUpdateMode, existingLocation }) => {
  const watchState = watch('state');
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (watchState) {
      const cityList = getCitiesByState(watchState);
      setCities(cityList.map(city => ({ value: city, label: city })));
      if (!isUpdateMode || (existingLocation && watchState !== existingLocation.state)) {
        setValue('city', '');
      }
    } else {
      setCities([]);
    }
  }, [watchState, setValue, isUpdateMode, existingLocation]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Estado</Label>
        <Controller
          name="state"
          control={control}
          rules={{ required: 'Estado é obrigatório' }}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {field.value ? states.find(s => s.value === field.value)?.label : "Selecione o estado"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar estado..." />
                  <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {states.map((state) => (
                        <CommandItem key={state.value} value={state.label} onSelect={() => {
                          field.onChange(state.value);
                        }}>
                          <Check className={cn("mr-2 h-4 w-4", field.value === state.value ? "opacity-100" : "opacity-0")} />
                          {state.label}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Cidade</Label>
        <Controller
          name="city"
          control={control}
          rules={{ required: 'Cidade é obrigatória' }}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!watchState}>
                  {field.value || "Selecione a cidade"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cidade..." />
                  <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {cities.map((city) => (
                        <CommandItem key={city.value} value={city.label} onSelect={() => {
                          field.onChange(city.value);
                        }}>
                          <Check className={cn("mr-2 h-4 w-4", field.value === city.value ? "opacity-100" : "opacity-0")} />
                          {city.label}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
      </div>
    </div>
  );
};

export default LocationSelectors;