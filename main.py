from fastapi import FastAPI
from routes.ml_route import ml_router

app = FastAPI(
    title="ML Model Prediction"
)

app.include_router(ml_router)

@app.get("/root")
async def root():
    return {
        "status" : "Running"
    }