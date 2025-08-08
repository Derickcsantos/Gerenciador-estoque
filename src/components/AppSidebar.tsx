import React, { useState, useEffect } from 'react';
import { Building2, Users, Settings, Package, ChevronRight } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Organization, UserOrganization } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  currentOrganization: string;
  onOrganizationChange: (orgId: string) => void;
}

export function AppSidebar({ currentOrganization, onOrganizationChange }: AppSidebarProps) {
  const { currentUser, isAdmin } = useUser();
  const { state } = useSidebar();
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchUserOrganizations();
    }
  }, [currentUser]);

  const fetchUserOrganizations = async () => {
    try {
      // Como a tabela user_organizations ainda não está disponível nos types,
      // vamos simular organizações por enquanto
      const mockOrganizations: UserOrganization[] = [
        {
          id: '1',
          user_id: currentUser?.id || '',
          organization_id: '1',
          role: currentUser?.user_type === 'admin' ? 'admin' : 'editor',
          created_at: new Date().toISOString(),
          organization: {
            id: '1',
            name: 'LAQUS Principal',
            description: 'Organização principal da empresa',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      ];

      setUserOrganizations(mockOrganizations);

      // Se não tem organização selecionada e tem organizações, seleciona a primeira
      if (!currentOrganization && mockOrganizations.length > 0) {
        onOrganizationChange(mockOrganizations[0].organization_id);
      }
    } catch (error) {
      console.error('Erro ao buscar organizações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as organizações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentOrganization = () => {
    return userOrganizations.find(uo => uo.organization_id === currentOrganization);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'editor': return 'Editor';
      case 'common': return 'Visualizar';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'editor': return 'secondary';
      case 'common': return 'outline';
      default: return 'outline';
    }
  };

  const canEdit = (role: string) => {
    return role === 'admin' || role === 'editor';
  };

  if (loading) {
    return (
      <Sidebar className="border-r border-sidebar-border">
        <SidebarContent>
          <div className="p-4 text-center text-sidebar-foreground/60">
            Carregando...
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Building2 className="h-6 w-6 text-sidebar-primary" />
          {state !== 'collapsed' && (
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Organizações</h2>
              <p className="text-xs text-sidebar-foreground/60">
                {userOrganizations.length} disponível{userOrganizations.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Suas Organizações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userOrganizations.map((userOrg) => (
                <SidebarMenuItem key={userOrg.id}>
                  <SidebarMenuButton
                    onClick={() => onOrganizationChange(userOrg.organization_id)}
                    isActive={currentOrganization === userOrg.organization_id}
                    className="w-full justify-start"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        {state !== 'collapsed' && (
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {userOrg.organization?.name}
                            </p>
                            {userOrg.organization?.description && (
                              <p className="text-xs text-sidebar-foreground/60 truncate">
                                {userOrg.organization.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {state !== 'collapsed' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge 
                            variant={getRoleBadgeVariant(userOrg.role)}
                            className="text-xs px-1.5 py-0.5"
                          >
                            {getRoleLabel(userOrg.role)}
                          </Badge>
                          {currentOrganization === userOrg.organization_id && (
                            <ChevronRight className="h-3 w-3 text-sidebar-primary" />
                          )}
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {getCurrentOrganization() && state !== 'collapsed' && (
          <SidebarGroup>
            <SidebarGroupLabel>Organização Atual</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 py-3 bg-sidebar-accent rounded-md mx-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sidebar-accent-foreground truncate">
                      {getCurrentOrganization()?.organization?.name}
                    </h3>
                    <p className="text-xs text-sidebar-accent-foreground/70">
                      Acesso: {getRoleLabel(getCurrentOrganization()?.role || '')}
                    </p>
                  </div>
                  <Badge 
                    variant={getRoleBadgeVariant(getCurrentOrganization()?.role || '')}
                    className="ml-2 flex-shrink-0"
                  >
                    {canEdit(getCurrentOrganization()?.role || '') ? 'Pode Editar' : 'Somente Leitura'}
                  </Badge>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {userOrganizations.length === 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-4 py-8 text-center">
                <Building2 className="h-8 w-8 text-sidebar-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-sidebar-foreground/60">
                  Nenhuma organização encontrada
                </p>
                <p className="text-xs text-sidebar-foreground/40 mt-1">
                  Entre em contato com o administrador
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}