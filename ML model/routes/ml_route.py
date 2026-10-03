from fastapi import APIRouter
from final_pipeline.schema.new_project_schema import ProjectSchema
from final_pipeline.run_pipeline import run_pipeline_from_json

ml_router = APIRouter(
    prefix="/ml/work"
)


@ml_router.get("/predict")
async def get_risk_output(new_project:dict):

    result = run_pipeline_from_json(new_project)

    return {
        "data" : result
    }
