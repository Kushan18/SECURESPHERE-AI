import os
import json
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, status
from auth import get_current_user
from models import AIRequest, AIChatRequest

router = APIRouter(prefix="/ai", tags=["ai"])

# Initialize Gemini SDK
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    # We fallback to standard check or raise an error if not present.
    # The SDK will automatically pick up the API key if set in environment.
    pass
else:
    genai.configure(api_key=GEMINI_API_KEY)

@router.post("/explain")
def explain_finding(request: AIRequest, current_user: dict = Depends(get_current_user)):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API Key is not set in backend configuration."
        )
        
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        You are a Cloud Security Architect. Analyze this GCP security finding and return an explanation and remediation command.
        
        Finding details:
        - Resource Name: {request.resource_name}
        - Resource Type: {request.resource_type}
        - Severity: {request.severity}
        - Description: {request.description}
        - Risk Score: {request.risk_score}/100
        
        Provide the explanation in clear, simple English, explaining what the risk is and the business/security impact. Also, provide a specific CLI command (e.g. gcloud CLI) or a snippet (like Terraform or config block) that resolves this issue.
        
        You MUST respond with a JSON object containing EXACTLY these two keys:
        {{
            "explanation": "A plain English markdown-formatted explanation containing: 1. Risk explanation, 2. Threat scenario, 3. Step-by-step resolution details.",
            "fix_command": "A specific gcloud command or code snippet to run to fix the vulnerability."
        }}
        
        Return ONLY the raw JSON. Do not wrap the JSON in markdown code blocks like ```json ... ```. Just return the JSON object directly.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean potential markdown wrapping if Gemini wraps the output in ```json...``` anyway
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
            
        try:
            data = json.loads(text)
            explanation = data.get("explanation", "")
            fix_command = data.get("fix_command", "")
        except Exception:
            # Fallback if json parsing fails, treat the response text as explanation
            explanation = text
            fix_command = "Please refer to Google Cloud console to configure security configurations manually."
            
        return {
            "explanation": explanation,
            "fix_command": fix_command
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini API error: {str(e)}"
        )

@router.post("/chat")
def chat_security(request: AIChatRequest, current_user: dict = Depends(get_current_user)):
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gemini API Key is not set in backend configuration."
        )
        
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        system_instruction = (
            "You are SecureSphere AI, a cloud security chatbot. Help the user with their questions about "
            "cloud security, vulnerability remediation, container security, and cloud compliance (GCP, AWS, Azure). "
            "Keep your responses clear, helpful, professional, and formatted in clean markdown. "
            "Do not answer questions unrelated to cloud security or computer science. If asked about unrelated things, "
            "politely redirect back to cloud security.\n\n"
        )
        
        chat_prompt = system_instruction
        for message in request.history:
            role = "User" if message.get("role") == "user" else "Assistant"
            chat_prompt += f"{role}: {message.get('content')}\n"
            
        chat_prompt += f"User: {request.message}\nAssistant:"
        
        response = model.generate_content(chat_prompt)
        return {
            "response": response.text.strip()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini API error: {str(e)}"
        )
