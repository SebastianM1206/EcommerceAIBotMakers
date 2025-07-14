import { useState, useCallback } from 'react';
import { Product } from '@/components/ProductCard';
import { productService } from '@/lib/productService';

interface ProductUpdate {
  productId: string;
  stockChange: number;
}

export const useProductUpdates = () => {
  const [updatingProducts, setUpdatingProducts] = useState<Set<string>>(new Set());

  // Optimistically update product stock in UI before server confirmation
  const updateProductStockOptimistic = useCallback((
    products: Product[], 
    updates: ProductUpdate[]
  ): Product[] => {
    return products.map(product => {
      const update = updates.find(u => u.productId === product.id);
      if (update) {
        const newStock = Math.max(0, product.stock + update.stockChange);
        return { ...product, stock: newStock };
      }
      return product;
    });
  }, []);

  // Update specific product by fetching latest data from server
  const refreshProduct = useCallback(async (productId: string): Promise<Product | null> => {
    try {
      setUpdatingProducts(prev => new Set(prev).add(productId));
      
      const updatedProduct = await productService.getProduct(productId);
      return updatedProduct;
      
    } catch (error) {
      console.error(`Failed to refresh product ${productId}:`, error);
      return null;
    } finally {
      setUpdatingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }, []);

  // Update multiple products by fetching latest data
  const refreshProducts = useCallback(async (productIds: string[]): Promise<Product[]> => {
    const updatedProducts: Product[] = [];
    
    await Promise.all(
      productIds.map(async (productId) => {
        const product = await refreshProduct(productId);
        if (product) {
          updatedProducts.push(product);
        }
      })
    );
    
    return updatedProducts;
  }, [refreshProduct]);

  // Apply product updates to a product list
  const applyProductUpdates = useCallback((
    currentProducts: Product[], 
    updatedProducts: Product[]
  ): Product[] => {
    return currentProducts.map(product => {
      const updated = updatedProducts.find(u => u.id === product.id);
      return updated || product;
    });
  }, []);

  // Check if a product is currently being updated
  const isProductUpdating = useCallback((productId: string): boolean => {
    return updatingProducts.has(productId);
  }, [updatingProducts]);

  return {
    updateProductStockOptimistic,
    refreshProduct,
    refreshProducts,
    applyProductUpdates,
    isProductUpdating,
    updatingProducts: Array.from(updatingProducts)
  };
}; 