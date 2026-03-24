from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os

from routers import search, ai, listing

load_dotenv()

app = FastAPI(title="PinTraderAI API")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-secret-change-me"),
    https_only=True,
    same_site="none",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://trina-unpermitting-fatimah.ngrok-free.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(listing.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
