# app/utils/pagination.py

from math import ceil

def paginate(page: int = 1, limit: int = 20):
    """
    Converts page & limit into offset/limit for SQL queries.
    Ensures limits are safe.
    """
    if page < 1:
        page = 1
    
    # Prevent heavy DB loads
    if limit < 1 or limit > 100:
        limit = 20

    skip = (page - 1) * limit
    return skip, limit


def build_pagination_metadata(page: int, limit: int, total: int):
    """
    Returns pagination metadata in the format required by the project spec.
    """
    total_pages = ceil(total / limit) if limit > 0 else 1

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "pages": total_pages,
    }
