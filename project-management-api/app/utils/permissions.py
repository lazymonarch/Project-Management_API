# app/utils/permissions.py

from collections.abc import Iterable

from fastapi import Depends, HTTPException, status

from app.models.enums import UserRole
from app.models.user import User
from app.routers.auth import get_current_user


def _normalize_roles(roles: tuple) -> set[str]:
    normalized: set[str] = set()

    for role in roles:
        items: Iterable = role if isinstance(role, Iterable) and not isinstance(role, (str, UserRole)) else (role,)
        for item in items:
            if isinstance(item, UserRole):
                normalized.add(item.value)
            else:
                normalized.add(str(item))
    return normalized


def require_roles(*allowed_roles):
    """Dependency to restrict access by user role and return the current user."""

    normalized = _normalize_roles(allowed_roles)

    async def checker(current_user: User = Depends(get_current_user)):
        role_value = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
        if role_value not in normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied",
            )
        return current_user

    return checker
