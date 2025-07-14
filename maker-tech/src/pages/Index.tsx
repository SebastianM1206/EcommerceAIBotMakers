import { useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
import { CartSidebar, CartItem } from '@/components/CartSidebar';
import { ProductDetails } from '@/components/ProductDetails';
import { ChatBot } from '@/components/ChatBot';
import { Product } from '@/components/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { useFeaturedProducts } from '@/hooks/useProducts';

const Index = () => {
  // Load featured products from database
  const { products: featuredProducts, loading: productsLoading, error: productsError, refetch: refetchProducts } = useFeaturedProducts();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock`,
        variant: "destructive"
      });
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast({
            title: "Stock limit reached",
            description: `Cannot add more ${product.name} to cart`,
            variant: "destructive"
          });
          return prevItems;
        }
        
        toast({
          title: "Updated cart",
          description: `Increased quantity of ${product.name}`,
        });
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart`,
        });
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveItem(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart",
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };

  const handleOrderComplete = () => {
    // Refresh products to show updated stock
    refetchProducts();
    toast({
      title: "Products updated",
      description: "Product information has been refreshed",
    });
  };

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Show connection error toast if there's an error loading products
  if (productsError && featuredProducts.length === 0) {

    console.warn('Products failed to load:', productsError);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        cartItemsCount={cartItemsCount} 
        onCartClick={() => setIsCartOpen(true)} 
      />
      
      <main>
        <Hero />
        <ProductGrid 
          products={featuredProducts} 
          loading={productsLoading}
          error={productsError}
          onAddToCart={handleAddToCart}
          onProductClick={handleProductClick}
        />
      </main>
      
      <CartSidebar
        isOpen={isCartOpen}
        onOpenChange={setIsCartOpen}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderComplete={handleOrderComplete}
      />
      
      <ProductDetails
        product={selectedProduct}
        isOpen={isProductDetailsOpen}
        onOpenChange={setIsProductDetailsOpen}
        onAddToCart={handleAddToCart}
      />
      
      <ChatBot />
    </div>
  );
};

export default Index;
