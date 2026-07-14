import pytest
import pyotp
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.academic import Department, Program
from app.models.audit import AuditLog
from app.core.security import get_password_hash
from app.core.tenant import TenantContextError, set_current_tenant_id

@pytest.mark.asyncio
async def test_tenant_scoping_isolation_errors(db_session: AsyncSession):
    """
    Ensure that attempting queries or modifications on tenant-scoped tables
    without a tenant context fails with TenantContextError.
    """
    # No tenant context set
    with pytest.raises(TenantContextError):
        await db_session.execute(select(User))

@pytest.mark.asyncio
async def test_tenant_creation_and_auth_flow(client: AsyncClient, db_session: AsyncSession):
    """
    Core integration test verifying:
      - Super Admin authentication
      - Tenant registration (Super Admin only)
      - Tenant-scoped signups
      - JWT and MFA setup/verification flows
      - RBAC constraints on departments and programs CRUD
      - Tenant isolation at the database layer (preventing data leakage)
      - Automatic audit log creation on write operations
    """
    # 1. Seed the system tenant and platform Super Admin
    db_session.info["tenant_bypass"] = True
    
    sys_tenant = Tenant(name="System Platform", subdomain="admin", status="active")
    db_session.add(sys_tenant)
    await db_session.flush()
    
    admin_pwd_hash = get_password_hash("supersecurepassword")
    sys_admin = User(
        tenant_id=sys_tenant.id,
        username="platformadmin",
        email="admin@platform.com",
        password_hash=admin_pwd_hash,
        first_name="Platform",
        last_name="Owner",
        is_active=True
    )
    db_session.add(sys_admin)
    await db_session.flush()
    
    sys_role = UserRole(
        tenant_id=sys_tenant.id,
        user_id=sys_admin.id,
        role_type="super_admin"
    )
    db_session.add(sys_role)
    await db_session.commit()
    db_session.info["tenant_bypass"] = False

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "platformadmin", "password": "supersecurepassword"},
        headers={"Host": "admin.localhost"}
    )
    assert login_resp.status_code == 200
    tokens = login_resp.json()
    assert "access_token" in tokens
    token = tokens["access_token"]
    admin_headers = {"Authorization": f"Bearer {token}", "Host": "admin.localhost"}

    # 3. Create Tenant A and Tenant B
    create_t1 = await client.post(
        "/api/v1/admin/tenants",
        json={"name": "Harvard College", "subdomain": "harvard", "subscription_tier": "premium"},
        headers=admin_headers
    )
    assert create_t1.status_code == 201
    t1_id = create_t1.json()["id"]

    create_t2 = await client.post(
        "/api/v1/admin/tenants",
        json={"name": "MIT College", "subdomain": "mit", "subscription_tier": "standard"},
        headers=admin_headers
    )
    assert create_t2.status_code == 201
    t2_id = create_t2.json()["id"]

    # 4. Sign up users on Tenant A (harvard) and Tenant B (mit)
    signup_t1 = await client.post(
        "/api/v1/auth/signup",
        json={
            "username": "harvard_admin",
            "email": "admin@harvard.edu",
            "password": "harvardpassword",
            "first_name": "Harvard",
            "last_name": "Admin",
            "role_type": "college_admin",
            "phone": "+16174951000",
            "address": "Cambridge, MA"
        },
        headers={"Host": "harvard.localhost"}
    )
    assert signup_t1.status_code == 201
    harvard_admin_id = signup_t1.json()["id"]

    signup_t2 = await client.post(
        "/api/v1/auth/signup",
        json={
            "username": "mit_student",
            "email": "student@mit.edu",
            "password": "mitpassword",
            "first_name": "MIT",
            "last_name": "Student",
            "role_type": "student",
            "phone": "+16172531000",
            "address": "Cambridge, MA"
        },
        headers={"Host": "mit.localhost"}
    )
    assert signup_t2.status_code == 201
    mit_student_id = signup_t2.json()["id"]

    # Test decryption is working transparently for fields (checking returned Pydantic properties)
    assert signup_t1.json()["phone"] == "+16174951000"
    assert signup_t2.json()["address"] == "Cambridge, MA"

    # 5. Authenticate Harvard Admin
    login_h = await client.post(
        "/api/v1/auth/login",
        json={"username": "harvard_admin", "password": "harvardpassword"},
        headers={"Host": "harvard.localhost"}
    )
    assert login_h.status_code == 200
    token_h = login_h.json()["access_token"]
    h_headers = {"Authorization": f"Bearer {token_h}", "Host": "harvard.localhost"}

    # Authenticate MIT Student
    login_m = await client.post(
        "/api/v1/auth/login",
        json={"username": "mit_student", "password": "mitpassword"},
        headers={"Host": "mit.localhost"}
    )
    assert login_m.status_code == 200
    token_m = login_m.json()["access_token"]
    m_headers = {"Authorization": f"Bearer {token_m}", "Host": "mit.localhost"}

    # 6. Test RBAC validation & isolation on Academic CRUD
    # Harvard Admin creates a Department
    create_dept = await client.post(
        "/api/v1/academic/departments",
        json={"code": "CS", "name": "Computer Science"},
        headers=h_headers
    )
    assert create_dept.status_code == 201
    dept_id = create_dept.json()["id"]

    # MIT Student tries to create a Department on MIT (RBAC Restriction Check)
    create_dept_fail = await client.post(
        "/api/v1/academic/departments",
        json={"code": "PHY", "name": "Physics"},
        headers=m_headers
    )
    assert create_dept_fail.status_code == 403 # Forbidden!

    # MIT Student list departments on MIT. Since MIT has no departments, it should return empty list.
    # The route is GET "/api/v1/academic/departments", using pagination params
    list_dept_m = await client.get("/api/v1/academic/departments", headers=m_headers)
    assert list_dept_m.status_code == 200
    assert len(list_dept_m.json()["data"]) == 0

    # Ensure MIT Student cannot see Harvard's "CS" Department (Tenant Isolation Check)
    # Listing departments with Tenant B context must never yield Tenant A departments.
    # Harvard Admin lists departments, should see 1 department
    list_dept_h = await client.get("/api/v1/academic/departments", headers=h_headers)
    assert list_dept_h.status_code == 200
    assert len(list_dept_h.json()["data"]) == 1
    assert list_dept_h.json()["data"][0]["code"] == "CS"

    # Harvard Admin creates a Program under CS department
    create_prog = await client.post(
        "/api/v1/academic/programs",
        json={"department_id": dept_id, "code": "BSCS", "name": "Bachelor of Science in CS", "duration_years": 4, "total_credits": 120},
        headers=h_headers
    )
    assert create_prog.status_code == 201
    prog_id = create_prog.json()["id"]

    # 7. Verify Audit Log Integration
    # Create events must create audit logs. Let's inspect logs in DB (bypassing tenant filter for check)
    db_session.info["tenant_bypass"] = True
    logs_result = await db_session.execute(
        select(AuditLog).where(AuditLog.tenant_id == t1_id, AuditLog.action == "create_department")
    )
    log = logs_result.scalar_one_or_none()
    assert log is not None
    assert log.resource == "departments"
    assert log.user_id == harvard_admin_id
    db_session.info["tenant_bypass"] = False

    # 8. Multi-Factor Authentication (MFA) Setup & Verify Flow
    # Initiate MFA Setup for Harvard Admin
    mfa_setup = await client.post("/api/v1/auth/mfa/setup", headers=h_headers)
    assert mfa_setup.status_code == 200
    setup_data = mfa_setup.json()
    assert "secret" in setup_data
    secret = setup_data["secret"]

    # Generate a code using the secret for validation
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()

    # Verify and activate MFA
    mfa_verify = await client.post(
        "/api/v1/auth/mfa/verify",
        json={"code": valid_code},
        headers=h_headers
    )
    assert mfa_verify.status_code == 200

    # Next login attempt must require MFA code
    login_mfa_req = await client.post(
        "/api/v1/auth/login",
        json={"username": "harvard_admin", "password": "harvardpassword"},
        headers={"Host": "harvard.localhost"}
    )
    assert login_mfa_req.status_code == 200
    assert login_mfa_req.json()["mfa_required"] is True
    assert login_mfa_req.json()["access_token"] is None

    # Login with valid MFA code
    login_success = await client.post(
        "/api/v1/auth/login",
        json={"username": "harvard_admin", "password": "harvardpassword", "mfa_code": totp.now()},
        headers={"Host": "harvard.localhost"}
    )
    assert login_success.status_code == 200
    assert login_success.json()["access_token"] is not None
