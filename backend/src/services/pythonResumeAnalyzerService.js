const axios = require("axios");

const pythonAI = axios.create({
  baseURL: process.env.PYTHON_AI_SERVICE_URL || "http://127.0.0.1:8001",
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

function detectSeniority(text) {
  const lower = (text || "").toLowerCase();
  if (/(director|vp|head of|principal|engineering manager)/i.test(lower)) {
    return "Management / Leadership";
  }
  if (/(lead|staff|senior|sr\.|architect|\b[5-9]\+?\s*years|\b1\d\+?\s*years)/i.test(lower)) {
    return "Senior / Lead";
  }
  if (/(mid-level|mid level|intermediate|\b[2-4]\+?\s*years)/i.test(lower)) {
    return "Mid-Level";
  }
  if (/(student|intern|fresher|graduate|entry-level|junior|\b0-[12]\s*years)/i.test(lower)) {
    return "Entry-Level / Student";
  }
  return "Entry-Level / Student";
}

function extractSkillsFromText(text) {
  const commonSkills = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express", "HTML", "CSS",
    "Python", "Django", "Flask", "Java", "Spring Boot", "C++", "C#", ".NET",
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD",
    "Git", "GitHub", "REST APIs", "GraphQL", "Microservices",
    "Data Structures", "Algorithms", "System Design", "Agile", "Scrum",
    "Unit Testing", "Jest", "Communication", "Problem Solving"
  ];

  const lower = (text || "").toLowerCase();
  return commonSkills.filter((skill) => {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    return regex.test(lower);
  });
}

function localFallbackAnalysis({ resumeText, job }) {
  const resumeSkills = extractSkillsFromText(resumeText);
  const jobFullText = [
    job.title,
    job.category,
    job.description,
    job.jobType,
    ...(Array.isArray(job.skills) ? job.skills : []),
  ]
    .filter(Boolean)
    .join(" ");

  const jobSkillsExtracted = extractSkillsFromText(jobFullText);
  const explicitJobSkills = Array.isArray(job.skills)
    ? job.skills.map((s) => s.trim()).filter(Boolean)
    : [];

  const combinedJobSkills = Array.from(
    new Set([...explicitJobSkills, ...jobSkillsExtracted])
  );

  const targetJobSkills =
    combinedJobSkills.length > 0
      ? combinedJobSkills
      : ["Problem Solving", "Data Structures", "Git", "REST APIs", "JavaScript"];

  const matchedSkills = targetJobSkills.filter((skill) =>
    resumeSkills.some((r) => r.toLowerCase() === skill.toLowerCase())
  );

  const missingSkills = targetJobSkills.filter(
    (skill) => !resumeSkills.some((r) => r.toLowerCase() === skill.toLowerCase())
  );

  // If no direct overlap but resume has general skills, preserve general skills as matched
  const finalMatched =
    matchedSkills.length > 0
      ? matchedSkills
      : resumeSkills.slice(0, 4);

  const finalMissing =
    missingSkills.length > 0
      ? missingSkills
      : ["Cloud Architecture", "CI/CD Pipelines", "System Design"];

  // Seniority detection
  const seniorityDetected = detectSeniority(resumeText);
  const seniorityRequired = detectSeniority(jobFullText);

  // Distinguish critical must-haves from secondary tools
  const jobTitleLower = (job.title || "").toLowerCase();
  const criticalMissingSkills = [];
  const secondaryMissingSkills = [];

  for (const skill of finalMissing) {
    const sLower = skill.toLowerCase();
    if (
      jobTitleLower.includes(sLower) ||
      ["react", "node", "python", "java", "sql", "javascript", "typescript", "mongodb"].some(
        (core) => sLower.includes(core)
      )
    ) {
      criticalMissingSkills.push(skill);
    } else {
      secondaryMissingSkills.push(skill);
    }
  }

  if (criticalMissingSkills.length === 0 && finalMissing.length > 0) {
    criticalMissingSkills.push(finalMissing[0]);
    if (finalMissing.length > 1) {
      secondaryMissingSkills.push(...finalMissing.slice(1));
    }
  }

  // Technical Score: proportion of technical job requirements covered
  const rawTechRatio = finalMatched.length / Math.max(targetJobSkills.length, 1);
  const technicalScore = Math.min(95, Math.max(25, Math.round(rawTechRatio * 100)));

  // Experience Score: evaluated against seniority alignment
  let experienceScore = 80;
  if (
    (seniorityRequired === "Senior / Lead" || seniorityRequired === "Management / Leadership") &&
    seniorityDetected.startsWith("Entry")
  ) {
    experienceScore = 40;
  } else if (seniorityRequired === "Mid-Level" && seniorityDetected.startsWith("Entry")) {
    experienceScore = 65;
  } else {
    experienceScore = 88;
  }

  // Meaningful weighted match score: 70% technical alignment, 30% experience/seniority
  const matchScore = Math.min(
    95,
    Math.max(30, Math.round(technicalScore * 0.7 + experienceScore * 0.3))
  );

  const topCritical = criticalMissingSkills[0] || finalMissing[0] || "Target Stack";
  const topSecondary = secondaryMissingSkills[0] || "Testing & CI/CD";
  const primaryMatched = finalMatched[0] || "Core Fundamentals";

  // 3-Phase Personalized Learning Roadmap
  const learningRoadmap = [
    {
      phase: "Phase 1 (Week 1-2): Core Concept & Syntax Mastery",
      focus: `Foundational mastery of ${topCritical}`,
      actionItems: [
        `Complete intensive hands-on tutorials covering core syntax and paradigms in ${topCritical}.`,
        `Build 3 small targeted modules demonstrating error handling and data manipulation.`,
      ],
    },
    {
      phase: "Phase 2 (Week 3-4): Hands-On Production Project",
      focus: `Integration of ${topCritical} with ${primaryMatched}`,
      actionItems: [
        `Develop an end-to-end full stack feature connecting ${primaryMatched} and ${topCritical}.`,
        `Incorporate ${topSecondary} with automated test coverage and clean git commit history.`,
      ],
    },
    {
      phase: "Phase 3 (Week 5-6): System Design & Interview Practice",
      focus: `Technical interview readiness for ${job.title || "this role"}`,
      actionItems: [
        `Practice articulating technical trade-offs and architectural design choices.`,
        `Quantify project achievements on your resume with concrete performance indicators.`,
      ],
    },
  ];

  return {
    matchScore,
    technicalScore,
    experienceScore,
    seniorityDetected,
    seniorityRequired,
    summary: `Rule-based evaluation against ${job.title || "selected role"} at ${job.company || "company"}. Resume shows strong baseline in ${finalMatched.slice(0, 3).join(", ") || "software fundamentals"} with prioritized gaps in ${criticalMissingSkills.join(", ") || "specialized tooling"}.`,
    matchedSkills: finalMatched,
    missingSkills: finalMissing,
    criticalMissingSkills,
    secondaryMissingSkills,
    learningRoadmap,
    suggestions: [
      `Prioritize practical experience with ${topCritical} on your resume and portfolio.`,
      "Highlight measurable impact (e.g. reduced load time, solved specific concurrency bottlenecks).",
      `Align your resume summary directly with the requirements outlined in ${job.title || "the role"}.`,
    ],
    interviewQuestions: [
      `Walk through how you applied ${primaryMatched} in a recent project and what challenges you overcame.`,
      `How would you plan the integration of ${topCritical} into a production service?`,
      `How do you handle testing and error recovery in distributed environments?`,
    ],
    method: "rule-based",
    disclaimer:
      "A match score is an estimate of alignment with the job requirements, not a guarantee of selection.",
  };
}

async function analyzeResumeWithPython({ resumeText, job }) {
  try {
    const response = await pythonAI.post("/analyze", {
      resume_text: resumeText,
      job_title: job.title || "Not specified",
      company: job.company || "Not specified",
      required_skills: Array.isArray(job.skills) ? job.skills : [],
      job_description: [
        job.title,
        job.category,
        job.description,
        job.jobType,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const result = response.data;

    return {
      matchScore: result.match_score,
      technicalScore: result.technical_score ?? 70,
      experienceScore: result.experience_score ?? 70,
      seniorityDetected: result.seniority_detected || "Entry-Level / Student",
      seniorityRequired: result.seniority_required || "Entry-Level",
      summary: result.summary,
      matchedSkills: result.matched_skills || [],
      criticalMissingSkills: result.critical_missing_skills || [],
      secondaryMissingSkills: result.secondary_missing_skills || [],
      missingSkills: result.missing_skills || [],
      learningRoadmap: (result.learning_roadmap || []).map((r) => ({
        phase: r.phase,
        focus: r.focus,
        actionItems: r.action_items || [],
      })),
      suggestions: result.suggestions || [],
      interviewQuestions: result.interview_questions || [],
      method: result.method || "gemini-llm",
      disclaimer:
        result.disclaimer ||
        "A match score is an estimate of alignment with the job requirements, not a guarantee of selection.",
    };
  } catch (error) {
    const status = error.response?.status;
    console.warn("Python Resume AI request warning:", {
      message: error.message,
      code: error.code,
      status,
      response: error.response?.data,
    });

    // If Python service is down or connection refused or quota exhausted or timeout, use rule-based fallback
    console.log(
      `ℹ️ Using intelligent rule-based fallback matching service (Reason: ${error.message || status || "Service Offline"})`
    );
    return localFallbackAnalysis({ resumeText, job });
  }
}

module.exports = { analyzeResumeWithPython };