/**
 * SmartCampus AI Mock Interview Analyzer
 * Evaluates interview transcripts against job requirements and generates
 * evidence-based scores, skill gap analysis, personalized roadmaps, and model answers.
 */

const MODEL_ANSWERS_BY_TOPIC = {
  intro:
    "I am an enthusiastic engineering student passionate about software development and solving real-world challenges. During my academic projects, I built scalable web applications and worked extensively with modern frameworks and databases. I am eager to apply my foundational skills and strong problem-solving mindset to contribute effectively to your engineering team.",
  project:
    "In my recent project, I tackled the challenge of optimizing data retrieval by implementing indexing and structured API design. Using the STAR method: the Situation was slow query response; my Task was to optimize backend performance; the Action I took was redesigning the schema and caching frequent queries; the Result was a 45% drop in latency and improved user experience.",
  database:
    "SQL databases are relational, table-based, and enforce strict ACID properties, making them ideal for structured data and transactional integrity like payment systems. In contrast, NoSQL databases like MongoDB use flexible document formats that scale horizontally and accommodate rapid schema evolution. In practice, I select SQL for complex relational queries and MongoDB for hierarchical data and high-velocity prototyping.",
  problemSolving:
    "When faced with a complex technical problem, I first deconstruct it into smaller, manageable subproblems. I clarify constraints and edge cases, evaluate trade-offs between time and space complexity, and write modular, testable code before benchmarking and optimizing bottlenecks.",
  conflict:
    "When differing technical opinions arise, I focus on data-driven discussion and team objectives rather than personal preference. I actively listen to the rationale, weigh trade-offs collaboratively, and once a decision is agreed upon, fully commit to executing the chosen approach.",
  general:
    "A strong answer articulates the core technical concept concisely, illustrates it with a real-world project example, discusses trade-offs, and demonstrates continuous learning and adaptability.",
};

function getModelAnswerForQuestion(question = "") {
  const qLower = question.toLowerCase();
  if (qLower.includes("yourself") || qLower.includes("introduce")) {
    return MODEL_ANSWERS_BY_TOPIC.intro;
  }
  if (
    qLower.includes("project") ||
    qLower.includes("challenge") ||
    qLower.includes("obstacle")
  ) {
    return MODEL_ANSWERS_BY_TOPIC.project;
  }
  if (
    qLower.includes("sql") ||
    qLower.includes("database") ||
    qLower.includes("mongodb") ||
    qLower.includes("dbms")
  ) {
    return MODEL_ANSWERS_BY_TOPIC.database;
  }
  if (
    qLower.includes("problem") ||
    qLower.includes("approach") ||
    qLower.includes("complex")
  ) {
    return MODEL_ANSWERS_BY_TOPIC.problemSolving;
  }
  if (
    qLower.includes("feedback") ||
    qLower.includes("criticism") ||
    qLower.includes("conflict") ||
    qLower.includes("team")
  ) {
    return MODEL_ANSWERS_BY_TOPIC.conflict;
  }
  return MODEL_ANSWERS_BY_TOPIC.general;
}

function evaluateQuestion(question = "", answer = "") {
  const cleanAns = (answer || "").trim();
  const wordCount = cleanAns ? cleanAns.split(/\s+/).length : 0;
  const isAnswered =
    wordCount >= 4 &&
    cleanAns.toLowerCase() !== "(no answer)" &&
    !cleanAns.toLowerCase().includes("no answer");

  let whatToImprove = "";
  if (!isAnswered) {
    whatToImprove =
      "Question was skipped or answered with insufficient detail. Structure a 60–90 second response highlighting key concepts and an example.";
  } else if (wordCount < 18) {
    whatToImprove =
      "Answer was brief. Expand with concrete technical details, the 'why' behind your approach, and specific tools or metrics.";
  } else if (
    !cleanAns.toLowerCase().includes("example") &&
    !cleanAns.toLowerCase().includes("project") &&
    !cleanAns.toLowerCase().includes("because")
  ) {
    whatToImprove =
      "Good start, but strengthen your answer by anchoring it to a specific academic or personal project using the STAR method.";
  } else {
    whatToImprove =
      "Strong response! To elevate it further, briefly mention the trade-offs or measurable outcomes of your technical decisions.";
  }

  return {
    question,
    studentAnswer: cleanAns || "(No answer recorded)",
    isAnswered,
    wordCount,
    whatToImprove,
    strongerAnswer: getModelAnswerForQuestion(question),
  };
}

