from fastapi import FastAPI
from routes.ml_route import ml_router

# Initialize the standalone FastAPI application for the ML Model Microservice
app = FastAPI(
    title="ML Model Prediction"
)

# Include the router that handles ML predictions
app.include_router(ml_router)

@app.get("/root")
async def root():
    """
    Health check endpoint to verify the ML service is running.
    """
    return {
        "status" : "Running"
    }