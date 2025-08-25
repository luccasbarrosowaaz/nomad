import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bed, Zap, Droplet, X } from 'lucide-react';
import { states, getCitiesByState } from '@/lib/brazilian-locations';

const ImprovedLocationFilters = ({ filters, onFilterChange, onClear }) => {
  const [cities, setCities] = useState([]);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => {
    if (filters.state) {
      setCities(getCitiesByState(filters.state));
    } else {
      setCities([]);
    }
  }, [filters.state]);

  const handleStateChange = (value) => {
    onFilterChange({ ...filters, state: value, city: '' });
    setStateSearch('');
  };

  const handleCityChange = (value) => {
    onFilterChange({ ...filters, city: value });
    setCitySearch('');
  };

  const handleInputChange = (e) => {
    onFilterChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value === 'all' ? '' : value });
  };

  const handleToggleChange = (value) => {
    onFilterChange({ ...filters, amenities: value });
  };

  const filteredStates = states.filter(state =>
    state.label.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const locationTypes = [
    { value: 'camping_selvagem', label: 'Camping Selvagem' },
    { value: 'ponto_de_apoio', label: 'Ponto de Apoio' },
    { value: 'estacionamento', label: 'Estacionamento' },
    { value: 'posto_combustivel', label: 'Posto de Combustível' },
    { value: 'outro', label: 'Outro' },
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.state) count++;
    if (filters.city) count++;
    if (filters.address) count++;
    if (filters.location_type) count++;
    if (filters.amenities && filters.amenities.length > 0) {
      count += filters.amenities.length;
    }
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Busca por endereço sempre visível */}
      <div className="space-y-2">
        <Label htmlFor="address">Buscar por endereço ou local específico</Label>
        <Input 
          id="address" 
          name="address" 
          placeholder="Digite parte do endereço ou nome do local" 
          value={filters.address || ''} 
          onChange={handleInputChange}
          className="text-base"
        />
      </div>

      {/* Estado e Cidade com busca direta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state-search">Estado</Label>
          <div className="relative">
            <Input
              id="state-search"
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
                    onClick={() => handleStateChange(state.value)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary text-sm border-b border-border last:border-b-0"
                  >
                    {state.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filters.state && (
            <div className="flex items-center justify-between bg-primary/10 px-2 py-1 rounded text-sm">
              <span className="text-primary font-medium">
                {states.find(s => s.value === filters.state)?.label}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-primary"
                onClick={() => handleStateChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city-search">Cidade</Label>
          <div className="relative">
            <Input
              id="city-search"
              placeholder={filters.state ? "Digite o nome da cidade..." : "Selecione um estado primeiro"}
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              disabled={!filters.state}
              className="text-base"
            />
            {citySearch && filteredCities.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                {filteredCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityChange(city)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary text-sm border-b border-border last:border-b-0"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filters.city && (
            <div className="flex items-center justify-between bg-primary/10 px-2 py-1 rounded text-sm">
              <span className="text-primary font-medium">{filters.city}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-primary"
                onClick={() => handleCityChange('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tipo de local */}
      <div className="space-y-2">
        <Label htmlFor="location_type">Tipo de Local</Label>
        <Select
          name="location_type"
          value={filters.location_type || 'all'}
          onValueChange={(value) => handleSelectChange('location_type', value)}
        >
          <SelectTrigger id="location_type" className="bg-input text-foreground text-base">
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

      {/* Comodidades */}
      <div className="space-y-2">
        <Label>Comodidades</Label>
        <ToggleGroup 
          type="multiple" 
          className="flex-wrap justify-start gap-2" 
          value={filters.amenities || []} 
          onValueChange={handleToggleChange}
        >
          <ToggleGroupItem value="allow_sleep" aria-label="Permite dormir" className="flex items-center gap-2 text-sm">
            <Bed className="h-4 w-4" /> Dormir
          </ToggleGroupItem>
          <ToggleGroupItem value="has_power" aria-label="Tem energia" className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4" /> Energia
          </ToggleGroupItem>
          <ToggleGroupItem value="has_water" aria-label="Tem água" className="flex items-center gap-2 text-sm">
            <Droplet className="h-4 w-4" /> Água
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Ações */}
      {getActiveFilterCount() > 0 && (
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {getActiveFilterCount()} filtro(s) ativo(s)
          </span>
          <Button variant="outline" onClick={onClear} size="sm">
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImprovedLocationFilters;