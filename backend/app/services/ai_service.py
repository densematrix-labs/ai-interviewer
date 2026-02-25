import httpx
import json
from app.config import get_settings

settings = get_settings()

async def generate_questions(job_title: str, job_requirements: str, key_skills: list[str]) -> list[dict]:
    """Generate interview questions based on job requirements."""
    skills_text = ", ".join(key_skills) if key_skills else "general skills"
    
    prompt = f"""You are an expert HR interviewer. Generate 6 screening interview questions for the following position:

Job Title: {job_title}
Requirements: {job_requirements}
Key Skills: {skills_text}

Generate questions that:
1. Assess relevant experience and skills
2. Include behavioral questions (STAR method suitable)
3. Include one technical/practical scenario
4. Are answerable in text format (no video/audio required)

Return a JSON array with exactly 6 questions. Each question should have:
- "id": number (1-6)
- "text": the question text
- "expected_focus": what a good answer should address

Example format:
[
  {{"id": 1, "text": "Tell me about...", "expected_focus": "Looking for specific examples of..."}}
]

Return ONLY valid JSON, no markdown or explanation."""

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.LLM_PROXY_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.LLM_PROXY_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 2000,
                "temperature": 0.7
            }
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        
        # Parse JSON from response
        try:
            # Handle potential markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content.strip())
        except json.JSONDecodeError:
            # Fallback questions
            return [
                {"id": 1, "text": f"Tell me about your experience relevant to {job_title}.", "expected_focus": "Relevant experience"},
                {"id": 2, "text": "What interests you about this position?", "expected_focus": "Motivation and fit"},
                {"id": 3, "text": "Describe a challenging project you've worked on.", "expected_focus": "Problem-solving skills"},
                {"id": 4, "text": "How do you handle tight deadlines?", "expected_focus": "Time management"},
                {"id": 5, "text": "What are your key strengths?", "expected_focus": "Self-awareness"},
                {"id": 6, "text": "Do you have any questions about the role?", "expected_focus": "Engagement and curiosity"}
            ]

async def evaluate_submission(interview: dict, answers: list[dict]) -> dict:
    """Evaluate candidate's answers."""
    questions_text = "\n".join([f"Q{q['id']}: {q['text']} (Focus: {q['expected_focus']})" for q in interview["questions"]])
    answers_text = "\n".join([f"A{a['question_id']}: {a['answer']}" for a in answers])
    
    prompt = f"""You are an expert HR interviewer evaluating a candidate's screening interview responses.

Position: {interview["job_title"]}
Requirements: {interview["job_requirements"]}

Questions and Expected Focus:
{questions_text}

Candidate's Answers:
{answers_text}

Evaluate each answer on a scale of 1-5:
- 5: Excellent - comprehensive, specific examples, clear communication
- 4: Good - solid response with relevant details
- 3: Average - acceptable but lacks depth
- 2: Below Average - vague or partially relevant
- 1: Poor - irrelevant or very weak response

Return a JSON object with:
- "scores": array of {{"question_id": number, "score": 1-5, "comment": "brief feedback"}}
- "overall_score": weighted average (number 1-5)
- "recommendation": "recommend" (>=4.0), "maybe" (3.0-3.9), or "not_recommended" (<3.0)
- "summary": 2-3 sentence overall assessment

Return ONLY valid JSON."""

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.LLM_PROXY_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.LLM_PROXY_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1500,
                "temperature": 0.3
            }
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content.strip())
        except json.JSONDecodeError:
            # Fallback evaluation
            return {
                "scores": [{"question_id": a["question_id"], "score": 3, "comment": "Evaluation pending"} for a in answers],
                "overall_score": 3.0,
                "recommendation": "maybe",
                "summary": "Unable to fully evaluate responses. Please review manually."
            }
