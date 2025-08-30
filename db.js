import mongoose from "mongoose";

export const connectDB = async () => {
    try {

        console.log(process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI )
        .then(() => {
            console.log("MongoDB connected");
        });
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};