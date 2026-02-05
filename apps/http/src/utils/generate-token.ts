import { IAdmin } from '@repo/shared';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from "@/config"

export type Payload = {
    id: string;
    name: string;
    email: string;
};

const generateAccessToken = (payload: Payload) => {
    const options: SignOptions = { expiresIn: config.JWT_ACCESS_TOKEN_EXPIRY };
    return jwt.sign(
        payload,
        config.JWT_ACCESS_TOKEN_SECRET,
        options
    );
};

const generateRefreshToken = (payload: Payload) => {
    const options: SignOptions = { expiresIn: config.JWT_REFRESH_TOKEN_EXPIRY };
    return jwt.sign(
        payload,
        config.JWT_REFRESH_TOKEN_SECRET,
        options
    );
};

export const generateTokens = (admin: IAdmin) => {
    const payload: Payload = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET);
        return decoded as Payload;
    } catch (error) {
        return false;
    }
};

export const verifyRefreshToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, config.JWT_REFRESH_TOKEN_SECRET);
        return decoded as Payload;
    } catch (error) {
        return false;
    }
};

export const verifyToken = verifyAccessToken;
