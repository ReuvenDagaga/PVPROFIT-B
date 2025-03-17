import mongoose from "mongoose"
import 'dotenv/config'

export const connectToMongo = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.MONGOS || "")
        console.log("connect to mongo");
    } catch (error) {
        console.error(error + "Not Connect");  
    }
}