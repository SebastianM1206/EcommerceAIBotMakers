import { ProductCard, Product } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onRetry?: () => void;
}

// Loading skeleton component
const ProductSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-square w-full" />
    <CardContent className="p-4">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-6 w-1/3" />
    </CardContent>
  </Card>
);

// Error component
const ProductGridError = ({ error, onRetry }: { error: string; onRetry?: () => void }) => (
  <div className="text-center py-12">
    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">Failed to Load Products</h3>
    <p className="text-muted-foreground mb-4 max-w-md mx-auto">{error}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    )}
  </div>
);

// Empty state component
const EmptyProducts = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📦</div>
    <h3 className="text-lg font-semibold mb-2">No Products Available</h3>
    <p className="text-muted-foreground">Check back later for new arrivals!</p>
  </div>
);

export const ProductGrid = ({ 
  products, 
  loading = false, 
  error = null, 
  onAddToCart, 
  onProductClick,
  onRetry 
}: ProductGridProps) => {
  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our latest collection of tech products, carefully curated for tech enthusiasts and professionals.
          </p>
        </div>
        
        {/* Show error state */}
        {error && products.length === 0 && (
          <ProductGridError error={error} onRetry={onRetry} />
        )}
        
        {/* Show loading state */}
        {loading && products.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        )}
        
        {/* Show products */}
        {!loading && !error && products.length === 0 && <EmptyProducts />}
        
        {products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onProductClick={onProductClick}
              />
            ))}
            
            {/* Show loading skeletons for additional products being loaded */}
            {loading && products.length > 0 && (
              <>
                {Array.from({ length: 4 }).map((_, index) => (
                  <ProductSkeleton key={`loading-${index}`} />
                ))}
              </>
            )}
          </div>
        )}
        
        {/* Show connection error banner if there are products but error occurred */}
        {error && products.length > 0 && (
          <div className="mt-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <p className="text-destructive text-sm">
              Connection issue detected. Showing cached products. {onRetry && (
                <Button onClick={onRetry} variant="link" className="p-0 h-auto text-destructive underline">
                  Retry
                </Button>
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};