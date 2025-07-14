from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import time

from app.config import settings
from app.routes.queries import router as queries_router
from app.routes.products import router as products_router
from app.routes.users import router as users_router
from app.routes.orders import router as orders_router
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    logger.info("Starting FastAPI application")
    logger.info(f"Configuration: DEBUG={settings.DEBUG}")
    logger.info(f"Supabase configured: {settings.supabase_configured}")
    logger.info(f"Gemini configured: {settings.gemini_configured}")

    yield

    # Shutdown
    logger.info("Shutting down FastAPI application")


app = FastAPI(
    title="FastAPI Backend with LLM",
    description="API to process natural language queries using Gemini and Supabase",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(queries_router)
app.include_router(products_router)
app.include_router(users_router)
app.include_router(orders_router)

# Root endpoint


@app.get("/", tags=["root"])
async def root():
    """Welcome endpoint"""
    return {
        "message": "FastAPI Backend with LLM working correctly",
        "service": "FastAPI Backend with LLM",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

# Global error handler


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled error: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "details": str(exc) if settings.DEBUG else "Contact administrator"
        }
    )

# Middleware para logging de requests


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware para logging de todas las requests"""
    start_time = time.time()

    # Procesar request
    response = await call_next(request)

    # Calcular tiempo de procesamiento
    process_time = time.time() - start_time

    # Log de la request
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )

    return response

# Función para ejecutar el servidor


def run_server():
    """Ejecuta el servidor FastAPI"""
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )


if __name__ == "__main__":
    run_server()
