import { useState } from 'react';
import { X, ShoppingCart, Heart, Star, Package, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Product } from './ProductCard';

interface ProductDetailsProps {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductDetails = ({ product, isOpen, onOpenChange, onAddToCart }: ProductDetailsProps) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    onOpenChange(false);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square bg-secondary/20 rounded-lg overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
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
            </div>
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Category */}
            <div className="space-y-2">
              {product.brand && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Brand:</span> {product.brand}
                </div>
              )}
              {product.category && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Category:</span> {product.category}
                </div>
              )}
            </div>
            
            {/* Rating */}
            {product.rating && product.reviews && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating!) 
                          ? 'text-warning fill-current' 
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>
            )}
            
            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <div className="text-sm text-success font-medium">
                  You save ${(product.originalPrice - product.price).toFixed(2)} ({discount}%)
                </div>
              )}
            </div>
            
            {/* Stock */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {product.stock > 0 ? (
                    <span className="text-success">
                      {product.stock} in stock
                    </span>
                  ) : (
                    <span className="text-destructive">Out of stock</span>
                  )}
                </span>
              </div>
            </div>
            
            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-semibold">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
            
            <Separator />
            
            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddToCart}
                    className="flex-1"
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart - ${(product.price * quantity).toFixed(2)}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>Ships within 2-3 business days</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 