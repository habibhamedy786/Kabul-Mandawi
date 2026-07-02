import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { getMyWalletOverview } from "@/controllers/wallet.controller";

const router = Router();
router.get("/mine", authenticate, getMyWalletOverview);

export default router;
