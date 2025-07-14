from typing import List, Optional, Dict, Any
from supabase import Client
from app.services.database import database_service
from app.models.schemas import Product, ProductCreate, ProductUpdate, ProductListResponse
from app.utils.logger import logger


class ProductService:
    """Service to handle product operations with database"""

    def __init__(self):
        self.database = database_service

    async def get_products(
        self,
        page: int = 1,
        limit: int = 20,
        category: Optional[str] = None,
        search: Optional[str] = None,
        is_on_sale: Optional[bool] = None,
        is_new: Optional[bool] = None
    ) -> ProductListResponse:
        """Get products with pagination and filters"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return ProductListResponse(products=[], total=0, page=page, limit=limit)

            query = self.database.supabase.table('products').select('*')

            # Apply filters
            if category:
                query = query.ilike('category', f'%{category}%')

            if search:
                # Use or_ for multiple field search
                query = query.or_(
                    f'name.ilike.%{search}%,brand.ilike.%{search}%,description.ilike.%{search}%')

            if is_on_sale is not None:
                query = query.eq('is_on_sale', is_on_sale)

            if is_new is not None:
                query = query.eq('is_new', is_new)

            # Get total count first
            count_query = self.database.supabase.table(
                'products').select('id', count='exact')
            if category:
                count_query = count_query.ilike('category', f'%{category}%')
            if search:
                count_query = count_query.or_(
                    f'name.ilike.%{search}%,brand.ilike.%{search}%,description.ilike.%{search}%')
            if is_on_sale is not None:
                count_query = count_query.eq('is_on_sale', is_on_sale)
            if is_new is not None:
                count_query = count_query.eq('is_new', is_new)

            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, 'count') else 0

            # Add ordering and pagination - use name for consistent ordering (UUID is random)
            offset = (page - 1) * limit
            query = query.order('name').range(offset, offset + limit - 1)

            result = query.execute()
            products_data = result.data if result.data else []

            products = []
            for item in products_data:
                try:
                    product = self._convert_to_product(item)
                    products.append(product)
                except Exception as e:
                    logger.error(
                        f"Error parsing product {item.get('id')}: {e}")
                    continue

            return ProductListResponse(
                products=products,
                total=total,
                page=page,
                limit=limit
            )

        except Exception as e:
            logger.error(f"Error getting products: {e}")
            return ProductListResponse(products=[], total=0, page=page, limit=limit)

    async def get_product_by_id(self, product_id: str) -> Optional[Product]:
        """Get a single product by ID"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            result = self.database.supabase.table('products').select(
                '*').eq('id', product_id).execute()

            if not result.data:
                return None

            return self._convert_to_product(result.data[0])

        except Exception as e:
            logger.error(f"Error getting product {product_id}: {e}")
            return None

    async def get_featured_products(self, limit: int = 20) -> List[Product]:
        """Get all products """
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return []

            # Query for ALL products - NO FILTERS AT ALL
            query = self.database.supabase.table('products').select('*')

            # Order by name and limit - NO OTHER FILTERS
            query = query.order('name').limit(limit)

            result = query.execute()
            products_data = result.data if result.data else []

            products = []
            for item in products_data:
                try:
                    product = self._convert_to_product(item)
                    products.append(product)
                except Exception as e:
                    logger.error(
                        f"Error parsing featured product {item.get('id')}: {e}")
                    continue

            return products

        except Exception as e:
            logger.error(f"Error getting featured products: {e}")
            return []

    async def get_categories(self) -> List[str]:
        """Get all available product categories"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return []

            result = self.database.supabase.table(
                'products').select('category').execute()

            categories = set()
            for item in result.data if result.data else []:
                if item.get('category'):
                    categories.add(item['category'])

            return sorted(list(categories))

        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []

    async def update_stock(self, product_id: str, new_stock: int) -> bool:
        """Update product stock"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available for stock update")
                return False

            # Only update stock, no timestamp columns
            result = self.database.supabase.table('products').update({
                'stock': new_stock
            }).eq('id', product_id).execute()

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            logger.error(f"Error updating stock for product {product_id}: {e}")
            return False

    async def create_product(self, product_data: ProductCreate) -> Optional[Product]:
        """Create a new product"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available for product creation")
                return None

            result = self.database.supabase.table('products').insert(
                product_data.model_dump()).execute()

            if result.data and len(result.data) > 0:
                return self._convert_to_product(result.data[0])

            return None

        except Exception as e:
            logger.error(f"Error creating product: {e}")
            return None

    async def update_product(self, product_id: str, product_data: ProductUpdate) -> Optional[Product]:
        """Update an existing product"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available for product update")
                return None

            # Only include non-None values in the update
            update_data = {
                k: v for k, v in product_data.model_dump().items() if v is not None}

            if not update_data:
                return await self.get_product_by_id(product_id)

            result = self.database.supabase.table('products').update(
                update_data).eq('id', product_id).execute()

            if result.data and len(result.data) > 0:
                return self._convert_to_product(result.data[0])

            return None

        except Exception as e:
            logger.error(f"Error updating product {product_id}: {e}")
            return None

    async def delete_product(self, product_id: str) -> bool:
        """Delete a product"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available for product deletion")
                return False

            result = self.database.supabase.table(
                'products').delete().eq('id', product_id).execute()

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            logger.error(f"Error deleting product {product_id}: {e}")
            return False

    def _convert_to_product(self, item: Dict[str, Any]) -> Product:
        """Convert database item to Product model with safe defaults for missing columns"""
        return Product(
            id=str(item['id']),
            name=item['name'],
            brand=item.get('brand'),
            description=item.get('description'),
            price=float(item['price']),
            stock=int(item.get('stock', 0)),
            category=item.get('category'),
            rating=float(item.get('rating', 0)) if item.get(
                'rating') else None,
            reviews=int(item.get('reviews', 0)),
            image_url=item.get('image_url'),
            original_price=float(item.get('original_price')) if item.get(
                'original_price') else None,
            is_new=bool(item.get('is_new', False)),
            is_on_sale=bool(item.get('is_on_sale', False)),
            created_at=None,  # Always None since column doesn't exist
            updated_at=None   # Always None since column doesn't exist
        )


product_service = ProductService()
