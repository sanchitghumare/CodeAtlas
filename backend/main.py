from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.review import router as review_router
from app.api.chat import router as chat_router

app = FastAPI(title="ReviewForge API")
app.include_router(chat_router)

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