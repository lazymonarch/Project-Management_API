# 🚀 Project Management System (TaskFlow)

> A modern, production-grade project management platform built with FastAPI and Next.js 15

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

TaskFlow demonstrates **real-world full-stack engineering**: backend APIs, frontend UI, RBAC, sessions, soft deletes, token refresh flows, project/task pipelines, and production-aligned system design. This is no longer a demo — it behaves like a **real SaaS project** with proper guardrails, security patterns, and lifecycle management.

---

## ✨ What Makes TaskFlow Different

🔐 **Hardened Security** - JWT with refresh rotation, XSS-safe token storage, session tracking  
👥 **Strict RBAC** - Three-tier permission system with enforced boundaries  
🛡️ **Safe Admin Controls** - Soft deletes, admin protection, duplicate prevention  
📁 **Manager Workflows** - Own and manage projects with full team assignment  
📌 **Developer Focus** - Clean "My Tasks" interface with status updates  
🎨 **Production-Ready UI** - Built with Next.js 15 App Router and shadcn/ui  
⚡ **Async-First Backend** - FastAPI with SQLAlchemy 2.0 async operations

---

## 🧩 Roles & Capabilities

| Feature         | 👑 Admin                     | 💼 Manager                   | 🧑‍💻 Developer    |
| --------------- | ---------------------------- | ---------------------------- | ---------------- |
| Authentication  | Login/Logout                 | Register/Login               | Register/Login   |
| User Management | Full control (Edit/Disable)  | ❌                            | ❌                |
| Projects        | Read-only audit              | Create / Edit / Delete (Own) | View assigned    |
| Tasks           | View-only                    | Create / Assign              | Update own       |
| Dashboard       | Admin Panel                  | Project Hub                  | My Tasks         |
| Permissions     | Cannot modify other admins   | Own projects only            | Own tasks only   |

---

## 🎯 Key Features

### 🔐 Authentication & Security

- **Manual Login Flow** - No auto-login after registration for enhanced security
- **Memory-Only Access Tokens** - XSS-safe pattern prevents token theft
- **Refresh Token Rotation** - Stored in localStorage with automatic retry
- **Session Management** - Multi-device tracking with logout-from-all capability
- **User Blocking** - Soft disable via `is_active=False` flag
- **Duplicate Prevention** - Enforced unique emails and usernames
- **Smart Error Handling** - Clean parsing for backend validation errors

### 👑 Admin Panel

```typescript
// Admin capabilities
✓ View all users with Role + Status indicators
✓ Soft delete (Disable user) instead of hard delete
✓ Prevent editing or disabling other admin accounts
✓ Read-only access to all projects for audit
✓ System-wide statistics and monitoring
```

### 💼 Manager Workflows

- **Project Ownership** - Create, edit, and delete your own projects
- **Project Hub Interface**:
  - Settings panel for project configuration
  - Task list with filtering and search
  - Create Task modal with assignment
  - Developer team management
- **Clean List View** - Focused on productivity (Kanban removed for clarity)

### 🧑‍💻 Developer Workflows

- **"My Tasks" Dashboard** - Personalized task view
- **Status Pipeline**: `Todo → In Progress → Done`
- **Assignment-Based Access** - Only see your assigned tasks
- **Quick Status Updates** - One-click status changes
- **Task Details** - Full context for each assignment

### 🧱 Backend Architecture

```python
# Production-ready patterns
✓ Pydantic v2 with from_attributes=True
✓ Enforced Enum for status/priority consistency
✓ Centralized permissions layer
✓ Clear 401/403 error boundaries
✓ Service layer separation
✓ Async database operations
✓ Type-safe API responses
```

---

## 📁 Project Structure

