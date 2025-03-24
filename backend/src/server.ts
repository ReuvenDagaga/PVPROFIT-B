import express from "express";
import dotenv from "dotenv";
import { connectToMongo } from "./DB/DB";
import router from "./routers/mainRoutes";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as http from "http";
import { Server } from "socket.io";
import { setupAllSockets } from "./socket/mainSocket";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(cookieParser());
app.use("/api", router);

const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
setupAllSockets(io);

const startServer = async () => {
  await connectToMongo();
  server.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
};

startServer();
