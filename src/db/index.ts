import mongoose from "mongoose";

export async function intitateMongoDb() {
  try {
    const res = await mongoose.connect(Bun.env.MONGO || "mongodb://localhost:27017", {
      dbName: "fishDB"
    });
    console.log(
      'Connected to mongodb on: ' +
      (Bun.env.MONGO ? "Azure cosmos db instance of mongodb" : "mongodb://localhost:27017")
    );
    return res;
  } catch (err) {
    throw new Error("Unable to connect to mongoDB: " + err);
  }
}