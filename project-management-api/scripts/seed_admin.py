import asyncio
from uuid import uuid4

from sqlalchemy import text
from app.database import AsyncSessionLocal, engine
from app.models.user import User
from app.models.enums import UserRole
from app.utils.auth import hash_password


async def seed_admin():
    print("🔍 Checking for existing admin...")

    # Create an async session manually (outside dependency system)
    async with AsyncSessionLocal() as session:
        # Check if admin already exists
        result = await session.execute(
            text("SELECT id FROM users WHERE role = 'admin' LIMIT 1;")
        )
        existing_admin = result.first()

        if existing_admin:
            print("✔️ Admin already exists. No action taken.")
            return

        print("⚠️ No admin found. Creating first admin user...")

        admin = User(
            id=uuid4(),
            email="admin@gmail.com",
            username="admin",
            full_name="Administrator",
            password_hash=hash_password("password123"),
            role=UserRole.admin,
        )

        session.add(admin)
        await session.commit()
        await session.refresh(admin)

        print("\n🎉 ADMIN CREATED SUCCESSFULLY")
        print("=====================================")
        print(" Email: admin@gmail.com")
        print(" Username: admin")
        print(" Password: password123")
        print("=====================================")
        print("👉 Change this password ASAP in production.\n")


if __name__ == "__main__":
    asyncio.run(seed_admin())
