from datetime import datetime, timezone
from typing import Optional, List, Tuple

from database.database import supabase
from services.ai_notification_service import (
    generate_notification_description,
)


# =============================================================
# AI message generation with fallback
# =============================================================

async def generate_message_with_fallback(
    context: dict,
    fallback: str,
) -> str:
    """
    Generate a short notification description using
    the external AI notification agent.

    If the AI service fails, use the supplied fallback.
    """

    try:
        generated_message = (
            await generate_notification_description(
                context
            )
        )

        if generated_message:
            return generated_message.strip()

    except Exception as e:
        print(
            "AI notification generation failed:",
            str(e),
        )

    return fallback


# =============================================================
# Create notification
# =============================================================

async def create_notification(
    *,
    project_id: Optional[int],
    notification_type: str,
    title: str,
    message: Optional[str] = None,
    recipients: List[Tuple[str, int]],
    actor_role: Optional[str] = None,
    actor_id: Optional[int] = None,
    metadata: Optional[dict] = None,
    ai_context: Optional[dict] = None,
):
    """
    Create one shared notification.

    Example:

        await create_notification(
            project_id=101,
            notification_type="ALERT",
            title="Risk Alert",
            recipients=[
                ("MP", 10),
                ("DM", 5),
            ],
            ai_context={
                "role": "DM",
                "event_type": "RISK_ALERT",
                ...
            },
        )

    The notification itself is shared.

    Read/unread/delete state is stored separately
    for each recipient.
    """

    # ---------------------------------------------------------
    # Validate recipients
    # ---------------------------------------------------------

    if not recipients:
        return None

    normalized_recipients = []

    for role, recipient_id in recipients:

        role = role.upper()

        if role not in {"MP", "DM"}:
            raise ValueError(
                f"Invalid recipient role: {role}"
            )

        if recipient_id is None:
            raise ValueError(
                "recipient_id cannot be None"
            )

        normalized_recipients.append(
            (role, int(recipient_id))
        )

    # ---------------------------------------------------------
    # Validate notification type
    # ---------------------------------------------------------

    notification_type = notification_type.upper()

    allowed_types = {
        "ALERT",
        "SUCCESS",
        "INFO",
        "ERROR",
    }

    if notification_type not in allowed_types:
        raise ValueError(
            f"Invalid notification type: "
            f"{notification_type}"
        )

    # ---------------------------------------------------------
    # Generate AI description
    # ---------------------------------------------------------

    if ai_context:

        message = await generate_message_with_fallback(
            context=ai_context,
            fallback=message or title,
        )

    # ---------------------------------------------------------
    # Final fallback
    # ---------------------------------------------------------

    if not message:
        message = title

    # ---------------------------------------------------------
    # Create notification
    # ---------------------------------------------------------

    notification_data = {
        "project_id": project_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "actor_role": (
            actor_role.upper()
            if actor_role
            else None
        ),
        "actor_id": actor_id,
        "metadata": metadata or {},
    }

    response = (
        supabase
        .table("mplads_notifications")
        .insert(notification_data)
        .execute()
    )

    notification_rows = response.data or []

    if not notification_rows:
        raise RuntimeError(
            "Failed to create notification"
        )

    notification = notification_rows[0]

    notification_id = notification["id"]

    # ---------------------------------------------------------
    # Create recipient rows
    # ---------------------------------------------------------

    recipient_rows = [
        {
            "notification_id": notification_id,
            "recipient_role": role,
            "recipient_id": recipient_id,
            "is_read": False,
            "read_at": None,
            "is_deleted": False,
            "deleted_at": None,
        }
        for role, recipient_id
        in normalized_recipients
    ]

    recipient_response = (
        supabase
        .table(
            "mplads_notification_recipients"
        )
        .insert(recipient_rows)
        .execute()
    )

    if not recipient_response.data:

        # Notification was created but recipients failed.
        # Remove the orphan notification.

        (
            supabase
            .table("mplads_notifications")
            .delete()
            .eq("id", notification_id)
            .execute()
        )

        raise RuntimeError(
            "Failed to create notification recipients"
        )

    return {
        "notification": notification,
        "recipients": recipient_response.data,
    }


# =============================================================
# Get notifications for MP or DM
# =============================================================

