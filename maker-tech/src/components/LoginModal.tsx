import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

export const LoginModal = ({ isOpen, onOpenChange, onLoginSuccess }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      // Validation for sign up
      if (!name || !email || !password || !address) {
        setError('Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      try {
        const result = await register({
          name,
          email,
          password,
          address
        });
        
        if (result.success) {
          onOpenChange(false);
          resetForm();
          
          // Handle admin redirection
          if (result.redirectTo) {
            navigate(result.redirectTo);
          } else if (onLoginSuccess) {
            onLoginSuccess();
          }
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError('An error occurred during registration. Please try again.');
      }
    } else {
      // Validation for login
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      try {
        const result = await login(email, password);
        
        if (result.success) {
          onOpenChange(false);
          resetForm();
          
          // Handle admin redirection
          if (result.redirectTo) {
            navigate(result.redirectTo);
          } else if (onLoginSuccess) {
            onLoginSuccess();
          }
        } else {
          setError(result.message);
        }
      } catch (error) {
        setError('An error occurred during login. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setAddress('');
    setConfirmPassword('');
    setError('');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setConfirmPassword('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSignUp 
              ? 'Create your account to complete your purchase' 
              : 'Sign in to your account to continue with checkout'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name field - only for sign up */}
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>



          {/* Address field - only for sign up */}
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter your address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <Button
            variant="link"
            className="h-auto p-0 ml-1"
            onClick={toggleMode}
            disabled={isLoading}
          >
            {isSignUp ? 'Sign In' : 'Create Account'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-2">
          {!isSignUp && (
            <>
              <p>(min. 6 characters)</p>
              <p>Example: demo@example.com / password123</p>

            </>
          )}
          {isSignUp && (
            <p>All fields are required. Your account will be created with user role.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 