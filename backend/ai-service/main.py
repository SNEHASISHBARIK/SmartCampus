import json
import os
import re
import time
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google import genai
from google.genai import types

from schemas import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    RoadmapPhase,
    PlacementQuestionRequest,
    PlacementQuestion,
    PlacementQuestionSection,
    PlacementQuestionResponse,
)

load_dotenv()

PREFERRED_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
API_KEY = os.getenv("GEMINI_API_KEY")

FALLBACK_MODELS = [
    PREFERRED_MODEL,
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
]
MODELS_TO_TRY = list(dict.fromkeys(FALLBACK_MODELS))

app = FastAPI(
    title="SmartCampus Resume AI",
    version="1.1.0",
)

client = None
if API_KEY and API_KEY != "YOUR_GEMINI_API_KEY":
    try:
        client = genai.Client(
            api_key=API_KEY,
            http_options=types.HttpOptions(
                timeout=25000,
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        )
    except Exception as e:
        print(f"[Resume AI] Warning: failed to initialize GenAI client: {e}")


def extract_skills_from_text(text: str) -> List[str]:
    common_skills = [
        "python", "javascript", "typescript", "java", "c++", "c#", "html", "css",
        "react", "react.js", "next.js", "node.js", "express", "angular", "vue",
        "sql", "mysql", "postgresql", "mongodb", "redis", "docker", "kubernetes",
        "aws", "azure", "gcp", "git", "github", "linux", "rest apis", "restful apis",
        "graphql", "machine learning", "deep learning", "nlp", "pandas", "numpy",
        "tensorflow", "pytorch", "data analysis", "data structures", "algorithms",
        "agile", "scrum", "system design", "microservices", "unit testing", "jest",
        "communication", "teamwork", "problem solving", "leadership"
    ]
    lower_text = text.lower()
    found = []
    for skill in common_skills:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, lower_text):
            found.append(skill.title() if len(skill) > 3 else skill.upper())
    return found


def detect_seniority(text: str) -> str:
    lower = text.lower()
    if any(k in lower for k in ["director", "vp", "head of", "principal", "manager"]):
        return "Management / Leadership"
    if any(k in lower for k in ["lead", "staff", "senior", "sr.", "architect", "5+ years", "7+ years", "8+ years"]):
        return "Senior / Lead"
    if any(k in lower for k in ["mid-level", "mid level", "intermediate", "3+ years", "2+ years", "3-5 years"]):
        return "Mid-Level"
    if any(k in lower for k in ["student", "intern", "junior", "associate", "fresher", "entry-level", "graduate", "0-2 years"]):
        return "Entry-Level / Student"
    return "Entry-Level / Student"


