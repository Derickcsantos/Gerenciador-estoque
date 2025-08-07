import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Edit, Trash, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, Organization, UserOrganization } from '@/types/database';

interface UserManagementDialogProps {
  onUsersUpdated: () => void;
}

export const UserManagementDialog: React.FC<UserManagementDialogProps> = ({ onUsersUpdated }) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserOrganizations, setSelectedUserOrganizations] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    user_type: 'common'
  });

  useEffect(() => {
    if (open) {
      fetchUsers();
      fetchOrganizations();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers((data || []) as User[]);
      
      // Buscar organizações dos usuários
      if (data && data.length > 0) {
        const { data: userOrgsData, error: userOrgsError } = await supabase
          .from('user_organizations')
          .select(`
            *,
            organization:organizations(*)
          `);
        
        if (userOrgsError) throw userOrgsError;
        setUserOrganizations(userOrgsData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Atualizar usuário
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            email: formData.email,
            user_type: formData.user_type
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!"
        });
      } else {
        // Criar novo usuário
        const { error } = await supabase
          .from('users')
          .insert({
            name: formData.name,
            email: formData.email,
            user_type: formData.user_type
          });

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso!"
        });
        
        // Se não está editando, adicionar às organizações selecionadas
        if (!editingUser && data) {
          await updateUserOrganizations(data[0].id);
        }
      }

      if (editingUser) {
        await updateUserOrganizations(editingUser.id);
      }

      setFormData({ name: '', email: '', user_type: 'common' });
      setEditingUser(null);
      setSelectedUserOrganizations([]);
      fetchUsers();
      onUsersUpdated();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o usuário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserOrganizations = async (userId: string) => {
    try {
      // Remover organizações existentes
      const { error: deleteError } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Adicionar novas organizações
      if (selectedUserOrganizations.length > 0) {
        const userOrgsToInsert = selectedUserOrganizations.map(orgId => ({
          user_id: userId,
          organization_id: orgId,
          role: formData.user_type
        }));

        const { error: insertError } = await supabase
          .from('user_organizations')
          .insert(userOrgsToInsert);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Erro ao atualizar organizações do usuário:', error);
      throw error;
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      user_type: user.user_type
    });
    
    // Buscar organizações do usuário
    const userOrgs = userOrganizations
      .filter(uo => uo.user_id === user.id)
      .map(uo => uo.organization_id);
    setSelectedUserOrganizations(userOrgs);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!"
      });

      fetchUsers();
      onUsersUpdated();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', user_type: 'common' });
    setEditingUser(null);
    setSelectedUserOrganizations([]);
  };

  const getUserOrganizations = (userId: string) => {
    return userOrganizations.filter(uo => uo.user_id === userId);
  };

  const handleOrganizationToggle = (orgId: string, checked: boolean) => {
    if (checked) {
      setSelectedUserOrganizations(prev => [...prev, orgId]);
    } else {
      setSelectedUserOrganizations(prev => prev.filter(id => id !== orgId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Gerenciar Usuários
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuários</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Form para adicionar/editar */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nome
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@laqus.com"
                required
              />
            </div>

            <div>
              <label htmlFor="user_type" className="block text-sm font-medium mb-2">
                Tipo de Usuário
              </label>
              <Select
                value={formData.user_type}
                onValueChange={(value) => setFormData({ ...formData, user_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="common">Usuário Comum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Organizações
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-input rounded-md p-3">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`org-${org.id}`}
                      checked={selectedUserOrganizations.includes(org.id)}
                      onCheckedChange={(checked) => handleOrganizationToggle(org.id, checked as boolean)}
                    />
                    <label htmlFor={`org-${org.id}`} className="text-sm font-medium cursor-pointer">
                      {org.name}
                    </label>
                  </div>
                ))}
                {organizations.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma organização disponível</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              {editingUser && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : editingUser ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>

          {/* Lista de usuários */}
          <div>
            <h4 className="font-medium mb-3">Usuários Existentes</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.name}</span>
                      <Badge variant={user.user_type === 'admin' ? 'default' : user.user_type === 'editor' ? 'secondary' : 'outline'}>
                        {user.user_type === 'admin' ? 'Admin' : user.user_type === 'editor' ? 'Editor' : 'Comum'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {getUserOrganizations(user.id).length} organização{getUserOrganizations(user.id).length !== 1 ? 'ões' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};