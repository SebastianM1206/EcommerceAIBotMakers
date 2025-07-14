#!/usr/bin/env python3
"""
Script alternativo para ejecutar el servidor FastAPI
"""

from app.main import run_server
import sys
import os

# Agregar la carpeta raíz al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


if __name__ == "__main__":

    try:
        run_server()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        sys.exit(1)