def generate_fallback_analysis(request: ResumeAnalysisRequest) -> ResumeAnalysisResponse:
    resume_skills = set(extract_skills_from_text(request.resume_text))
    job_text = f"{request.job_title} {request.job_description}"
    job_skills = set(extract_skills_from_text(job_text))

    for sk in request.required_skills:
        job_skills.add(sk.strip().title())

    if not job_skills:
        job_skills = {"Problem Solving", "Data Structures", "Git", "REST APIs"}

    matched = [s for s in job_skills if any(s.lower() == r.lower() for r in resume_skills)]
    missing = [s for s in job_skills if not any(s.lower() == r.lower() for r in resume_skills)]

    if not matched and resume_skills:
        matched = list(resume_skills)[:4]

    # Seniority detection
    job_seniority = detect_seniority(job_text)
    resume_seniority = detect_seniority(request.resume_text)

    # Separate critical from secondary missing skills
    job_title_lower = request.job_title.lower()
    critical_missing = []
    secondary_missing = []

    for m in missing:
        if m.lower() in job_title_lower or any(w in m.lower() for w in ["python", "react", "java", "node", "sql"]):
            critical_missing.append(m)
        else:
            secondary_missing.append(m)

    if not critical_missing and missing:
        critical_missing = missing[:2]
        secondary_missing = missing[2:]

    # Technical Score: proportion of technical job skills matched
    tech_score = int(min(98, max(25, (len(matched) / max(len(job_skills), 1)) * 100)))

    # Experience Score: evaluates seniority match
    if job_seniority in ["Management / Leadership", "Senior / Lead"] and resume_seniority.startswith("Entry"):
        exp_score = 35
    elif job_seniority == "Mid-Level" and resume_seniority.startswith("Entry"):
        exp_score = 65
    else:
        exp_score = 85

    # Overall weighted score: 70% technical, 30% experience alignment
    match_score = int(round(tech_score * 0.70 + exp_score * 0.30))

    summary = (
        f"Evaluated candidate profile against {request.job_title} at {request.company}. "
        f"Demonstrates strong alignment in {len(matched)} technical competencies, with "
        f"{'seniority' if exp_score < 60 else 'tooling'} gaps identified."
    )

    # Learning Roadmap
    top_critical = critical_missing[0] if critical_missing else (missing[0] if missing else "Cloud Deployment")
    top_secondary = secondary_missing[0] if secondary_missing else "CI/CD & Testing"

    roadmap = [
        RoadmapPhase(
            phase="Phase 1 (Week 1-2): Core Concept & Syntax Mastery",
            focus=f"Foundational understanding of {top_critical}",
            action_items=[
                f"Complete intensive exercises on {top_critical} fundamentals and architectural patterns.",
                "Review official documentation and core APIs relevant to modern production use.",
            ],
        ),
        RoadmapPhase(
            phase="Phase 2 (Week 3-4): Hands-On Production Project",
            focus=f"Integration of {top_critical} with {matched[0] if matched else 'core stack'}",
            action_items=[
                f"Build a showcase full-stack application utilizing {top_critical} and {top_secondary}.",
                "Implement automated unit tests and Dockerize the application for portfolio deployment.",
            ],
        ),
        RoadmapPhase(
            phase="Phase 3 (Week 5-6): System Design & Interview Practice",
            focus="Scenario-based technical interview mastery",
            action_items=[
                f"Prepare answers for trade-off decisions between {matched[0] if matched else 'your stack'} and alternative architectures.",
                f"Quantify bullet points on your resume highlighting latency or scalability impact.",
            ],
        ),
    ]

    suggestions = [
        f"Priority Gap: Emphasize practical experience with {critical_missing[0] if critical_missing else 'core requirements'} on your resume.",
        "Add quantifiable metrics (e.g. 'boosted throughput by 30%', 'reduced bundle size by 20%').",
        f"Tailor project descriptions to highlight requirements mentioned in the {request.job_title} listing.",
    ]

    interview_questions = [
        f"Can you explain a production problem you resolved using {matched[0] if matched else 'your primary stack'}?",
        f"How would you approach introducing and integrating {top_critical} into an existing software architecture?",
        f"What trade-offs do you consider when designing scalable REST or microservice architectures?",
    ]

    return ResumeAnalysisResponse(
        match_score=match_score,
        technical_score=tech_score,
        experience_score=exp_score,
        seniority_detected=resume_seniority,
        seniority_required=job_seniority,
        summary=summary,
        matched_skills=matched,
        critical_missing_skills=critical_missing[:5],
        secondary_missing_skills=secondary_missing[:5],
        missing_skills=missing[:8],
        learning_roadmap=roadmap,
        suggestions=suggestions[:4],
        interview_questions=interview_questions[:4],
        method="rule-based",
        disclaimer="A match score is an estimate of alignment with the job requirements, not a guarantee of selection.",
    )


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "SmartCampus Python Resume AI",
        "gemini_configured": client is not None,
        "active_models": MODELS_TO_TRY,
    }


