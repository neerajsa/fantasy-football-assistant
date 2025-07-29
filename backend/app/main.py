from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .api import draft_config, custom_rankings

load_dotenv()

app = FastAPI(
    title="Fantasy Football Draft Assistant API",
    description="API for fantasy football draft configuration and assistance",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(draft_config.router)
app.include_router(custom_rankings.router)

@app.get("/")
async def root():
    return {"message": "Fantasy Football Draft Assistant API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}