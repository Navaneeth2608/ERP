import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.core.tenant import register_tenant_listeners, set_current_tenant_id

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Register our tenant scoping event listeners on the test engine
    register_tenant_listeners(engine.sync_engine)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncSession:
    # Synchronously create schema
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async_session = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()
        
    # Drop schema after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db_session) -> AsyncClient:
    # Dependency override
    async def override_get_db():
        yield db_session
            
    app.dependency_overrides[get_db] = override_get_db
    
    # Initialize / clean tenant context
    set_current_tenant_id(None)
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test.localhost") as ac:
        yield ac
        
    app.dependency_overrides.clear()
