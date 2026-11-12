
from typing import Literal, List, Optional
from pydantic import BaseModel, Field


class RoadmapPhase(BaseModel):
    phase: str
    focus: str
    action_items: List[str]


class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(min_length=50, max_length=30000)
    job_title: str = Field(min_length=1, max_length=200)
    company: str = Field(default="Not specified", max_length=200)
    required_skills: list[str] = Field(default_factory=list)
    job_description: str = Field(default="", max_length=15000)


class ResumeAnalysisResponse(BaseModel):
    match_score: int = Field(ge=0, le=100)
    technical_score: int = Field(default=70, ge=0, le=100)
    experience_score: int = Field(default=70, ge=0, le=100)
    seniority_detected: str = Field(default="Entry-Level / Student")
    seniority_required: str = Field(default="Entry-Level")
    summary: str
    matched_skills: list[str] = Field(default_factory=list)
    critical_missing_skills: list[str] = Field(default_factory=list)
    secondary_missing_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    learning_roadmap: list[RoadmapPhase] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    interview_questions: list[str] = Field(default_factory=list)
    method: str = Field(default="gemini-llm")
    disclaimer: str = Field(
        default="A match score is an estimate of alignment with the job requirements, not a guarantee of selection."
    )

class PlacementQuestionRequest(BaseModel):
    job_role: str = Field(min_length=2, max_length=100)
    difficulty: Literal["easy", "medium", "hard"] = "medium"


class PlacementQuestion(BaseModel):
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    correct_answer: str
    explanation: str
    topic: str


class PlacementQuestionSection(BaseModel):
    section: Literal["aptitude", "logical_reasoning", "programming"]
    questions: list[PlacementQuestion] = Field(min_length=20, max_length=20)


class PlacementQuestionResponse(BaseModel):
    job_role: str
    difficulty: str
    sections: list[PlacementQuestionSection] = Field(min_length=3, max_length=3)

