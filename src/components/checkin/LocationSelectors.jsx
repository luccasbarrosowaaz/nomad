import React, { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { states, getCitiesByState } from '@/lib/brazilian-locations';

const LocationSelectors = ({ control, errors, watch, setValue, isUpdateMode, existingLocation }) => {
  const watchState = watch('state');
  const watchCity = watch('city');
  const [cities, setCities] = useState([]);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => {
    if (watchState) {
      setCities(getCitiesByState(watchState));
      if (!isUpdateMode || (existingLocation && watchState !== existingLocation.state)) {
        setValue('city', '');
      }
    } else {
      setCities([]);
    }
  }, [watchState, setValue, isUpdateMode, existingLocation]);

  const filteredStates = states.filter(state =>
    state.label.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Estado</Label>
        <div className="relative">
          <Input
            placeholder="Digite o nome do estado..."
            value={stateSearch}
            onChange={(e) => setStateSearch(e.target.value)}
            className="text-base"
          />
          {stateSearch && filteredStates.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
              {filteredStates.map((state) => (
                <button
                  key={state.value}
                  onClick={() => {
                    setValue('state', state.value);
                    setStateSearch('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-secondary text-sm border-b border-border last:border-b-0"
                >
                  {state.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {watchState && (
          <div className="flex items-center justify-between bg-primary/10 px-2 py-1 rounded text-sm">
            <span className="text-primary font-medium">
              {states.find(s => s.value === watchState)?.label}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-primary"
              onClick={() => setValue('state', '')}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Cidade</Label>
        <div className="relative">
          <Input
            placeholder={watchState ? "Digite o nome da cidade..." : "Selecione um estado primeiro"}
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            disabled={!watchState}
            className="text-base"
          />
          {citySearch && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setValue('city', city);
                    setCitySearch('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-secondary text-sm border-b border-border last:border-b-0"
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
        {watchCity && (
          <div className="flex items-center justify-between bg-primary/10 px-2 py-1 rounded text-sm">
            <span className="text-primary font-medium">{watchCity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-primary"
              onClick={() => setValue('city', '')}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
      </div>
    </div>
  );
};

export default LocationSelectors;