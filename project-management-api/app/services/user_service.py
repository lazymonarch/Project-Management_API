# app/services/user_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from fastapi import HTTPException, status
from uuid import uuid4, UUID 
from datetime import datetime

from app.models.user import User
from app.schemas.user import UserCreate, UserRegister
from app.models.enums import UserRole 
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token
)
from app.services.session_service import SessionService
from app.utils.pagination import paginate, build_pagination_metadata
from app.schemas.user import UserCreate, UserRegister, UserUpdate


class UserService:

    @staticmethod
    async def register_user(db: AsyncSession, user_data: UserRegister):
        """
        Handles public registration.
        Validates email/username and sets default role.
        """
        # Check unique email
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered")

        # Check unique username
        result = await db.execute(select(User).where(User.username == user_data.username))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Username already taken")

        # Create new user
        new_user = User(
            id=uuid4(), 
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            password_hash=hash_password(user_data.password),
            role=UserRole.developer  
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate):
        """
        Handles user creation by an admin.
        """
        # Check unique email
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered")

        # Check unique username
        result = await db.execute(select(User).where(User.username == user_data.username))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Username already taken")

        # Create new user
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            password_hash=hash_password(user_data.password),
            role=user_data.role,
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user
    
    @staticmethod
    async def update_user(db: AsyncSession, user_id: UUID, data: UserUpdate):
        # 1. Find user
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return None

        # 2. Update fields if provided
        if data.full_name is not None:
            user.full_name = data.full_name
        
        if data.role is not None:
            # Optional: Prevent changing own role or changing TO admin if not allowed
            # But for now, we trust the router's permission check (Admin Only)
            user.role = data.role

        # 3. Commit
        user.updated_at = datetime.now() 
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user

    @staticmethod
    async def authenticate(
        db: AsyncSession,
        email: str,
        password: str,
        device_name: str = "unknown",
        device_os: str = "unknown",
        user_agent: str = "unknown",
        ip: str = "unknown",
    ):
        # Fetch user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.is_active:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Please contact admin."
            )

        refresh_token = str(uuid4())
        session = await SessionService.create_session(
            db=db,
            user_id=user.id,
            refresh_token=refresh_token,
            device_name=device_name,
            device_os=device_os,
            user_agent=user_agent,
            ip=ip,
        )
        access_token = create_access_token({
            "user_id": str(user.id),
            "session_id": str(session.id)
        })

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "session_id": session.id,
            "token_type": "bearer"
        }

    
    @staticmethod
    async def get_users(db, page: int, limit: int):
        skip, limit = paginate(page, limit)

        # total count
        total = await db.scalar(select(func.count()).select_from(User))

        # page
        result = await db.execute(
            select(User)
            .offset(skip)
            .limit(limit)
            .order_by(User.created_at.desc())
        )
        users = result.scalars().all()

        metadata = build_pagination_metadata(page, limit, total)
        return users, metadata
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: UUID):
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_users(
        db: AsyncSession,
        role: str | None = None,
        search: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        page: int = 1,
        limit: int = 20
    ):
        skip, limit = paginate(page, limit)

        conditions = []

        if role:
            conditions.append(User.role == role)

        if search:
            like = f"%{search.lower()}%"
            conditions.append(
                or_(
                    func.lower(User.username).like(like),
                    func.lower(User.full_name).like(like),
                    func.lower(User.email).like(like),
                )
            )

        if date_from:
            conditions.append(User.created_at >= date_from)

        if date_to:
            conditions.append(User.created_at <= date_to)

        # Count
        count_query = select(func.count()).select_from(User)
        if conditions:
            count_query = count_query.where(*conditions)
        total = await db.scalar(count_query)

        # Fetch users
        query = (
            select(User)
            .where(*conditions)
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        users = result.scalars().all()

        pagination = build_pagination_metadata(page, limit, total)

        return users, pagination