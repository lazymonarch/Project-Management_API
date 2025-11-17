# app/routers/users.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.enums import UserRole
from app.schemas.response import TaskListResponse, UserListResponse, UserResponse
from app.services.user_service import UserService
from app.utils.permissions import require_roles
from app.utils.response import success
from app.routers.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
    dependencies=[Depends(get_current_user)]
)


# -------------------------
# LIST USERS (FILTER + SEARCH + PAGINATION)
# -------------------------
@router.get("/", response_model=UserListResponse)
async def list_users(
    role: str | None = Query(None),
    search: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    users, pagination = await UserService.list_users(
        db=db,
        role=role,
        search=search,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit
    )

    return success("User list", {
        "data": users,
        "pagination": pagination
    })


# -------------------------
# GET USER BY ID
# -------------------------
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin, UserRole.manager)),
):
    user = await UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return success("User details", user)


# -------------------------
# CREATE USER
# -------------------------
@router.post("/", response_model=UserResponse)
async def create_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    user = await UserService.create_user(db, payload)
    return success("User created", user)


# -------------------------
# UPDATE USER
# -------------------------
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    updated = await UserService.update_user(db, user_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return success("User updated", updated)


# -------------------------
# DELETE USER
# -------------------------
@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    deleted = await UserService.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return success("User deleted", {"id": str(user_id)})


# -------------------------
# GET TASKS ASSIGNED TO USER
# -------------------------
@router.get("/{user_id}/tasks", response_model=TaskListResponse)
async def get_user_tasks(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    tasks = await UserService.get_tasks_for_user(db, user_id)
    return success("User tasks", tasks)


# -------------------------
# CHANGE USER ROLE
# -------------------------
class RoleUpdate(BaseModel):
    role: UserRole


@router.put("/{user_id}/role")
async def change_role(
    user_id: UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.admin)),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_role = user.role
    user.role = payload.role

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return success(
        "Role updated",
        {
            "id": str(user.id),
            "old_role": str(old_role),
            "new_role": str(user.role),
        },
    )