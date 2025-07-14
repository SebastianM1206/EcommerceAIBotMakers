-- Complete Ecommerce Database Schema (without timestamp columns)
-- Make sure to run this in your Supabase SQL Editor

-- Users table
CREATE TABLE
IF NOT EXISTS public.users
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  address TEXT,
  role TEXT CHECK
(role IN
('admin', 'user')) DEFAULT 'user'
);

-- Products table with all required fields (no timestamps)
CREATE TABLE
IF NOT EXISTS public.products
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  price DECIMAL
(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  rating DECIMAL
(3, 2) DEFAULT 0.0,
  reviews INTEGER DEFAULT 0,
  image_url TEXT,
  original_price DECIMAL
(10, 2),
  is_new BOOLEAN DEFAULT false,
  is_on_sale BOOLEAN DEFAULT false
);

-- Orders table
CREATE TABLE
IF NOT EXISTS public.orders
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  user_id UUID NOT NULL REFERENCES public.users
(id) ON
DELETE CASCADE,
  total_price DECIMAL(10, 2)
NOT NULL,
  status TEXT CHECK
(status IN
('pending', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending'
);

-- Order items table
CREATE TABLE
IF NOT EXISTS public.order_items
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  order_id UUID NOT NULL REFERENCES public.orders
(id) ON
DELETE CASCADE,
  product_id UUID
NOT NULL REFERENCES public.products
(id) ON
DELETE CASCADE,
  quantity INTEGER
NOT NULL,
  unit_price DECIMAL
(10, 2) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX
IF NOT EXISTS idx_products_category ON public.products
(category);
CREATE INDEX
IF NOT EXISTS idx_products_is_new ON public.products
(is_new);
CREATE INDEX
IF NOT EXISTS idx_products_is_on_sale ON public.products
(is_on_sale);
CREATE INDEX
IF NOT EXISTS idx_products_stock ON public.products
(stock);
CREATE INDEX
IF NOT EXISTS idx_products_name ON public.products
(name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access to products
CREATE POLICY "Products are publicly readable" ON public.products
  FOR
SELECT USING (true);

-- RLS Policies for users (they can only see their own data)
CREATE POLICY "Users can view own profile" ON public.users
  FOR
SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR
UPDATE USING (auth.uid()
= id);

-- RLS Policies for orders (users can only see their own orders)
CREATE POLICY "Users can view own orders" ON public.orders
  FOR
SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.orders
  FOR
INSERT WITH CHECK (auth.uid() =
user_id);

-- Insert only basic admin user for system management
INSERT INTO public.users
  (name, email, password, address, role)
VALUES
  ('Admin User', 'admin@ecommerce.com', 'admin123', '123 Admin Street', 'admin')
ON CONFLICT
(email) DO NOTHING;

-- Optional: Function for executing dynamic queries (if needed)
CREATE OR REPLACE FUNCTION public.execute_dynamic_query
(query_text TEXT)
RETURNS TABLE
(result JSONB)
SECURITY DEFINER
AS $$
BEGIN
  -- Validate that the query is only SELECT
  IF NOT (query_text ILIKE 'SELECT%' OR query_text ILIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT and WITH queries are allowed';
END
IF;
  
  -- Validate that it doesn't have dangerous operations
  IF query_text ILIKE '%DROP%' OR query_text ILIKE '%DELETE%' OR 
     query_text ILIKE '%UPDATE%' OR query_text ILIKE '%INSERT%' OR
     query_text ILIKE '%CREATE%' OR query_text ILIKE '%ALTER%' OR
     query_text ILIKE '%TRUNCATE%' THEN
    RAISE EXCEPTION 'Dangerous operations detected';
END
IF;
  
  -- Execute the query and return results as JSONB
  RETURN QUERY
EXECUTE 'SELECT to_jsonb(subquery) FROM ('
|| query_text || ') AS subquery';
END;
$$ LANGUAGE plpgsql; 