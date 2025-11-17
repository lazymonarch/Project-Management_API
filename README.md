# 🚀 Project Management System

> A modern, full-stack project management solution built with FastAPI and Next.js 15

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

## ✨ Overview

A clean, understandable, and extendable project management system featuring JWT authentication, role-based access control, and a modern React interface. Built as part of an assessment to demonstrate full-stack development capabilities.

### 🎯 Key Features

- **🔐 Secure Authentication** - JWT-based auth with refresh token rotation
- **👥 Role-Based Access Control** - Admin, Manager, and Developer roles
- **📊 Real-time Dashboard** - Task statistics and project insights
- **🔄 Session Management** - Multi-device support with logout-from-all
- **🎨 Modern UI** - Built with Tailwind CSS and shadcn/ui
- **⚡ High Performance** - Async database operations with SQLAlchemy 2.0

---

## 🛠️ Tech Stack

### Backend
```
FastAPI          → Async Python web framework
SQLAlchemy 2.0   → Async ORM
PostgreSQL       → Primary database
Alembic          → Database migrations
JWT (jose)       → Token authentication
Passlib + bcrypt → Password hashing
Pydantic v2      → Data validation
```

### Frontend
```
Next.js 15       → React framework with App Router
React 18         → UI library
Tailwind CSS     → Utility-first styling
shadcn/ui        → Component library
TypeScript       → Type safety
```

---

## 📁 Project Structure

```
Project-Management/
│
├── 📂 my-saas-frontend/              # Next.js Frontend
│   ├── 📂 app/
│   │   ├── 📂 (auth)/                # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── 📂 (app)/
│   │   │   └── dashboard/            # Protected dashboard
│   │   ├── 📂 admin/                 # Admin-only pages
│   │   ├── 📂 api/
│   │   │   └── auth/session/         # Session proxy endpoint
│   │   └── layout.tsx
│   ├── 📂 components/                # Reusable UI components
│   ├── 📂 lib/
│   │   ├── fetcher.ts                # API client
│   │   ├── auth-manager.ts           # Auth state management
│   │   └── token-manager.ts          # Token handling
│   └── 📂 public/
│
└── 📂 project-management-api/        # FastAPI Backend
    ├── 📂 app/
    │   ├── 📂 routers/               # API endpoints
    │   │   ├── auth.py
    │   │   ├── users.py
    │   │   ├── projects.py
    │   │   ├── tasks.py
    │   │   └── stats.py
    │   ├── 📂 services/              # Business logic
    │   │   ├── session_service.py
    │   │   ├── auth_service.py
    │   │   └── user_service.py
    │   ├── 📂 utils/                 # Helper functions
    │   │   ├── jwt.py
    │   │   ├── hashing.py
    │   │   ├── pagination.py
    │   │   └── device.py
    │   ├── 📂 models/                # SQLAlchemy models
    │   ├── 📂 schemas/               # Pydantic schemas
    │   ├── database.py               # DB configuration
    │   ├── config.py                 # Environment settings
    │   └── main.py                   # Application entry
    ├── 📂 alembic/                   # Database migrations
    ├── 📂 scripts/
    │   └── seed_admin.py             # Admin user seeder
    ├── requirements.txt
    ├── .env
    └── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)

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
```

### 3️⃣ Setup Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Run database migrations
alembic upgrade head

# Seed admin user
python scripts/seed_admin.py

# Start the API server
uvicorn app.main:app --reload
```

**Backend Environment (.env):**
```env
DATABASE_URL=postgresql+asyncpg://lakshan:root@localhost:5432/taskflow
SECRET_KEY=your_super_secret_key_change_this_in_production
ALGORITHM=HS256
```

🎉 **Backend running at:** [http://localhost:8000](http://localhost:8000)  
📚 **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

### 4️⃣ Setup Frontend

```bash
cd my-saas-frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your settings

