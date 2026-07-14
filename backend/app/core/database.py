from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.tenant import register_tenant_listeners

# Extra arguments for specific SQL dialects
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args
)

# Register the tenant listeners on the SQLAlchemy engine
register_tenant_listeners(engine.sync_engine)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency generator for obtaining an asynchronous database session.
    Ensures sessions are properly closed after request completion.
    """
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
