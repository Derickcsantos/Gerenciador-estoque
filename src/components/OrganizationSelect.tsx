import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/context/UserContext';
import { Organization } from '@/types/database';

interface OrganizationSelectProps {
  currentOrganization: string;
  onOrganizationChange: (orgId: string) => void;
}

export const OrganizationSelect: React.FC<OrganizationSelectProps> = ({
  currentOrganization,
  onOrganizationChange
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  const fetchUserOrganizations = async () => {
    if (!currentUser) return;

    try {
      let query = supabase
        .from('user_organizations')
        .select('organization:organizations(*)')
        .eq('user_id', currentUser.id);

      const { data, error } = await query;

      if (error) throw error;

      const userOrgs = data?.map(item => item.organization).filter(Boolean) || [];
      setOrganizations(userOrgs as Organization[]);

      // Se não há organização selecionada e há organizações disponíveis, seleciona a primeira
      if (!currentOrganization && userOrgs.length > 0) {
        onOrganizationChange(userOrgs[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar organizações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrganizations();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4" />
        <span className="text-sm">Carregando...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building className="h-4 w-4" />
        <span className="text-sm">Nenhuma organização</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building className="h-4 w-4 text-primary" />
      <Select value={currentOrganization} onValueChange={onOrganizationChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecionar organização" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};