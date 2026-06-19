from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from database import test_connection
from auth import router as auth_router
from scanner import router as scanner_router
from ai_advisor import router as ai_router

app = FastAPI(title="SecureSphere AI Backend", version="1.0.0")

# Enable CORS for all origins, methods, and headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_client():
    print("Testing MongoDB connection on startup...")
    success = test_connection()
    if success:
        print("MongoDB startup connection test successful.")
    else:
        print("MongoDB startup connection test failed. Please verify configurations.")

@app.get("/")
def root():
    return {"message": "SecureSphere AI Backend Running", "status": "healthy"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "SecureSphere AI"}

# Include routers
app.include_router(auth_router)
app.include_router(scanner_router)
app.include_router(ai_router)