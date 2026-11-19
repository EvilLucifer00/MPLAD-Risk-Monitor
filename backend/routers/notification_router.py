from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
    Body,
)

from auth.auth import (
    get_current_dm,
    get_current_mp,
)

from services.notification_service import (
    get_dm_notifications,
    get_mp_notifications,
    update_notification_read_status,
    mark_all_notifications_read,
    delete_notification,
)


notification_router = APIRouter(
    prefix="/notification",
    tags=["Notifications"],
)


# =============================================================
# MP - Get notifications
# =============================================================

@notification_router.get("/mp")
async def get_mp_notification_route(
    mp: dict = Depends(get_current_mp),

    notification_filter: Optional[str] = Query(
        None,
        alias="filter",
        description=(
            "Notification filter: "
            "all, unread, alerts, success, info, errors"
        ),
    ),
):
    return await get_mp_notifications(
        mp,
        notification_filter,
    )


# =============================================================
# DM - Get notifications
# =============================================================

@notification_router.get("/dm")
async def get_dm_notification_route(
    dm: dict = Depends(get_current_dm),

    notification_filter: Optional[str] = Query(
        None,
        alias="filter",
        description=(
            "Notification filter: "
            "all, unread, alerts, success, info, errors"
        ),
    ),
):
    return await get_dm_notifications(
        dm,
        notification_filter,
    )


# =============================================================
# MP - Read/unread one
# =============================================================

@notification_router.patch(
    "/mp/{notification_id}/read"
)
async def update_mp_notification_read(
    notification_id: int,

    is_read: bool = Body(
        ...,
        embed=True,
    ),

    mp: dict = Depends(get_current_mp),
):

    return await update_notification_read_status(
        role="MP",
        user_id=mp["id"],
        notification_id=notification_id,
        read_status=is_read,
    )


# =============================================================
# DM - Read/unread one
# =============================================================

@notification_router.patch(
    "/dm/{notification_id}/read"
)
async def update_dm_notification_read(
    notification_id: int,

    is_read: bool = Body(
        ...,
        embed=True,
    ),

    dm: dict = Depends(get_current_dm),
):

    return await update_notification_read_status(
        role="DM",
        user_id=dm["id"],
        notification_id=notification_id,
        read_status=is_read,
    )


# =============================================================
# MP - Mark all read
# =============================================================

@notification_router.patch(
    "/mp/read-all"
)
async def mark_mp_notifications_read(
    mp: dict = Depends(get_current_mp),
):

    rows = await mark_all_notifications_read(
        role="MP",
        user_id=mp["id"],
    )

    return {
        "message": (
            "All MP notifications marked as read"
        ),
        "updated": len(rows),
    }


# =============================================================
# DM - Mark all read
# =============================================================

@notification_router.patch(
    "/dm/read-all"
)
async def mark_dm_notifications_read(
    dm: dict = Depends(get_current_dm),
):

    rows = await mark_all_notifications_read(
        role="DM",
        user_id=dm["id"],
    )

    return {
        "message": (
            "All DM notifications marked as read"
        ),
        "updated": len(rows),
    }


# =============================================================
# MP - Delete
# =============================================================

@notification_router.delete(
    "/mp/{notification_id}"
)
async def delete_mp_notification(
    notification_id: int,

    mp: dict = Depends(get_current_mp),
):

    return await delete_notification(
        role="MP",
        user_id=mp["id"],
        notification_id=notification_id,
    )


# =============================================================
# DM - Delete
# =============================================================

@notification_router.delete(
    "/dm/{notification_id}"
)
async def delete_dm_notification(
    notification_id: int,

    dm: dict = Depends(get_current_dm),
):

    return await delete_notification(
        role="DM",
        user_id=dm["id"],
        notification_id=notification_id,
    )