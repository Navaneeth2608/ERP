# College ERP Backend - Phase 0

This is the backend of the college ERP platform, featuring a multi-tenant, cloud-native SaaS architecture built with Python 3.11, FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Redis, and Celery.

## Features Built in Phase 0
- Scaffolding & Infrastructure: FastAPI, Alembic, Docker Compose
- Multi-tenancy Isolation: Shared database, shared schema, `tenant_id` checking
- Authentication: JWT access and refresh tokens, MFA (TOTP), Password Hashing
- RBAC Middleware: Fine-grained permissions
- Audit Logging: Tracking of write requests
- Basic CRUD: Departments and Programs under tenant scope
- Celery Boilerplate

## Running Locally

To build and start the application container cluster:

```bash
docker-compose up --build
```

The auto-generated OpenAPI documentation will be accessible at:
http://localhost:8000/docs
