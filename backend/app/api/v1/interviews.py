from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.database import get_db
from app.models.interview import Interview, Submission, TokenBalance
from app.services.ai_service import generate_questions, evaluate_submission
from app.metrics import interviews_created, submissions_total, tokens_consumed, free_trial_used

router = APIRouter(prefix="/interviews", tags=["interviews"])

class CreateInterviewRequest(BaseModel):
    job_title: str
    job_requirements: str
    key_skills: list[str] = []

class CreateInterviewResponse(BaseModel):
    id: str
    hr_access_code: str
    interview_url: str
    results_url: str
    questions: list[dict]

class SubmitAnswersRequest(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    answers: list[dict]  # [{question_id, answer}]

class InterviewDetails(BaseModel):
    id: str
    job_title: str
    questions: list[dict]

class SubmissionResult(BaseModel):
    id: str
    candidate_name: str
    candidate_email: str
    overall_score: float
    recommendation: str
    ai_summary: str
    scores: list[dict]
    submitted_at: str

FREE_INTERVIEWS_LIMIT = 1

async def check_tokens(device_id: str, db: AsyncSession) -> tuple[bool, str]:
    """Check if device has tokens available. Returns (allowed, message)."""
    result = await db.execute(select(TokenBalance).where(TokenBalance.device_id == device_id))
    balance = result.scalar_one_or_none()
    
    if not balance:
        # New device, allow one free interview
        balance = TokenBalance(device_id=device_id, free_trial_used=0, balance=0)
        db.add(balance)
        await db.commit()
        return True, "free_trial"
    
    # Check free trial
    if balance.free_trial_used < FREE_INTERVIEWS_LIMIT:
        return True, "free_trial"
    
    # Check paid tokens
    if balance.balance > 0:
        return True, "paid"
    
    return False, "no_tokens"

async def consume_token(device_id: str, token_type: str, db: AsyncSession):
    """Consume a token or free trial."""
    result = await db.execute(select(TokenBalance).where(TokenBalance.device_id == device_id))
    balance = result.scalar_one_or_none()
    
    if token_type == "free_trial":
        balance.free_trial_used += 1
        free_trial_used.labels(tool="ai-interviewer").inc()
    else:
        balance.balance -= 1
        tokens_consumed.labels(tool="ai-interviewer").inc()
    
    await db.commit()

@router.post("", response_model=CreateInterviewResponse)
async def create_interview(
    request: CreateInterviewRequest,
    x_device_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Create a new interview session with AI-generated questions."""
    # Check tokens
    allowed, token_type = await check_tokens(x_device_id, db)
    if not allowed:
        raise HTTPException(
            status_code=402,
            detail="No interviews remaining. Please purchase more interviews."
        )
    
    # Generate questions
    questions = await generate_questions(
        request.job_title,
        request.job_requirements,
        request.key_skills
    )
    
    # Create interview
    interview = Interview(
        job_title=request.job_title,
        job_requirements=request.job_requirements,
        key_skills=request.key_skills,
        questions=questions
    )
    db.add(interview)
    
    # Consume token
    await consume_token(x_device_id, token_type, db)
    await db.commit()
    await db.refresh(interview)
    
    interviews_created.labels(tool="ai-interviewer").inc()
    
    return CreateInterviewResponse(
        id=interview.id,
        hr_access_code=interview.hr_access_code,
        interview_url=f"/interview/{interview.id}",
        results_url=f"/results/{interview.id}?code={interview.hr_access_code}",
        questions=questions
    )

@router.get("/{interview_id}", response_model=InterviewDetails)
async def get_interview(interview_id: str, db: AsyncSession = Depends(get_db)):
    """Get interview details for candidates to answer."""
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Return questions without expected_focus (that's for HR only)
    questions = [{"id": q["id"], "text": q["text"]} for q in interview.questions]
    
    return InterviewDetails(
        id=interview.id,
        job_title=interview.job_title,
        questions=questions
    )

@router.post("/{interview_id}/submit")
async def submit_answers(
    interview_id: str,
    request: SubmitAnswersRequest,
    db: AsyncSession = Depends(get_db)
):
    """Submit candidate answers and get AI evaluation."""
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Check if already submitted
    existing = await db.execute(
        select(Submission).where(
            Submission.interview_id == interview_id,
            Submission.candidate_email == request.candidate_email
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already submitted answers for this interview")
    
    # Evaluate with AI
    interview_dict = {
        "job_title": interview.job_title,
        "job_requirements": interview.job_requirements,
        "questions": interview.questions
    }
    evaluation = await evaluate_submission(interview_dict, request.answers)
    
    # Create submission
    submission = Submission(
        interview_id=interview_id,
        candidate_name=request.candidate_name,
        candidate_email=request.candidate_email,
        answers=request.answers,
        scores=evaluation.get("scores", []),
        overall_score=evaluation.get("overall_score", 0),
        recommendation=evaluation.get("recommendation", "pending"),
        ai_summary=evaluation.get("summary", "")
    )
    db.add(submission)
    await db.commit()
    
    submissions_total.labels(tool="ai-interviewer").inc()
    
    return {
        "success": True,
        "message": "Thank you for completing the interview. The hiring team will review your responses."
    }

@router.get("/{interview_id}/results")
async def get_results(
    interview_id: str,
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all submissions for an interview (HR only with access code)."""
    result = await db.execute(select(Interview).where(Interview.id == interview_id))
    interview = result.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview.hr_access_code != code:
        raise HTTPException(status_code=403, detail="Invalid access code")
    
    # Get all submissions
    subs_result = await db.execute(
        select(Submission).where(Submission.interview_id == interview_id).order_by(Submission.overall_score.desc())
    )
    submissions = subs_result.scalars().all()
    
    return {
        "interview": {
            "id": interview.id,
            "job_title": interview.job_title,
            "job_requirements": interview.job_requirements,
            "questions": interview.questions,
            "created_at": interview.created_at.isoformat()
        },
        "submissions": [
            {
                "id": s.id,
                "candidate_name": s.candidate_name,
                "candidate_email": s.candidate_email,
                "overall_score": s.overall_score,
                "recommendation": s.recommendation,
                "ai_summary": s.ai_summary,
                "scores": s.scores,
                "answers": s.answers,
                "submitted_at": s.submitted_at.isoformat()
            }
            for s in submissions
        ],
        "summary": {
            "total": len(submissions),
            "recommended": len([s for s in submissions if s.recommendation == "recommend"]),
            "maybe": len([s for s in submissions if s.recommendation == "maybe"]),
            "not_recommended": len([s for s in submissions if s.recommendation == "not_recommended"])
        }
    }
