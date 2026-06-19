import os
import sys
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from database import scans_collection, findings_collection
from auth import get_current_user
from models import ScanModel, FindingModel

# Add the scanner folder path to sys.path to import security_checks
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "scanner")))
from security_checks import run_security_scan

router = APIRouter(prefix="/scan", tags=["scanner"])

@router.post("/run")
def run_scan(current_user: dict = Depends(get_current_user)):
    # Run the simulated security scanner
    raw_findings = run_security_scan()
    
    # Calculate counts by severity
    critical = sum(1 for f in raw_findings if f["severity"] == "CRITICAL")
    high = sum(1 for f in raw_findings if f["severity"] == "HIGH")
    medium = sum(1 for f in raw_findings if f["severity"] == "MEDIUM")
    low = sum(1 for f in raw_findings if f["severity"] == "LOW")
    total = len(raw_findings)
    
    # Calculate security score (starts at 100, deduct based on severities)
    # Critical: -20, High: -12, Medium: -6, Low: -2
    deductions = (critical * 20) + (high * 12) + (medium * 6) + (low * 2)
    score = max(0, 100 - deductions)
    
    # Create the scan record
    scan_doc = {
        "user_id": current_user["id"],
        "status": "COMPLETED",
        "score": score,
        "total_findings": total,
        "critical_findings": critical,
        "high_findings": high,
        "medium_findings": medium,
        "low_findings": low,
        "created_at": datetime.utcnow()
    }
    
    scan_result = scans_collection.insert_one(scan_doc)
    scan_id = str(scan_result.inserted_id)
    scan_doc["id"] = scan_id
    del scan_doc["_id"]
    scan_doc["created_at"] = scan_doc["created_at"].isoformat()
    
    # Create individual finding records in MongoDB
    findings_list = []
    for rf in raw_findings:
        finding_doc = {
            "scan_id": scan_id,
            "resource_name": rf["resource_name"],
            "resource_type": rf["resource_type"],
            "severity": rf["severity"],
            "description": rf["description"],
            "risk_score": rf["risk_score"],
            "created_at": datetime.utcnow()
        }
        finding_result = findings_collection.insert_one(finding_doc)
        finding_doc["id"] = str(finding_result.inserted_id)
        del finding_doc["_id"]
        finding_doc["created_at"] = finding_doc["created_at"].isoformat()
        findings_list.append(finding_doc)
        
    return {
        "scan": scan_doc,
        "findings": findings_list
    }

@router.get("/history")
def get_scan_history(current_user: dict = Depends(get_current_user)):
    cursor = scans_collection.find({"user_id": current_user["id"]}).sort("created_at", -1)
    scans = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        if "created_at" in doc and isinstance(doc["created_at"], datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        scans.append(doc)
    return scans

@router.get("/{scan_id}")
def get_scan_details(scan_id: str, current_user: dict = Depends(get_current_user)):
    try:
        scan_oid = ObjectId(scan_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scan ID format"
        )
        
    scan = scans_collection.find_one({"_id": scan_oid})
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan report not found"
        )
        
    # Security check: Ensure scan belongs to the user requesting it
    if scan.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this scan report"
        )
        
    scan["id"] = str(scan["_id"])
    del scan["_id"]
    if "created_at" in scan and isinstance(scan["created_at"], datetime):
        scan["created_at"] = scan["created_at"].isoformat()
        
    # Get associated findings
    cursor = findings_collection.find({"scan_id": scan_id})
    findings = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        if "created_at" in doc and isinstance(doc["created_at"], datetime):
            doc["created_at"] = doc["created_at"].isoformat()
        findings.append(doc)
        
    return {
        "scan": scan,
        "findings": findings
    }
