from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.models.schemas import Order, OrderCreate, OrderListResponse
from app.services.orders import order_service
from app.utils.logger import logger

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("/user/{user_id}", response_model=Order)
async def create_order(user_id: str, order_data: OrderCreate):
    """Create a new order"""
    try:

        validation_result = await order_service.validate_order_items([
            {
                'product_id': item.product_id,
                'quantity': item.quantity,
                'unit_price': item.unit_price
            }
            for item in order_data.items
        ])

        if not validation_result['valid']:
            if 'errors' in validation_result:
                raise HTTPException(
                    status_code=400,
                    detail=f"Order validation failed: {', '.join(validation_result['errors'])}"
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Order validation failed: {validation_result.get('error', 'Unknown error')}"
                )

        items_data = [
            {
                'product_id': item.product_id,
                'quantity': item.quantity,
                'unit_price': item.unit_price
            }
            for item in order_data.items
        ]

        order = await order_service.create_order(user_id, items_data)
        if not order:
            raise HTTPException(
                status_code=400,
                detail="Failed to create order"
            )

        return order

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in create_order endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/user/{user_id}", response_model=List[Order])
async def get_user_orders(user_id: str):
    """Get all orders for a specific user"""
    try:
        orders = await order_service.get_user_orders(user_id)
        return orders
    except Exception as e:
        logger.error(f"Error in get_user_orders endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get a specific order by ID"""
    try:
        order = await order_service.get_order_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_order endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/", response_model=List[Order])
async def get_all_orders():
    """Get all orders (admin only)"""
    try:
        orders = await order_service.get_all_orders()
        return orders
    except Exception as e:
        logger.error(f"Error in get_all_orders endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.put("/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status"""
    try:

        valid_statuses = ['pending', 'processing',
                          'shipped', 'delivered', 'cancelled']
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )

        updated_order = await order_service.update_order_status(order_id, status)
        if not updated_order:
            raise HTTPException(
                status_code=404,
                detail="Order not found or failed to update"
            )

        return {"message": f"Order status updated to {status}", "order": updated_order}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_order_status endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/validate", response_model=dict)
async def validate_order(order_data: OrderCreate):
    """Validate order items before creating order"""
    try:
        validation_result = await order_service.validate_order_items([
            {
                'product_id': item.product_id,
                'quantity': item.quantity,
                'unit_price': item.unit_price
            }
            for item in order_data.items
        ])

        return validation_result

    except Exception as e:
        logger.error(f"Error in validate_order endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
