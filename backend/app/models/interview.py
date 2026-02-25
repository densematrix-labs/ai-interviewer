from sqlalchemy import Column, String, Text, DateTime, JSON, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def generate_access_code():
    return str(uuid.uuid4())[:8].upper()

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_title = Column(String(255), nullable=False)
    job_requirements = Column(Text, nullable=False)
    key_skills = Column(JSON, default=list)
    questions = Column(JSON, default=list)  # List of {id, text, expected_focus}
    hr_access_code = Column(String(8), default=generate_access_code)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    submissions = relationship("Submission", back_populates="interview", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    interview_id = Column(String(36), ForeignKey("interviews.id"), nullable=False)
    candidate_name = Column(String(255), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    answers = Column(JSON, default=list)  # List of {question_id, answer}
    scores = Column(JSON, default=list)  # List of {question_id, score, comment}
    overall_score = Column(Float, default=0.0)
    recommendation = Column(String(20), default="pending")  # recommend, maybe, not_recommended, pending
    ai_summary = Column(Text, default="")
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    interview = relationship("Interview", back_populates="submissions")

class TokenBalance(Base):
    __tablename__ = "token_balances"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(String(64), unique=True, nullable=False, index=True)
    balance = Column(Integer, default=0)
    free_trial_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    device_id = Column(String(64), nullable=False, index=True)
    checkout_id = Column(String(255), unique=True)
    product_id = Column(String(255))
    amount_cents = Column(Integer)
    currency = Column(String(3), default="USD")
    status = Column(String(20), default="pending")  # pending, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
