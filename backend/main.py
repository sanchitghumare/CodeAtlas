import asyncio
from contextlib import asynccontextmanager

from app.api.chat import router as chat_router
from app.api.review import cleanup_expired_jobs
from app.api.review import router as review_router
from app.services.config import JOB_CLEANUP_INTERVAL
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware


async def _job_cleanup_loop() -> None:
    while True:
        await asyncio.sleep(JOB_CLEANUP_INTERVAL)
        cleanup_expired_jobs()


@asynccontextmanager
async def lifespan(_: FastAPI):
    cleanup_task = asyncio.create_task(_job_cleanup_loop())
    try:
        yield
    finally:
        cleanup_task.cancel()
        await asyncio.gather(cleanup_task, return_exceptions=True)


app = FastAPI(title="CodeAtlas API", lifespan=lifespan)
app.include_router(chat_router)
app.include_router(review_router)
from app.core.limiter import limiter

app.state.limiter = limiter
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please try again later."
        },
    )

app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
