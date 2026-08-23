import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { setupChatHub } from "./websocket/chatHub";
import { authRouter } from "./routes/auth.routes";
import { confessionRouter } from "./routes/confession.routes";
import { interactionRouter } from "./routes/interaction.routes";
import { chatRoomRouter } from "./routes/chatroom.routes";
import { adminRouter } from "./routes/admin.routes";
import { verificationRouter } from "./routes/verification.routes";
import { paymentRouter } from "./routes/payment.routes";
import { profileRouter } from "./routes/profile.routes";
import { notificationRouter } from "./routes/notification.routes";

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration (allow all origins, headers, credentials)
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-admin-auth",
      "x-requested-with",
      "x-signalr-user-agent",
      "dnt",
      "sec-ch-ua",
      "sec-ch-ua-mobile",
      "sec-ch-ua-platform",
      "accept",
      "origin",
      "referer",
    ],
  })
);

// Large payload limits for ID photo and base64 uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// SignalR HTTP Negotiation Endpoint (supports POST & GET)
app.all("/hubs/chat/negotiate", (req: Request, res: Response) => {
  return res.json({
    negotiateVersion: 1,
    connectionId: "conn_" + Math.random().toString(36).substring(2, 10),
    connectionToken: "tok_" + Math.random().toString(36).substring(2, 10),
    availableTransports: [
      {
        transport: "WebSockets",
        transferFormats: ["Text"],
      },
    ],
  });
});

// Setup WebSocket Hub for SignalR
const wss = setupChatHub(server);

// Handle HTTP upgrade to WebSocket for /hubs/chat
server.on("upgrade", (request, socket, head) => {
  const pathname = request.url ? request.url.split("?")[0] : "";
  if (pathname === "/hubs/chat" || pathname.startsWith("/hubs/chat")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Mount API Routes
app.use("/api/auth", authRouter);
app.use("/api/confession", confessionRouter);
app.use("/api/interaction", interactionRouter);
app.use("/api/chatroom", chatRoomRouter);
app.use("/api/admin", adminRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/profile", profileRouter);
app.use("/api/notifications", notificationRouter);

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), runtime: "Node.js + Express + Prisma" });
});

// Serve frontend production build if available
const distPath = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(distPath));

app.get("*", (req: Request, res: Response) => {
  if (!req.path.startsWith("/api") && !req.path.startsWith("/hubs")) {
    const indexPath = path.join(distPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send("Finding Node.js API Server Running.");
      }
    });
  } else {
    res.status(404).json({ error: "Endpoint not found" });
  }
});

import { seedDatabase } from "./seed";

const PORT = process.env.PORT || 5000;
server.listen(Number(PORT), "0.0.0.0", async () => {
  console.log(`====================================================`);
  console.log(` Finding Node.js API Server is running on:`);
  console.log(` Local:   http://localhost:${PORT}`);
  console.log(` Network: http://0.0.0.0:${PORT}`);
  console.log(` Hub:     http://localhost:${PORT}/hubs/chat`);
  console.log(`====================================================`);

  await seedDatabase();
});

