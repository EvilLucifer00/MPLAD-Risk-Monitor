import asyncio
import json
import os
import socket
from datetime import datetime, timezone

from database import redis
from database.redis import redis_client
from database.database import supabase

from ml_model.service.risk_service import score_project

QUEUE_NAME = "jobs:queue"
GROUP_NAME = "job-workers"
CONSUMER_NAME = socket.gethostname()


async def create_consumer_group():

    try:

        await redis_client.xgroup_create(
            name=QUEUE_NAME,
            groupname=GROUP_NAME,
            id="0",
            mkstream=True,
        )

        print("Consumer group created")

    except redis.ResponseError as e:

        if "BUSYGROUP" in str(e):
            print("Consumer group already exists")

        else:
            raise


async def save_risk_result(
    work_id: str,
    result: dict,
):
    """
    Persist the completed risk result into PostgreSQL,
    then connect the risk record to the project.

    Mapping:

        risk_scores.work_id
                ↓
             work_id
                ↓
        projects.risk_work_id

    And finally:

        projects.risk_id
                ↓
        risk_scores.id
    """

    # ---------------------------------------------------------
    # 1. Insert/upsert risk score
    # ---------------------------------------------------------

    risk_payload = {
        "work_id": work_id,

        "risk_score": result.get(
            "overall_risk_score",
            result.get("risk_score", 0),
        ),

        "risk_level": result.get(
            "risk_level",
            "LOW",
        ),

        "cost_anomaly_risk": result.get(
            "cost_anomaly_risk",
            0,
        ),

        "timeline_delay_risk": result.get(
            "timeline_delay_risk",
            0,
        ),

        "duplicate_work_risk": result.get(
            "duplicate_work_risk",
            0,
        ),

        "vendor_risk": result.get(
            "vendor_risk",
            0,
        ),
    }

    risk_response = (
        supabase
        .table("mplads_risk_scores")
        .upsert(
            risk_payload,
            on_conflict="work_id",
        )
        .execute()
    )

    risk_rows = risk_response.data or []

    if not risk_rows:
        raise RuntimeError(
            f"Failed to save risk result for work_id={work_id}"
        )

    risk_row = risk_rows[0]

    risk_id = risk_row["id"]

    # ---------------------------------------------------------
    # 2. Find project using risk_work_id
    # ---------------------------------------------------------

    project_response = (
        supabase
        .table("mplads_new_projects")
        .select(
            "id, project_title, mp_id, dm_id, "
            "status, risk_work_id"
        )
        .eq("risk_work_id", work_id)
        .limit(1)
        .execute()
    )

    projects = project_response.data or []

    if not projects:
        raise RuntimeError(
            f"No project mapped to risk work_id={work_id}"
        )

    project = projects[0]

    project_id = project["id"]

    # ---------------------------------------------------------
    # 3. Update project with risk_id
    # ---------------------------------------------------------

    update_response = (
        supabase
        .table("mplads_new_projects")
        .update(
            {
                "risk_id": risk_id,
                "updated_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }
        )
        .eq("id", project_id)
        .execute()
    )

    if not update_response.data:
        raise RuntimeError(
            f"Failed to update project {project_id} "
            f"with risk_id={risk_id}"
        )

    return {
        "project_id": project_id,
        "risk_id": risk_id,
        "work_id": work_id,
        "risk_score": risk_payload["risk_score"],
        "risk_level": risk_payload["risk_level"],
    }


async def process_job(
    message_id,
    data,
):

    # ---------------------------------------------------------
    # 1. Extract work_id
    # ---------------------------------------------------------

    work_id = data["work_id"]

    # ---------------------------------------------------------
    # 2. Extract project input
    # ---------------------------------------------------------

    raw_input = data.get("input", "{}")

    try:
        project_input = (
            json.loads(raw_input)
            if isinstance(raw_input, str)
            else raw_input
        )
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"Invalid JSON input for work_id={work_id}: {e}"
        )

    job_key = f"job:{work_id}"

    # ---------------------------------------------------------
    # 3. Mark job processing
    # ---------------------------------------------------------

    await redis_client.hset(
        job_key,
        "status",
        "processing",
    )

    try:

        # -----------------------------------------------------
        # 4. Run slow risk service
        # -----------------------------------------------------

        result = await score_project(
            payload=project_input
        )

        if not isinstance(result, dict):
            raise RuntimeError(
                "score_project() must return a dict"
            )

        # -----------------------------------------------------
        # 5. Save risk result to PostgreSQL
        # -----------------------------------------------------

        db_result = await save_risk_result(
            work_id=work_id,
            result=result,
        )

        # -----------------------------------------------------
        # 6. Mark Redis job completed
        # -----------------------------------------------------

        await redis_client.hset(
            job_key,
            mapping={
                "status": "completed",
                "result": json.dumps(
                    {
                        **result,
                        **db_result,
                    }
                ),
                "error": "",
            },
        )

        print(
            f"Job {work_id} completed "
            f"for project {db_result['project_id']}"
        )

    except Exception as e:

        await redis_client.hset(
            job_key,
            mapping={
                "status": "failed",
                "error": str(e),
            },
        )

        raise


async def worker():

    await create_consumer_group()

    print(
        f"Worker {CONSUMER_NAME} started"
    )

    while True:

        messages = await redis_client.xreadgroup(
            groupname=GROUP_NAME,
            consumername=CONSUMER_NAME,
            streams={
                QUEUE_NAME: ">"
            },
            count=1,
            block=5000,
        )

        if not messages:
            continue

        for stream_name, entries in messages:

            for message_id, data in entries:

                try:

                    await process_job(
                        message_id,
                        data,
                    )

                    # ACK only after PostgreSQL persistence succeeds
                    await redis_client.xack(
                        QUEUE_NAME,
                        GROUP_NAME,
                        message_id,
                    )

                except Exception as e:

                    print(
                        f"Job failed: {e}"
                    )