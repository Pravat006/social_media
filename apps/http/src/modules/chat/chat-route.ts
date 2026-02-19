import { Router } from "express";
import * as chatController from "./chat-controller";
import authMiddleware from "@/middlewares/auth-middleware";

const router: Router = Router();

router.use(authMiddleware);

router.post("/", chatController.initChat);
router.delete("/:chatId", chatController.deleteChat);
router.patch("/:chatId", chatController.updateChat);

router.post("/:chatId/members", chatController.addOrRemoveMember);
router.post("/:chatId/members/:userId/toggle-role", chatController.toggleMemberRole);
router.get("/:chatId/members/:userId", chatController.getChatMember);

export { router as chatRouter };
