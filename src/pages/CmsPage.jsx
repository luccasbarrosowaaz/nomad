import React, { useState, useEffect, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { Loader2, LogOut, ShieldCheck, CheckCircle, XCircle, Users, Calendar, MessageSquare } from 'lucide-react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

    const ADMIN_EMAIL = 'nomadconnect@waaz.com.br';

    const CmsLogin = ({ onLogin }) => {
      const { signIn } = useAuth();
      const { toast } = useToast();
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        if (email.toLowerCase() !== ADMIN_EMAIL) {
          toast({
            variant: 'destructive',
            title: 'Acesso Negado',
            description: 'Este e-mail não tem permissão para acessar o CMS.',
          });
          return;
        }
        setLoading(true);
        const { error } = await signIn(email, password);
        if (!error) {
          onLogin();
        } else {
            toast({
                variant: 'destructive',
                title: 'Falha no Login',
                description: 'Verifique suas credenciais e tente novamente.',
            });
        }
        setLoading(false);
      };

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg dark:bg-gray-800"
          >
            <div className="text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
              <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Acesso Restrito</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Painel de Administração Nomad Connect</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email-cms" className="dark:text-gray-300">Email de Administrador</Label>
                <Input
                  id="email-cms"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password-cms" className="dark:text-gray-300">Senha</Label>
                <Input
                  id="password-cms"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full nomad-gradient" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
              </Button>
            </form>
          </motion.div>
        </div>
      );
    };

    const CmsDashboard = ({ user, onLogout }) => {
        const [pendingEvents, setPendingEvents] = useState([]);
        const [users, setUsers] = useState([]);
        const [loadingData, setLoadingData] = useState(true);
        const { toast } = useToast();

        const fetchData = useCallback(async () => {
            setLoadingData(true);
            const [eventsRes, usersRes] = await Promise.all([
                supabase.from('events').select('*, profile:user_id(username, full_name)').eq('status', 'pending'),
                supabase.from('profiles').select('*')
            ]);

            if (eventsRes.error) toast({ variant: 'destructive', title: 'Erro ao buscar eventos' });
            else setPendingEvents(eventsRes.data);

            if (usersRes.error) toast({ variant: 'destructive', title: 'Erro ao buscar usuários' });
            else setUsers(usersRes.data);
            
            setLoadingData(false);
        }, [toast]);

        useEffect(() => {
            fetchData();
        }, [fetchData]);

        const handleEventApproval = async (eventId, newStatus) => {
            const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId);
            if (error) {
                toast({ variant: 'destructive', title: `Erro ao ${newStatus === 'approved' ? 'aprovar' : 'rejeitar'} evento` });
            } else {
                toast({ title: `Evento ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!` });
                fetchData(); // Refresh data
            }
        };
        
        const handleUserAction = (userId, action) => {
            toast({
                title: "🚧 Em construção!",
                description: `A funcionalidade de ${action} usuário ainda não foi implementada.`
            });
        }

        return (
            <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
                <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-bold dark:text-white">CMS Nomad Connect</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline">Logado como {user.email}</span>
                        <Button variant="ghost" size="icon" onClick={onLogout}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </header>
                <main className="flex-grow p-4 md:p-8">
                    <Tabs defaultValue="events">
                        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
                            <TabsTrigger value="events"><Calendar className="mr-2 h-4 w-4" />Aprovação de Eventos</TabsTrigger>
                            <TabsTrigger value="content"><MessageSquare className="mr-2 h-4 w-4" />Moderação de Conteúdo</TabsTrigger>
                            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Gerenciamento de Usuários</TabsTrigger>
                        </TabsList>
                        <TabsContent value="events">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Eventos Pendentes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingData ? <Loader2 className="animate-spin mx-auto" /> : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Título</TableHead>
                                                    <TableHead className="hidden md:table-cell">Criador</TableHead>
                                                    <TableHead className="hidden md:table-cell">Data</TableHead>
                                                    <TableHead className="text-right">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pendingEvents.length > 0 ? pendingEvents.map(event => (
                                                    <TableRow key={event.id}>
                                                        <TableCell className="font-medium">{event.title}</TableCell>
                                                        <TableCell className="hidden md:table-cell">{event.profile?.username || 'N/A'}</TableCell>
                                                        <TableCell className="hidden md:table-cell">{new Date(event.start_time).toLocaleDateString()}</TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button size="sm" variant="outline" className="text-green-500 border-green-500 hover:bg-green-500 hover:text-white" onClick={() => handleEventApproval(event.id, 'approved')}><CheckCircle className="h-4 w-4" /></Button>
                                                            <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleEventApproval(event.id, 'rejected')}><XCircle className="h-4 w-4" /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : <TableRow><TableCell colSpan="4" className="text-center">Nenhum evento pendente.</TableCell></TableRow>}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="content">
                             <Card>
                                <CardHeader><CardTitle>Moderação de Conteúdo</CardTitle></CardHeader>
                                <CardContent className="text-center text-gray-500">
                                    <p>A área para moderar posts e comentários reportados está em construção.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="users">
                             <Card>
                                <CardHeader><CardTitle>Gerenciamento de Usuários</CardTitle></CardHeader>
                                <CardContent>
                                     {loadingData ? <Loader2 className="animate-spin mx-auto" /> : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Usuário</TableHead>
                                                    <TableHead className="hidden md:table-cell">Email</TableHead>
                                                    <TableHead className="hidden md:table-cell">Desde</TableHead>
                                                    <TableHead className="text-right">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {users.map(u => (
                                                    <TableRow key={u.id}>
                                                        <TableCell className="font-medium">{u.username}</TableCell>
                                                        <TableCell className="hidden md:table-cell">{u.email || 'N/A'}</TableCell>
                                                        <TableCell className="hidden md:table-cell">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="destructive" onClick={() => handleUserAction(u.id, 'banir')}>Banir</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        );
    };

    const CmsPage = () => {
      const { user, loading, signOut, profile } = useAuth();
      const [isAdmin, setIsAdmin] = useState(false);
      const [checkingAuth, setCheckingAuth] = useState(true);

      useEffect(() => {
        if (!loading) {
          setIsAdmin(user?.email?.toLowerCase() === ADMIN_EMAIL);
          setCheckingAuth(false);
        }
      }, [user, loading, profile]);

      const handleLogin = () => {
        setIsAdmin(true);
      };

      const handleLogout = async () => {
        await signOut();
        setIsAdmin(false);
      };

      if (checkingAuth) {
        return (
          <div className="flex justify-center items-center h-screen bg-background">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
          </div>
        );
      }

      return (
        <>
          <Helmet>
            <title>CMS - Nomad Connect</title>
            <meta name="description" content="Área de administração do Nomad Connect." />
          </Helmet>
          {isAdmin ? (
            <CmsDashboard user={user} onLogout={handleLogout} />
          ) : (
            <CmsLogin onLogin={handleLogin} />
          )}
        </>
      );
    };

    export default CmsPage;