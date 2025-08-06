import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Shield, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Package className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">LAQUS Inventory</h1>
          </div>
          <Button onClick={() => navigate('/login')}>
            Fazer Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Sistema de Gestão de <span className="text-primary">Estoque LAQUS</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Gerencie notebooks, periféricos e licenças de software com eficiência. 
            Controle total sobre seu inventário com notificações inteligentes.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/login')}>
              Acessar Sistema
            </Button>
            <Button variant="outline" size="lg">
              Saiba Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Funcionalidades Principais
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Controle de Acesso</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sistema de usuários com diferentes níveis de permissão. 
                Administradores podem gerenciar tudo, usuários comuns visualizam.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Notificações Inteligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Alertas automáticos para estoque baixo, vencimentos próximos 
                e adição de novos itens ao inventário.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Package className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Gestão Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Controle notebooks, periféricos e licenças. Categorias personalizadas, 
                modelos e marcas organizados de forma intuitiva.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-20 px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 LAQUS - Sistema de Gestão de Estoque. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;