import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { Model, Category } from '@/types/database';

interface ModelDialogProps {
  onModelsUpdated: () => void;
}

export const ModelDialog: React.FC<ModelDialogProps> = ({ onModelsUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category_id: ''
  });
  const { currentUser } = useUser();

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select(`
          *,
          category:categories(*)
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar modelos",
        variant: "destructive"
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchModels();
      fetchCategories();
    }
  }, [isOpen, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingModel) {
        const { error } = await supabase
          .from('models')
          .update({
            name: formData.name,
            brand: formData.brand,
            category_id: formData.category_id
          })
          .eq('id', editingModel.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Modelo atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('models')
          .insert({
            name: formData.name,
            brand: formData.brand,
            category_id: formData.category_id
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Modelo criado com sucesso!"
        });
      }

      setFormData({ name: '', brand: '', category_id: '' });
      setEditingModel(null);
      fetchModels();
      onModelsUpdated();
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar modelo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (model: Model) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      brand: model.brand,
      category_id: model.category_id
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Modelo excluído com sucesso!"
      });

      fetchModels();
      onModelsUpdated();
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir modelo",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', brand: '', category_id: '' });
    setEditingModel(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Gerenciar Modelos</span>
          <span className="sm:hidden">Modelos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Modelos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-background">
            <h3 className="font-medium text-foreground">
              {editingModel ? 'Editar Modelo' : 'Novo Modelo'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Modelo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: iPhone 15"
                  required
                />
              </div>

              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ex: Apple"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
                {loading ? 'Salvando...' : editingModel ? 'Atualizar' : 'Criar'}
              </Button>
              {editingModel && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>

          {/* Lista de Modelos */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Modelos Existentes</h3>
            
            {models.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum modelo encontrado
              </p>
            ) : (
              <div className="grid gap-3">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card gap-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-card-foreground">
                        {model.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {model.brand} • {model.category?.name}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(model)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(model.id)}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Excluir</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};