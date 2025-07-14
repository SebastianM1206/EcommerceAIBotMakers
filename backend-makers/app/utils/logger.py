import logging
import sys
from datetime import datetime
from app.config import settings


class ColorFormatter(logging.Formatter):
    """Formatter con colores para la consola"""

    # Códigos de colores ANSI
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Verde
        'WARNING': '\033[33m',    # Amarillo
        'ERROR': '\033[31m',      # Rojo
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }

    def format(self, record):
        # Agregar color al nivel de log
        level_color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        record.levelname = f"{level_color}{record.levelname}{self.COLORS['RESET']}"

        return super().format(record)


def setup_logger():
    """Configura el logger global de la aplicación"""

    # Crear logger principal
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))

    # Limpiar handlers existentes
    logger.handlers.clear()

    # Formato de log
    log_format = "[%(asctime)s] %(levelname)s in %(name)s: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Handler para consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)

    if settings.DEBUG:
        # En modo debug, usar colores
        console_formatter = ColorFormatter(log_format, date_format)
    else:
        # En producción, formato simple
        console_formatter = logging.Formatter(log_format, date_format)

    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # Handler para archivo (opcional)
    try:
        file_handler = logging.FileHandler('app.log', encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        file_formatter = logging.Formatter(log_format, date_format)
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        pass

    # Silenciar logs de librerías externas si es necesario
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("supabase").setLevel(logging.WARNING)

    return logger


# Configurar logger al importar el módulo
logger = setup_logger()

# Función para obtener un logger específico


def get_logger(name: str) -> logging.Logger:
    """Obtiene un logger específico para un módulo"""
    return logging.getLogger(name)
