import asyncio
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from app.config import settings
from app.utils.logger import logger


# Esquema de la base de datos del ecommerce
DATABASE_SCHEMA = """

-- Usuarios del sistema
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  address TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user'
);

--  Productos del ecommerce

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


--  Órdenes de compra
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--  Productos dentro de cada orden
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL
);

-- Función para ejecutar consultas SELECT de forma segura
CREATE OR REPLACE FUNCTION public.execute_dynamic_query(query_text TEXT)
RETURNS TABLE(result JSONB)
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que la consulta sea solo SELECT
  IF NOT (query_text ILIKE 'SELECT%' OR query_text ILIKE 'WITH%') THEN
    RAISE EXCEPTION 'Solo se permiten consultas SELECT y WITH';
  END IF;
  
  -- Validar que no tenga operaciones peligrosas
  IF query_text ILIKE '%DROP%' OR query_text ILIKE '%DELETE%' OR 
     query_text ILIKE '%UPDATE%' OR query_text ILIKE '%INSERT%' OR
     query_text ILIKE '%CREATE%' OR query_text ILIKE '%ALTER%' OR
     query_text ILIKE '%TRUNCATE%' THEN
    RAISE EXCEPTION 'Operaciones no permitidas detectadas';
  END IF;
  
  -- Ejecutar la consulta y retornar resultados como JSONB
  RETURN QUERY EXECUTE 'SELECT to_jsonb(subquery) FROM (' || query_text || ') AS subquery';
END;
$$ LANGUAGE plpgsql;
"""


class DatabaseService:
    """Servicio para interactuar con Supabase - Solo datos reales"""

    def __init__(self):
        self.supabase: Optional[Client] = None
        self._initialize_client()

    def _initialize_client(self):
        """Initializes the Supabase client"""
        if not settings.supabase_configured:
            logger.error(
                "Supabase is NOT configured. This service requires real configuration.")
            logger.error(
                "Configure SUPABASE_URL and SUPABASE_KEY in your .env file")
            raise ValueError("Supabase is not configured correctly")

        try:
            self.supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            logger.info("Supabase client initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing Supabase: {e}")
            raise ConnectionError(f"Could not connect to Supabase: {e}")

    async def execute_query(self, sql_query: str) -> List[Dict[str, Any]]:
        """
        Executes a SQL query in Supabase using RPC
        """
        if not self.supabase:
            raise ConnectionError("Supabase client not initialized")

        try:
            logger.info(f"Executing SQL query: {sql_query}")

            result = self.supabase.rpc('execute_dynamic_query', {
                'query_text': sql_query
            }).execute()

            logger.info(
                f"Query executed successfully. Rows returned: {len(result.data) if result.data else 0}")
            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error executing SQL query: {e}")
            logger.error(f"Query that failed: {sql_query}")

            # Provide useful information about the error
            if "function execute_dynamic_query" in str(e).lower():
                logger.error(
                    "You need to create the RPC function 'execute_dynamic_query' in Supabase")
                logger.error("Check the README for instructions")

            raise Exception(f"Error executing query: {e}")

    async def execute_direct_query(self, table: str, select_fields: str = "*", filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Executes direct queries using native Supabase methods
        """
        if not self.supabase:
            raise ConnectionError("Supabase client not initialized")

        try:
            query = self.supabase.table(table).select(select_fields)

            if filters:
                for field, value in filters.items():
                    query = query.eq(field, value)

            result = query.execute()
            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error in direct query to table {table}: {e}")
            raise Exception(f"Error in direct query: {e}")

    async def health_check(self) -> bool:
        """Verifies connection with Supabase"""
        if not self.supabase:
            return False

        try:
            # Verify connection by making a simple query
            result = self.supabase.table(
                'users').select('id').limit(1).execute()
            logger.info("Supabase connection verified")
            return True

        except Exception as e:
            logger.error(f"Error in Supabase health check: {e}")
            return False


# Instancia global del servicio de base de datos
database_service = DatabaseService()
