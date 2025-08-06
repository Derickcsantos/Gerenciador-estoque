import React, { useState, useEffect } from 'react';
import { Search, Bell, Plus, Minus, Users, Package, Settings, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, Notification } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export const Dashboard: React.FC = () => {
  const { currentUser, isAdmin } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchNotifications();
  }, []);

  const fetchProducts = async () => {
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

      // Recarregar notificações
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade",
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
    return <Badge className="bg-success text-success-foreground">Ok</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Desk Guard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
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
              <span className="text-sm text-muted-foreground">
                {currentUser?.name} ({isAdmin ? 'Admin' : 'Usuário'})
              </span>
              {isAdmin && (
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
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

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Produtos em Estoque</span>
              {isAdmin && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Produto</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Modelo</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Quantidade</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vencimento</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    {isAdmin && (
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-foreground">{product.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {product.model?.brand} {product.model?.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {product.category?.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{product.quantity}</span>
                        <span className="text-muted-foreground text-sm"> / min: {product.min_quantity}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {product.expiry_date 
                          ? new Date(product.expiry_date).toLocaleDateString('pt-BR')
                          : 'N/A'
                        }
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(product)}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, product.quantity - 1)}
                              disabled={product.quantity <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, product.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};