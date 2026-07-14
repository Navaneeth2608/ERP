from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")

class PaginationMetadata(BaseModel):
    page: int
    limit: int
    total: int
    pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: PaginationMetadata

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str

class ErrorResponse(BaseModel):
    error: str
    code: str
    message: str
    details: List[ErrorDetail] = []
    trace_id: Optional[str] = None
