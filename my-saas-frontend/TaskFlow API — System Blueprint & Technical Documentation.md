# # TaskFlow API — System Blueprint & Technical Documentation
A complete, multi-section architectural reference for the TaskFlow backend system, including deep technical specifications, RBAC design, workflows, developer notes, and repository-friendly documentation.

# SECTION 1 — Full Architecture Blueprint (Deep Technical Spec)
# 1\. System Intent & Philosophy
TaskFlow API is a modern, production-grade backend for project management — enabling teams to organize projects, assign tasks, track progress, manage sessions, and enforce secure, role-aware access. Its philosophy:
* **•	Centralize authentication & authorization**
* **•	Enforce strict RBAC at all layers**
* **•	Ensure predictable API behavior**
* **•	Adopt layered architecture (router → service → model)**
* **•	Use clean domain models & predictable response structures**
* **•	Design for real-world production constraints (sessions, tokens, devices)**

⠀This backend mirrors the architectural discipline of systems like Linear, Jira, and Asana.

# 2\. Core Design Principles
### 2.1 Layered Architecture
### Client → Router → Permission Layer (require_roles) → Service Layer → ORM Models → DB
### 2.2 Centralized Authorization
* get_current_user() handles auth extraction from tokens
* require_roles() normalizes role enforcement
* Service methods perform deeper project/task ownership checks

⠀2.3 Strong RBAC
* Admin → Full access
* Manager → Scoped to own projects
* Developer → Scoped to assigned tasks & task status updates only

⠀2.4 Session-Based Authentication
Every login creates:
* A **session record**
* A **refresh token (rotatable)**
* A **timeless access token linked to session_id**

⠀Sessions track:
* Device info
* OS
* User agent
* IP
* Expiry
* Active/inactive state

⠀
# 3\. Database Model Architecture
### 3.1 User
* Unique email + username
* Role enum
* Relationships: created_tasks, assigned_tasks, owned projects

⠀3.2 Project
* Owned by a user
* Has many tasks
* Enforced via:
  * ensure_project_access
  * ensure_project_management

⠀3.3 Task
* Belongs to project
* Has creator
* Has assignee
* Has strict per-role access controls

⠀3.4 Session
Tracks login devices, refresh tokens, and activity.

# 4\. RBAC (Role-Based Access Control)
### Admin
* Full system access
* Can CRUD any resource
* See all sessions
* View full stats

⠀Manager
* Create projects
* Manage only their own projects
* Create/update/delete tasks inside owned projects
* View tasks inside owned projects
* Cannot affect other managers’ or admin projects/tasks
* Can view users list

⠀Developer
* Read-only except:
  * Can update *status* of assigned tasks
* Can view:
  * Tasks assigned to them
  * Projects containing their tasks

⠀
# 5\. Authorization Pipeline
### 5.1 Authentication Flow
### POST /auth/login
### ↓
### UserService.authenticate()
### ↓
### SessionService.create_session()
### ↓
### access_token + refresh_token returned
### 5.2 Access Token Validation
### get_current_user() decodes JWT:
* Validates structure
* Reads user_id and session_id
* Confirms session is active
* Fetches user

⠀5.3 Permission Enforcement
Routers use:
* Depends(get_current_user) for auth
* Depends(require_roles(...)) for RBAC

⠀Business logic uses:
* ensure_project_access
* ensure_project_management
* ensure_task_access
* ensure_project_visibility

⠀
# 6\. Service Layer Workflows
### 6.1 Project Workflow
**Create**
* Admin/Manager only
* Owner = current user

⠀**Update/Delete**
* Admin/Manager
* Manager limited to own projects

⠀**Read**
* Admin → all
* Manager → own
* Developer → only projects containing assigned tasks

⠀
### 6.2 Task Workflow
**Create**
* Admin/Manager
* Managers limited to tasks in their own projects

⠀**Update**
* Admin/Manager
* Developer → forbidden
* Manager limited to own projects

⠀**Update Status**
* Developer allowed ONLY for self-assigned tasks
* Manager allowed
* Admin allowed

⠀**Fetch**
* Based on project visibility + task ownership

⠀
### 6.3 Session Workflow
**List**
* All users — including admins — can only view their own sessions
* Session visibility is strictly private and scoped to the authenticated user
* The API does *not* expose cross-user session inspection for security and privacy reasons


⠀**Refresh**
* Validate refresh token
* Rotate token
* Return new access token

⠀**Logout**
* Invalidate session

⠀**Logout All**
* Invalidate all user sessions

⠀
### 6.4 Stats Workflow
* Admin only
* Aggregates users, projects, tasks, sessions
* Returns clean dashboard metrics

