import { Router } from "express";
import { getMe, getProfile } from "./user-controller";
import authMiddleware from "@/middlewares/auth-middleware";


const router = Router();

// All user routes require authentication
router.use(authMiddleware);

router.get("/me", getMe);
router.get("/profile", getProfile);

export const userSafeRouter: Router = router;
