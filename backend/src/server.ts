import express from "express";
import dotenv from "dotenv";
import { connectToMongo } from "./DB/DB";
import router from "./routers/mainRoutes";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "0.0.0.0",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(cookieParser());
app.use("/api", router);

// setupSockets(server)

const startServer = async () => {
  await connectToMongo();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
