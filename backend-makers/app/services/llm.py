import json
import asyncio
from typing import Optional, Dict, Any
import google.generativeai as genai
from app.config import settings
from app.utils.logger import logger
from app.models.schemas import SQLQueryResult


class GeminiService:
    """Service to interact with Gemini LLM"""

    def __init__(self):
        self.model = None
        self._initialize_client()

    def _initialize_client(self):
        """Initializes the Gemini client"""
        if not settings.gemini_configured:
            logger.error(
                "Gemini is NOT configured. This service requires real configuration.")
            logger.error("Configure GEMINI_API_KEY in your .env file")
            raise ValueError("Gemini is not configured correctly")

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            logger.info(
                f"Gemini client initialized successfully (Model: {settings.GEMINI_MODEL})")

        except Exception as e:
            logger.error(f"Error initializing Gemini: {e}")
            raise ConnectionError(f"Could not connect to Gemini: {e}")

    async def human_query_to_sql(self, human_query: str, database_schema: str) -> Optional[SQLQueryResult]:
        """
        Converts a natural language query to SQL using Gemini
        """
        if not self.model:
            raise ConnectionError("Gemini client not initialized")

        try:
            logger.info(f"Processing query with Gemini: {human_query}")

            system_prompt = f"""
You are an expert in PostgreSQL databases for an e-commerce system. Your task is to understand customer queries given in natural format and transform them into SQL that can answer them.

IMPORTANT RULES:
- Return ONLY a valid JSON object
- Do not include additional text before or after the JSON
- Do NOT include semicolons at the end of SQL statements
- Use ONLY the tables and columns listed below
- Generate valid and efficient SQL for PostgreSQL
- Use proper table aliases when joining tables
- For product recommendations, focus on products table with relevant filters
- For user queries, use the users table
- For order queries, join orders with order_items and products
- categories (Accessories, Smartphones, Laptops, Audio)

DATABASE SCHEMA:
{database_schema}

REQUIRED RESPONSE FORMAT:
{{
    "sql_query": "SELECT * FROM users WHERE role = 'admin';",
    "original_query": "user's original query",
    "confidence": 0.95
}}

USER QUERY: {human_query}
            """

            response = self.model.generate_content(system_prompt)

            if not response.text:
                logger.error("Empty response from Gemini")
                raise Exception("Gemini did not generate a response")

            logger.info(
                f"Gemini response received: {len(response.text)} characters")

            # Clean the response and extract JSON
            cleaned_response = self._clean_json_response(response.text)
            result_dict = json.loads(cleaned_response)

            # Validar estructura de respuesta
            if "sql_query" not in result_dict:
                raise ValueError("Respuesta de Gemini no contiene 'sql_query'")

            sql_result = SQLQueryResult(
                sql_query=result_dict.get("sql_query", ""),
                original_query=result_dict.get("original_query", human_query),
                confidence=result_dict.get("confidence", 0.5)
            )

            logger.info(f"SQL generated successfully: {sql_result.sql_query}")
            return sql_result

        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON from Gemini: {e}")
            logger.error(
                f"Response received: {response.text if 'response' in locals() else 'No response'}")
            raise Exception(f"Error in Gemini response format: {e}")

        except Exception as e:
            logger.error(f"Error in human_query_to_sql: {e}")
            raise Exception(f"Error processing query with Gemini: {e}")

    def _clean_json_response(self, response_text: str) -> str:
        """Cleans Gemini response to extract only JSON"""
        try:
            # Find JSON within the text
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx == -1 or end_idx == 0:
                raise ValueError("No valid JSON found in response")

            json_str = response_text[start_idx:end_idx]

            # Clean problematic characters
            json_str = json_str.replace('```json', '').replace('```', '')
            json_str = json_str.strip()

            return json_str

        except Exception as e:
            logger.error(f"Error cleaning JSON response: {e}")
            raise

    async def build_answer(self, query_result: list, human_query: str) -> Optional[str]:
        """
        Builds a natural language response based on results
        """
        if not self.model:
            raise ConnectionError("Gemini client not initialized")

        try:
            logger.info(
                f"Generating natural response for {len(query_result)} results")

            # Limit data amount to avoid excessive tokens
            limited_result = query_result[:10] if len(
                query_result) > 10 else query_result

            system_prompt = f"""
You are an ecommerce assistant that generates natural language responses based on your ecommerce stock.

INSTRUCTIONS:
- Respond in English naturally and conversationally
- Be concise but informative
- If there's no data, explain it in a friendly way (No stock available)
- Include relevant information from the data (names, prices, quantities, etc.)
- Use a professional but approachable tone
- For products, mention names, prices, and availability when relevant
- For users, mention general information without sensitive data
- For orders, include totals and statuses
-DOES NOT use special formatting like *, **, etc.

ORIGINAL QUESTION: {human_query}

DATABASE DATA:
{json.dumps(limited_result, indent=2, ensure_ascii=False, default=str)}

Generate a natural and helpful response based on this data:
            """

            response = self.model.generate_content(system_prompt)

            if not response.text:
                logger.error("Empty response from Gemini for build_answer")
                raise Exception(
                    "Gemini did not generate a response for build_answer")

            answer = response.text.strip()
            logger.info(
                f"Natural response generated: {len(answer)} characters")
            return answer

        except Exception as e:
            logger.error(f"Error in build_answer: {e}")
            raise Exception(f"Error generating natural response: {e}")

    async def health_check(self) -> bool:
        """Verifies connection with Gemini"""
        if not self.model:
            return False

        try:
            # Make a simple query to verify connection
            response = self.model.generate_content(
                "Respond 'OK' if the service works correctly")
            is_working = bool(response.text and "ok" in response.text.lower())

            if is_working:
                logger.info("Gemini connection verified")
            else:
                logger.warning(
                    "Gemini responds but the response is unexpected")

            return is_working

        except Exception as e:
            logger.error(f"Error in Gemini health check: {e}")
            return False


# Instancia global del servicio de Gemini
gemini_service = GeminiService()
