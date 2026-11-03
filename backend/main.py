import time
import logging
import uuid


from fastapi import FastAPI,Depends, HTTPException, Request
from routers.dashboard_router import dashboard_router
from routers.projects_route import project_router
from routers.report_route import report_router
from routers.user_router import user_router
from routers.document_router import document_router
from routers.notification_router import notification_router
from fastapi.middleware.cors import CORSMiddleware


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api.performance")

app = FastAPI(title="MPLADS Risk Monitor API", version="1.0")


@app.middleware("http")
async def performance_middleware(request:Request,call_next):
    request_id = str(uuid.uuid4())[:8]
    start_time = time.perf_counter()
    
    request.state.request_id = request_id
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        
        elapsed_ms = (time.perf_counter() - start_time)*1000
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.2f}"
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception :
        logger.exception(
            "request_id=%s method=%s path=%s unhandled_exception",
            request_id,
            request.method,
            request.url.path,
        )
        raise
    finally:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        logger.info(
            "request_id=%s method=%s path=%s status=%s "
            "duration_ms=%.2f",
            request_id,
            request.method,
            request.url.path,
            status_code,
            elapsed_ms,
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mplad-risk-monitor.vercel.app",
        "http://localhost:3000",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time-Ms", "X-Request-ID"],
)

app.include_router(dashboard_router)
app.include_router(project_router)
app.include_router(report_router)
app.include_router(user_router)
app.include_router(document_router)
app.include_router(notification_router)

@app.get("/health")
async def root():
    return {
        "status" : "Backend running !!!!"
    }

