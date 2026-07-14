import uuid
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.tenant import TenantContextError
from app.api.v1 import auth, admin, academic

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standardized Error Exception Handlers
@app.exception_handler(TenantContextError)
async def tenant_context_error_handler(request: Request, exc: TenantContextError):
    trace_id = str(uuid.uuid4())
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "TenantContextError",
            "code": "MISSING_TENANT_CONTEXT",
            "message": str(exc),
            "details": [],
            "trace_id": trace_id
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    trace_id = str(uuid.uuid4())
    details = []
    for err in exc.errors():
        field_path = " -> ".join(str(loc) for loc in err.get("loc", []))
        details.append({
            "field": field_path,
            "message": err.get("msg", "Validation error")
        })
        
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "code": "VALIDATION_FAILED",
            "message": "Input validation failed. Please check the details field.",
            "details": details,
            "trace_id": trace_id
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    trace_id = str(uuid.uuid4())
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred on the server.",
            "details": [{"message": str(exc)}],
            "trace_id": trace_id
        }
    )

# Register Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Super Admin"])
app.include_router(academic.router, prefix=f"{settings.API_V1_STR}/academic", tags=["Academics"])

@app.get("/")
async def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API Gateway",
        "docs": "/docs",
        "version": "1.0.0"
    }
