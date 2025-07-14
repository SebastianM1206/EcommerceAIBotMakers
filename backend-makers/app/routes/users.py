from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import User, UserCreate, UserLogin, UserUpdate
from app.services.users import user_service
from app.utils.logger import logger

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.post("/login", response_model=User)
async def login(user_data: UserLogin):
    """Login user with email and password"""
    try:
        user = await user_service.login_user(user_data.email, user_data.password)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/register", response_model=User)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:

        existing_user = await user_service.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )

        user = await user_service.create_user(
            name=user_data.name,
            email=user_data.email,
            password=user_data.password,
            address=user_data.address
        )
        if not user:
            raise HTTPException(
                status_code=400,
                detail="Failed to create user"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/", response_model=List[User])
async def get_users():
    """Get all users (admin only)"""
    try:
        users = await user_service.get_all_users()
        return users
    except Exception as e:
        logger.error(f"Error in get_users endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get a specific user by ID"""
    try:
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_user endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.put("/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate):
    """Update an existing user"""
    try:
        existing_user = await user_service.get_user_by_id(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")
        if user_data.email and user_data.email != existing_user.email:
            email_exists = await user_service.get_user_by_email(user_data.email)
            if email_exists:
                raise HTTPException(
                    status_code=400,
                    detail="User with this email already exists"
                )

        updated_user = await user_service.update_user(
            user_id=user_id,
            name=user_data.name,
            email=user_data.email,
            address=user_data.address
        )
        if not updated_user:
            raise HTTPException(
                status_code=400,
                detail="Failed to update user"
            )

        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_user endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    try:
        existing_user = await user_service.get_user_by_id(user_id)
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found")

        success = await user_service.delete_user(user_id)
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to delete user"
            )

        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_user endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/email/{email}", response_model=User)
async def get_user_by_email(email: str):
    """Get a user by email"""
    try:
        user = await user_service.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_user_by_email endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
