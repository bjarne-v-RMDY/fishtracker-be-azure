import mongoose from "mongoose";


export const intitateMongoDb = () =>  mongoose.connect(Bun.env.MONGO || "mongodb://localhost:27017", {
    dbName: "fishDB"
}).then((res) => {    
    console.log('Connected to mongodb on: ' + Bun.env.MONGO || "mongodb://localhost:27017")
})