const Placement = require("../models/Placement");

const API_URL = "https://devglobaljobs.com/api/v1/jobs";


function cleanDescription(value = "") {
  return String(value)
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}


async function syncDevGlobalJobs({
  country = "in",
  category = "technology",
  limit = 50,
  offset = 0,
} = {}) {
  const params = new URLSearchParams({
    country,
    category,
    limit: String(Math.min(Math.max(Number(limit) || 50, 1), 100)),
    offset: String(Math.max(Number(offset) || 0, 0)),
  });

  const response = await fetch(`${API_URL}?${params}`, {
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Jobs API returned HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.jobs)) {
    throw new Error("Unexpected jobs API response: data.jobs is not an array");
  }

  let saved = 0;

  for (const job of data.jobs) {
    const sourceId = job.id ?? job._id;
    const sourceUrl =
      job.url ?? job.detailUrl ?? job.jobUrl ?? job.sourceUrl;

    if (!sourceId || !sourceUrl || !job.title) continue;

    await Placement.updateOne(
      { source: "devglobaljobs", sourceId: String(sourceId) },
      {
        $set: {
          title: job.title,
          company:
            job.organisation ??
            job.organization ??
            job.company ??
            "Company not specified",
          location: job.location ?? "Location not specified",
          category: job.category ?? category,
          description: cleanDescription(job.descriptionExcerpt ?? job.description ?? job.summary ?? ""),
          jobType: job.jobType ?? job.type ?? "Not specified",
          sourceUrl,
          applyUrl: job.applyUrl ?? job.applicationUrl ?? "",
          postedAt: job.postedAt ? new Date(job.postedAt) : null,
          isActive: true,
          lastSyncedAt: new Date(),
        },
        $setOnInsert: {
          source: "devglobaljobs",
          sourceId: String(sourceId),
        },
      },
      { upsert: true }
    );

    saved++;
  }

  return { fetched: data.jobs.length, saved };
}

module.exports = { syncDevGlobalJobs };
