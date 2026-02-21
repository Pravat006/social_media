
import type { UserDTO } from './user.dto';

/**
 * Authentication DTOs
 */

export interface AuthUserDTO extends UserDTO { }

export interface TokenDTO {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponseDTO {
    user: AuthUserDTO;
    tokens: TokenDTO;
}

export interface RefreshTokenResponseDTO {
    tokens: TokenDTO;
}
