from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
app = FastAPI(title="SecureSphere AI") 
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]) 
 
@app.get("/") 
def root(): return {"service": "SecureSphere AI", "status": "running"} 
 
@app.get("/health") 
def health(): return {"status": "healthy"} 
