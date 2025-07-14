from typing import List, Optional, Dict, Any
from supabase import Client
from app.services.database import database_service
from app.utils.logger import logger


class UserService:
    """Service to handle user operations with database"""

    def __init__(self):
        self.database = database_service

    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users from database"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return []

            result = self.database.supabase.table(
                'users').select('*').execute()
            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            result = self.database.supabase.table(
                'users').select('*').eq('email', email).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            result = self.database.supabase.table(
                'users').select('*').eq('id', user_id).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]

            return None

        except Exception as e:
            logger.error(f"Error getting user by ID {user_id}: {e}")
            return None

    async def login_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Login user by checking email and password"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            # Get user by email
            user = await self.get_user_by_email(email)

            if not user:
                logger.info(f"User not found with email: {email}")
                return None

            if user.get('password') == password:
                logger.info(f"Login successful for user: {email}")
                # Return user data without password
                user_data = {k: v for k, v in user.items() if k != 'password'}
                return user_data
            else:
                logger.info(f"Invalid password for user: {email}")
                return None

        except Exception as e:
            logger.error(f"Error during login for {email}: {e}")
            return None

    async def create_user(self, name: str, email: str, password: str, address: str = None) -> Optional[Dict[str, Any]]:
        """Create new user with role 'user'"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            existing_user = await self.get_user_by_email(email)
            if existing_user:
                logger.info(f"User already exists with email: {email}")
                return None

            user_data = {
                'name': name,
                'email': email,
                'password': password,
                'address': address,
                'role': 'user'  # Always 'user' for new registrations
            }

            result = self.database.supabase.table(
                'users').insert(user_data).execute()

            if result.data and len(result.data) > 0:
                created_user = result.data[0]
                # Return user data without password
                user_response = {k: v for k,
                                 v in created_user.items() if k != 'password'}
                logger.info(f"User created successfully: {email}")
                return user_response

            return None

        except Exception as e:
            logger.error(f"Error creating user {email}: {e}")
            return None

    async def update_user(self, user_id: str, name: str = None, email: str = None, address: str = None) -> Optional[Dict[str, Any]]:
        """Update user information"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return None

            update_data = {}
            if name is not None:
                update_data['name'] = name
            if email is not None:
                update_data['email'] = email
            if address is not None:
                update_data['address'] = address

            if not update_data:
                # No data to update, return current user
                return await self.get_user_by_id(user_id)

            result = self.database.supabase.table('users').update(
                update_data).eq('id', user_id).execute()

            if result.data and len(result.data) > 0:
                updated_user = result.data[0]
                # Return user data without password
                user_response = {k: v for k,
                                 v in updated_user.items() if k != 'password'}
                return user_response

            return None

        except Exception as e:
            logger.error(f"Error updating user {user_id}: {e}")
            return None

    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        try:
            if not self.database.supabase:
                logger.warning("Database not available")
                return False

            result = self.database.supabase.table(
                'users').delete().eq('id', user_id).execute()

            return len(result.data) > 0 if result.data else False

        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {e}")
            return False


user_service = UserService()