# Start the development server
npm run dev
```

**Frontend Environment (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

🎨 **Frontend running at:** [http://localhost:3000](http://localhost:3000)

---

## 🔑 Default Credentials

After running the admin seeder:

```
Email:    admin@example.com
Password: admin123
```

> ⚠️ **Important:** Change these credentials immediately in production!

---

## 🎨 Features Breakdown

### 🔐 Authentication & Security

- **Timeless Access Tokens** - Short-lived, memory-only tokens
- **Refresh Token Rotation** - Enhanced security through token rotation
- **Session Tracking** - Multi-device session management with device detection
- **Password Hashing** - bcrypt-based secure password storage
- **Role-Based Access Control** - Three-tier permission system

### 👥 User Management

```python
# Roles
- Admin     → Full system access
- Manager   → Project ownership and team management
- Developer → Task execution on assigned projects
```

- User CRUD operations
- Search and pagination
- Profile management
- Activity tracking

### 📊 Project Management

- Create, read, update, delete projects
- Owner-based access for managers
- Assignment-based access for developers
- Advanced filtering (search, date ranges, status)
- Project statistics and insights

### ✅ Task Management

- Full CRUD functionality
- Status workflow (Todo → In Progress → Done)
- Task assignment and tracking
- Priority levels
- Due date management

### 📈 Dashboard & Analytics

- Task breakdown by status
- Overdue task counters
- Active session monitoring
- New user metrics (last 30 days)
- Project completion rates

---

## 🏗️ Architecture Highlights

### Frontend Architecture

```typescript
// Client-side authentication pattern
// Access token: In-memory only
// Refresh token: localStorage
// Session ID: localStorage

// Rehydration on page refresh
app → /auth/refresh → validates session → restores state
```

**Key Design Decisions:**
- **No SSR Authentication** - Prevents hydration mismatches
- **Memory-only Access Tokens** - XSS protection
- **localStorage Refresh Tokens** - Persistent sessions
- **Empty Middleware** - Client-side auth flow

### Backend Architecture

```python
# Async-first design
async def get_projects(
    db: AsyncSession,
    user: User,
    skip: int = 0,
    limit: int = 10
) -> list[Project]:
    # Role-based filtering
    # Pagination
    # Optimized queries
    ...
```

**Key Features:**
- Async SQLAlchemy sessions
- Service layer separation
- Pydantic validation
- JWT stateless authentication
- RESTful API design

---

## 📡 API Endpoints

### Authentication
```http
POST   /auth/register          # Create new user
POST   /auth/login             # Login and get tokens
POST   /auth/refresh           # Refresh access token
POST   /auth/logout            # Logout current session
POST   /auth/logout-all        # Logout all sessions
GET    /auth/sessions          # List active sessions
```

### Users
```http
GET    /users                  # List all users (paginated)
GET    /users/{id}             # Get user by ID
POST   /users                  # Create user (admin)
PUT    /users/{id}             # Update user
DELETE /users/{id}             # Delete user
GET    /users/search           # Search users
```

### Projects
```http
GET    /projects               # List projects
GET    /projects/{id}          # Get project details
POST   /projects               # Create project
PUT    /projects/{id}          # Update project
DELETE /projects/{id}          # Delete project
GET    /projects/search        # Search projects
```

### Tasks
```http
GET    /tasks                  # List tasks
GET    /tasks/{id}             # Get task details
POST   /tasks                  # Create task
PUT    /tasks/{id}             # Update task
DELETE /tasks/{id}             # Delete task
PATCH  /tasks/{id}/status      # Update task status
```

### Statistics
```http
GET    /stats/dashboard        # Get dashboard statistics
GET    /stats/tasks            # Task analytics
GET    /stats/projects         # Project analytics
```

---

## 🧪 Testing

### Backend Tests
```bash
cd project-management-api
pytest
```

### Frontend Tests
```bash
cd my-saas-frontend
npm run test
```

---

## 🚢 Deployment

### Backend Deployment (Example: Railway/Render)

1. Set environment variables in hosting platform
2. Configure PostgreSQL database
3. Run migrations: `alembic upgrade head`
4. Start with: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Example: Vercel/Netlify)

1. Connect repository to hosting platform
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Build command: `npm run build`
4. Deploy!

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is part of an assessment and is available for educational purposes.

---

## 📞 Contact

**Repository:** [https://github.com/lazymonarch/Project-Management_API](https://github.com/lazymonarch/Project-Management_API)

**Author:** Lakshan ([@lazymonarch](https://github.com/lazymonarch))

---

## 🙏 Acknowledgments

- FastAPI for the incredible framework
- Next.js team for App Router
- shadcn for beautiful UI components
- The open-source community

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ and ☕

</div>
