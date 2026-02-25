from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time
from app.database import init_db
from app.api.v1 import interviews, payment
from app.metrics import router as metrics_router, http_requests, http_request_duration, crawler_visits

BOT_PATTERNS = ["Googlebot", "bingbot", "Baiduspider", "YandexBot", "DuckDuckBot", "Slurp", "facebot"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="AI Interviewer",
    description="AI-powered text interview screening agent",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request tracking middleware
@app.middleware("http")
async def track_requests(request: Request, call_next):
    start_time = time.time()
    
    # Track crawlers
    ua = request.headers.get("user-agent", "")
    for bot in BOT_PATTERNS:
        if bot.lower() in ua.lower():
            crawler_visits.labels(tool="ai-interviewer", bot=bot).inc()
            break
    
    response = await call_next(request)
    
    # Record metrics
    duration = time.time() - start_time
    endpoint = request.url.path
    method = request.method
    status = response.status_code
    
    http_requests.labels(
        tool="ai-interviewer",
        endpoint=endpoint,
        method=method,
        status=status
    ).inc()
    
    http_request_duration.labels(
        tool="ai-interviewer",
        endpoint=endpoint,
        method=method
    ).observe(duration)
    
    return response

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-interviewer"}

# Include routers
app.include_router(interviews.router, prefix="/api/v1")
app.include_router(payment.router, prefix="/api/v1")
app.include_router(metrics_router)
