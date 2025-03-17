"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const DB_1 = require("./DB/DB");
const mainRoutes_1 = __importDefault(require("./routers/mainRoutes"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     credentials: true,
//   },
// });
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
const PORT = process.env.PORT || 3456;
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api", mainRoutes_1.default);
// setupSockets(server)
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, DB_1.connectToMongo)();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
startServer();
