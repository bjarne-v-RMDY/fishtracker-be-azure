import mongoose from "mongoose";
import * as Effect from "effect/Effect";

export const intitateMongoDb = Effect.tryPromise({
  try: () =>
    mongoose.connect(Bun.env.MONGO || "mongodb://localhost:27017", {
      dbName: "fishDB"
    }).then((res) => {
      console.log(
        'Connected to mongodb on: ' +
        (Bun.env.MONGO  ? "Azure cosmos db instance of mongodb" : "mongodb://localhost:27017")
      );
      return res;
    }),
  catch: (err) => new Error("Unable to connect to mongoDB: " + err)
});