```
Project-Management/
│
├── 📂 my-saas-frontend/                # Next.js 15 Frontend
│   ├── 📂 app/
│   │   ├── 📂 (app)/                   # 🔒 Authenticated Area
│   │   │   ├── dashboard/              # Main dashboard
│   │   │   └── layout.tsx              # Protected layout
│   │   ├── 📂 (auth)/                  # 🔓 Public Area
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── 📂 admin/                   # 👑 Admin Only
│   │   │   ├── page.tsx                # Admin dashboard
│   │   │   ├── users/                  # User management
│   │   │   └── projects/               # Project audit
│   │   ├── 📂 projects/                # 💼 Manager Views
│   │   │   ├── [id]/                   # Project hub
│   │   │   └── create/                 # New project
│   │   ├── 📂 tasks/                   # 🧑‍💻 Developer Views
│   │   │   └── page.tsx                # My tasks list
│   │   ├── 📂 api/
│   │   │   └── auth/                   # Session refresh endpoint
│   │   ├── providers.tsx               # Auth context provider
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── 📂 components/
│   │   ├── AuthForm.tsx                # Login/Register form
│   │   ├── ProtectedClientWrapper.tsx  # Route protection
│   │   └── ui/                         # shadcn/ui components
│   ├── 📂 lib/                         # Core Logic
│   │   ├── auth.ts                     # Auth context & hooks
│   │   ├── fetcher.ts                  # API client with auto-refresh
│   │   ├── tokenManager.ts             # Token storage & retrieval
│   │   ├── hooks/                      # Custom React hooks
│   │   └── utils.ts                    # Helper functions
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   └── 📄 .env.local
│
└── 📂 project-management-api/          # FastAPI Backend
    ├── 📂 app/
    │   ├── 📄 main.py                  # Application entry point
    │   ├── 📄 config.py                # Environment configuration
    │   ├── 📄 database.py              # Async DB setup
    │   ├── 📂 models/                  # SQLAlchemy Models
    │   │   ├── user.py
    │   │   ├── project.py
    │   │   ├── task.py
    │   │   └── session.py
    │   ├── 📂 schemas/                 # Pydantic Schemas
    │   │   ├── user.py
    │   │   ├── project.py
    │   │   ├── task.py
    │   │   └── auth.py
    │   ├── 📂 routers/                 # API Routes
    │   │   ├── auth.py
    │   │   ├── users.py
    │   │   ├── projects.py
    │   │   ├── tasks.py
    │   │   └── stats.py
    │   ├── 📂 services/                # Business Logic
    │   │   ├── auth_service.py
    │   │   ├── user_service.py
    │   │   ├── project_service.py
    │   │   └── session_service.py
    │   └── 📂 utils/                   # Utilities
    │       ├── jwt.py                  # Token generation
    │       ├── device.py               # Device detection
    │       ├── permissions.py          # RBAC helpers
    │       └── pagination.py           # Query pagination
    ├── 📂 alembic/                     # Database Migrations
    ├── 📂 scripts/
    │   └── seed_admin.py               # Admin user seeder
    ├── 📄 requirements.txt
    ├── 📄 docker-compose.yml
    ├── 📄 .env
    └── 📄 README.md
```

---

## 🚀 Quick Start

### Prerequisites

```bash
Python 3.11+
Node.js 18+
Docker & Docker Compose
Git
```

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/lazymonarch/Project-Management_API.git
cd Project-Management_API
```

### 2️⃣ Start PostgreSQL Database

```bash
cd project-management-api
docker-compose up -d
```

**docker-compose.yml:**
```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: lakshan
      POSTGRES_PASSWORD: root
      POSTGRES_DB: taskflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 3️⃣ Setup Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

**Configure .env:**
```env
# Database
DATABASE_URL=postgresql+asyncpg://lakshan:root@localhost:5432/taskflow

# Security
SECRET_KEY=your_super_secret_key_change_this_in_production_minimum_32_characters
ALGORITHM=HS256

# Access token expires in memory (no expiry stored)
# Refresh token valid for 7 days
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

```bash
# Run migrations
alembic upgrade head

# Seed admin user
python scripts/seed_admin.py

# Start server
uvicorn app.main:app --reload
```

✅ **Backend running at:** [http://localhost:8000](http://localhost:8000)  
📚 **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)  
📖 **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4️⃣ Setup Frontend

```bash
cd ../my-saas-frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

**Configure .env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
# Start development server
npm run dev
```

✅ **Frontend running at:** [http://localhost:3000](http://localhost:3000)

---

## 🔑 Default Admin Credentials

```
📧 Email:    admin@example.com
🔒 Password: admin123
```

> ⚠️ **Security Warning:** Change these credentials immediately in production!

---

## 📡 API Reference

### 🔐 Authentication

```http
POST   /auth/register          # Create new account
POST   /auth/login             # Login and get tokens
POST   /auth/refresh           # Refresh access token
POST   /auth/logout            # Logout current session
POST   /auth/logout-all        # Logout all devices
GET    /auth/sessions          # List active sessions
DELETE /auth/sessions/{id}     # Delete specific session
```

**Example Login Request:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 👥 Users (Admin Only)

```http
GET    /users                  # List all users (paginated)
GET    /users/{id}             # Get user details
PUT    /users/{id}             # Update user
PATCH  /users/{id}/disable     # Disable user (soft delete)
GET    /users/search?q=john    # Search users
```

### 📁 Projects (Manager + Admin)

```http
GET    /projects               # List projects (role-filtered)
POST   /projects               # Create new project (Manager)
GET    /projects/{id}          # Get project details
PUT    /projects/{id}          # Update project (Owner only)
DELETE /projects/{id}          # Delete project (Owner only)
GET    /projects/search        # Search projects
```

**Example Create Project:**
```json
{
  "name": "TaskFlow Redesign",
  "description": "Modern UI overhaul",
  "status": "active",
  "start_date": "2025-01-01",
  "end_date": "2025-06-30"
}
```

### 📌 Tasks (Manager & Developer)

```http
POST   /tasks                  # Create task (Manager)
GET    /tasks                  # List tasks (role-filtered)
GET    /tasks/{id}             # Get task details
PUT    /tasks/{id}             # Update task
PATCH  /tasks/{id}/status      # Update status (Developer)
DELETE /tasks/{id}             # Delete task (Manager)
```

**Task Status Flow:**
```
todo → in_progress → done
```

### 📊 Statistics

```http
GET    /stats/dashboard        # Dashboard overview
GET    /stats/tasks            # Task analytics
GET    /stats/projects         # Project metrics
```

---

## 🏗️ Architecture Decisions

### Frontend Authentication Pattern

```typescript
// Memory-only access token (XSS protection)
const accessToken = useAuthStore(state => state.accessToken);

