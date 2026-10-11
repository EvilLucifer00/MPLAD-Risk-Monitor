from fastapi import APIRouter, HTTPException
from final_pipeline.src.schema.new_project_schema import ProjectSchema
from final_pipeline.src.run_pipeline import run_pipeline_from_json

# Initialize the router for ML workload processing
ml_router = APIRouter(
    prefix="/ml/work"
)


@ml_router.post("/predict")
@ml_router.get("/predict")
async def get_risk_output(new_project: dict):
    """
    Accepts project data as a dictionary (either {"works": [...]} or a single work entry),
    runs it through the machine learning pipeline, and returns a comprehensive risk assessment.
    """
    # Normalize input: if user sent a single work object directly, wrap it in {"works": [...]}
    if "works" not in new_project and "work_id" in new_project:
        new_project = {"works": [new_project]}

    try:
        # Execute the core ML pipeline with the provided JSON project data
        result = run_pipeline_from_json(new_project)

        # Return the generated risk scores and flagged anomalies
        return {
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")
