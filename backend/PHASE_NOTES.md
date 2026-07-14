# Phase 0: Foundation Phase Notes

This document summarizes what was built in Phase 0 and what has been deliberately deferred to future development phases.

## What Was Built

1. **Scaffolding & App Factory**: Integrated FastAPI, async SQLAlchemy 2.0 (using asyncpg), Alembic, Redis, and Celery worker. Configured the settings layer using `pydantic-settings`.
2. **Strict Multi-Tenancy**: Implemented row-level security (RLS) query rewriting inside SQLAlchemy using global event listeners on the `Session` and `Base` classes. Query filters are automatically applied based on the request-scoped `tenant_id` ContextVar. Misaligned modifications or queries without tenant context raise `TenantContextError`.
3. **Data Model**: Implemented declarative entities for `Tenant`, `User`, `UserRole`, `Department`, `Program`, and `AuditLog`.
4. **Transparent Encryption**: Implemented a custom SQLAlchemy TypeDecorator `EncryptedString` using Fernet cryptography to encrypt/decrypt sensitive PII fields (phone, address) at rest.
5. **Authentication & MFA**: Implemented native bcrypt password hashing, JWT credentials generation (Access + Refresh tokens), and multi-factor authentication (MFA) via TOTP secrets.
6. **RBAC Middleware**: Implemented a fine-grained permissions checks dependency (`require_permission`) utilizing the active user's roles and permission maps.
7. **Write Audit Logging**: Integrated an audit-log service creating details of creations, updates, logins, and MFA actions inside the database.
8. **Academic CRUD**: Enabled basic CRUD endpoints for Departments and Programs.
9. **Testing & Verification**: Created a full asyncio integration test suite running on an in-memory SQLite database (`aiosqlite`), validating tenant isolation, RBAC checks, MFA logins, and audit logs.

## Deliberately Deferred (Future Phases)

1. **Schema-per-Tenant isolation**: Row-level security is enforced via `tenant_id` columns in the shared database. Upgrading large tenants to separate schemas or dedicated databases is deferred to Phase 5.
2. **S3 Object Storage**: Integration of S3-compatible buckets per tenant is deferred until academic profiles and documents are created (Phase 1).
3. **SMS, Email, and Push Providers**: Pluggable providers (Twilio, AWS SES, FCM) are stubbed behind the architecture interfaces and will be built in Phase 2's Notification Router.
4. **Razorpay/Stripe Payment Processors**: Gateway integrations are deferred to Phase 2 (Finance).
5. **ClickHouse Analytics & Materialized Views**: Platform-wide dashboards and reporting views are deferred to Phase 5.
6. **MFA QR Code Generation PNGs**: The API returns the raw TOTP provisioning URI. Rendering QR code images (e.g. using `qrcode`) is deferred to Phase 1/frontend integration.
