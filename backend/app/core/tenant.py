from contextvars import ContextVar
from sqlalchemy import event
from sqlalchemy.orm import Session, ORMExecuteState, object_session
from app.models.base import Base

# Context variable to hold the tenant ID for the current request context
tenant_id_ctx: ContextVar[int | None] = ContextVar("tenant_id_ctx", default=None)

def get_current_tenant_id() -> int | None:
    return tenant_id_ctx.get()

def set_current_tenant_id(tenant_id: int | None) -> None:
    tenant_id_ctx.set(tenant_id)

class TenantContextError(RuntimeError):
    """Raised when tenant-scoped operations are attempted without tenant context."""
    pass

def register_tenant_listeners(engine=None):
    """
    No-op fallback for backwards compatibility.
    Listeners are now registered globally at the class level on Session and Base.
    """
    pass

# --- Global Listeners registered on Session and Base classes ---

@event.listens_for(Session, "do_orm_execute")
def _do_orm_execute(execute_state: ORMExecuteState):
    # Check bypass in execution options (session-level) or statement options (statement-level)
    bypass = (
        execute_state.execution_options.get("tenant_bypass", False) or
        (hasattr(execute_state.statement, "get_execution_options") and
         execute_state.statement.get_execution_options().get("tenant_bypass", False))
    )
    if bypass:
        return

    tenant_id = get_current_tenant_id()

    if execute_state.is_select:
        for mapper in execute_state.all_mappers:
            if hasattr(mapper.class_, "tenant_id"):
                # Exception: allow reading AuditLog without tenant context (for global platform analytics/logs)
                if mapper.class_.__name__ == "AuditLog" and tenant_id is None:
                    continue
                    
                if tenant_id is None:
                    raise TenantContextError(
                        f"Access denied: Missing tenant context for querying {mapper.class_.__name__}."
                    )
                # Automatically apply tenant filter
                execute_state.statement = execute_state.statement.filter(
                    mapper.class_.tenant_id == tenant_id
                )

@event.listens_for(Base, "before_insert", propagate=True)
def _before_insert_listener(mapper, connection, target):
    if hasattr(target, "tenant_id"):
        session = object_session(target)
        if session and session.info.get("tenant_bypass", False):
            return

        tenant_id = get_current_tenant_id()
        
        # Exception: allow AuditLog inserts without tenant context (e.g. system logs, login failures)
        if target.__class__.__name__ == "AuditLog" and tenant_id is None:
            return
            
        if tenant_id is None:
            raise TenantContextError(
                f"Access denied: Missing tenant context for inserting {target.__class__.__name__}."
            )
        
        if target.tenant_id is None:
            target.tenant_id = tenant_id
        elif target.tenant_id != tenant_id:
            raise TenantContextError(
                f"Access denied: Tenant ID mismatch ({target.tenant_id} != {tenant_id}) for {target.__class__.__name__}."
            )

@event.listens_for(Base, "before_update", propagate=True)
def _before_update_listener(mapper, connection, target):
    if hasattr(target, "tenant_id"):
        session = object_session(target)
        if session and session.info.get("tenant_bypass", False):
            return

        tenant_id = get_current_tenant_id()
        
        # Exception: allow AuditLog updates without tenant context
        if target.__class__.__name__ == "AuditLog" and tenant_id is None:
            return
            
        if tenant_id is None:
            raise TenantContextError(
                f"Access denied: Missing tenant context for updating {target.__class__.__name__}."
            )
        
        if target.tenant_id != tenant_id:
            raise TenantContextError(
                f"Access denied: Tenant ID mismatch ({target.tenant_id} != {tenant_id}) for {target.__class__.__name__}."
            )
