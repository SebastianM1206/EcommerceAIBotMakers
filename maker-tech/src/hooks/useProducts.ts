import { useState, useEffect } from 'react';
import { productService, ProductApiError } from '@/lib/productService';
import { Product } from '@/components/ProductCard';
import { useToast } from '@/hooks/use-toast';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  categories: string[];
  featuredProducts: Product[];
  loadProducts: (params?: ProductFilters) => Promise<void>;
  loadFeaturedProducts: () => Promise<void>;
  loadCategories: () => Promise<void>;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
}

interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  is_on_sale?: boolean;
  is_new?: boolean;
}

export const useProducts = (initialFilters: ProductFilters = {}): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialFilters.page || 1);
  const [limit] = useState(initialFilters.limit || 20);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const { toast } = useToast();

  const totalPages = Math.ceil(totalProducts / limit);

  const loadProducts = async (newFilters: ProductFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedFilters = { ...filters, ...newFilters, page: currentPage, limit };
      setFilters(mergedFilters);
      
      const response = await productService.getProducts(mergedFilters);
      
      setProducts(response.products);
      setTotalProducts(response.total);
      
    } catch (err) {
      const errorMessage = err instanceof ProductApiError 
        ? err.message 
        : 'Failed to load products';
      
      setError(errorMessage);
      setProducts([]);
      
      // Show toast for connection errors
      if (err instanceof ProductApiError && err.status === 0) {
        toast({
          title: "Connection Error",
          description: "Cannot connect to server. Using offline mode.",
          variant: "destructive"
        });
      }
      
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const featured = await productService.getFeaturedProducts(8);
      setFeaturedProducts(featured);
    } catch (err) {
      console.error('Failed to load featured products:', err);
      // Don't show error for featured products, just log it
    }
  };

  const loadCategories = async () => {
    try {
      const categoryList = await productService.getCategories();
      setCategories(categoryList);
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Don't show error for categories, just log it
    }
  };

  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const refetch = async () => {
    await loadProducts(filters);
  };

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadFeaturedProducts();
    loadCategories();
  }, [currentPage]);

  return {
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    totalPages,
    categories,
    featuredProducts,
    loadProducts,
    loadFeaturedProducts,
    loadCategories,
    setPage,
    refetch,
  };
};

// Hook specifically for featured products (for homepage)
export const useFeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const featured = await productService.getFeaturedProducts(8);
      setProducts(featured);
      
    } catch (err) {
      const errorMessage = err instanceof ProductApiError 
        ? err.message 
        : 'Failed to load featured products';
      
      setError(errorMessage);
      
      // Fallback to empty array if connection fails
      setProducts([]);
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: loadProducts,
  };
}; 