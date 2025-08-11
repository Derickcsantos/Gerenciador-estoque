import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Plus, Minus, Users, Package, LogOut, Menu, Download, BarChart3, Trash } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Product, Notification, Model, ModelWithProductCount } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { ProductDialog } from './ProductDialog';
import { CategoryDialog } from './CategoryDialog';
import { UserManagementDialog } from './UserManagementDialog';
import { ModelDialog } from './ModelDialog';
import { OrganizationManagementDialog } from './OrganizationManagementDialog';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export const Dashboard: React.FC = () => {
  const { currentUser, isAdmin, logout } = useUser();
  const isEditor = currentUser?.user_type === 'editor';
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [models, setModels] = useState<ModelWithProductCount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showModelsView, setShowModelsView] = useState(false);
  const [currentOrganization, setCurrentOrganization] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Se não tem organização ainda, aguardar o AppSidebar definir uma
    if (!currentOrganization) {
      setLoading(false); // Para não ficar carregando eternamente
      return;
    }
    
    fetchProducts();
    fetchNotifications();
    fetchModels();
  }, [currentUser, navigate, currentOrganization]);

  const fetchProducts = async () => {
    if (!currentOrganization) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          model:models(*, category:categories(*)),
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    if (!currentOrganization) return;
    
    try {
      const { data: modelsData, error: modelsError } = await supabase
        .from('models')
        .select(`
          *,
          category:categories(*)
        `)
        .order('name', { ascending: true });

      if (modelsError) throw modelsError;

      // Buscar contagem de produtos para cada modelo
      const modelsWithCount: ModelWithProductCount[] = await Promise.all(
        (modelsData || []).map(async (model) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('model_id', model.id);

          return {
            ...model,
            product_count: count || 0
          };
        })
      );

      setModels(modelsWithCount);
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os modelos",
        variant: "destructive"
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          product:products(name)
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    // Verificar permissões - apenas admins e editores podem alterar quantidades
    if (!isAdmin && !isEditor) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores e editores podem alterar quantidades",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, quantity: newQuantity }
          : product
      ));

      toast({
        title: "Sucesso",
        description: "Quantidade atualizada com sucesso",
      });

      // Recarregar notificações e modelos
      fetchNotifications();
      fetchModels();
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade",
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    // Verificar permissões - apenas admins e editores podem excluir
    if (!isAdmin && !isEditor) {
      toast({
        title: "Sem permissão",
        description: "Apenas administradores e editores podem excluir produtos",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      });

      // Recarregar notificações e modelos
      fetchNotifications();
      fetchModels();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive"
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.model?.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (product: Product) => {
    const isLowStock = product.quantity <= product.min_quantity;
    const isExpiringSoon = product.expiry_date && 
      new Date(product.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isLowStock) {
      return <Badge variant="destructive">Estoque Baixo</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge className="bg-warning text-warning-foreground">Vence em Breve</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">OK</Badge>;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Estoque_LAQUS_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          currentOrganization={currentOrganization} 
          onOrganizationChange={setCurrentOrganization} 
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <Package className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">LAQUS Inventory</h1>
              </div>
          
                <div className="flex items-center space-x-4">
                  <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-40 lg:w-80"
              />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModelsView(!showModelsView)}
                    className="hidden md:flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {showModelsView ? 'Produtos' : 'Modelos'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="hidden md:flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
            
                <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-destructive text-destructive-foreground">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-md shadow-lg z-50">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3">Notificações</h3>
                    {notifications.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Nenhuma notificação</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="p-2 bg-muted rounded-md text-sm">
                            <p>{notification.message}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markNotificationAsRead(notification.id)}
                              className="mt-1 h-6 px-2"
                            >
                              Marcar como lida
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
                </div>
            
                <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground hidden md:block">
                {currentUser?.name} ({isAdmin ? 'Admin' : isEditor ? 'Editor' : 'Usuário'})
              </span>
              {isAdmin && (
                <div className="hidden lg:flex space-x-2">
                  <CategoryDialog onCategoriesUpdated={fetchProducts} />
                  <ModelDialog onModelsUpdated={fetchProducts} />
                  <UserManagementDialog onUsersUpdated={() => {}} />
                  <OrganizationManagementDialog 
                    onOrganizationsUpdated={() => {}} 
                    currentOrganization={currentOrganization}
                    onOrganizationChange={setCurrentOrganization}
                  />
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sair</span>
                 </Button>
                 </div>
               </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6 flex-1 overflow-auto">
            <div ref={printRef}>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard de Estoque</h2>
              <p className="text-muted-foreground">
                Gerencie o estoque de equipamentos e licenças da empresa
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{products.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Estoque Baixo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {products.filter(p => p.quantity <= p.min_quantity).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Vencendo em Breve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {products.filter(p => 
                      p.expiry_date && 
                      new Date(p.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    ).length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Notificações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{notifications.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Products/Models Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{showModelsView ? 'Modelos e Quantidades' : 'Produtos em Estoque'}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowModelsView(!showModelsView)}
                      className="md:hidden"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {showModelsView ? 'Produtos' : 'Modelos'}
                    </Button>
                    {isAdmin && !showModelsView && (
                      <ProductDialog onProductAdded={fetchProducts} currentOrganization={currentOrganization} />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  {showModelsView ? (
                    <table className="w-full">
                      <thead>
                         <tr className="border-b border-border">
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground">Modelo</th>
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Marca</th>
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground">Produtos</th>
                         </tr>
                      </thead>
                      <tbody>
                         {models.map((model) => (
                           <tr key={model.id} className="border-b border-border hover:bg-muted/50">
                             <td className="py-3 px-4 font-medium text-foreground">
                               <div>
                                 <div>{model.name}</div>
                                 <div className="text-xs text-muted-foreground sm:hidden">
                                   {model.brand}
                                 </div>
                               </div>
                             </td>
                             <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{model.brand}</td>
                             <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                               {model.category?.name}
                             </td>
                             <td className="py-3 px-4">
                               <Badge variant={model.product_count > 0 ? "default" : "secondary"} className="text-xs">
                                 {model.product_count}
                               </Badge>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full">
                       <thead>
                         <tr className="border-b border-border">
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground">Produto</th>
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Modelo</th>
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground">Qtd</th>
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Vencimento</th>
                           <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                           {(isAdmin || isEditor) && (
                             <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                           )}
                         </tr>
                       </thead>
                      <tbody>
                         {filteredProducts.map((product) => (
                           <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                             <td className="py-3 px-4 font-medium text-foreground">
                               <div>
                                 <div>{product.name}</div>
                                 <div className="text-xs text-muted-foreground sm:hidden">
                                   {product.model?.brand} {product.model?.name}
                                 </div>
                               </div>
                             </td>
                             <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                               {product.model?.brand} {product.model?.name}
                             </td>
                             <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                               {product.category?.name}
                             </td>
                             <td className="py-3 px-4">
                               <div className="flex items-center space-x-1">
                                 {(isAdmin || isEditor) && (
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => updateQuantity(product.id, product.quantity - 1)}
                                     disabled={product.quantity <= 0}
                                     className="h-7 w-7 p-0"
                                   >
                                     <Minus className="h-3 w-3" />
                                   </Button>
                                 )}
                                 <span className="w-8 text-center text-sm font-medium">{product.quantity}</span>
                                 {(isAdmin || isEditor) && (
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => updateQuantity(product.id, product.quantity + 1)}
                                     className="h-7 w-7 p-0"
                                   >
                                     <Plus className="h-3 w-3" />
                                   </Button>
                                 )}
                               </div>
                               <div className="text-xs text-muted-foreground mt-1">
                                 min: {product.min_quantity}
                               </div>
                             </td>
                             <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                               {product.expiry_date 
                                 ? new Date(product.expiry_date).toLocaleDateString('pt-BR')
                                 : 'N/A'
                               }
                             </td>
                             <td className="py-3 px-4">
                               {getStatusBadge(product)}
                             </td>
                             {(isAdmin || isEditor) && (
                               <td className="py-3 px-4">
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => deleteProduct(product.id)}
                                   className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                                 >
                                   <Trash className="h-3 w-3" />
                                 </Button>
                               </td>
                             )}
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  )}
                  
                  {showModelsView ? (
                    models.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum modelo encontrado
                      </div>
                    )
                  ) : (
                    filteredProducts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum produto encontrado
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};