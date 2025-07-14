from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud"""
    status: str
    message: str
    timestamp: datetime
    services: Dict[str, bool]


class HumanQueryRequest(BaseModel):
    """Request para consulta en lenguaje natural"""
    human_query: str = Field(..., description="Consulta en lenguaje natural")

    class Config:
        json_schema_extra = {
            "example": {
                "human_query": "Muestra todos los usuarios activos"
            }
        }


class HumanQueryResponse(BaseModel):
    """Respuesta exitosa para consulta en lenguaje natural"""
    answer: str = Field(..., description="Respuesta generada por el LLM")
    sql_query: Optional[str] = Field(None, description="Consulta SQL generada")
    execution_time: Optional[float] = Field(
        None, description="Tiempo de ejecución en segundos")

    class Config:
        json_schema_extra = {
            "example": {
                "answer": "Se encontraron 5 usuarios activos en el sistema.",
                "sql_query": "SELECT * FROM users WHERE active = true",
                "execution_time": 1.23
            }
        }


class ErrorResponse(BaseModel):
    """Respuesta de error"""
    error: str = Field(..., description="Mensaje de error")
    details: Optional[str] = Field(
        None, description="Detalles adicionales del error")
    timestamp: datetime = Field(default_factory=datetime.now)

    class Config:
        json_schema_extra = {
            "example": {
                "error": "Database connection failed",
                "details": "Unable to connect to Supabase database",
                "timestamp": "2024-01-15T10:30:00"
            }
        }


class SQLQueryResult(BaseModel):
    """Resultado de una consulta SQL"""
    sql_query: str
    original_query: str
    confidence: Optional[float] = None


class DatabaseSchema(BaseModel):
    """Esquema de la base de datos"""
    tables: List[Dict[str, Any]]
    relationships: Optional[List[Dict[str, Any]]] = None


class QueryMetrics(BaseModel):
    """Query performance metrics"""
    total_queries: int
    successful_queries: int
    failed_queries: int
    average_response_time: float
    last_updated: datetime


# Product schemas
class ProductBase(BaseModel):
    """Base product model"""
    name: str = Field(..., description="Product name")
    brand: Optional[str] = Field(None, description="Product brand")
    description: Optional[str] = Field(None, description="Product description")
    price: float = Field(..., gt=0, description="Product price")
    stock: int = Field(..., ge=0, description="Product stock quantity")
    category: Optional[str] = Field(None, description="Product category")
    rating: Optional[float] = Field(
        None, ge=0, le=5, description="Product rating")
    reviews: Optional[int] = Field(0, ge=0, description="Number of reviews")
    image_url: Optional[str] = Field(None, description="Product image URL")
    original_price: Optional[float] = Field(
        None, gt=0, description="Original price before discount")
    is_new: Optional[bool] = Field(False, description="Is new product")
    is_on_sale: Optional[bool] = Field(False, description="Is product on sale")


class ProductCreate(ProductBase):
    """Product creation schema"""
    pass


class ProductUpdate(BaseModel):
    """Product update schema"""
    name: Optional[str] = Field(None, description="Product name")
    brand: Optional[str] = Field(None, description="Product brand")
    description: Optional[str] = Field(None, description="Product description")
    price: Optional[float] = Field(None, gt=0, description="Product price")
    stock: Optional[int] = Field(
        None, ge=0, description="Product stock quantity")
    category: Optional[str] = Field(None, description="Product category")
    rating: Optional[float] = Field(
        None, ge=0, le=5, description="Product rating")
    reviews: Optional[int] = Field(None, ge=0, description="Number of reviews")
    image_url: Optional[str] = Field(None, description="Product image URL")
    original_price: Optional[float] = Field(
        None, gt=0, description="Original price before discount")
    is_new: Optional[bool] = Field(None, description="Is new product")
    is_on_sale: Optional[bool] = Field(None, description="Is product on sale")


class Product(ProductBase):
    """Product response schema"""
    id: str = Field(..., description="Product ID")
    created_at: Optional[datetime] = Field(
        None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(
        None, description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "Gaming Laptop Pro",
                "brand": "TechBrand",
                "description": "High-performance gaming laptop with RTX graphics",
                "price": 1299.99,
                "stock": 15,
                "category": "Laptops",
                "rating": 4.8,
                "reviews": 127,
                "image_url": "https://example.com/laptop.jpg",
                "original_price": 1499.99,
                "is_new": True,
                "is_on_sale": True,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T14:20:00Z"
            }
        }


class ProductListResponse(BaseModel):
    """Product list response schema"""
    products: List[Product] = Field(..., description="List of products")
    total: int = Field(..., description="Total number of products")
    page: int = Field(..., description="Current page")
    limit: int = Field(..., description="Products per page")

    class Config:
        json_schema_extra = {
            "example": {
                "products": [],
                "total": 25,
                "page": 1,
                "limit": 10
            }
        }


# User schemas
class UserBase(BaseModel):
    """Base user model"""
    name: str = Field(..., description="User name")
    email: str = Field(..., description="User email")
    address: Optional[str] = Field(None, description="User address")


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=6, description="User password")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "password": "securepassword123",
                "address": "123 Main Street"
            }
        }


class UserLogin(BaseModel):
    """User login schema"""
    email: str = Field(..., description="User email")
    password: str = Field(..., description="User password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "securepassword123"
            }
        }


class UserUpdate(BaseModel):
    """User update schema"""
    name: Optional[str] = Field(None, description="User name")
    email: Optional[str] = Field(None, description="User email")
    address: Optional[str] = Field(None, description="User address")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Updated",
                "address": "456 New Street"
            }
        }


class User(UserBase):
    """User response schema"""
    id: str = Field(..., description="User ID")
    role: str = Field(..., description="User role")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "name": "John Doe",
                "email": "john@example.com",
                "address": "123 Main Street",
                "role": "user"
            }
        }


# Order schemas
class OrderItemBase(BaseModel):
    """Base order item model"""
    product_id: str = Field(..., description="Product ID")
    quantity: int = Field(..., gt=0, description="Quantity")
    unit_price: float = Field(..., gt=0,
                              description="Unit price at time of order")


class OrderItemCreate(OrderItemBase):
    """Order item creation schema"""
    pass


class OrderItem(OrderItemBase):
    """Order item response schema"""
    id: str = Field(..., description="Order item ID")
    order_id: str = Field(..., description="Order ID")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "order_id": "456e7890-e89b-12d3-a456-426614174001",
                "product_id": "789e1234-e89b-12d3-a456-426614174002",
                "quantity": 2,
                "unit_price": 99.99
            }
        }


class OrderBase(BaseModel):
    """Base order model"""
    total_price: float = Field(..., gt=0, description="Total order price")
    status: str = Field(default="pending", description="Order status")


class OrderCreate(BaseModel):
    """Order creation schema"""
    items: List[OrderItemCreate] = Field(..., description="Order items")

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "product_id": "789e1234-e89b-12d3-a456-426614174002",
                        "quantity": 2,
                        "unit_price": 99.99
                    }
                ]
            }
        }


class Order(OrderBase):
    """Order response schema"""
    id: str = Field(..., description="Order ID")
    user_id: str = Field(..., description="User ID")
    items: Optional[List[OrderItem]] = Field(None, description="Order items")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "456e7890-e89b-12d3-a456-426614174001",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "total_price": 199.98,
                "status": "pending",
                "items": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "order_id": "456e7890-e89b-12d3-a456-426614174001",
                        "product_id": "789e1234-e89b-12d3-a456-426614174002",
                        "quantity": 2,
                        "unit_price": 99.99
                    }
                ]
            }
        }


class OrderListResponse(BaseModel):
    """Order list response schema"""
    orders: List[Order] = Field(..., description="List of orders")
    total: int = Field(..., description="Total number of orders")

    class Config:
        json_schema_extra = {
            "example": {
                "orders": [],
                "total": 0
            }
        }