async def _get_notifications_for_user(
    *,
    role: str,
    user_id: int,
    notification_filter: Optional[str] = None,
):
    """
    Get notifications for one authenticated user.

    Read/unread state comes from that user's recipient row.
    """

    role = role.upper()

    if role not in {"MP", "DM"}:
        raise ValueError(
            f"Invalid role: {role}"
        )

    # ---------------------------------------------------------
    # Get recipient records
    # ---------------------------------------------------------

    recipient_rows = (
        supabase
        .table(
            "mplads_notification_recipients"
        )
        .select(
            "id, notification_id, is_read, read_at, "
            "is_deleted, deleted_at"
        )
        .eq(
            "recipient_role",
            role,
        )
        .eq(
            "recipient_id",
            user_id,
        )
        .eq(
            "is_deleted",
            False,
        )
        .execute()
        .data
        or []
    )

    if not recipient_rows:
        return {
            "data": [],
            "count": 0,
            "unread_count": 0,
        }

    # ---------------------------------------------------------
    # Get notification IDs
    # ---------------------------------------------------------

    notification_ids = [
        row["notification_id"]
        for row in recipient_rows
    ]

    # ---------------------------------------------------------
    # Get actual notification records
    # ---------------------------------------------------------

    notifications = (
        supabase
        .table("mplads_notifications")
        .select(
            "id, project_id, type, title, message, "
            "actor_role, actor_id, metadata, created_at"
        )
        .in_(
            "id",
            notification_ids,
        )
        .execute()
        .data
        or []
    )

    notification_map = {
        row["id"]: row
        for row in notifications
    }

    # ---------------------------------------------------------
    # Normalize filter
    # ---------------------------------------------------------

    filter_value = (
        notification_filter or "all"
    ).strip().lower()

    valid_filters = {
        "all",
        "unread",
        "alerts",
        "success",
        "info",
        "errors",
    }

    if filter_value not in valid_filters:
        filter_value = "all"

    # ---------------------------------------------------------
    # Build response
    # ---------------------------------------------------------

    filtered = []

    for recipient in recipient_rows:

        notification = notification_map.get(
            recipient["notification_id"]
        )

        if not notification:
            continue

        notification_type = (
            notification.get("type")
            or ""
        ).upper()

        # -----------------------------------------------------
        # Apply UI filter
        # -----------------------------------------------------

        if filter_value == "unread":

            if recipient["is_read"]:
                continue

        elif filter_value == "alerts":

            if notification_type != "ALERT":
                continue

        elif filter_value == "success":

            if notification_type != "SUCCESS":
                continue

        elif filter_value == "info":

            if notification_type != "INFO":
                continue

        elif filter_value == "errors":

            if notification_type != "ERROR":
                continue

        # -----------------------------------------------------
        # Add notification
        # -----------------------------------------------------

        filtered.append(
            {
                "recipient_id": recipient["id"],
                "notification_id": notification["id"],
                "project_id": notification["project_id"],

                "type": notification["type"],
                "title": notification["title"],
                "message": notification["message"],

                "actor_role": notification[
                    "actor_role"
                ],
                "actor_id": notification[
                    "actor_id"
                ],

                "metadata": notification[
                    "metadata"
                ],

                "created_at": notification[
                    "created_at"
                ],

                # Recipient-specific state
                "is_read": recipient["is_read"],
                "read_at": recipient["read_at"],
            }
        )

    # ---------------------------------------------------------
    # Newest first
    # ---------------------------------------------------------

    filtered.sort(
        key=lambda row: (
            row.get("created_at") or ""
        ),
        reverse=True,
    )

    # ---------------------------------------------------------
    # Unread count
    #
    # This should always represent ALL unread notifications
    # for this user, not just the current filter.
    # ---------------------------------------------------------

    unread_count = sum(
        1
        for row in recipient_rows
        if not row["is_read"]
    )

    return {
        "data": filtered,
        "count": len(filtered),
        "unread_count": unread_count,
    }


# =============================================================
# MP notifications
# =============================================================

async def get_mp_notifications(
    mp: dict,
    notification_filter: Optional[str] = None,
):
    mp_id = mp["id"]

    return await _get_notifications_for_user(
        role="MP",
        user_id=mp_id,
        notification_filter=notification_filter,
    )


# =============================================================
# DM notifications
# =============================================================

async def get_dm_notifications(
    dm: dict,
    notification_filter: Optional[str] = None,
):
    dm_id = dm["id"]

    return await _get_notifications_for_user(
        role="DM",
        user_id=dm_id,
        notification_filter=notification_filter,
    )


# =============================================================
# Mark ONE notification read/unread
# =============================================================

async def update_notification_read_status(
    *,
    role: str,
    user_id: int,
    notification_id: int,
    read_status: bool,
):
    """
    Mark a notification read/unread for THIS recipient only.

    MP changing the state does not affect DM.
    DM changing the state does not affect MP.
    """

    role = role.upper()

    update_data = {
        "is_read": read_status,
        "read_at": (
            datetime.now(
                timezone.utc
            ).isoformat()
            if read_status
            else None
        ),
    }

    response = (
        supabase
        .table(
            "mplads_notification_recipients"
        )
        .update(update_data)
        .eq(
            "notification_id",
            notification_id,
        )
        .eq(
            "recipient_role",
            role,
        )
        .eq(
            "recipient_id",
            user_id,
        )
        .eq(
            "is_deleted",
            False,
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        return {
            "updated": False,
            "message": (
                "Notification not found "
                "for this user"
            ),
        }

    return {
        "updated": True,
        "data": rows,
    }


# =============================================================
# Mark ALL notifications as read
# =============================================================

async def mark_all_notifications_read(
    *,
    role: str,
    user_id: int,
):
    """
    Mark all notifications as read for THIS user.
    """

    role = role.upper()

    read_time = datetime.now(
        timezone.utc
    ).isoformat()

    response = (
        supabase
        .table(
            "mplads_notification_recipients"
        )
        .update(
            {
                "is_read": True,
                "read_at": read_time,
            }
        )
        .eq(
            "recipient_role",
            role,
        )
        .eq(
            "recipient_id",
            user_id,
        )
        .eq(
            "is_read",
            False,
        )
        .eq(
            "is_deleted",
            False,
        )
        .execute()
    )

    return response.data or []


# =============================================================
# Delete notification for THIS recipient only
# =============================================================

async def delete_notification(
    *,
    role: str,
    user_id: int,
    notification_id: int,
):
    """
    Soft-delete notification for this user only.

    MP deleting it does NOT delete it for DM.
    """

    role = role.upper()

    response = (
        supabase
        .table(
            "mplads_notification_recipients"
        )
        .update(
            {
                "is_deleted": True,
                "deleted_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }
        )
        .eq(
            "notification_id",
            notification_id,
        )
        .eq(
            "recipient_role",
            role,
        )
        .eq(
            "recipient_id",
            user_id,
        )
        .eq(
            "is_deleted",
            False,
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        return {
            "deleted": False,
            "message": (
                "Notification not found "
                "for this user"
            ),
        }

    return {
        "deleted": True,
        "data": rows,
    }