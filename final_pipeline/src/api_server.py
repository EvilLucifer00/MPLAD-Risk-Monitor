"""
api_server.py
=============
FastAPI server that exposes the MPLADS fraud-detection pipeline as a REST API.

Endpoints:
    POST /analyze   — Accept works JSON, run the full pipeline, return risk scores.
    GET  /health    — Health check.

Usage:
    uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations

import json
import os
import tempfile
import shutil
import uuid
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any

app = FastAPI(
    title="MPLADS Risk Monitor API",
    description="Fraud detection pipeline for MPLADS works — JSON in, risk scores out.",
    version="1.0.0",
)

# Allow frontend to call this API from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ────────────────────────────────────────────

class WorkEntry(BaseModel):
    work_id: str
    description: str
    category: str
    mp_name: str
    state: str
    district: str
    latitude: float
    longitude: float
    sanction_amount: float
    quantity: float
    unit: str
    sanction_date: str
    vendor: str
    expenditure_amount: float
    expenditure_date: str
    ida: str
    # Optional fields
    house: str | None = None
    completed_date: str | None = None
    has_images: bool | None = None
    average_rating: float | None = None
    constituency: str | None = None
    payment_status: str | None = None


class AnalyzeRequest(BaseModel):
    works: list[WorkEntry]


class AnalyzeResponse(BaseModel):
    success: bool
    run_metadata: dict[str, Any]
    decision_threshold: float
    capacity_threshold: float
    risk_band_cuts: list[float]
    mps: list[dict[str, Any]]


# ── Endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    """
    Run the full MPLADS fraud-detection pipeline on the submitted works.
    Returns per-MP composite risk scores with SHAP explanations.
    """
    from run_pipeline import run_pipeline_from_json

    # Convert pydantic models to plain dicts for the pipeline
    input_json = {"works": [w.model_dump(exclude_none=True) for w in request.works]}

    # Use a unique temp directory for each request to avoid conflicts
    run_id = str(uuid.uuid4())[:8]
    output_dir = os.path.join(tempfile.gettempdir(), f"mplads_run_{run_id}")

    try:
        result = run_pipeline_from_json(input_json, output_dir)
        return AnalyzeResponse(
            success=True,
            run_metadata=result.get("run_metadata", {}),
            decision_threshold=result.get("decision_threshold", 0.5),
            capacity_threshold=result.get("capacity_threshold", 0.8),
            risk_band_cuts=result.get("risk_band_cuts", [0.25, 0.50, 0.75]),
            mps=result.get("mps", []),
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")
    finally:
        # Clean up temp files
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir, ignore_errors=True)


# ── Run directly ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
