from typing import List, Optional, Dict, Any
from supabase import Client
from app.services.database import database_service
from app.utils.logger import logger


class OrderService:
    """Service to handle order operations with database"""

    def __init__(self):
        self.database = database_service

    async def create_order(self, user_id: str, items: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Create a new order with items and update product stock"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            total_price = sum(item['quantity'] * item['unit_price']
                              for item in items)

            # Start a transaction-like process
            # 1. Create the order
            order_data = {
                'user_id': user_id,
                'total_price': total_price,
                'status': 'pending'
            }

            order_result = self.database.supabase.table(
                'orders').insert(order_data).execute()

            if not order_result.data or len(order_result.data) == 0:
                logger.error("Failed to create order")
                return None

            order = order_result.data[0]
            order_id = order['id']

            # 2. Create order items and update stock
            created_items = []
            for item in items:

                order_item_data = {
                    'order_id': order_id,
                    'product_id': item['product_id'],
                    'quantity': item['quantity'],
                    'unit_price': item['unit_price']
                }

                item_result = self.database.supabase.table(
                    'order_items').insert(order_item_data).execute()

                if item_result.data and len(item_result.data) > 0:
                    created_items.append(item_result.data[0])

                # Update product stock
                await self._update_product_stock(item['product_id'], -item['quantity'])

            # 3. Return complete order with items
            order['items'] = created_items
            return order

        except Exception as e:
            logger.error(f"Error creating order: {e}")
            return None

    async def _update_product_stock(self, product_id: str, quantity_change: int) -> bool:
        """Update product stock (quantity_change can be negative for stock reduction)"""
        try:
            if not self.database.supabase:
                return False

            # Get current stock
            product_result = self.database.supabase.table(
                'products').select('stock').eq('id', product_id).execute()

            if not product_result.data or len(product_result.data) == 0:
                logger.error(f"Product {product_id} not found")
                return False

            current_stock = product_result.data[0]['stock']
            # Ensure stock doesn't go negative
            new_stock = max(0, current_stock + quantity_change)

            # Update stock
            update_result = self.database.supabase.table('products').update(
                {'stock': new_stock}).eq('id', product_id).execute()

            return update_result.data is not None and len(update_result.data) > 0

        except Exception as e:
            logger.error(f"Error updating product stock for {product_id}: {e}")
            return False

    async def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Get order by ID with items"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            # Get order
            order_result = self.database.supabase.table(
                'orders').select('*').eq('id', order_id).execute()

            if not order_result.data or len(order_result.data) == 0:
                return None

            order = order_result.data[0]

            # Get order items
            items_result = self.database.supabase.table(
                'order_items').select('*').eq('order_id', order_id).execute()
            order['items'] = items_result.data if items_result.data else []

            return order

        except Exception as e:
            logger.error(f"Error getting order {order_id}: {e}")
            return None

    async def get_user_orders(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all orders for a user"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return []

            # Get orders
            orders_result = self.database.supabase.table(
                'orders').select('*').eq('user_id', user_id).execute()

            if not orders_result.data:
                return []

            orders = orders_result.data

            # Get items for each order
            for order in orders:
                items_result = self.database.supabase.table('order_items').select(
                    '*').eq('order_id', order['id']).execute()
                order['items'] = items_result.data if items_result.data else []

            return orders

        except Exception as e:
            logger.error(f"Error getting user orders for {user_id}: {e}")
            return []

    async def get_all_orders(self) -> List[Dict[str, Any]]:
        """Get all orders (admin only)"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return []

            # Get all orders
            orders_result = self.database.supabase.table(
                'orders').select('*').execute()

            if not orders_result.data:
                return []

            orders = orders_result.data

            # Get items for each order
            for order in orders:
                items_result = self.database.supabase.table('order_items').select(
                    '*').eq('order_id', order['id']).execute()
                order['items'] = items_result.data if items_result.data else []

            return orders

        except Exception as e:
            logger.error(f"Error getting all orders: {e}")
            return []

    async def update_order_status(self, order_id: str, status: str) -> Optional[Dict[str, Any]]:
        """Update order status"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            valid_statuses = ['pending', 'processing',
                              'shipped', 'delivered', 'cancelled']
            if status not in valid_statuses:
                logger.error(f"Invalid status: {status}")
                return None

            # Update order
            result = self.database.supabase.table('orders').update(
                {'status': status}).eq('id', order_id).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error updating order status for {order_id}: {e}")
            return None

    async def validate_order_items(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate order items against current product stock and prices"""
        try:
            if not self.database.supabase:
                return {"valid": False, "error": "Database not available"}

            validation_errors = []
            total_price = 0

            for item in items:
                product_id = item.get('product_id')
                quantity = item.get('quantity', 0)
                unit_price = item.get('unit_price', 0)

                # Get current product data
                product_result = self.database.supabase.table(
                    'products').select('*').eq('id', product_id).execute()

                if not product_result.data or len(product_result.data) == 0:
                    validation_errors.append(f"Product {product_id} not found")
                    continue

                product = product_result.data[0]

                if quantity > product['stock']:
                    validation_errors.append(
                        f"Insufficient stock for {product['name']}. Available: {product['stock']}, Requested: {quantity}")
                    continue

                if abs(unit_price - product['price']) > 0.01:
                    validation_errors.append(
                        f"Price mismatch for {product['name']}. Current price: ${product['price']}, Order price: ${unit_price}")
                    continue

                total_price += quantity * unit_price

            if validation_errors:
                return {"valid": False, "errors": validation_errors}

            return {"valid": True, "total_price": total_price}

        except Exception as e:
            logger.error(f"Error validating order items: {e}")
            return {"valid": False, "error": str(e)}


order_service = OrderService()
