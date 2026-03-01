import time
from pathlib import Path

import cloudinary
import cloudinary.utils
import environ
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer

from realtime.models import Notification

env = environ.Env()
BASE_DIR = Path(__file__).resolve().parent
env.read_env(BASE_DIR / ".env")

cloudinary.config(
    cloud_name=env("CLOUD_NAME"),
    api_key=env("CLOUD_API_KEY"),
    api_secret=env("CLOUD_API_SECRET"),
    secure=True,
)

VALID_CODES = {"success", "error", "info", "warning"}
CHANNEL_LAYER = get_channel_layer()


@sync_to_async(thread_sensitive=True)
def _create_notification(**kwargs):
    return Notification.objects.create(**kwargs)


@sync_to_async(thread_sensitive=True)
def _bulk_create_notifications(notifications):
    return Notification.objects.bulk_create(notifications)


@sync_to_async
def _signed_profile_url(public_id: str | None, expires_in: int = 30):
    if not public_id:
        return None

    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type="image",
        type="authenticated",
        sign_url=True,
        secure=True,
        expires_at=int(time.time()) + expires_in,
    )
    return url


async def _serialize_actor(actor):
    if not actor:
        return None

    return {
        "id": actor.id,
        "full_name": actor.full_name,
        "email": actor.email,
        "profile_pic_url": await _signed_profile_url(
            getattr(actor, "profile_pic_id", None)
        ),
    }


async def notify_user(
    *,
    recipient,
    title: str,
    description: str,
    code: str = "info",
    actor=None,
    url: str | None = None,
    is_push_notif: bool = False,
):
    if not recipient or not recipient.id:
        raise ValueError("Recipient is required")

    if not title:
        raise ValueError("Notification title is required")

    if code not in VALID_CODES:
        code = "info"

    if not recipient.notif_enabled:
        return None

    if actor and actor.id == recipient.id:
        return None

    push_allowed = is_push_notif and recipient.push_notif_enabled
    actor_data = await _serialize_actor(actor)

    notification = await _create_notification(
        recipient=recipient,
        actor=actor,
        title=title,
        description=description,
        code=code,
        url=url,
    )

    if CHANNEL_LAYER:
        try:
            await CHANNEL_LAYER.group_send(
                f"user_{recipient.id}",
                {
                    "type": "send_notification",
                    "respond": {
                        "id": notification.id,
                        "title": title,
                        "message": description,
                        "code": code,
                        "url": url,
                        "is_read": False,
                        "is_push_notif": push_allowed,
                        "actor": actor_data,
                        "sent_at": notification.sent_at.isoformat(),
                    },
                },
            )
        except Exception as exc:
            print("WS notify failed:", exc)

    return notification


async def live_update(recipient, /, **payload):
    if not recipient or not recipient.id:
        raise ValueError("Recipient is required")

    if not CHANNEL_LAYER:
        return

    try:
        await CHANNEL_LAYER.group_send(
            f"user_{recipient.id}",
            {
                "type": "send_notification",
                "respond": {
                    "live_update": True,
                    **payload,
                },
            },
        )
    except Exception as exc:
        print("WS live update failed:", exc)


async def notify_users_bulk(
    *,
    recipients,
    title: str,
    description: str,
    code: str = "info",
    actor=None,
    url: str | None = None,
    is_push_notif: bool = False,
):
    if not recipients:
        return []

    if not title:
        raise ValueError("Notification title is required")

    if code not in VALID_CODES:
        code = "info"

    notifications = []
    recipient_map = []

    for recipient in recipients:
        if not recipient or not recipient.id:
            continue

        if not recipient.notif_enabled:
            continue

        if actor and actor.id == recipient.id:
            continue

        notifications.append(
            Notification(
                recipient=recipient,
                actor=actor,
                title=title,
                description=description,
                code=code,
                url=url,
            )
        )
        recipient_map.append(recipient)

    if not notifications:
        return []

    created_notifications = await _bulk_create_notifications(notifications)
    actor_data = await _serialize_actor(actor)

    if CHANNEL_LAYER:
        for recipient, notification in zip(recipient_map, created_notifications):
            push_allowed = is_push_notif and recipient.push_notif_enabled

            try:
                await CHANNEL_LAYER.group_send(
                    f"user_{recipient.id}",
                    {
                        "type": "send_notification",
                        "respond": {
                            "id": notification.id,
                            "title": notification.title,
                            "message": notification.description,
                            "code": notification.code,
                            "url": notification.url,
                            "is_read": False,
                            "is_push_notif": push_allowed,
                            "actor": actor_data,
                            "sent_at": notification.sent_at.isoformat(),
                        },
                    },
                )
            except Exception as exc:
                print(f"WS notify failed for user {recipient.id}:", exc)

    return created_notifications