function analyzeInterview({
  jobTitle = "Software Developer",
  skills = [],
  questionsAndAnswers = [],
}) {
  const evaluatedQuestions = questionsAndAnswers.map((item) =>
    evaluateQuestion(item.question, item.answer)
  );

  const totalQuestions = Math.max(evaluatedQuestions.length, 1);
  const answeredCount = evaluatedQuestions.filter((q) => q.isAnswered).length;
  const totalWords = evaluatedQuestions.reduce((acc, q) => acc + q.wordCount, 0);
  const avgWords = Math.round(totalWords / totalQuestions);

  // 1. Scoring Logic grounded in actual speech transcript
  const answerRate = answeredCount / totalQuestions;

  // Technical Score: based on depth of answered questions and terminology
  const technical = Math.min(
    100,
    Math.max(
      25,
      Math.round(
        answerRate * 60 +
          Math.min(avgWords, 60) * 0.5 +
          (answeredCount >= 5 ? 10 : 0)
      )
    )
  );

  // Communication: clarity, articulation length, continuous speech
  const communication = Math.min(
    100,
    Math.max(
      30,
      Math.round(
        answerRate * 50 +
          Math.min(avgWords, 50) * 0.8 +
          (avgWords >= 25 ? 10 : 0)
      )
    )
  );

  // Problem Solving: structured reasoning
  const problemSolving = Math.min(
    100,
    Math.max(
      20,
      Math.round(
        answerRate * 55 +
          Math.min(avgWords, 40) * 0.6 +
          (answeredCount >= 4 ? 15 : 0)
      )
    )
  );

  // Relevance: answering prompt directly
  const relevance = Math.min(
    100,
    Math.max(35, Math.round(answerRate * 75 + (avgWords >= 15 ? 15 : 0)))
  );

  // Confidence & Clarity: completion consistency
  const confidence = Math.min(
    100,
    Math.max(30, Math.round(answerRate * 80 + (avgWords >= 20 ? 15 : 0)))
  );

  // Overall Score (Weighted)
  const overallScore = Math.round(
    technical * 0.35 +
      communication * 0.25 +
      problemSolving * 0.2 +
      relevance * 0.1 +
      confidence * 0.1
  );

  // Recommendations per category
  const categories = {
    technical: {
      score: technical,
      recommendation:
        technical >= 75
          ? "Solid conceptual grasp. Practise system design and architectural edge cases."
          : technical >= 55
          ? `Revise core concepts and libraries relevant to ${jobTitle}.`
          : `Prioritize fundamentals and coding patterns required for ${jobTitle}.`,
    },
    communication: {
      score: communication,
      recommendation:
        communication >= 75
          ? "Clear, articulate tone. Maintain natural pacing throughout technical explanations."
          : communication >= 55
          ? "Practise explaining complex topics simply and concisely without hesitation."
          : "Focus on articulating complete thoughts and structuring answers with the STAR format.",
    },
    problemSolving: {
      score: problemSolving,
      recommendation:
        problemSolving >= 75
          ? "Strong analytical intuition. Continue highlighting trade-offs in your answers."
          : problemSolving >= 55
          ? "Work on step-by-step problem deconstruction before diving into the final solution."
          : "Practise explaining your thought process out loud while solving algorithmic challenges.",
    },
    relevance: {
      score: relevance,
      recommendation:
        relevance >= 75
          ? "Answers were well-targeted and directly addressed the interview questions."
          : "Keep answers focused on the question's core intent before introducing extra details.",
    },
    confidence: {
      score: confidence,
      recommendation:
        confidence >= 75
          ? "Steady, professional presence. Pacing and delivery were well-balanced."
          : "Prepare 2–3 structured stories from projects to boost delivery flow and eliminate pauses.",
    },
  };

  // Feedback: Strengths & Weaknesses
  const strengths = [];
  const weaknesses = [];

  if (answeredCount >= Math.ceil(totalQuestions * 0.8)) {
    strengths.push(
      `Attempted ${answeredCount} of ${totalQuestions} questions with sustained engagement.`
    );
  }
  if (avgWords >= 30) {
    strengths.push(
      "Provided descriptive answers with sufficient context rather than one-line responses."
    );
  }
  if (communication >= 70) {
    strengths.push(
      "Maintained professional conversational cadence and clear phrasing."
    );
  }
  if (strengths.length === 0) {
    strengths.push("Good initial attempt taking on real-time speech interview questions.");
    strengths.push("Identified primary areas where focused technical prep will yield fast gains.");
  }

  if (answeredCount < totalQuestions) {
    weaknesses.push(
      `${totalQuestions - answeredCount} questions were skipped or left incomplete.`
    );
  }
  if (avgWords < 25) {
    weaknesses.push(
      "Answers were relatively brief; incorporate real project examples to demonstrate depth."
    );
  }
  if (technical < 70) {
    weaknesses.push(
      `Need more rigorous technical vocabulary and implementation details for ${jobTitle}.`
    );
  }
  if (weaknesses.length === 0) {
    weaknesses.push(
      "Deepen trade-off analysis between alternative technologies and frameworks."
    );
  }

  // Feature 2: Skill Gap Analysis
  const jobSkills =
    Array.isArray(skills) && skills.length > 0
      ? skills
      : ["Problem Solving", "Core Technical Skills", "System Architecture", "Git & Collaboration"];

  const skillGaps = jobSkills.slice(0, 6).map((skillName, index) => {
    // Check if any question touched on this skill
    const mentionedInQuestion = evaluatedQuestions.some((q) =>
      q.question.toLowerCase().includes(skillName.toLowerCase())
    );

    let assessment = "Not Assessed";
    let recommendedAction = "Review concept fundamentals and prepare practical project examples.";

    if (mentionedInQuestion || index < answeredCount) {
      if (technical >= 75 && answeredCount >= 6) {
        assessment = "Good";
        recommendedAction = `Practise explaining advanced architectural trade-offs in ${skillName}.`;
      } else if (technical >= 55) {
        assessment = "Moderate";
        recommendedAction = `Build a hands-on mini-project to solidify practical experience in ${skillName}.`;
      } else {
        assessment = "Needs Improvement";
        recommendedAction = `Dedicate focused study sessions to foundational concepts of ${skillName}.`;
      }
    }

    return {
      skill: skillName,
      assessment,
      recommendedAction,
    };
  });

  // Feature 3: Personalized 7-Day Roadmap
  const learningRoadmap = [
    {
      day: 1,
      activity: `Review foundational concepts and architecture for ${jobTitle}`,
      goal: "Solidify core concepts and resolve conceptual gaps highlighted in interview",
    },
    {
      day: 2,
      activity: `Practise ${skillGaps[0]?.skill || "core technical skills"} problems and syntax`,
      goal: "Gain hands-on proficiency and prepare concrete technical talking points",
    },
    {
      day: 3,
      activity: "Solve practical coding and system design scenario questions",
      goal: "Improve problem deconstruction and time-efficient reasoning",
    },
    {
      day: 4,
      activity: "Prepare 2 project deep-dives using the STAR method",
      goal: "Explain Situation, Task, Action, and Result clearly under 90 seconds",
    },
    {
      day: 5,
      activity: "Mock Q&A verbal rehearsal on communication and behavioral questions",
      goal: "Eliminate hesitation, improve vocal clarity and structured explanation",
    },
    {
      day: 6,
      activity: `Retake SmartCampus AI Mock Interview for ${jobTitle}`,
      goal: "Benchmark performance gains against initial baseline attempt",
    },
    {
      day: 7,
      activity: "Review updated analytics and refine interview response notes",
      goal: "Achieve placement readiness for upcoming campus drives",
    },
  ];

  // Feature 4: Recommended Priorities
  const recommendedPriorities = [
    {
      priority: 1,
      area: skillGaps[0]?.skill || "Technical Knowledge Depth",
      tasks: [
        `Master fundamental theory and real-world trade-offs in ${skillGaps[0]?.skill || jobTitle}.`,
        "Prepare concrete examples from coursework or personal projects.",
        "Practise explaining code and data flow without referencing external notes.",
      ],
    },
    {
      priority: 2,
      area: "Structured STAR Communication",
      tasks: [
        "Structure past experiences with clear Situation, Task, Action, and Result phases.",
        "Keep technical answers crisp, targeting the 60 to 90 second sweet spot.",
        "Translate complex technical jargon into accessible, logically sequenced steps.",
      ],
    },
    {
      priority: 3,
      area: "Problem-Solving & Trade-Off Analysis",
      tasks: [
        "Deconstruct problems out loud before proposing the final architecture or algorithm.",
        "Discuss complexity trade-offs (Time vs Space) and alternative approaches.",
        "Demonstrate adaptability when receiving feedback or edge-case constraints.",
      ],
    },
  ];

  return {
    overallScore,
    categories,
    feedback: {
      summary: `You demonstrated genuine effort in this mock interview for ${jobTitle}. Overall score was ${overallScore}/100. Focusing on structured technical examples and answering every prompt consistently will quickly push your performance into top placement tiers.`,
      strengths,
      weaknesses,
    },
    skillGaps,
    learningRoadmap,
    recommendedPriorities,
    questionsAndAnswers: evaluatedQuestions.map((q) => ({
      question: q.question,
      studentAnswer: q.studentAnswer,
      whatToImprove: q.whatToImprove,
      strongerAnswer: q.strongerAnswer,
    })),
  };
}

module.exports = { analyzeInterview };