// Persistent storage for refresh
localStorage.setItem('refreshToken', token);
localStorage.setItem('sessionId', id);

// Auto-refresh with backendFetch
const response = await backendFetch('/api/endpoint', {
  method: 'GET',
  // Automatically adds: Authorization: Bearer {accessToken}
  // Automatically refreshes on 401
});
```

**Key Benefits:**
- ✅ No hydration mismatches (pure client-side)
- ✅ XSS protection (access token never in localStorage)
- ✅ Automatic token refresh
- ✅ Clean error handling
- ✅ Type-safe responses

### Backend Service Layer Pattern

```python
# Service layer handles business logic
class ProjectService:
    @staticmethod
    async def create_project(
        db: AsyncSession,
        project_data: ProjectCreate,
        owner: User
    ) -> Project:
        # Validate permissions
        if owner.role != Role.MANAGER:
            raise HTTPException(403, "Only managers can create projects")
        
        # Business logic
        project = Project(**project_data.dict(), owner_id=owner.id)
        db.add(project)
        await db.commit()
        
        return project
```

**Architecture Benefits:**
- ✅ Separation of concerns
- ✅ Testable business logic
- ✅ Reusable across routes
- ✅ Clear permission boundaries
- ✅ Type-safe operations

---

## 🧪 Testing

### Backend Tests

```bash
cd project-management-api

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py -v
```

### Frontend Tests

```bash
cd my-saas-frontend

# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

---

## 🚢 Deployment Guide

### Backend Deployment (Railway/Render/Fly.io)

```bash
# 1. Set environment variables
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
SECRET_KEY=production_secret_min_32_chars
ALGORITHM=HS256

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations
alembic upgrade head

# 4. Start with production server
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
```

### Frontend Deployment (Vercel/Netlify)

```bash
# 1. Set environment variable
NEXT_PUBLIC_API_URL=https://your-backend-url.com

# 2. Build
npm run build

# 3. Deploy (automatic on push with Vercel)
```

**Vercel Configuration (vercel.json):**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

---

## 📈 Roadmap & Future Enhancements

- [ ] 🗂️ **File Attachments** - Upload documents to projects/tasks
- [ ] 🏷️ **Labels & Tags** - Flexible categorization system
- [ ] 🧵 **Task Comments** - Team collaboration & discussion
- [ ] 🕒 **Activity Timeline** - Audit log for all changes
- [ ] 📆 **Sprint Planning** - Agile workflow support
- [ ] 🔍 **Global Search** - Search across projects/tasks/users
- [ ] 📧 **Email Notifications** - Task assignments & updates
- [ ] 📱 **Mobile App** - React Native companion
- [ ] 🔔 **Real-time Updates** - WebSocket support
- [ ] 📊 **Advanced Analytics** - Charts & insights

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Coding Standards:**
- Python: Follow PEP 8
- TypeScript: Use ESLint + Prettier
- Write tests for new features
- Update documentation

---

## 📄 License

This project is part of a technical assessment and is available for educational purposes.

---

## 🧑‍💻 Author

**Lakshan** - Full-Stack Engineer

[![GitHub](https://img.shields.io/badge/GitHub-lazymonarch-181717?style=for-the-badge&logo=github)](https://github.com/lazymonarch)
[![Repository](https://img.shields.io/badge/Repo-Project--Management__API-blue?style=for-the-badge&logo=github)](https://github.com/lazymonarch/Project-Management_API)

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Next.js](https://nextjs.org/) - React framework for production
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [SQLAlchemy](https://www.sqlalchemy.org/) - Python SQL toolkit

---

<div align="center">

### ⭐ Star this repo if you find it helpful!

**Made with ❤️, caffeine, and way too many late nights**

[Report Bug](https://github.com/lazymonarch/Project-Management_API/issues) · [Request Feature](https://github.com/lazymonarch/Project-Management_API/issues)

</div>
