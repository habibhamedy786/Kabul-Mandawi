import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@/config/env";
import router from "@/routes/index";
import { notFoundHandler, errorHandler } from "@/middleware/errorHandler";
import { stripeWebhookHandler } from "@/controllers/payment.controller";
import { hesabPayWebhookHandler } from "@/controllers/hesabpay.controller";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

// Payment webhooks need the raw body for signature verification,
// so they must be registered BEFORE the json() body parser.
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.post("/api/payments/hesabpay/webhook", express.raw({ type: "application/json" }), hesabPayWebhookHandler);

app.use(express.json({ limit: "2mb" }));

app.get("/healthz", (_req, res) => res.json({ status: "ok", service: "afc-api" }));

app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);
