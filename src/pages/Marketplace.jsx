import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Search, Plus, MapPin, Clock, Heart, MessageCircle, Tag, Type, DollarSign, Text, Package, ImagePlus, X, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CreateListingForm = ({ setOpen, onListingCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [itemType, setItemType] = useState('produtos');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  
  const sanitizeFileName = (name) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\s+/g, '_');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
        toast({ variant: 'destructive', title: 'Limite de 5 imagens por anúncio.' });
        return;
    }
    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);

    const newImagePreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newImagePreviews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
      const sanitizedName = sanitizeFileName(file.name);
      const fileName = `${user.id}/${Date.now()}_${sanitizedName}`;
      
      const { data, error } = await supabase.storage
        .from('marketplace-images')
        .upload(fileName, file);

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      
      const { data: urlData } = supabase.storage.from('marketplace-images').getPublicUrl(data.path);
      if (!urlData.publicUrl) {
        throw new Error('Upload succeeded but did not return a public URL.');
      }
      
      return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      toast({ variant: 'destructive', title: 'Título é obrigatório' });
      return;
    }
    setIsSubmitting(true);
    try {
      const imageUrls = await Promise.all(imageFiles.map(uploadFile));
      const { data, error } = await supabase
        .from('marketplace_items')
        .insert({
          title, description, price: price ? parseFloat(price) : null, category, item_type: itemType, user_id: user.id, image_urls: imageUrls
        })
        .select('*, profile:profiles(id, username, full_name, avatar_url)')
        .single();

      if (error) throw error;
      
      toast({ title: 'Anúncio criado com sucesso!' });
      onListingCreated(data);
      setOpen(false);

    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro ao criar anúncio', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={itemType} onValueChange={setItemType} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="produtos">Produto</TabsTrigger>
              <TabsTrigger value="servicos">Serviço</TabsTrigger>
          </TabsList>
      </Tabs>
      <div className="space-y-2">
        <Label htmlFor="title"><Type className="inline-block h-4 w-4 mr-2" />Título do anúncio</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description"><Text className="inline-block h-4 w-4 mr-2" />Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price"><DollarSign className="inline-block h-4 w-4 mr-2" />Preço (R$)</Label>
          <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Deixe em branco se for grátis"/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category"><Tag className="inline-block h-4 w-4 mr-2" />Categoria</Label>
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={itemType === 'produtos' ? 'Ex: Equipamento' : 'Ex: Guia'}/>
        </div>
      </div>
       <div className="space-y-2">
            <Label><ImagePlus className="inline-block h-4 w-4 mr-2" />Fotos (até 5)</Label>
            <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                        <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-md" />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {imagePreviews.length < 5 && (
                    <Button type="button" variant="outline" className="aspect-square flex-col" onClick={() => fileInputRef.current.click()}>
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    </Button>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
        </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="nomad-gradient text-white">
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</> : "Publicar Anúncio"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const Marketplace = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('produtos');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('marketplace_items')
      .select('*, profile:profiles(id, username, full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if(searchTerm){
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar itens.', description: error.message });
    } else {
      setItems(data);
    }
    setLoading(false);
  }, [toast, searchTerm]);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchItems();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchItems, searchTerm]);
  
  const filteredItems = items.filter(item => item.item_type === activeTab);

  const handleContact = async (item) => {
    if (!user || !item.profile) return;
    if (user.id === item.profile.id) {
      toast({ title: "Você não pode contatar a si mesmo." });
      return;
    }

    const { data: existingConversation, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_one.eq.${user.id},participant_two.eq.${item.profile.id}),and(participant_one.eq.${item.profile.id},participant_two.eq.${user.id})`)
      .maybeSingle();

    if (existingError) {
      return toast({ variant: 'destructive', title: 'Erro ao iniciar conversa', description: existingError.message });
    }

    if (existingConversation) {
      return navigate('/messages');
    }

    const { error: newConvError } = await supabase
      .from('conversations')
      .insert({ participant_one: user.id, participant_two: item.profile.id });

    if (newConvError) {
      return toast({ variant: 'destructive', title: 'Erro ao iniciar conversa', description: newConvError.message });
    }

    navigate('/messages');
  };

  const handleListingCreated = (newItem) => {
    setItems(prev => [newItem, ...prev]);
    if (newItem.item_type === activeTab) {
        // stay on the same tab
    } else {
        setActiveTab(newItem.item_type);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    if (selectedItem.image_urls && selectedItem.image_urls.length > 0) {
      const filesToDelete = selectedItem.image_urls.map(url => {
        const urlParts = new URL(url);
        const pathParts = urlParts.pathname.split('/');
        return pathParts.slice(pathParts.indexOf('marketplace-images') + 1).join('/');
      });

      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from('marketplace-images').remove(filesToDelete);
        if (storageError) {
          console.error("Erro ao deletar imagens do storage:", storageError);
          toast({ variant: "destructive", title: "Erro ao deletar imagens", description: storageError.message });
        }
      }
    }

    const { error } = await supabase.from('marketplace_items').delete().eq('id', selectedItem.id);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao apagar anúncio", description: error.message });
    } else {
      toast({ title: "Anúncio apagado com sucesso!" });
      setItems(prev => prev.filter(item => item.id !== selectedItem.id));
      setSelectedItem(null);
    }
    setDeleteAlertOpen(false);
  };
  
  return (
    <>
      <Helmet>
        <title>Classificados - Nomad Connect</title>
        <meta name="description" content="Compre e venda equipamentos e serviços no marketplace do Nomad Connect" />
      </Helmet>
      
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-3xl font-bold nomad-gradient-text mb-2">Classificados Nomad</h1>
          <p className="text-muted-foreground">Compre, venda e contrate serviços da comunidade aventureira</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input placeholder="Buscar por título, descrição, localização..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-input border-border text-foreground" />
            </div>
            <div className="flex space-x-2">
              <Button className="nomad-gradient text-white" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Anúncio
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="produtos">Produtos</TabsTrigger>
                  <TabsTrigger value="servicos">Serviços</TabsTrigger>
              </TabsList>
          </Tabs>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? Array.from({length: 6}).map((_, i) => (
            <div key={i} className="bg-card rounded-xl shadow-md border border-border p-4 animate-pulse">
              <div className="h-48 bg-secondary rounded-lg mb-4"></div>
              <div className="h-6 bg-secondary rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-secondary rounded w-1/2"></div>
            </div>
          )) : 
          filteredItems.map((item, index) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.1 }} 
              whileHover={{ y: -5 }} 
              className="bg-card rounded-xl overflow-hidden cursor-pointer group shadow-md border border-border"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative h-48 overflow-hidden bg-secondary">
                {item.image_urls && item.image_urls.length > 0 ? (
                  <img alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src={item.image_urls[0]} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-500 p-4">
                     <Package className="h-16 w-16 text-white/50" />
                  </div>
                )}
                <div className="absolute top-4 right-4"><button className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500/70 transition-colors"><Heart className="h-4 w-4 text-white" /></button></div>
                <div className="absolute bottom-4 left-4"><span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">{item.category}</span></div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary dark:group-hover:text-primary transition-colors">{item.title}</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{item.price ? `R$ ${item.price}`: 'Grátis / A combinar'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-3">
                  <MapPin className="h-3 w-3" /><span>{item.location || 'Brasil'}</span><span>•</span><Clock className="h-3 w-3" /><span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-sm">
                    <p className="text-foreground">{item.profile.full_name}</p>
                    {item.condition && (<p className="text-xs text-muted-foreground">{item.condition}</p>)}
                  </div>
                  <Button onClick={(e) => { e.stopPropagation(); handleContact(item); }} size="sm" className="nomad-gradient text-white"><MessageCircle className="h-4 w-4 mr-1" />Contatar</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
              <DialogTitle>Criar Novo Anúncio</DialogTitle>
              <DialogDescription>Preencha os detalhes abaixo para publicar seu item ou serviço.</DialogDescription>
          </DialogHeader>
          <CreateListingForm setOpen={setCreateModalOpen} onListingCreated={handleListingCreated} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-foreground">{selectedItem.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center"><MapPin className="h-4 w-4 mr-1" />{selectedItem.location || 'Brasil'}</div>
                  <div className="flex items-center"><Clock className="h-4 w-4 mr-1" />{new Date(selectedItem.created_at).toLocaleDateString()}</div>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="relative h-64 rounded-lg overflow-hidden bg-secondary">
                    {selectedItem.image_urls && selectedItem.image_urls.length > 0 ? (
                      <img alt={selectedItem.title} className="w-full h-full object-cover" src={selectedItem.image_urls[0]} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 p-4">
                        <Package className="h-16 w-16 text-white/50" />
                      </div>
                    )}
                </div>
                <div className="flex flex-col">
                    <p className="text-muted-foreground mb-4 flex-grow">{selectedItem.description}</p>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Vendido por: <span className="font-medium text-foreground">{selectedItem.profile.full_name}</span></p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{selectedItem.price ? `R$ ${selectedItem.price}` : 'Grátis / A combinar'}</p>
                    </div>
                </div>
            </div>
            <DialogFooter className="justify-between">
              <div>
                {user && user.id === selectedItem.profile.id && (
                  <Button variant="destructive" onClick={() => setDeleteAlertOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Apagar Anúncio
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Heart className="h-4 w-4 mr-2" />
                  Curtir
                </Button>
                {user && user.id !== selectedItem.profile.id && (
                  <Button onClick={() => handleContact(selectedItem)} className="nomad-gradient text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contatar Vendedor
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-destructive" />
                Tem certeza?
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso apagará permanentemente o anúncio e todas as suas imagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, apagar anúncio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Marketplace;