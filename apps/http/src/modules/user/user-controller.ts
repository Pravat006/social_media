import { asyncHandler } from "@/utils/async-handler";
import { ApiResponse } from "@/interface/api-response";
import status from "http-status";
import userService from "./user-service";
import { ApiError } from "@/interface";
import { toUserDTO, toUserProfileDTO } from "./user-dto";


export const getMe = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(status.UNAUTHORIZED, "Not authenticated");
    }

    return res.status(status.OK).json(
        new ApiResponse(status.OK, "User info retrieved successfully", toUserDTO(user))
    );
});



export const getProfile = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(status.UNAUTHORIZED, "Not authenticated");
    }

    const userData = await userService.getUserProfile(user.id);

    return res.status(status.OK).json(
        new ApiResponse(status.OK, "User profile retrieved successfully", toUserProfileDTO(userData))
    );
});

export const getUsers = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(status.UNAUTHORIZED, "Not authenticated");
    }

    const users = await userService.getAllUsers(user.id);

    return res.status(status.OK).json(
        new ApiResponse(status.OK, "Users retrieved successfully", users)
    );
});
