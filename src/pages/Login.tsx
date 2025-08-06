import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Package, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar usuário no banco
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        toast({
          title: "Erro",
          description: "Email ou senha incorretos",
          variant: "destructive"
        });
        return;
      }

      // Simular verificação de senha (em um sistema real seria hash)
      if (password !== '123456') { // Senha padrão para demonstração
        toast({
          title: "Erro",
          description: "Email ou senha incorretos",
          variant: "destructive"
        });
        return;
      }

      setCurrentUser(user as User);
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!"
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Package className="h-12 w-12 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">LAQUS</h1>
          </div>
          <p className="text-muted-foreground">Sistema de Gestão de Estoque</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Fazer Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {/* Demo Info */}
            <div className="mt-6 p-4 bg-muted rounded-md">
              <h4 className="font-medium text-foreground mb-2">Credenciais de Demonstração:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Admin:</strong> admin@laqus.com</p>
                <p><strong>Usuário:</strong> user@laqus.com</p>
                <p><strong>Senha:</strong> 123456</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Landing */}
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            ← Voltar para página inicial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;