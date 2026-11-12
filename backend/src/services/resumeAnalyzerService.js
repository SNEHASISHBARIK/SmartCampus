
const SKILL_GROUPS = {
  JavaScript: ["javascript", "js"],
  React: ["react", "reactjs", "react.js"],
  "Node.js": ["node.js", "nodejs"],
  Express: ["express", "express.js"],
  Python: ["python"],
  Java: ["java"],
  SQL: ["sql", "mysql", "postgresql", "postgres"],
  MongoDB: ["mongodb", "mongo db"],
  Git: ["git", "github", "gitlab"],
  Docker: ["docker", "containerization"],
  AWS: ["aws", "amazon web services"],
  "Machine Learning": [
    "machine learning",
    "scikit-learn",
    "sklearn",
    "supervised learning",
    "unsupervised learning",
  ],
  "Deep Learning": ["deep learning", "tensorflow", "pytorch", "keras"],
  "Data Analysis": [
    "data analysis",
    "data analytics",
    "pandas",
    "numpy",
    "data visualization",
  ],
  Excel: ["excel", "microsoft excel"],
  "Power BI": ["power bi", "powerbi"],
  "REST API": ["rest api", "restful api", "rest apis"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3", "responsive design"],
  TypeScript: ["typescript", "ts"],
  C: ["c programming", " c language "],
  "C++": ["c++", "cpp"],
  DSA: [
    "data structures and algorithms",
    "data structure",
    "algorithms",
  ],
  Agile: ["agile", "scrum", "kanban"],
  Linux: ["linux", "ubuntu"],
  Hadoop: ["hadoop", "hdfs", "mapreduce"],
  Spark: ["apache spark", "pyspark"],
};

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function containsTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(^|[^a-z0-9+#.])${escaped}(?=$|[^a-z0-9+#.])`,
    "i"
  );

  return pattern.test(text);
}

function findSkills(text) {
  const normalized = normalizeText(text);
  const found = [];

  for (const [skill, aliases] of Object.entries(SKILL_GROUPS)) {
    if (aliases.some((alias) => containsTerm(normalized, alias))) {
      found.push(skill);
    }
  }

  return found.sort();
}

function analyzeResume(resumeText, job) {
  const resumeSkills = findSkills(resumeText);
  const jobText = [
    job.title,
    job.category,
    job.description,
    job.jobType,
  ]
    .filter(Boolean)
    .join(" ");

  const requiredSkills = findSkills(jobText);

  const matchedSkills = requiredSkills.filter((skill) =>
    resumeSkills.includes(skill)
  );

  const missingSkills = requiredSkills.filter(
    (skill) => !resumeSkills.includes(skill)
  );

  const matchScore =
    requiredSkills.length === 0
      ? null
      : Math.round(
          (matchedSkills.length / requiredSkills.length) * 100
        );

  const suggestions = [];

  if (requiredSkills.length === 0) {
    suggestions.push(
      "This job description does not contain enough recognized skills for a reliable skill-match score."
    );
  } else if (missingSkills.length > 0) {
    suggestions.push(
      `Review the job requirements for ${missingSkills.slice(0, 5).join(", ")}. Add these skills to your resume only if you genuinely have the relevant experience.`
    );
  }

  if (resumeSkills.length === 0) {
    suggestions.push(
      "No recognized skills were detected. Make sure your resume contains readable text and clearly lists your technical skills."
    );
  }

  suggestions.push(
    "Include relevant project experience and measurable results to demonstrate your skills."
  );

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    resumeSkills,
    requiredSkills,
    suggestions,
    method: "rule-based",
    disclaimer:
      "This score measures overlap between recognized skills, not your overall suitability for the job. Skills not detected may still be present in your resume.",
  };
}

module.exports = {
  analyzeResume,
  findSkills,
};
