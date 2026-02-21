import { IUser, IMedia } from './user-interface';
import { ChatType, MessageType, CallType, CallStatus, ChatRole } from '../constants';

export interface IChat {
    id: string;
    type: ChatType;
    name?: string | null;
    createdAt: Date;
    updatedAt: Date;
    directKey?: string | null;
    members?: IChatMember[];
    messages?: IMessage[];
}

export interface IChatMember {
    chatId: string;
    userId: string;
    joinedAt: Date;
    role: ChatRole;
    lastDeletedAt?: Date | null;
    chat?: IChat;
    user?: IUser;
}

export interface IMessage {
    id: string;
    chatId: string;
    senderId: string;
    content?: string | null;
    type: MessageType;
    createdAt: Date;
    updatedAt: Date;
    chat?: IChat;
    sender?: IUser;
    messageMedias?: IMessageMedia[];
    messageReactions?: IMessageReaction[];
    messageReads?: IMessageRead[];
    callData?: ICallData | null;
}

export interface IMessageMedia {
    messageId: string;
    mediaId: string;
    message?: IMessage;
    media?: IMedia;
}

export interface IMessageReaction {
    messageId: string;
    userId: string;
    reaction: string;
    createdAt: Date;
    message?: IMessage;
    user?: IUser;
}

export interface IMessageRead {
    messageId: string;
    userId: string;
    readAt: Date;
    message?: IMessage;
    user?: IUser;
}

export interface ICallData {
    id: string;
    messageId: string;
    initiatorId: string;
    type: CallType;
    status: CallStatus;
    startedAt: Date;
    endedAt?: Date | null;
    durationSec?: number | null;
    message?: IMessage;
    initiator?: IUser;
}
