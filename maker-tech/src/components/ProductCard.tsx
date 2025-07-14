import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  price: number;
  stock: number;
  image_url: string;
  // Additional fields for UI (can be derived or added)
  originalPrice?: number;
  category?: string;
  rating?: number;
  reviews?: number;
  isNew?: boolean;
  isOnSale?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  isUpdating?: boolean; // New prop to show loading state
}

export const ProductCard = ({ product, onAddToCart, onProductClick, isUpdating = false }: ProductCardProps) => {
  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleCardClick = () => {
    onProductClick(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when adding to cart
    onAddToCart(product);
  };

  return (
    <Card 
      className="group relative overflow-hidden border-border bg-card hover:shadow-product transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-square bg-secondary/20">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-success text-white">New</Badge>
          )}
          {product.isOnSale && discount > 0 && (
            <Badge className="bg-destructive text-white">-{discount}%</Badge>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <Badge className="bg-warning text-white">Low Stock</Badge>
          )}
          {product.stock === 0 && (
            <Badge className="bg-destructive text-white">Out of Stock</Badge>
          )}
          {isUpdating && (
            <Badge className="bg-primary text-white animate-pulse">Updating...</Badge>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button size="icon" variant="secondary" className="h-8 w-8">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Add to Cart */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Button 
            onClick={handleAddToCart}
            className="w-full"
            size="sm"
            disabled={product.stock === 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        {/* Category & Brand */}
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {product.brand && product.category ? `${product.brand} • ${product.category}` : product.category || product.brand}
        </div>
        
        {/* Product Name */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Rating */}
        {product.rating && product.reviews && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.rating!) 
                      ? 'text-warning fill-current' 
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Stock info */}
        <div className="mt-2 text-xs text-muted-foreground">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </div>
      </CardContent>
    </Card>
  );
};