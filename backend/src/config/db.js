const mongoose = require("mongoose");
const { autoSeedEssentialData } = require("../utils/seedData");

const connectDB = async () => {
  const primaryUri = (process.env.MONGO_URI || "").trim();
  const fallbackUri = "mongodb://127.0.0.1:27017/smartcampus";

  let connected = false;

  if (primaryUri) {
    try {
      console.log("Connecting to primary MongoDB URI...");
      const connection = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB connected (Primary): ${connection.connection.host}`);
      connected = true;
    } catch (primaryError) {
      console.warn("⚠️ Primary MongoDB connection failed (e.g. Atlas IP whitelist or network):", primaryError.message);
      console.log("🔄 Falling back to local MongoDB at:", fallbackUri);
    }
  }

  if (!connected) {
    try {
      const fallbackConnection = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ Connected to local MongoDB fallback: ${fallbackConnection.connection.host}`);
      connected = true;
    } catch (localError) {
      console.error("❌ Both Primary and Local MongoDB connections failed:");
      console.error(localError.message);
      process.exit(1);
    }
  }

  // Ensure test accounts and sample placement jobs are available
  await autoSeedEssentialData();
};

module.exports = connectDB;