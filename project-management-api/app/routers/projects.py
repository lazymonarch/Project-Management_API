# app/routers/projects.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.schemas.response import (
    ProjectPublic,
    ProjectListResponse,
    ProjectSummaryResponse,
    SuccessResponse
)
from app.services.project_service import ProjectService
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.enums import UserRole
from app.utils.permissions import require_roles
from app.utils.response import success


router = APIRouter(
    prefix="/api/v1/projects",
    tags=["Projects"],
    dependencies=[Depends(get_current_user)]
)


# -------------------------
# CREATE PROJECT (Managers Only)
# -------------------------
@router.post("/", response_model=SuccessResponse)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.manager))
):
    project = await ProjectService.create_project(db, payload, current_user.id)
    return success("Project created successfully", {"data": project})


# -------------------------
# GET PROJECT BY ID
# -------------------------
@router.get("/{project_id}", response_model=SuccessResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await ProjectService.get_project(db, project_id)
    await ProjectService.ensure_project_access(db, project, current_user)
    return success("Project details", {"data": project})


# -------------------------
# UPDATE PROJECT (Owner Manager Only)
# -------------------------
@router.put("/{project_id}", response_model=SuccessResponse)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.manager))
):
    project = await ProjectService.get_project(db, project_id)
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this project."
        )

    project = await ProjectService.update_project(db, project_id, payload)
    return success("Project updated successfully", {"data": project})


# -------------------------
# DELETE PROJECT (Owner Manager Only)
# -------------------------
@router.delete("/{project_id}", response_model=SuccessResponse)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.manager))
):
    project = await ProjectService.get_project(db, project_id)

    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this project."
        )

    await ProjectService.delete_project(db, project_id)
    return success("Project deleted successfully")


# -------------------------
# LIST PROJECTS
# -------------------------
@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    status: str | None = Query(None),
    search: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Service handles filtering:
    # - Admins see ALL
    # - Managers see ONLY theirs
    # - Devs see ONLY assigned
    projects, pagination = await ProjectService.list_projects(
        db=db,
        status=status,
        search=search,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
        current_user=current_user
    )

    return {
        "message": "Project list",
        "data": projects,
        "pagination": pagination
    }


# -------------------------
# PROJECT SUMMARY
# -------------------------
@router.get("/{project_id}/summary", response_model=ProjectSummaryResponse)
async def get_project_summary(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure existence and access first
    project = await ProjectService.get_project(db, project_id)
    await ProjectService.ensure_project_access(db, project, current_user)

    summary = await ProjectService.get_project_summary(db, project_id)
    if not summary:
         raise HTTPException(status_code=404, detail="Project not found")

    return success("Project summary", {"data": summary})