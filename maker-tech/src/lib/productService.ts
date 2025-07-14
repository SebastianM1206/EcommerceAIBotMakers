import { buildApiUrl } from './config';
import { Product } from '@/components/ProductCard';

// API response interfaces
interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

// API error interface
interface ApiError {
  error: string;
  details?: string;
  timestamp?: string;
}

// Custom error class
export class ProductApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ProductApiError';
  }
}

// Product service class
export class ProductService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = buildApiUrl('/api/v1/products');
  }

  // Get all products with pagination and filters
  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    is_on_sale?: boolean;
    is_new?: boolean;
  } = {}): Promise<ProductListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.category) searchParams.append('category', params.category);
      if (params.search) searchParams.append('search', params.search);
      if (params.is_on_sale !== undefined) searchParams.append('is_on_sale', params.is_on_sale.toString());
      if (params.is_new !== undefined) searchParams.append('is_new', params.is_new.toString());

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new ProductApiError(
          errorData.error || 'Failed to fetch products',
          response.status,
          errorData.details
        );
      }

      const data: ProductListResponse = await response.json();
      
      // Transform the data to match frontend interface
      const transformedData = {
        ...data,
        products: data.products.map(this.transformProduct)
      };
      
      return transformedData;

    } catch (error) {
      if (error instanceof ProductApiError) {
        throw error;
      }

      if (error instanceof TypeError) {
        throw new ProductApiError(
          'Could not connect to server. Please check your internet connection.',
          0,
          error.message
        );
      }

      throw new ProductApiError(
        'Unexpected error while fetching products',
        0,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Get featured products
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
      const url = `${this.baseUrl}/featured?limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new ProductApiError(
          errorData.error || 'Failed to fetch featured products',
          response.status,
          errorData.details
        );
      }

      const products: Product[] = await response.json();
      return products.map(this.transformProduct);

    } catch (error) {
      if (error instanceof ProductApiError) {
        throw error;
      }

      throw new ProductApiError(
        'Unexpected error while fetching featured products',
        0,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Get product by ID
  async getProductById(productId: string): Promise<Product> {
    try {
      const url = `${this.baseUrl}/${productId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new ProductApiError(
          errorData.error || 'Failed to fetch product',
          response.status,
          errorData.details
        );
      }

      const product: Product = await response.json();
      return this.transformProduct(product);

    } catch (error) {
      if (error instanceof ProductApiError) {
        throw error;
      }

      throw new ProductApiError(
        'Unexpected error while fetching product',
        0,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Get product categories
  async getCategories(): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/categories`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new ProductApiError(
          errorData.error || 'Failed to fetch categories',
          response.status,
          errorData.details
        );
      }

      return await response.json();

    } catch (error) {
      if (error instanceof ProductApiError) {
        throw error;
      }

      throw new ProductApiError(
        'Unexpected error while fetching categories',
        0,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Update product stock
  async updateStock(productId: string, newStock: number): Promise<void> {
    try {
      const url = `${this.baseUrl}/${productId}/update-stock?new_stock=${newStock}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new ProductApiError(
          errorData.error || 'Failed to update stock',
          response.status,
          errorData.details
        );
      }

    } catch (error) {
      if (error instanceof ProductApiError) {
        throw error;
      }

      throw new ProductApiError(
        'Unexpected error while updating stock',
        0,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  // Transform backend product to frontend format
  private transformProduct(product: any): Product {
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      rating: product.rating,
      reviews: product.reviews || 0,
      image_url: product.image_url || '/placeholder.svg',
      originalPrice: product.original_price,
      isNew: product.is_new || false,
      isOnSale: product.is_on_sale || false,
    };
  }

  // Check if backend is available
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const productService = new ProductService(); 