from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "erp_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Boilerplate background task for testing and future notification work
@celery_app.task(name="app.core.celery_app.send_system_notification")
def send_system_notification(user_id: int, message: str):
    """
    Stub background job for system notifications.
    """
    return {
        "status": "success",
        "user_id": user_id,
        "message": message,
        "processed": True
    }
