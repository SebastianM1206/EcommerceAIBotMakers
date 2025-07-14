from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import Product, ProductCreate, ProductUpdate, ProductListResponse
from app.services.products import product_service
from app.utils.logger import logger

router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.get("/", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Products per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(
        None, description="Search in name, brand, description"),
    is_on_sale: Optional[bool] = Query(
        None, description="Filter products on sale"),
    is_new: Optional[bool] = Query(None, description="Filter new products")
):
    """Get all products with pagination and filters"""
    try:
        return await product_service.get_products(
            page=page,
            limit=limit,
            category=category,
            search=search,
            is_on_sale=is_on_sale,
            is_new=is_new
        )
    except Exception as e:
        logger.error(f"Error in get_products endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/featured", response_model=List[Product])
async def get_featured_products(
    limit: int = Query(
        8, ge=1, le=20, description="Maximum number of featured products")
):
    """Get featured products (new or on sale)"""
    try:
        return await product_service.get_featured_products(limit=limit)
    except Exception as e:
        logger.error(f"Error in get_featured_products endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/categories", response_model=List[str])
async def get_categories():
    """Get all available product categories"""
    try:
        return await product_service.get_categories()
    except Exception as e:
        logger.error(f"Error in get_categories endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get a specific product by ID"""
    try:
        product = await product_service.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_product endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/", response_model=Product)
async def create_product(product_data: ProductCreate):
    """Create a new product"""
    try:
        product = await product_service.create_product(product_data)
        if not product:
            raise HTTPException(
                status_code=400, detail="Failed to create product")
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_product endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate):
    """Update an existing product"""
    try:
        existing_product = await product_service.get_product_by_id(product_id)
        if not existing_product:
            raise HTTPException(status_code=404, detail="Product not found")

        updated_product = await product_service.update_product(product_id, product_data)
        if not updated_product:
            raise HTTPException(
                status_code=400, detail="Failed to update product")

        return updated_product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_product endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/{product_id}")
async def delete_product(product_id: str):
    """Delete a product"""
    try:
        existing_product = await product_service.get_product_by_id(product_id)
        if not existing_product:
            raise HTTPException(status_code=404, detail="Product not found")

        success = await product_service.delete_product(product_id)
        if not success:
            raise HTTPException(
                status_code=400, detail="Failed to delete product")

        return {"message": "Product deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_product endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{product_id}/update-stock")
async def update_product_stock(
    product_id: str,
    new_stock: int = Query(..., ge=0, description="New stock quantity")
):
    """Update product stock quantity"""
    try:
        existing_product = await product_service.get_product_by_id(product_id)
        if not existing_product:
            raise HTTPException(status_code=404, detail="Product not found")

        success = await product_service.update_stock(product_id, new_stock)
        if not success:
            raise HTTPException(
                status_code=400, detail="Failed to update stock")

        return {"message": f"Stock updated successfully to {new_stock}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_product_stock endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")
