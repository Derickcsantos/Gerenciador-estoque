import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Category, Model } from '@/types/database';

interface ProductDialogProps {
  onProductAdded: () => void;
  currentOrganization: string;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({ onProductAdded, currentOrganization }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    modelId: '',
    quantity: 1,
    minQuantity: 1,
    value: '',
    expiryDate: undefined as Date | undefined
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchModels();
    }
  }, [open]);

  useEffect(() => {
    if (formData.categoryId) {
      const filtered = models.filter(model => model.category_id === formData.categoryId);
      setFilteredModels(filtered);
    } else {
      setFilteredModels([]);
    }
  }, [formData.categoryId, models]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          category_id: formData.categoryId,
          model_id: formData.modelId,
          quantity: formData.quantity,
          min_quantity: formData.minQuantity,
          value: formData.value ? parseFloat(formData.value) : null,
          expiry_date: formData.expiryDate?.toISOString().split('T')[0] || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Produto adicionado com sucesso!"
      });

      setFormData({
        name: '',
        categoryId: '',
        modelId: '',
        quantity: 1,
        minQuantity: 1,
        value: '',
        expiryDate: undefined
      });
      
      setOpen(false);
      onProductAdded();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nome do Produto
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Notebook Desenvolvimento #003"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Categoria
            </label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value, modelId: '' })}
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

          <div>
            <label htmlFor="model" className="block text-sm font-medium mb-2">
              Modelo
            </label>
            <Select
              value={formData.modelId}
              onValueChange={(value) => setFormData({ ...formData, modelId: value })}
              disabled={!formData.categoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {filteredModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.brand} {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                Quantidade
              </label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <label htmlFor="minQuantity" className="block text-sm font-medium mb-2">
                Estoque Mínimo
              </label>
              <Input
                id="minQuantity"
                type="number"
                min="1"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium mb-2">
              Valor (opcional)
            </label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Data de Vencimento (opcional)
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expiryDate ? (
                    format(formData.expiryDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.expiryDate}
                  onSelect={(date) => setFormData({ ...formData, expiryDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};