⠀
# 7\. Search, Filter, Pagination
### Filters supported
* Users → role, search, date
* Projects → status, search, date
* Tasks → project_id, assigned_to, status, priority, search
* Sessions → device_name/os/IP/search/date

⠀Pagination
Consistent metadata:
### {
###   page,
###   limit,
###   total,
###   pages
### }

# 8\. Response Architecture
All successful operations use:
### success(message, data)
Public models always hide internal DB fields and return clean API objects.

# 9\. Token, Session & Security Notes
### Tokens
* Access Token → timeless, tied to session_id
* Refresh Token → UUID, hashed, rotated on refresh

⠀Session Security
* Records device-level info
* Includes expiry
* revokable individually or all-at-once

⠀
# SECTION 2 — Executive Summary (Medium-Length)
# 1\. What TaskFlow API Does
TaskFlow API manages:
* Users
* Projects
* Tasks
* Login sessions
* Dashboard stats

⠀It enforces **strong RBAC**, ensuring data isolation and predictable behavior.

# 2\. Key Technical Highlights
* Strict permission enforcement at every step
* Centralized token/session authentication
* Multi-level filtering & pagination
* Clean service-driven architecture
* Production-ready relational models

⠀
# 3\. RBAC Overview
| **Role** | **Capabilities** |
|:-:|:-:|
| Admin | Full system access |
| Manager | Own projects/tasks only |
| Developer | Assigned tasks only |

# 4\. Why This Architecture
Because it:
* Scales
* Keeps responsibilities separated
* Allows extending to new roles easily
* Mirrors real enterprise PM systems

⠀
# SECTION 3 — Internal Dev Notes (Short & Practical)
# 1\. Where to Add Permissions
Use:
* require_roles() → router-level
* ensure_project_access() → project visibility
* ensure_project_management() → project modification
* ensure_task_access() → task visibility/edit

⠀
# 2\. Add a New Role
Steps:
1. Add to UserRole enum
2. Update require_roles()
3. Update project/task access helpers

⠀
# 3\. Adding a New Filter
Place inside:
* list_users()
* list_projects()
* list_tasks()
* list_sessions()

⠀Using SQLAlchemy conditions list.

# 4\. Where Token Logic Lives
* Generation → utils.auth
* Rotation → AuthService
* Validation → SessionService

⠀
# SECTION 4 — README-Ready Document
# TaskFlow API
A modern, role-secured backend for managing projects, tasks, and team workflows.
# 🚀 Tech Stack
* FastAPI
* PostgreSQL
* SQLAlchemy 2.0
* Alembic
* Pydantic
* JWT auth
* Async architecture

⠀
# ✨ Features
* User accounts with roles
* Project & task management
* Full RBAC
* Device-based sessions
* Pagination & filtering
* Dashboard statistics

⠀
# 🔐 RBAC Matrix
| **Action** | **Admin** | **Manager** | **Developer** |
|:-:|:-:|:-:|:-:|
| Create project | ✔ | ✔ | ✖ |
| Update project | ✔ | own only | ✖ |
| Read project | ✔ | own only | assigned only |
| Delete project | ✔ | ✖ | ✖ |
| Create task | ✔ | own only | ✖ |
| Update task | ✔ | own only | ✖ |
| Update status | ✔ | ✔ | own only |
| Delete task | ✔ | own only | ✖ |
| List users | ✔ | ✔ | ✖ |
| Stats | ✔ | ✖ | ✖ |

# 📦 Setup
### pip install -r requirements.txt
### alembic upgrade head
### cp .env.example .env
### uvicorn app.main:app --reload

# 📁 Folder Structure
### app/
###   routers/
###   services/
###   schemas/
###   models/
###   utils/

# 📊 API Overview
* /auth — login, register, refresh, logout
* /users — CRUD users
* /projects — CRUD projects + summary
* /tasks — CRUD tasks + board
* /sessions — session list
* •	/stats — admin dashboard

⠀
# SECTION 5 — Appendix
# 1\. Token Payload
### {
###   user_id: "...",
###   session_id: "..."
### }
# 2\. Error Format
### {
###   detail: "message"
### }
# 3\. Relationships Diagram
### User 1 ──* Projects
### User 1 ──* CreatedTasks
### User 1 ──* AssignedTasks
### Project 1 ──* Tasks
### User 1 ──* Sessions
# 4\. Pagination Format
### {
###   data: [...],
###   pagination: {
###     page, limit, total, pages
###   }
### }

# End of Document
TaskFlow API architecture is now fully and professionally documented.
