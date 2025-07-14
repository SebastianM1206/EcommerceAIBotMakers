const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
}

export interface Order {
  id: string;
  user_id: string;
  total_price: number;
  status: string;
  items?: OrderItem[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  error?: string;
  total_price?: number;
}

class OrderService {
  async createOrder(userId: string, orderData: CreateOrderRequest): Promise<Order> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user orders');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  async validateOrder(orderData: CreateOrderRequest): Promise<ValidationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to validate order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/status?status=${status}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/orders/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch all orders');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService(); 