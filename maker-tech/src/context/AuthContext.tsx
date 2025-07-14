import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  address?: string;
  role: 'admin' | 'user';
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  address: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; redirectTo?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string; redirectTo?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string; redirectTo?: string }> => {
    setIsLoading(true);
    
    // Real API call to backend
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:8001/api/v1/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (response.ok) {
            const userData = await response.json();
            
            // Set user data (remove password from stored data)
            const userToStore: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              address: userData.address,
              role: userData.role,
          };
          
            setUser(userToStore);
            localStorage.setItem('user', JSON.stringify(userToStore));
          setIsLoading(false);
          
          resolve({ 
            success: true, 
              message: userData.role === 'admin' ? 'Welcome to Admin Dashboard!' : 'Login successful!',
              redirectTo: userData.role === 'admin' ? '/dashboard' : undefined
            });
          } else {
            const errorData = await response.json();
            setIsLoading(false);
            resolve({ 
              success: false, 
              message: errorData.detail || 'Invalid email or password' 
            });
          }
        } catch (error) {
          setIsLoading(false);
          resolve({ 
            success: false, 
            message: 'Network error. Please check your connection and try again.' 
          });
        }
      }, 1000); // Simulate network delay
    });
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string; redirectTo?: string }> => {
    setIsLoading(true);
    
    // Simulate API call to register user
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          // In a real app, this would be an API call to your backend
          const response = await fetch('http://localhost:8001/api/v1/users/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            const userData = await response.json();
            
            // Set user data (remove password from stored data)
            const userToStore: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              address: userData.address,
              role: userData.role,
            };
            
            setUser(userToStore);
            localStorage.setItem('user', JSON.stringify(userToStore));
            setIsLoading(false);
            
            resolve({ 
              success: true, 
              message: 'Account created successfully!',
              redirectTo: userData.role === 'admin' ? '/dashboard' : undefined
          });
        } else {
            const errorData = await response.json();
            setIsLoading(false);
            resolve({ 
              success: false, 
              message: errorData.detail || 'Registration failed. Please try again.' 
            });
          }
        } catch (error) {
          setIsLoading(false);
          resolve({ 
            success: false, 
            message: 'Network error. Please check your connection and try again.' 
          });
        }
      }, 1000); // Simulate network delay
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    isLoggedIn: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 