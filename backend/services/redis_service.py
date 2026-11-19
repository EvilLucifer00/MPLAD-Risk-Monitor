import json
import uuid
from typing import Optional

from fastapi import HTTPException

from database.redis import redis_client


QUEUE_NAME = "jobs:queue"
JOB_PREFIX = "job:"


async def create_job(
    request: dict,
    work_id: Optional[str] = None,
):
    """
    Create an asynchronous risk-scoring job.

    work_id:
        Application-level job ID.
        This is the ID that will eventually be stored in
        mplads_risk_scores.work_id and
        mplads_new_projects.risk_work_id.
    """

    if work_id is None:
        work_id = str(uuid.uuid4())

    job_key = f"{JOB_PREFIX}{work_id}"

    # ---------------------------------------------------------
    # Create job status record
    # ---------------------------------------------------------

    await redis_client.hset(
        job_key,
        mapping={
            "status": "queued",
            "result": json.dumps({}),
            "error": "",
        },
    )

    # ---------------------------------------------------------
    # Put job into Redis Stream
    # ---------------------------------------------------------

    stream_message_id = await redis_client.xadd(
        QUEUE_NAME,
        {
            "work_id": work_id,
            "input": json.dumps(request),
        },
    )

    return {
        "work_id": work_id,
        "message_id": stream_message_id,
        "status": "queued",
    }


async def get_job(work_id: str):

    job = await redis_client.hgetall(
        f"{JOB_PREFIX}{work_id}"
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    response = {
        "work_id": work_id,
        "status": job.get("status"),
    }

    if job.get("result"):
        try:
            response["result"] = json.loads(
                job["result"]
            )
        except json.JSONDecodeError:
            response["result"] = {}

    if job.get("error"):
        response["error"] = job["error"]

    return response