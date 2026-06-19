from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr

class FindingModel(BaseModel):
    id: Optional[str] = None
    scan_id: str
    resource_name: str
    resource_type: str
    severity: str
    description: str
    risk_score: int
    fix_command: Optional[str] = None
    created_at: Optional[str] = None

class ScanModel(BaseModel):
    id: Optional[str] = None
    user_id: str
    status: str
    score: int
    total_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    created_at: Optional[str] = None

class AIRequest(BaseModel):
    finding_id: str
    resource_name: str
    resource_type: str
    severity: str
    description: str
    risk_score: int

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
