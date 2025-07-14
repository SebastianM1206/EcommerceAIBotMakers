import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoginModal } from './LoginModal';
import { useAuth } from '@/context/AuthContext';
import { CartItem } from './CartSidebar';
import { useToast } from '@/hooks/use-toast';
import { orderService, CreateOrderRequest } from '@/services/orderService';
import { useProductUpdates } from '@/hooks/useProductUpdates';

interface CheckoutFlowProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onClearCart: () => void;
  onOrderComplete?: () => void; // New callback to refresh products
}

export const CheckoutFlow = ({ isOpen, onOpenChange, cartItems, onClearCart, onOrderComplete }: CheckoutFlowProps) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  const { isLoggedIn, user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshProducts } = useProductUpdates();

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    await processOrder();
  };

  const processOrder = async () => {
    setIsProcessing(true);
    
    try {
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      // Prepare order data
      const orderData: CreateOrderRequest = {
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price
        }))
      };

      // Create the order
      const order = await orderService.createOrder(user.id, orderData);
      
      setOrderId(order.id);
        setOrderComplete(true);
        setIsProcessing(false);
        
        toast({
          title: "Order Confirmed!",
        description: `Your order ${order.id.slice(-8).toUpperCase()} has been placed successfully.`,
        });
        
        onClearCart();
      
      // Refresh specific products that were in the order
      const productIds = cartItems.map(item => item.id);
      await refreshProducts(productIds);
      
      // Trigger product refresh to show updated stock
      if (onOrderComplete) {
        onOrderComplete();
      }
      
    } catch (error) {
      setIsProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
      
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error('Order processing error:', error);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    
    // Check if user is admin after login and redirect if so
    if (isAdmin) {
      onOpenChange(false);
      navigate('/dashboard');
      return;
    }
    
    // Otherwise proceed with order processing
    processOrder();
  };

  const handleClose = () => {
    if (!isProcessing) {
      setOrderComplete(false);
      setOrderId('');
      onOpenChange(false);
    }
  };

  if (orderComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-success" />
              Order Confirmed!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-center">
            <div className="p-4 bg-success/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Order Number</p>
              <p className="font-mono text-lg font-semibold">MT-{orderId.slice(-8).toUpperCase()}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Thank you for your purchase, {user?.name}!
              </p>
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation email to {user?.email}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                <span>3-5 days</span>
              </div>
            </div>
            
            <Button onClick={handleClose} className="w-full">
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Checkout
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* User Info */}
            {isLoggedIn && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{user?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Address:</span>
                    <span>{user?.address || '123 Main St, City, State 12345'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Order Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Order Summary</CardTitle>
                <CardDescription>
                  {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Payment Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4" />
                  <span>•••• •••• •••• 1234</span>
                  <span className="text-muted-foreground">(Demo)</span>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              onClick={handleCheckout} 
              className="w-full" 
              size="lg"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 
               isLoggedIn ? `Complete Purchase - $${totalPrice.toFixed(2)}` : 
               'Sign In to Complete Purchase'}
            </Button>
            
            {!isLoggedIn && (
              <p className="text-xs text-muted-foreground text-center">
                You'll be asked to sign in or create an account to complete your purchase
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <LoginModal 
        isOpen={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}; 