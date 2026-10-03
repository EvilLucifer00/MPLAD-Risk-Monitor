from fastapi import FastAPI,Depends, HTTPException
from routers.dashboard_router import dashboard_router
from routers.projects_route import project_router
from routers.report_route import report_router
from routers.user_router import user_router
from routers.document_router import document_router
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(title="MPLADS Risk Monitor API", version="1.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mplad-risk-monitor.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(project_router)
app.include_router(report_router)
app.include_router(user_router)
app.include_router(document_router)

