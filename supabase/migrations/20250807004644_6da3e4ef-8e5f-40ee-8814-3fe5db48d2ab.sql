-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_organizations junction table for many-to-many relationship
CREATE TABLE public.user_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'common')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Update users table to change user_type to support new roles
ALTER TABLE public.users 
ALTER COLUMN user_type TYPE TEXT,
ADD CONSTRAINT users_user_type_check CHECK (user_type IN ('admin', 'editor', 'common'));

-- Add organization_id to products and models tables
ALTER TABLE public.products 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN value DECIMAL(10,2);

ALTER TABLE public.models 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.categories 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Users can view organizations they belong to" 
ON public.organizations 
FOR SELECT 
USING (
  id IN (
    SELECT organization_id 
    FROM public.user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins and editors can update organizations" 
ON public.organizations 
FOR UPDATE 
USING (
  id IN (
    SELECT organization_id 
    FROM public.user_organizations 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can insert organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (true); -- Will be handled by application logic

CREATE POLICY "Admins can delete organizations" 
ON public.organizations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_organizations 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create policies for user_organizations
CREATE POLICY "Users can view their organization memberships" 
ON public.user_organizations 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage organization memberships" 
ON public.user_organizations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_organizations uo 
    WHERE uo.user_id = auth.uid() 
    AND uo.role = 'admin'
  )
);

-- Update existing tables policies to include organization filtering
CREATE POLICY "Users can view products from their organizations" 
ON public.products 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins and editors can manage products in their organizations" 
ON public.products 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.user_organizations 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Add trigger for organizations updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo organizations
INSERT INTO public.organizations (name, description) VALUES 
('Infraestrutura', 'Gestão de equipamentos de TI e infraestrutura'),
('Recursos Humanos', 'Gestão de materiais e equipamentos de RH');

-- Insert user-organization relationships
INSERT INTO public.user_organizations (user_id, organization_id, role)
SELECT 
  u.id,
  o.id,
  CASE 
    WHEN u.user_type = 'admin' THEN 'admin'
    ELSE 'common'
  END
FROM public.users u
CROSS JOIN public.organizations o;

-- Update existing data to belong to first organization
UPDATE public.products 
SET organization_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE organization_id IS NULL;

UPDATE public.models 
SET organization_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE organization_id IS NULL;

UPDATE public.categories 
SET organization_id = (SELECT id FROM public.organizations LIMIT 1)
WHERE organization_id IS NULL;