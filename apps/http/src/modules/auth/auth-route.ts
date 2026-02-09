import { Router } from "express";
import { register, login, logout, refreshTokens } from "./auth-controller";
import authMiddleware from "@/middlewares/auth-middleware";

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-tokens', refreshTokens);

router.use(authMiddleware);
router.post('/logout', logout);

export const authRouter: Router = router;