from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.review import router as review_router

app = FastAPI(title="ReviewForge API")

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router)