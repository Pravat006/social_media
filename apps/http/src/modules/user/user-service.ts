import db from "@/services/db";
import { ApiError } from "@/interface";
import status from "http-status";

class UserService {
    async getUserProfile(userId: string) {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    name: true,
                    bio: true,
                    profilePictureId: true,
                    isVerified: true,
                    isPrivate: true,
                    createdAt: true,
                    updatedAt: true,
                    profilePicture: {
                        select: {
                            id: true,
                            url: true,
                            type: true
                        }
                    }
                }
            });

            if (!user) {
                throw new ApiError(status.NOT_FOUND, "User not found");
            }
            return user;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(
                status.INTERNAL_SERVER_ERROR,
                "Something went wrong while fetching user profile"
            );
        }
    }
}

export default new UserService();
