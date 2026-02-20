import { authRouter } from "@/modules/auth/auth-route";
import { Router } from "express";
import { userSafeRouter } from "@/modules/user/user-route";
import { chatRouter } from "@/modules/chat/chat-route";

const router: Router = Router()

type Route = {
    path: string,
    route: Router
}

const routeModules: Route[] = [
    {
        path: '/auth',
        route: authRouter
    },
    {
        path: '/user',
        route: userSafeRouter
    },
    {
        path: '/chat',
        route: chatRouter
    }
]

routeModules.forEach((route) => {
    router.use(route.path, route.route)
})

export default router
