const axios = require("axios");

const AI_SERVICE_URL =
  process.env.PYTHON_AI_SERVICE_URL || "http://127.0.0.1:8001";

const EXPECTED_SECTIONS = [
  "aptitude",
  "logical_reasoning",
  "programming",
];

async function generatePlacementQuestions({ jobRole, difficulty = "medium" }) {
  const response = await axios.post(
    `${AI_SERVICE_URL}/placement-practice/generate`,
    {
      job_role: jobRole,
      difficulty,
    },
    {
      timeout: 180000,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = response.data;

  if (!data || !Array.isArray(data.sections)) {
    throw new Error("AI service returned an invalid response.");
  }

  if (data.sections.length !== 3) {
    throw new Error("AI service must return three question sections.");
  }

  for (const sectionName of EXPECTED_SECTIONS) {
    const section = data.sections.find(
      (item) => item.section === sectionName
    );

    if (!section || !Array.isArray(section.questions)) {
      throw new Error(`Missing question section: ${sectionName}`);
    }

    if (section.questions.length !== 20) {
      throw new Error(
        `Expected 20 questions in ${sectionName}, received ${section.questions.length}.`
      );
    }
  }

  return data;
}

module.exports = { generatePlacementQuestions };
