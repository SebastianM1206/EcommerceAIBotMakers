import { useState } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Product } from './ProductCard';
import { CheckoutFlow } from './CheckoutFlow';

export interface CartItem extends Product {
  quantity: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderComplete?: () => void; // New callback to refresh products
}

export const CartSidebar = ({ 
  isOpen, 
  onOpenChange, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onClearCart,
  onOrderComplete
}: CartSidebarProps) => {
  const [showCheckout, setShowCheckout] = useState(false);
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckoutClick = () => {
    setShowCheckout(true);
  };

  const handleCheckoutClose = () => {
    setShowCheckout(false);
    onOpenChange(false); // Close cart sidebar after checkout
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shopping Cart ({totalItems})
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-4">Add some products to get started</p>
                  <Button onClick={() => onOpenChange(false)}>Continue Shopping</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md bg-secondary"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.category}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-sm">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveItem(item.id)}
                              className="h-auto p-0 text-xs text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            

            {cartItems.length > 0 && (
              <div className="border-t border-border pt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button className="w-full" size="lg" onClick={handleCheckoutClick}>
                    Checkout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => onOpenChange(false)}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      
      <CheckoutFlow
        isOpen={showCheckout}
        onOpenChange={handleCheckoutClose}
        cartItems={cartItems}
        onClearCart={onClearCart}
        onOrderComplete={onOrderComplete}
      />
    </>
  );
};