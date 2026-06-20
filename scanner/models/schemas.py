from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class Finding(BaseModel):
    id: str = Field(..., description="Unique identifier for the finding")
    resource_type: str = Field(..., description="Type of GCP resource (e.g., bucket, firewall, vm)")
    resource_name: str = Field(..., description="Name of the GCP resource")
    risk_score: int = Field(..., ge=0, le=100, description="Risk score from 0 (low) to 100 (critical)")
    description: str = Field(..., description="Brief description of the issue")
    recommendation: str = Field(..., description="Suggested remediation steps")
    details: dict = Field(default_factory=dict, description="Additional data for the finding")

class ScanResult(BaseModel):
    scan_id: str = Field(..., description="Unique identifier for the scan run")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When the scan was performed")
    findings: List[Finding] = Field(default_factory=list, description="List of all findings detected in the scan")
