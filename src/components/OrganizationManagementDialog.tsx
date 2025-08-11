import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Edit, Trash, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Organization } from '@/types/database';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface OrganizationManagementDialogProps {
  onOrganizationsUpdated: () => void;
  currentOrganization: string;
  onOrganizationChange: (orgId: string) => void;
}

export const OrganizationManagementDialog: React.FC<OrganizationManagementDialogProps> = ({ 
  onOrganizationsUpdated, 
  currentOrganization,
  onOrganizationChange 
}) => {
  const [open, setOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (open) {
      fetchOrganizations();
    }
  }, [open]);

  const fetchOrganizations = async () => {
    try {
      // Simulação temporária
      const mockOrganizations: Organization[] = [
        {
          id: '1',
          name: 'LAQUS Principal',
          description: 'Organização principal da empresa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'LAQUS Filial Sul',
          description: 'Filial da região sul',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      setOrganizations(mockOrganizations);
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as organizações",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingOrg) {
        // Simulação temporária - atualizar organização
        console.log('Simulando atualização de organização:', editingOrg.id, formData);
        toast({
          title: "Sucesso",
          description: "Organização atualizada com sucesso!"
        });
      } else {
        // Simulação temporária - criar nova organização
        console.log('Simulando criação de organização:', formData);
        toast({
          title: "Sucesso",
          description: "Organização criada com sucesso!"
        });
      }

      setFormData({ name: '', description: '' });
      setEditingOrg(null);
      fetchOrganizations();
      onOrganizationsUpdated();
    } catch (error) {
      console.error('Erro ao salvar organização:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a organização",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      description: org.description || ''
    });
  };

  const handleDelete = async (orgId: string) => {
    try {
      // Simulação temporária
      console.log('Simulando exclusão de organização:', orgId);
      
      toast({
        title: "Sucesso",
        description: "Organização excluída com sucesso!"
      });

      // Se a organização excluída era a atual, trocar para a primeira disponível
      if (currentOrganization === orgId) {
        const remainingOrgs = organizations.filter(org => org.id !== orgId);
        if (remainingOrgs.length > 0) {
          onOrganizationChange(remainingOrgs[0].id);
        } else {
          onOrganizationChange('');
        }
      }

      fetchOrganizations();
      onOrganizationsUpdated();
    } catch (error) {
      console.error('Erro ao excluir organização:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a organização",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingOrg(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          Gerenciar Organizações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Organizações</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Form para adicionar/editar */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nome da Organização
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: LAQUS Filial Sul"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Descrição (Opcional)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da organização..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              {editingOrg && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : editingOrg ? 'Atualizar' : 'Criar Organização'}
              </Button>
            </div>
          </form>

          {/* Lista de organizações */}
          <div>
            <h4 className="font-medium mb-3">Organizações Existentes</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {organizations.map((org) => (
                <div key={org.id} className="flex items-start justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-foreground">{org.name}</span>
                      {currentOrganization === org.id && (
                        <Badge variant="default" className="text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>
                    {org.description && (
                      <p className="text-sm text-muted-foreground mb-2">{org.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Criada em {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOrganizationChange(org.id)}
                      disabled={currentOrganization === org.id}
                      className="text-xs px-2"
                    >
                      Acessar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(org)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Confirmar Exclusão
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a organização <strong>{org.name}</strong>?
                            <br />
                            <span className="text-destructive font-medium">
                              Esta ação não pode ser desfeita e todos os dados relacionados serão removidos.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(org.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir Organização
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {organizations.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Nenhuma organização encontrada
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Crie a primeira organização usando o formulário acima
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};