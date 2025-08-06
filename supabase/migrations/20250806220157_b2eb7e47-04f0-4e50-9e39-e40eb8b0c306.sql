-- Create users table (without using Supabase Auth)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'comum')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create models table
CREATE TABLE public.models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, brand, category_id)
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'expiry_warning', 'new_item')),
  message TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON public.models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notifications for low stock
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if quantity is at or below minimum
  IF NEW.quantity <= NEW.min_quantity THEN
    INSERT INTO public.notifications (type, message, product_id)
    VALUES (
      'low_stock',
      'Estoque baixo: ' || NEW.name || ' (' || NEW.quantity || ' unidades restantes)',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check expiry dates
CREATE OR REPLACE FUNCTION public.check_expiry_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if expiry date is within 30 days
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN
    INSERT INTO public.notifications (type, message, product_id)
    VALUES (
      'expiry_warning',
      'Produto próximo ao vencimento: ' || NEW.name || ' (vence em ' || NEW.expiry_date || ')',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification for new items
CREATE OR REPLACE FUNCTION public.notify_new_item()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (type, message, product_id)
  VALUES (
    'new_item',
    'Novo item adicionado: ' || NEW.name,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
CREATE TRIGGER trigger_check_low_stock
  AFTER UPDATE OF quantity ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock();

CREATE TRIGGER trigger_check_expiry_dates
  AFTER INSERT OR UPDATE OF expiry_date ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_expiry_dates();

CREATE TRIGGER trigger_notify_new_item
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_item();

-- Insert sample data
INSERT INTO public.users (name, email, user_type) VALUES 
('Admin Sistema', 'admin@empresa.com', 'admin'),
('João Silva', 'joao@empresa.com', 'comum'),
('Maria Santos', 'maria@empresa.com', 'comum');

INSERT INTO public.categories (name, description) VALUES 
('Notebooks', 'Notebooks e laptops corporativos'),
('Periféricos', 'Mouses, teclados e acessórios'),
('Software', 'Licenças de software e sistemas');

-- Get category IDs for models
WITH category_data AS (
  SELECT id as notebook_id FROM public.categories WHERE name = 'Notebooks'
), 
periferico_data AS (
  SELECT id as periferico_id FROM public.categories WHERE name = 'Periféricos'
),
software_data AS (
  SELECT id as software_id FROM public.categories WHERE name = 'Software'
)
INSERT INTO public.models (name, brand, category_id) 
SELECT * FROM (
  VALUES 
    ('ThinkPad X1 Carbon', 'Lenovo', (SELECT notebook_id FROM category_data)),
    ('Latitude 7420', 'Dell', (SELECT notebook_id FROM category_data)),
    ('MacBook Pro 14"', 'Apple', (SELECT notebook_id FROM category_data)),
    ('MX Master 3', 'Logitech', (SELECT periferico_id FROM periferico_data)),
    ('Magic Mouse', 'Apple', (SELECT periferico_id FROM periferico_data)),
    ('MX Keys', 'Logitech', (SELECT periferico_id FROM periferico_data)),
    ('Office 365', 'Microsoft', (SELECT software_id FROM software_data)),
    ('Windows 11 Pro', 'Microsoft', (SELECT software_id FROM software_data))
) AS t(name, brand, category_id);