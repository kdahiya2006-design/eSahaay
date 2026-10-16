"""
Main FastAPI entry point for eSahaay backend.
"""

import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.routes import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("esahaay")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Helpline Triage and Incident-Reporting Assistant for Women's Safety",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler to prevent leaking sensitive stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Processing Error",
            "message": "An error occurred during triage analysis. Operator review advised."
        }
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": "eSahaay API",
        "description": "Decision-support triage assistant for women's safety helplines",
        "status": "online",
        "docs_url": "/docs"
    }
