from fastapi import APIRouter
from final_pipeline.schema.new_project_schema import ProjectSchema
from final_pipeline.run_pipeline import run_pipeline_from_json

# Initialize the router for ML workload processing
ml_router = APIRouter(
    prefix="/ml/work"
)


@ml_router.get("/predict")
async def get_risk_output(new_project: dict):
    """
    Accepts project data as a dictionary, runs it through the machine learning pipeline,
    and returns a comprehensive risk assessment (including anomalies, ghost work detection, etc.)
    """
    # Execute the core ML pipeline with the provided JSON project data
    result = run_pipeline_from_json(new_project)

    # Return the generated risk scores and flagged anomalies
    return {
        "data" : result
    }
