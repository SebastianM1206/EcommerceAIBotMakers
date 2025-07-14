import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application configuration"""

    # Server configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"

    # Supabase configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # Gemini configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # Logging configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # CORS configuration
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

    @property
    def supabase_configured(self) -> bool:
        """Checks if Supabase is configured"""
        return bool(self.SUPABASE_URL and self.SUPABASE_KEY)

    @property
    def gemini_configured(self) -> bool:
        """Checks if Gemini is configured"""
        return bool(self.GEMINI_API_KEY)


# Instancia global de configuración
settings = Settings()
