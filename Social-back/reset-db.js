import mongoose from "mongoose";
import 'dotenv/config';
const { MONGO_URI } = process.env;

if (!MONGO_URI) {
  console.error("MONGO_URI is not set in environment variables. Please set MONGO_URI to your MongoDB connection string.");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
await mongoose.connection.db.dropDatabase();
console.log("Database dropped");
process.exit();