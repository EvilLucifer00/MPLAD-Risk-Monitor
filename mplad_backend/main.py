from fastapi import FastAPI, Depends, HTTPException
from routers.dashboard_router import dashboard_router
from routers.projects_route import project_router
from routers.report_route import report_router
from routers.user_router import user_router
from routers.document_router import document_router
from fastapi.middleware.cors import CORSMiddleware

# Initialize the main FastAPI application with title and version
app = FastAPI(title="MPLADS Risk Monitor API", version="1.0")

# Configure Cross-Origin Resource Sharing (CORS) middleware
# This allows the frontend (hosted on Vercel or running locally) to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mplad-risk-monitor.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"], # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Allow all headers in requests
)

# Include all the specialized routers to organize the API endpoints
app.include_router(dashboard_router) # Endpoints related to dashboard statistics
app.include_router(project_router)   # Endpoints for project creation, listing, and management
app.include_router(report_router)    # Endpoints for generating and managing reports
app.include_router(user_router)      # Endpoints for user management and authentication
app.include_router(document_router)  # Endpoints for uploading and handling documents
