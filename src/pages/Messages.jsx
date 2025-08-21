import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { Search, Send, MoreVertical, MessageSquare, ArrowLeft } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
    import { useToast } from '@/components/ui/use-toast';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { cn } from '@/lib/utils';
    import EmojiPicker from '@/components/EmojiPicker';
    import { useLocation, useNavigate } from 'react-router-dom';

    const Messages = () => {
      const { toast } = useToast();
      const { user } = useAuth();
      const location = useLocation();
      const navigate = useNavigate();
      const [conversations, setConversations] = useState([]);
      const [selectedConversation, setSelectedConversation] = useState(null);
      const [messages, setMessages] = useState([]);
      const [newMessage, setNewMessage] = useState('');
      const [loading, setLoading] = useState(true);
      const [sending, setSending] = useState(false);
      const messagesEndRef = useRef(null);
      const inputRef = useRef(null);

      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };

      useEffect(scrollToBottom, [messages]);

      const fetchConversations = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            participant_one_profile:profiles!conversations_participant_one_fkey(*),
            participant_two_profile:profiles!conversations_participant_two_fkey(*)
          `)
          .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao buscar conversas', description: error.message });
        } else {
          setConversations(data);
          if (location.state?.conversationId) {
            const conversationToSelect = data.find(c => c.id === location.state.conversationId);
            if (conversationToSelect) {
              handleSelectConversation(conversationToSelect);
            }
            // Clear state to prevent re-selecting on refresh
            navigate(location.pathname, { replace: true });
          }
        }
        setLoading(false);
      }, [user, toast, location.state, navigate]);

      useEffect(() => {
        fetchConversations();
      }, [fetchConversations]);

      const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;
        setMessages([]);
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles(id, username, avatar_url)')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao buscar mensagens', description: error.message });
        } else {
          setMessages(data);
        }
      }, [toast]);
      
      const handleSelectConversation = (conv) => {
        if (selectedConversation?.id !== conv.id) {
          setSelectedConversation(conv);
          fetchMessages(conv.id);
        }
      }

      useEffect(() => {
        if (selectedConversation) {
          const channel = supabase.channel(`messages:${selectedConversation.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` }, async (payload) => {
              const { data: senderData, error } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', payload.new.sender_id).single();
              if (!error) {
                setMessages(currentMessages => [...currentMessages, {...payload.new, sender: senderData}]);
              }
            })
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      }, [selectedConversation, user.id]);

      const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !user) return;
        setSending(true);

        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: selectedConversation.id,
            sender_id: user.id,
            content: newMessage,
          });

        if (error) {
          toast({ variant: 'destructive', title: 'Erro ao enviar mensagem', description: error.message });
        } else {
          const recipientId = selectedConversation.participant_one === user.id ? selectedConversation.participant_two : selectedConversation.participant_one;
          await supabase.from('notifications').insert({
            user_id: recipientId,
            actor_id: user.id,
            type: 'new_message',
          });
          setNewMessage('');
        }
        setSending(false);
        inputRef.current?.focus();
      };
      
      const handleEmojiSelect = (emoji) => {
        setNewMessage(prev => prev + emoji);
        inputRef.current?.focus();
      };

      return (
        <>
          <Helmet>
            <title>Mensagens - Nomad Connect</title>
            <meta name="description" content="Converse com outros aventureiros no Nomad Connect" />
          </Helmet>

          <div className="flex h-[calc(100vh-120px)] bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            <motion.div 
              initial={{ x: 0 }}
              animate={{ x: selectedConversation ? '-100%' : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn("w-full md:w-1/3 md:flex flex-col flex-shrink-0 border-r border-border", selectedConversation ? "hidden md:flex" : "flex")}>
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">Mensagens</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Buscar conversas..." className="pl-10 bg-input border-border text-foreground" />
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {loading ? <div className="p-4 text-center text-muted-foreground">Carregando...</div> :
                conversations.map((conv, index) => {
                  const otherParticipant = conv.participant_one === user.id ? conv.participant_two_profile : conv.participant_one_profile;
                  if (!otherParticipant) return null;
                  return (
                  <motion.div key={conv.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => handleSelectConversation(conv)} className={`p-4 border-b border-border cursor-pointer hover:bg-secondary transition-colors ${selectedConversation?.id === conv.id ? 'bg-primary/10' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={otherParticipant.avatar_url} alt={otherParticipant.full_name} />
                        <AvatarFallback>{otherParticipant.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{otherParticipant.full_name}</h3>
                        <p className="text-sm text-muted-foreground truncate">@{otherParticipant.username}</p>
                      </div>
                    </div>
                  </motion.div>
                )})}
              </div>
            </motion.div>

            <motion.div 
              initial={{ x: '100%'}}
              animate={{ x: selectedConversation ? 0 : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn("w-full md:w-2/3 flex-col flex-shrink-0", selectedConversation ? "flex" : "hidden md:flex")}>
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}><ArrowLeft className="h-5 w-5"/></Button>
                      <Avatar className="w-10 h-10"><AvatarImage src={selectedConversation.participant_one === user.id ? selectedConversation.participant_two_profile.avatar_url : selectedConversation.participant_one_profile.avatar_url} /><AvatarFallback>{(selectedConversation.participant_one === user.id ? selectedConversation.participant_two_profile.full_name : selectedConversation.participant_one_profile.full_name)?.charAt(0)}</AvatarFallback></Avatar>
                      <div><h3 className="font-medium text-foreground">{selectedConversation.participant_one === user.id ? selectedConversation.participant_two_profile.full_name : selectedConversation.participant_one_profile.full_name}</h3><p className="text-sm text-muted-foreground">@{selectedConversation.participant_one === user.id ? selectedConversation.participant_two_profile.username : selectedConversation.participant_one_profile.username}</p></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => toast({title: "Mais opções em breve!"})} className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-5 w-5" /></Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-secondary/50">
                    <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender_id === user.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none shadow-sm'}`}>
                          <p className="text-sm break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 text-right ${msg.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
                    <div className="flex items-center space-x-2">
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                      <Input 
                        ref={inputRef}
                        placeholder="Digite sua mensagem..." 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        className="flex-1 bg-input border-border text-foreground" />
                      <Button type="submit" disabled={sending || !newMessage.trim()} className="nomad-gradient text-white"><Send className="h-4 w-4" /></Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-border mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Selecione uma conversa</h3>
                    <p className="text-muted-foreground">Escolha um aventureiro para começar a trocar mensagens.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      );
    };

    export default Messages;