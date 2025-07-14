import time
from typing import Dict, Any, Optional
from app.services.database import database_service, DATABASE_SCHEMA
from app.services.llm import gemini_service
from app.models.schemas import HumanQueryResponse, ErrorResponse
from app.utils.logger import logger


class QueryProcessor:
    """Query processor that coordinates between LLM and database - Real data only"""

    def __init__(self):
        self.database = database_service
        self.llm = gemini_service

    async def process_human_query(self, human_query: str) -> Dict[str, Any]:
        """
        Processes a natural language query completely
        """
        start_time = time.time()

        try:
            await self._verify_services_configured()

            logger.info(f"Processing query: {human_query}")
            database_schema = DATABASE_SCHEMA

            sql_result = await self.llm.human_query_to_sql(human_query, database_schema)

            if not await self.validate_query_safety(sql_result.sql_query):
                return self._create_error_response(
                    "SQL query not allowed for security reasons",
                    "Only SELECT queries are allowed"
                )

            query_result = await self.database.execute_query(sql_result.sql_query)

            natural_answer = await self.llm.build_answer(query_result, human_query)

            execution_time = time.time() - start_time
            response = HumanQueryResponse(
                answer=natural_answer,
                sql_query=sql_result.sql_query,
                execution_time=execution_time
            )

            logger.info(
                f"Query processed successfully in {execution_time:.2f}s")
            return response.dict()

        except ValueError as e:
            # Configuration errors
            logger.error(f"Configuration error: {e}")
            return self._create_error_response(
                "Service not configured correctly",
                "Verify your Supabase and Gemini configuration in the .env file"
            )

        except ConnectionError as e:
            # Connection errors
            logger.error(f"Connection error: {e}")
            return self._create_error_response(
                "Connection error with services",
                "Verify your internet connectivity and credentials"
            )

        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return self._create_error_response(f"Error processing query: {str(e)}")

    async def _verify_services_configured(self):
        """Verifies that all necessary services are configured"""
        errors = []

        # Verify database configuration
        if not self.database.supabase:
            errors.append("Supabase is not configured")

        # Verify LLM configuration
        if not self.llm.model:
            errors.append("Gemini is not configured")

        if errors:
            error_msg = "Services not configured: " + ", ".join(errors)
            raise ValueError(error_msg)

    def _create_error_response(self, error_message: str, details: Optional[str] = None) -> Dict[str, Any]:
        """Creates a structured error response"""
        error_response = ErrorResponse(
            error=error_message,
            details=details
        )
        return error_response.dict()

    async def validate_query_safety(self, sql_query: str) -> bool:
        """
        Validates that the SQL query is safe (SELECT only)
        """
        try:
            # Clean and normalize the query
            cleaned_query = sql_query.strip().lower()

            # List of dangerous operations
            dangerous_operations = [
                'drop', 'delete', 'insert', 'update', 'alter', 'create',
                'truncate', 'grant', 'revoke', 'exec', 'execute'
            ]

            # Verify it doesn't contain dangerous operations
            for operation in dangerous_operations:
                if operation in cleaned_query:
                    logger.warning(
                        f"Dangerous query detected: {operation}")
                    return False

            # Verify it starts with SELECT
            if not cleaned_query.startswith('select'):
                logger.warning("Query is not a SELECT")
                return False

            return True

        except Exception as e:
            logger.error(f"Error validating query: {e}")
            return False

    async def get_health_status(self) -> Dict[str, Any]:
        """
        Gets the health status of all services
        """
        try:
            # Verify status of each service
            database_health = await self.database.health_check()
            llm_health = await self.llm.health_check()

            # Determine overall status
            overall_status = "healthy" if database_health and llm_health else "degraded"

            if not database_health and not llm_health:
                overall_status = "unhealthy"

            # Specific message based on configuration
            message = self._get_status_message(
                overall_status, database_health, llm_health)

            return {
                "status": overall_status,
                "services": {
                    "database": database_health,
                    "llm": llm_health
                },
                "message": message
            }

        except Exception as e:
            logger.error(f"Error getting health status: {e}")
            return {
                "status": "error",
                "services": {
                    "database": False,
                    "llm": False
                },
                "message": f"Error checking status: {str(e)}"
            }

    def _get_status_message(self, status: str, database_health: bool, llm_health: bool) -> str:
        """Generates a descriptive status message"""
        if status == "healthy":
            return "All services are working correctly"
        elif status == "degraded":
            problems = []
            if not database_health:
                problems.append("Supabase")
            if not llm_health:
                problems.append("Gemini")
            return f"Problems with: {', '.join(problems)}"
        elif status == "unhealthy":
            return "Critical services unavailable - check your configuration"
        else:
            return "Unknown system status"


# Instancia global del procesador de consultas
query_processor = QueryProcessor()
