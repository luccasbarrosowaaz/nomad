import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Search, MapPin, Filter, Star, Users, Compass, X, Power, Droplets, Bed, Utensils as CookingPot, Dog, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import CheckInModal from '@/components/CheckInModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import LocationFilters from '@/components/LocationFilters';

const Explore = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('cards');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    state: '',
    city: '',
    location_type: '',
    amenities: [],
    address: '',
  });
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('check_in_locations')
      .select('*, profile:profiles(username, full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.or(`place_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`);
    }
    if (filters.state) {
      query = query.eq('state', filters.state);
    }
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.address) {
      query = query.ilike('address', `%${filters.address}%`);
    }
    if (filters.location_type) {
      query = query.eq('location_type', filters.location_type);
    }
    if (filters.amenities?.includes('allow_sleep')) {
      query = query.eq('allow_sleep', true);
    }
    if (filters.amenities?.includes('has_power')) {
      query = query.eq('has_power', true);
    }
    if (filters.amenities?.includes('has_water')) {
      query = query.eq('has_water', true);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar locais', description: error.message });
    } else {
      setLocations(data);
    }
    setLoading(false);
  }, [toast, searchTerm, filters]);
  
  const updateActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.state) count++;
    if (filters.city) count++;
    if (filters.address) count++;
    if (filters.location_type) count++;
    if (filters.amenities && filters.amenities.length > 0) {
      count += filters.amenities.length;
    }
    setActiveFilterCount(count);
  }, [filters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLocations();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchLocations, searchTerm]);

  useEffect(() => {
    updateActiveFilterCount();
  }, [filters, updateActiveFilterCount]);


  const handleCheckIn = () => {
    setIsCheckInModalOpen(true);
  };
  
  const handleApplyFilters = () => {
    fetchLocations();
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({ state: '', city: '', location_type: '', amenities: [], address: '' });
    // The fetch will be triggered by the state change in the useEffect
  };
  
  const renderMap = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-border">
       <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src="https://www.openstreetmap.org/export/embed.html?bbox=-73.99%2C-33.75%2C-34.79%2C5.27&layer=mapnik"
        >
        </iframe>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Explorar - Nomad Connect</title>
        <meta name="description" content="Descubra novos destinos e aventuras incríveis no Nomad Connect" />
      </Helmet>

      <CheckInModal 
        isOpen={isCheckInModalOpen} 
        setIsOpen={setIsCheckInModalOpen}
        onCheckInSuccess={(location) => navigate(`/location/${location.id}`)}
      />

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-3xl font-bold nomad-gradient-text mb-2">Explore Novos Destinos</h1>
          <p className="text-muted-foreground">Descubra lugares incríveis avaliados pela comunidade de aventureiros</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input placeholder="Buscar por local, cidade, endereço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-input border-input text-foreground" />
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={handleCheckIn} className="w-full md:w-auto nomad-gradient text-white">
                <Compass className="h-4 w-4 mr-2" />
                Check-in
              </Button>

              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-semibold text-lg">Filtros de Locais</h3>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFilterOpen(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <LocationFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                  />
                </PopoverContent>
              </Popover>

              <div className="hidden sm:flex space-x-1 bg-secondary rounded-lg p-1">
                 <Button onClick={() => setView('cards')} variant={view === 'cards' ? 'default' : 'ghost'} size="sm" className={view === 'cards' ? 'nomad-gradient text-white' : 'text-muted-foreground'}>Cards</Button>
                 <Button onClick={() => setView('map')} variant={view === 'map' ? 'default' : 'ghost'} size="sm" className={view === 'map' ? 'nomad-gradient text-white' : 'text-muted-foreground'}>Mapa</Button>
              </div>
            </div>
          </div>
        </motion.div>

        {view === 'cards' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-card rounded-xl shadow-md border border-border p-4 animate-pulse">
                  <div className="h-48 bg-secondary rounded-lg mb-4"></div>
                  <div className="h-6 bg-secondary rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-secondary rounded w-1/2"></div>
                </div>
              ))
            ) : locations.length > 0 ? locations.map((location, index) => (
              <motion.div key={location.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -5 }} className="bg-card rounded-xl overflow-hidden cursor-pointer group shadow-md border border-border">
                 <Link to={`/location/${location.id}`}>
                  <div>
                    <div className="relative h-48 overflow-hidden bg-secondary">
                      {location.image_url ? (
                        <img src={location.image_url} alt={location.place_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                          <MapPin className="h-16 w-16 text-white/50" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-white text-xs font-medium">{location.security_level || 'N/A'}</span>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                          <h3 className="font-semibold text-lg">{location.place_name}</h3>
                          <div className="flex items-center space-x-1 text-xs">
                              <MapPin className="h-3 w-3" />
                              <span>{location.city}, {location.state}</span>
                          </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground mb-3 h-10 truncate">{location.description || 'Nenhuma descrição fornecida.'}</p>
                      <div className="flex flex-wrap gap-2 text-muted-foreground">
                        {location.allow_sleep && <Bed className="h-4 w-4" title="Permite dormir" />}
                        {location.has_power && <Power className="h-4 w-4" title="Tem energia" />}
                        {location.has_water && <Droplets className="h-4 w-4" title="Tem água" />}
                        {location.accepts_motorhome && <Car className="h-4 w-4" title="Aceita motorhome" />}
                        {location.accepts_pets && <Dog className="h-4 w-4" title="Aceita pets" />}
                        {location.kitchen_details && location.kitchen_details !== 'nao_tem' && <CookingPot className="h-4 w-4" title="Tem cozinha" />}
                      </div>
                        <div className="flex items-center text-xs text-muted-foreground space-x-1 mt-4 border-t border-border pt-2">
                            <Users className="h-3 w-3" />
                            <span>{location.profile.username}</span>
                        </div>
                      </div>
                    </div>
                </Link>
              </motion.div>
            )) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">Nenhum local encontrado com os filtros atuais.</p>
                <Button variant="link" onClick={handleClearFilters}>Limpar filtros</Button>
              </div>
            )}
          </motion.div>
        ) : renderMap()}
      </div>
    </>
  );
};

export default Explore;