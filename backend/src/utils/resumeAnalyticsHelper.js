const SKILL_TAXONOMY = {
  "Programming & Core": [
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "golang",
    "go",
    "ruby",
    "php",
    "data structures",
    "algorithms",
  ],
  "Frontend & UI": [
    "react",
    "react.js",
    "vue",
    "angular",
    "next.js",
    "html",
    "html5",
    "css",
    "css3",
    "tailwind",
    "redux",
    "responsive design",
  ],
  "Backend & APIs": [
    "node.js",
    "express",
    "express.js",
    "django",
    "flask",
    "fastapi",
    "spring boot",
    "rest apis",
    "graphql",
    "microservices",
  ],
  "Databases & Storage": [
    "mongodb",
    "postgresql",
    "sql",
    "mysql",
    "redis",
    "mongoose",
    "prisma",
    "database indexing",
  ],
  "DevOps & Cloud": [
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "ci/cd",
    "git",
    "github",
    "linux",
    "terraform",
  ],
  "Engineering Practices": [
    "agile",
    "scrum",
    "system design",
    "unit testing",
    "testing",
    "jest",
    "ci/cd pipelines",
    "security",
  ],
};

function formatSkillName(skill) {
  const s = String(skill || "").trim();
  if (!s) return "";
  if (s.length <= 3) return s.toUpperCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildCategoryComparison(matchedSkills = [], missingSkills = []) {
  const matchedSet = new Set(matchedSkills.map((s) => s.toLowerCase().trim()));
  const missingSet = new Set(missingSkills.map((s) => s.toLowerCase().trim()));

  const categories = [];

  for (const [categoryName, keywords] of Object.entries(SKILL_TAXONOMY)) {
    const matched = [];
    const missing = [];

    for (const kw of keywords) {
      if (matchedSet.has(kw)) {
        matched.push(formatSkillName(kw));
      }
      if (missingSet.has(kw)) {
        missing.push(formatSkillName(kw));
      }
    }

    // Also check partial word matches from matchedSkills
    for (const ms of matchedSkills) {
      const lower = ms.toLowerCase().trim();
      if (
        keywords.some((kw) => lower.includes(kw) || kw.includes(lower)) &&
        !matched.includes(ms)
      ) {
        matched.push(ms);
      }
    }

    for (const mis of missingSkills) {
      const lower = mis.toLowerCase().trim();
      if (
        keywords.some((kw) => lower.includes(kw) || kw.includes(lower)) &&
        !missing.includes(mis)
      ) {
        missing.push(mis);
      }
    }

    const total = matched.length + missing.length;
    if (total > 0) {
      const score = Math.round((matched.length / total) * 100);
      categories.push({
        category: categoryName,
        matched,
        missing,
        score,
      });
    }
  }

  // Ensure at least 3 categories are represented for balanced charts
  if (categories.length < 3) {
    if (!categories.some((c) => c.category === "Programming & Core")) {
      categories.push({
        category: "Programming & Core",
        matched: matchedSkills.slice(0, 3),
        missing: missingSkills.slice(0, 1),
        score: matchedSkills.length > 0 ? 75 : 40,
      });
    }
    if (!categories.some((c) => c.category === "DevOps & Cloud")) {
      categories.push({
        category: "DevOps & Cloud",
        matched: matchedSkills.filter((s) =>
          ["git", "docker", "aws", "linux"].some((k) =>
            s.toLowerCase().includes(k)
          )
        ),
        missing: missingSkills.filter((s) =>
          ["docker", "cloud", "aws", "ci/cd"].some((k) =>
            s.toLowerCase().includes(k)
          )
        ),
        score: 60,
      });
    }
  }

  return categories;
}

function buildTailoredRecommendations(jobTitle, company, missingSkills = [], matchScore = 70) {
  const recommendations = [];

  if (missingSkills.length > 0) {
    recommendations.push(
      `Bridge Priority Gap: Add coursework or a showcase project highlighting ${missingSkills.slice(0, 2).join(" and ")} to immediately boost alignment for ${jobTitle}.`
    );
  }

  if (matchScore >= 80) {
    recommendations.push(
      `Interview Preparation: You have strong technical alignment for ${company}. Focus your preparation on discussing architectural trade-offs and scaling experiences in past projects.`
    );
    recommendations.push(
      "Resume Polish: Quantify your results in project bullet points (e.g. 'reduced latency by 30%', 'served 10k users') to stand out among top candidates."
    );
  } else if (matchScore >= 50) {
    recommendations.push(
      `Targeted Project: Build a live demo that features ${missingSkills[0] || "relevant modern technologies"} alongside your primary stack to demonstrate practical versatility to ${company}.`
    );
    recommendations.push(
      "Highlight Transferable Skills: Emphasize fundamental software engineering, debugging, and problem-solving practices in your resume summary."
    );
  } else {
    recommendations.push(
      `Core Skills Realignment: The ${jobTitle} role expects specific skills like ${missingSkills.slice(0, 3).join(", ") || "advanced tooling"}. Allocate 2-3 weeks to study core fundamentals before submitting your application.`
    );
    recommendations.push(
      "Open Source Contributions: Contribute small bug fixes or documentation to related repositories on GitHub to prove active hands-on competency."
    );
  }

  return recommendations;
}

module.exports = {
  buildCategoryComparison,
  buildTailoredRecommendations,
};
