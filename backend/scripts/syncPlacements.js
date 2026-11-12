require("dotenv").config();

const mongoose = require("mongoose");
const { syncDevGlobalJobs } = require("../src/services/placementSyncService");

async function main() {
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MongoDB URI is missing from backend/.env");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected for placement sync");

  const result = await syncDevGlobalJobs({
    country: "in",
    category: "technology",
    limit: 50,
    offset: 0,
  });

  console.log("Placement sync completed:", result);
}

main()
  .catch((error) => {
    console.error("Placement sync failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
