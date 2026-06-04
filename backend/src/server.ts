import "dotenv/config";
import app from "./app";
import connectDB from "./config/database";
import { setupEmailService } from "./services/emailService";
import { processDueInterestChecks } from "./services/campaignInterestService";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  await setupEmailService();

  let interestInterval: ReturnType<typeof setInterval> | undefined;

  const server = app.listen(PORT, () => {
    console.log(`🚀 Mashhoor API running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  });

  interestInterval = setInterval(() => {
    processDueInterestChecks().catch((err) =>
      console.error("Interest check scheduler error:", err)
    );
  }, 30_000);

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    if (interestInterval) clearInterval(interestInterval);
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (err: Error) => {
    console.error("❌ Unhandled Rejection:", err.message);
    server.close(() => process.exit(1));
  });
};

startServer();
