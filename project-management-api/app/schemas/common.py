# app/schemas/common.py

from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar("T")


class Pagination(BaseModel):
    page: int
    limit: int
    total: int
    pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    pagination: Pagination