@app.post(
    "/analyze",
    response_model=ResumeAnalysisResponse,
)
def analyze_resume(request: ResumeAnalysisRequest):
    prompt = f"""You are an expert technical recruiter and resume analysis assistant for SmartCampus.

Analyze the candidate's resume against the selected job.
Use ONLY evidence from the resume and job details provided.
Do not invent skills, experience, qualifications, or achievements.

JOB TITLE: {request.job_title}
COMPANY: {request.company}
REQUIRED SKILLS: {json.dumps(request.required_skills)}
JOB DESCRIPTION:
{request.job_description}

RESUME TEXT:
{request.resume_text}

Return ONLY valid JSON matching this exact structure:
{{
  "match_score": 0,
  "technical_score": 0,
  "experience_score": 0,
  "seniority_detected": "Entry-Level / Student",
  "seniority_required": "Mid-Level",
  "summary": "A concise explanation of the candidate match",
  "matched_skills": ["Skill1", "Skill2"],
  "critical_missing_skills": ["Must-have skill 1"],
  "secondary_missing_skills": ["Nice-to-have skill 1"],
  "missing_skills": ["Must-have skill 1", "Nice-to-have skill 1"],
  "learning_roadmap": [
    {{
      "phase": "Phase 1 (Week 1-2): Core Gap Foundations",
      "focus": "Master core syntax and paradigms",
      "action_items": ["Action item 1", "Action item 2"]
    }},
    {{
      "phase": "Phase 2 (Week 3-4): Project Implementation",
      "focus": "Build a portfolio project",
      "action_items": ["Action item 1", "Action item 2"]
    }},
    {{
      "phase": "Phase 3 (Week 5-6): Interview Readiness",
      "focus": "Architecture and mock interview questions",
      "action_items": ["Action item 1", "Action item 2"]
    }}
  ],
  "suggestions": ["Concrete suggestion 1", "Concrete suggestion 2"],
  "interview_questions": ["Question 1", "Question 2"],
  "disclaimer": "A match score is an estimate of alignment with the job requirements, not a guarantee of selection."
}}

Rules:
- match_score must be an integer between 0 and 100 representing overall alignment.
- technical_score: evaluate technical competencies (0-100).
- experience_score: evaluate seniority, years, and scope match (0-100).
- Do not treat every missing skill equally: prioritize critical must-haves in critical_missing_skills vs secondary tools in secondary_missing_skills.
- suggestions and learning_roadmap should be truthful, actionable, and specific.
"""

    start_time = time.time()
    print(
        f"[Resume AI] Request received for '{request.job_title}' at '{request.company}'. "
        f"Length: {len(request.resume_text)} chars",
        flush=True,
    )

    if client is not None:
        for model in MODELS_TO_TRY:
            try:
                print(f"[Resume AI] Trying Gemini model: {model}...", flush=True)
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                )

                output_text = response.text
                if not output_text:
                    continue

                cleaned = output_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1]
                    if cleaned.endswith("```"):
                        cleaned = cleaned[:-3].strip()
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:].strip()

                result = json.loads(cleaned)
                validated = ResumeAnalysisResponse.model_validate(result)
                validated.method = "gemini-llm"
                print(
                    f"[Resume AI] Success with {model} in {time.time() - start_time:.2f}s "
                    f"(Score: {validated.match_score}%, Tech: {validated.technical_score}%, Exp: {validated.experience_score}%)",
                    flush=True,
                )
                return validated

            except Exception as model_err:
                print(
                    f"[Resume AI] Model {model} failed: {type(model_err).__name__}: {model_err}",
                    flush=True,
                )
                continue

    # If all models failed or client not configured, use heuristic rule-based analyzer
    print(
        f"[Resume AI] Falling back to rule-based resume matcher after {time.time() - start_time:.2f}s",
        flush=True,
    )
    return generate_fallback_analysis(request)


@app.post(
    "/placement-practice/generate",
    response_model=PlacementQuestionResponse,
)
def generate_placement_questions(request: PlacementQuestionRequest):
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured. Check GEMINI_API_KEY.",
        )

    prompt = f"""
You are an expert placement-test question setter for SmartCampus.

Generate exactly 60 original multiple-choice questions for a student
preparing for the job role: {request.job_role}

Difficulty: {request.difficulty}

Create exactly these three sections:
1. aptitude: 20 quantitative aptitude questions
2. logical_reasoning: 20 logical reasoning questions
3. programming: 20 programming questions relevant to {request.job_role}

Every question must have:
- A clear question statement.
- Exactly four distinct answer options.
- correct_answer matching one option exactly.
- A concise, accurate explanation.
- A topic label.

Avoid duplicate questions and ambiguous answers.
For programming questions, tailor the content to the selected job role.
Do not include questions that require unavailable images or external files.

Return ONLY valid JSON matching this structure:
{{
  "job_role": "{request.job_role}",
  "difficulty": "{request.difficulty}",
  "sections": [
    {{
      "section": "aptitude",
      "questions": [
        {{
          "question": "Example question?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A",
          "explanation": "Explanation of the correct answer.",
          "topic": "Percentages"
        }}
      ]
    }},
    {{
      "section": "logical_reasoning",
      "questions": []
    }},
    {{
      "section": "programming",
      "questions": []
    }}
  ]
}}

The example demonstrates the required fields. Each of the three sections
must contain exactly 20 complete questions.
"""

    errors = []
    # For large multi-section question generation, prioritize faster streaming models to prevent 504 Deadline Exceeded
    QUESTION_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.5-flash"]

    for model in QUESTION_MODELS:
        try:
            print(
                f"[Placement AI] Generating questions with {model}",
                flush=True,
            )

            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.4,
                ),
            )

            if not response.text:
                raise ValueError("The AI returned an empty response.")

            result = json.loads(response.text)
            validated = PlacementQuestionResponse.model_validate(result)

            expected_sections = {
                "aptitude",
                "logical_reasoning",
                "programming",
            }

            actual_sections = [
                section.section for section in validated.sections
            ]

            if (
                len(actual_sections) != 3
                or set(actual_sections) != expected_sections
            ):
                raise ValueError(
                    "The AI response must contain all three required sections."
                )

            for section in validated.sections:
                for question in section.questions:
                    if question.correct_answer not in question.options:
                        raise ValueError(
                            "A correct answer does not match any option."
                        )

                    if len(set(question.options)) != 4:
                        raise ValueError(
                            "Each question must have four distinct options."
                        )

            return validated

        except Exception as error:
            errors.append(f"{model}: {type(error).__name__}: {error}")
            print(
                f"[Placement AI] {errors[-1]}",
                flush=True,
            )

    print("[Placement AI] All AI models failed. Using deterministic fallback question bank.", flush=True)
    return generate_fallback_placement_questions(request)


