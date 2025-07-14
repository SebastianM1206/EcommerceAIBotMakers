from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List

from app.models.schemas import (
    HumanQueryRequest,
    HumanQueryResponse,
    ErrorResponse,
    HealthResponse
)
from app.services.query_processor import query_processor
from app.utils.logger import logger


router = APIRouter(prefix="/api/v1", tags=["queries"])


@router.post(
    "/query",
    response_model=HumanQueryResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    summary="Process natural language query",
    description="Converts a natural language query to SQL, executes it and returns a natural response"
)
async def process_human_query(request: HumanQueryRequest):
    """
    Processes a natural language query
    """
    try:

        if not request.human_query.strip():
            raise HTTPException(
                status_code=400,
                detail="Query cannot be empty"
            )

        result = await query_processor.process_human_query(request.human_query)

        if "error" in result:
            raise HTTPException(
                status_code=400,
                detail=result["error"]
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in process_human_query: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check health status",
    description="Checks the status of all services"
)
async def health_check():
    """
    Checks the system health status
    """
    try:
        health_status = await query_processor.get_health_status()

        response = HealthResponse(
            status=health_status["status"],
            message=health_status["message"],
            timestamp=datetime.now(),
            services=health_status["services"]
        )

        # Return appropriate HTTP status code
        status_code = 200 if health_status["status"] == "healthy" else 503

        return JSONResponse(
            status_code=status_code,
            content=response.dict()
        )

    except Exception as e:
        logger.error(f"Error in health check: {e}")
        error_response = HealthResponse(
            status="error",
            message=f"Error checking status: {str(e)}",
            timestamp=datetime.now(),
            services={"database": False, "llm": False}
        )

        return JSONResponse(
            status_code=503,
            content=error_response.dict()
        )

# Additional endpoint for system information


@router.get(
    "/info",
    summary="System information",
    description="Gets basic system information"
)
async def system_info():
    """
    Gets system information
    """
    return {
        "service": "Backend FastAPI con LLM",
        "version": "1.0.0",
        "llm_provider": "Google Gemini",
        "database_provider": "Supabase",
        "timestamp": datetime.now().isoformat(),
        "note": "This service requires real Supabase and Gemini configuration"
    }
