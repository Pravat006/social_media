import { UserDTO, MediaDTO, UserProfileDTO } from "@repo/shared";



export const toUserDTO = (user: any): UserDTO => {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        profilePictureId: user.profilePictureId,
        isVerified: user.isVerified,
        isPrivate: user.isPrivate,
        lastSeen: user.lastSeen?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
};

export const toMediaDTO = (media: any): MediaDTO => {
    return {
        id: media.id,
        ownerId: media.ownerId,
        url: media.url,
        type: media.type,
        mimeType: media.mimeType,
        size: media.size,
        width: media.width,
        height: media.height,
        duration: media.duration,
        createdAt: media.createdAt.toISOString(),
        updatedAt: media.updatedAt.toISOString(),
    };
};

export const toUserProfileDTO = (user: any): UserProfileDTO => {
    return {
        ...toUserDTO(user),
        profilePicture: user.profilePicture ? toMediaDTO(user.profilePicture) : null,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
    };
};