def generate_fallback_placement_questions(request: PlacementQuestionRequest) -> PlacementQuestionResponse:
    role = request.job_role
    diff = request.difficulty.capitalize()

    aptitude_data = [
        ("A train 150m long is running at 54 km/hr. How much time will it take to cross an electric pole?", ["10 seconds", "12 seconds", "15 seconds", "8 seconds"], "10 seconds", "Speed = 54 * (5/18) = 15 m/s. Time = Distance / Speed = 150 / 15 = 10s.", "Speed & Distance"),
        ("A can do a piece of work in 10 days and B in 15 days. In how many days can both complete it together?", ["6 days", "5 days", "8 days", "7 days"], "6 days", "1/10 + 1/15 = 5/30 = 1/6. Total days = 6 days.", "Time & Work"),
        ("What is the compound interest on $10,000 for 2 years at 10% per annum compounded annually?", ["$2,100", "$2,000", "$2,200", "$1,900"], "$2,100", "Amount = 10000 * (1.1)^2 = 12,100. CI = 12,100 - 10,000 = $2,100.", "Compound Interest"),
        ("If an item bought for $200 is sold for $250, what is the profit percentage?", ["25%", "20%", "30%", "15%"], "25%", "Profit = 50. Profit % = (50 / 200) * 100 = 25%.", "Profit & Loss"),
        ("A vendor sells 20 apples for the cost price of 25 apples. What is the profit percentage?", ["25%", "20%", "30%", "15%"], "25%", "Profit % = ((25 - 20) / 20) * 100 = 25%.", "Profit & Loss"),
        ("The ratio of two numbers is 3:5 and their sum is 160. What is the larger number?", ["100", "60", "90", "110"], "100", "Parts = 8. Each part = 20. Larger = 5 * 20 = 100.", "Ratio & Proportion"),
        ("A boat travels 24 km downstream in 2 hours and 16 km upstream in 2 hours. What is the boat's speed in still water?", ["10 km/h", "12 km/h", "8 km/h", "6 km/h"], "10 km/h", "Downstream = 12 km/h, Upstream = 8 km/h. Still speed = (12 + 8)/2 = 10 km/h.", "Boats & Streams"),
        ("What is the probability of rolling a sum of 7 with two standard 6-sided dice?", ["1/6", "1/12", "5/36", "7/36"], "1/6", "Combinations making 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6/36 = 1/6.", "Probability"),
        ("How many 3-digit numbers can be formed using digits 1, 2, 3, 4, 5 without repetition?", ["60", "120", "20", "125"], "60", "5 * 4 * 3 = 60 permutations.", "Permutations & Combinations"),
        ("The average of 5 consecutive numbers is 27. What is the largest number?", ["29", "28", "30", "31"], "29", "Numbers: x-2, x-1, x, x+1, x+2. Mid = 27. Largest = 27 + 2 = 29.", "Averages"),
        ("Pipe A fills a tank in 4 hours while Pipe B empties it in 6 hours. If both open together, how long to fill?", ["12 hours", "10 hours", "8 hours", "14 hours"], "12 hours", "Rate = 1/4 - 1/6 = 1/12. Time = 12 hours.", "Pipes & Cisterns"),
        ("A father is 3 times as old as his son. In 12 years, he will be twice as old. What is the son's current age?", ["12 years", "14 years", "10 years", "16 years"], "12 years", "3x + 12 = 2(x + 12) => 3x + 12 = 2x + 24 => x = 12.", "Problems on Ages"),
        ("What is 35% of 400 plus 25% of 160?", ["180", "160", "190", "175"], "180", "35% of 400 = 140. 25% of 160 = 40. 140 + 40 = 180.", "Percentages"),
        ("In a mixture of 60 liters, the ratio of milk to water is 2:1. How much water must be added to make it 1:2?", ["60 liters", "40 liters", "50 liters", "30 liters"], "60 liters", "Milk = 40, Water = 20. For 1:2, Water must be 80. Add 80 - 20 = 60 liters.", "Mixtures"),
        ("What is the greatest common divisor (GCD) of 48 and 72?", ["24", "12", "18", "36"], "24", "Factors of 48 and 72 share 24 as the highest factor.", "Number Systems"),
        ("Find the next number in the arithmetic progression: 7, 13, 19, 25, ...", ["31", "30", "32", "33"], "31", "Common difference = 6. 25 + 6 = 31.", "Number Series"),
        ("A sum doubles itself in 5 years at simple interest. What is the rate of interest per annum?", ["20%", "15%", "25%", "10%"], "20%", "SI = P. P = (P * R * 5) / 100 => R = 100 / 5 = 20%.", "Simple Interest"),
        ("A square and a rectangle have equal area of 64 sq cm. If the rectangle length is 16 cm, what is its perimeter?", ["40 cm", "36 cm", "32 cm", "44 cm"], "40 cm", "Width = 64 / 16 = 4 cm. Perimeter = 2 * (16 + 4) = 40 cm.", "Mensuration"),
        ("If log_10(x) = 3, what is the value of x?", ["1000", "100", "10000", "30"], "1000", "x = 10^3 = 1000.", "Logarithms"),
        ("In an exam, a student scored 80% out of 500 total marks. How many marks did they score?", ["400", "420", "380", "450"], "400", "500 * 0.80 = 400 marks.", "Percentages")
    ]

    logical_data = [
        ("Pointing to a photograph, a woman says: 'He is the son of the only daughter of my father.' Who is he?", ["Her son", "Her brother", "Her nephew", "Her cousin"], "Her son", "The only daughter of the woman's father is the woman herself. His son is her son.", "Blood Relations"),
        ("Statements: All roses are flowers. Some flowers fade quickly. Conclusions: I. Some roses fade quickly. II. All flowers are roses.", ["Neither I nor II follows", "Only I follows", "Only II follows", "Both I and II follow"], "Neither I nor II follows", "No definite link between roses and fading quickly.", "Syllogism"),
        ("If 'COMPUTER' is coded as 'RFUVQNPC', how is 'MEDICINE' coded in that language?", ["EOJDJEFM", "EOJDEJFM", "MFEJDJOE", "EOJDJFEM"], "EOJDJEFM", "Reverse the word and shift each intermediate letter by +1.", "Coding-Decoding"),
        ("Find the odd one out: Apple, Mango, Carrot, Banana.", ["Carrot", "Apple", "Mango", "Banana"], "Carrot", "Carrot is a root vegetable; the rest are fruits.", "Classification"),
        ("Complete the sequence: 2, 6, 12, 20, 30, ?", ["42", "40", "44", "46"], "42", "Differences: +4, +6, +8, +10, +12. 30 + 12 = 42.", "Series Completion"),
        ("A person walks 10m North, turns right and walks 5m, turns right again and walks 10m. Where is he from start?", ["5m East", "5m West", "10m East", "At start point"], "5m East", "North and South cancel out, leaving 5m East.", "Direction Sense"),
        ("Five friends A, B, C, D, E sit in a row. B is between A and C. D is to the left of A. Who is in the middle?", ["A", "B", "C", "D"], "A", "Order: D, A, B, C, E. A is in the middle position.", "Seating Arrangement"),
        ("Book is to Reading as Fork is to: ?", ["Eating", "Writing", "Cooking", "Cutting"], "Eating", "A book is an instrument for reading; a fork is for eating.", "Analogy"),
        ("If today is Monday, what day will it be after 61 days?", ["Saturday", "Sunday", "Friday", "Tuesday"], "Saturday", "61 mod 7 = 5 days remainder. Monday + 5 days = Saturday.", "Calendar"),
        ("At what angle are the hands of a clock at 3:30?", ["75 degrees", "80 degrees", "90 degrees", "70 degrees"], "75 degrees", "Angle = |30*H - 5.5*M| = |90 - 165| = 75 degrees.", "Clocks"),
        ("Statements: Heavy rains caused waterlogging in the city. Conclusions: Municipal teams should deploy pumps.", ["Conclusion follows", "Conclusion does not follow", "Data insufficient", "None of these"], "Conclusion follows", "Deploying pumps is a direct corrective course of action.", "Statement & Action"),
        ("Which number is opposite to 4 in a standard die where sum of opposite faces is 7?", ["3", "1", "2", "5"], "3", "7 - 4 = 3.", "Cube & Dice"),
        ("In a class of 40 students, Rahul ranks 15th from the top. What is his rank from the bottom?", ["26th", "25th", "27th", "24th"], "26th", "Rank from bottom = 40 - 15 + 1 = 26th.", "Order & Ranking"),
        ("Statement: 'Please read the instructions carefully before filling the form.' Assumption: Applicants can read.", ["Assumption is implicit", "Assumption is not implicit", "Either or", "Neither"], "Assumption is implicit", "Giving written instructions assumes the target audience can read.", "Statement & Assumption"),
        ("Find the missing letter: B, D, G, K, P, ?", ["V", "U", "W", "X"], "V", "Step differences: +2, +3, +4, +5, +6. P(16) + 6 = V(22).", "Alphabet Series"),
        ("A is the sister of B. B is the brother of C. How is A related to C?", ["Sister", "Mother", "Cousin", "Aunt"], "Sister", "All three share siblingship, so A is the sister of C.", "Blood Relations"),
        ("Statements: Some cats are dogs. All dogs are birds. Can we conclude some cats are birds?", ["Yes, definitely", "No, impossible", "Data insufficient", "Cannot determine"], "Yes, definitely", "The intersection of cats and dogs is included in birds.", "Syllogism"),
        ("If south-east becomes North and north-east becomes West, what will West become?", ["South-East", "North-West", "South-West", "North-East"], "South-East", "135 degree clockwise rotation turns West into South-East.", "Direction Sense"),
        ("Complete the analogy: Doctor : Hospital :: Teacher : ?", ["School", "Clinic", "Office", "Court"], "School", "A doctor works in a hospital; similarly, a teacher works in a school.", "Analogy"),
        ("Choose the odd pair: (2, 8), (3, 27), (4, 64), (5, 100)", ["(5, 100)", "(2, 8)", "(3, 27)", "(4, 64)"], "(5, 100)", "Others are x and x^3. 5^3 = 125, not 100.", "Number Classification")
    ]

    prog_data = [
        ("What is the worst-case time complexity of QuickSort?", ["O(n^2)", "O(n log n)", "O(n)", "O(log n)"], "O(n^2)", "Worst case occurs when the chosen pivot is always the smallest or largest element.", "Data Structures"),
        ("Which data structure uses the First In First Out (FIFO) principle?", ["Queue", "Stack", "Binary Tree", "Heap"], "Queue", "Queues follow FIFO where the earliest inserted element is dequeued first.", "Data Structures"),
        ("In Object-Oriented Programming, what does Polymorphism mean?", ["Ability to take many forms", "Hiding internal details", "Binding code and data", "Reusing code"], "Ability to take many forms", "Polymorphism allows objects of different classes to respond to the same method call.", "OOP Concepts"),
        ("What is the time complexity to access an element by index in an Array?", ["O(1)", "O(n)", "O(log n)", "O(n^2)"], "O(1)", "Arrays store elements in contiguous memory allowing instant index math.", "Data Structures"),
        ("Which HTTP status code indicates 'Not Found'?", ["404", "200", "500", "401"], "404", "HTTP 404 indicates the requested resource could not be found on the server.", "Web Protocols"),
        ("What is the primary purpose of a database Index?", ["Speed up data retrieval", "Encrypt stored records", "Enforce primary keys only", "Reduce table size"], "Speed up data retrieval", "Indexes create search trees (like B-Trees) to locate rows without full table scans.", "Databases"),
        ("Which of the following is an immutable data type in Python?", ["Tuple", "List", "Dictionary", "Set"], "Tuple", "Tuples cannot be modified in place after creation.", "Programming"),
        ("In Git, which command stages changes for the next commit?", ["git add", "git commit", "git push", "git checkout"], "git add", "'git add' moves working directory changes into the staging index.", "Git & DevOps"),
        ("What is the space complexity of Depth First Search (DFS) on a tree of height h?", ["O(h)", "O(n^2)", "O(1)", "O(n!)"], "O(h)", "DFS recursion stack depth is proportional to the tree height h.", "Algorithms"),
        ("What does REST stand for in web architecture?", ["Representational State Transfer", "Remote Execution System Tool", "Rapid Enterprise Server Task", "Real-time Endpoint State Tree"], "Representational State Transfer", "REST is an architectural style for distributed hypermedia systems.", "Web Architecture"),
        ("Which sorting algorithm has a guaranteed O(n log n) worst-case time complexity?", ["MergeSort", "QuickSort", "BubbleSort", "InsertionSort"], "MergeSort", "MergeSort always divides the array in half and merges in linear time.", "Algorithms"),
        ("What does the 'S' in SOLID object-oriented principles stand for?", ["Single Responsibility Principle", "System Isolation Protocol", "Stateful Interface Design", "Standardized Inheritance"], "Single Responsibility Principle", "A class should have one, and only one, reason to change.", "Design Patterns"),
        ("In relational databases, which SQL clause is used to filter aggregated group records?", ["HAVING", "WHERE", "ORDER BY", "GROUP BY"], "HAVING", "WHERE filters individual rows; HAVING filters results after GROUP BY.", "Databases"),
        ("Which protocol is secure and encrypts browser-to-server HTTP communication?", ["HTTPS", "FTP", "SMTP", "Telnet"], "HTTPS", "HTTPS uses TLS/SSL encryption to secure communication.", "Security & Networking"),
        ("What is a Memory Leak in software development?", ["Allocated memory never released", "RAM hardware damage", "Cache thrashing", "CPU stack overflow"], "Allocated memory never released", "Occurs when dynamic memory is no longer referenced but not deallocated.", "Systems & Architecture"),
        ("Which data structure is typically used to implement Breadth First Search (BFS)?", ["Queue", "Stack", "Priority Queue", "Hash Map"], "Queue", "BFS explores vertices level by level using a FIFO queue.", "Data Structures"),
        ("What is the result of 10 / 0 in most modern languages without error handling?", ["DivisionByZero exception", "Returns 0", "Returns null", "Infinite loop"], "DivisionByZero exception", "Zero division raises a runtime error or exception.", "Error Handling"),
        ("What does API stand for in software engineering?", ["Application Programming Interface", "Automated Program Integration", "Advanced Process Instruction", "Asynchronous Packet Index"], "Application Programming Interface", "An API provides contracts and tools for software components to interact.", "Software Engineering"),
        ("In JavaScript / Node.js, what is the Event Loop responsible for?", ["Handling asynchronous callbacks", "Compiling bytecode", "Managing CSS styles", "Executing synchronous loops"], "Handling asynchronous callbacks", "The event loop offloads async operations and monitors call stack and callback queue.", "JavaScript / Node.js"),
        ("Which data structure provides O(1) average time complexity for key lookup?", ["Hash Map", "Binary Search Tree", "Linked List", "Sorted Array"], "Hash Map", "Hash maps compute an array bucket from hash codes for constant-time lookup.", "Data Structures")
    ]

    return PlacementQuestionResponse(
        job_role=role,
        difficulty=diff,
        sections=[
            PlacementQuestionSection(
                section="aptitude",
                questions=[
                    PlacementQuestion(question=q, options=opts, correct_answer=ans, explanation=exp, topic=top)
                    for q, opts, ans, exp, top in aptitude_data
                ]
            ),
            PlacementQuestionSection(
                section="logical_reasoning",
                questions=[
                    PlacementQuestion(question=q, options=opts, correct_answer=ans, explanation=exp, topic=top)
                    for q, opts, ans, exp, top in logical_data
                ]
            ),
            PlacementQuestionSection(
                section="programming",
                questions=[
                    PlacementQuestion(question=q, options=opts, correct_answer=ans, explanation=exp, topic=f"{role}: {top}")
                    for q, opts, ans, exp, top in prog_data
                ]
            )
        ]
    )


