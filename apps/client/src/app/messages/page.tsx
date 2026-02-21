"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { socketService } from "@/lib/socket-service";
import { ChatService } from "@/lib/services/chat.service";
import { UserService } from "@/lib/services/user.service";
import {
    ChatMessageData,
    ChatReadData,
    ChatReactionData,
    ChatDeleteData,
} from "@repo/shared";
import { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Flag for preventing duplicate global fetches across remounts
let hasInitializedGlobally = false;

export default function SocketTestPage() {
    const router = useRouter();

    // Auth Store Selectors (minimize re-renders)
    const user = useAuthStore(s => s.user);
    const accessToken = useAuthStore(s => s.accessToken);
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const isLoading = useAuthStore(s => s.isLoading);
    const initialize = useAuthStore(s => s.initialize);
    const logout = useAuthStore(s => s.logout);

    // App State
    const [isReady, setIsReady] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [chats, setChats] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    // Chat State
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [messagesByChat, setMessagesByChat] = useState<Record<string, any[]>>({});
    const [messageInput, setMessageInput] = useState("");
    const [typingStatus, setTypingStatus] = useState<Record<string, string>>({}); // chatId -> typing msg

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Auth Initialization
    useEffect(() => {
        if (!isAuthenticated && accessToken && !isLoading) {
            initialize();
        }
    }, [isAuthenticated, accessToken, isLoading, initialize]);

    // Fetch Initial Data once authenticated
    useEffect(() => {
        const loadInitialData = async () => {
            if (hasInitializedGlobally || !isAuthenticated) return;
            hasInitializedGlobally = true;

            try {
                const [userChats, usersList] = await Promise.all([
                    ChatService.getUserChats(),
                    UserService.getAllUsers()
                ]);
                setChats(userChats);
                setAllUsers(usersList);
            } catch (err) {
                console.error("Initialization failed:", err);
                hasInitializedGlobally = false;
            } finally {
                setIsReady(true);
            }
        };

        if (isAuthenticated) {
            loadInitialData();
        } else if (!isLoading && !accessToken) {
            setIsReady(true);
        }
    }, [isAuthenticated, isLoading, accessToken]);

    // Dedicated effect for redirection to avoid "update during render" errors
    useEffect(() => {
        if (isReady && !isAuthenticated && !accessToken) {
            router.push("/login?redirect=/messages");
        }
    }, [isReady, isAuthenticated, accessToken, router]);

    // Socket Connection
    useEffect(() => {
        if (isAuthenticated && accessToken) {
            const s = socketService.connect(accessToken);
            setSocket(s);

            s.on("connect", () => {
                setIsConnected(true);
                console.log("Socket connected:", s.id);
            });

            s.on("connect_error", (err) => {
                console.error("Socket connection error:", err);
                setIsConnected(false);
            });

            s.on("disconnect", () => {
                setIsConnected(false);
                console.log("Socket disconnected");
            });

            s.on("users:online_initial", (userIds: string[]) => {
                setOnlineUserIds(new Set(userIds));
            });

            s.on("user:online", (data: any) => {
                setOnlineUserIds(prev => {
                    const next = new Set(prev);
                    next.add(data.userId);
                    return next;
                });
            });

            s.on("user:offline", (data: any) => {
                setOnlineUserIds(prev => {
                    const next = new Set(prev);
                    next.delete(data.userId);
                    return next;
                });
            });

            s.on("chat:message", (data: any) => {
                setMessagesByChat(prev => {
                    const msgs = prev[data.chatId] || [];
                    if (data.tempId && msgs.find(m => m.tempId === data.tempId)) {
                        return { ...prev, [data.chatId]: msgs.map(m => m.tempId === data.tempId ? { ...data } : m) };
                    }
                    if (msgs.find(m => m.id === data.id)) return prev;
                    return { ...prev, [data.chatId]: [...msgs, data] };
                });

                // Update sidebar chats list
                setChats(prev => {
                    const chatIndex = prev.findIndex(c => c.id === data.chatId);
                    if (chatIndex === -1) return prev; // Should ideally refetch if not found

                    const updatedChat = { ...prev[chatIndex], lastMessage: data };
                    const next = [...prev];
                    next.splice(chatIndex, 1);
                    return [updatedChat, ...next];
                });

                console.log("Message received:", data);
            });

            s.on("chat:typing", (data: any) => {
                setTypingStatus(prev => ({
                    ...prev,
                    [data.chatId]: data.isTyping ? `${data.username} is typing...` : "",
                }));
            });

            s.on("chat:reaction", (data: any) => {
                setMessagesByChat(prev => {
                    const msgs = prev[data.chatId] || [];
                    const updated = msgs.map(m => {
                        if (m.id === data.messageId) {
                            const reactions = m.reactions || {};
                            return { ...m, reactions: { ...reactions, [data.userId]: data.reaction } };
                        }
                        return m;
                    });
                    return { ...prev, [data.chatId]: updated };
                });
            });

            s.on("chat:delete", (data: any) => {
                setMessagesByChat(prev => {
                    const msgs = prev[data.chatId] || [];
                    const updated = msgs.map(m => m.id === data.messageId ? { ...m, isDeleted: true } : m);
                    return { ...prev, [data.chatId]: updated };
                });
            });

            return () => {
                socketService.disconnect();
            };
        }
    }, [isAuthenticated, accessToken]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messagesByChat, activeChatId]);

    // Handle Auth
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
    };

    // Chat Actions
    const handleChatClick = async (chat: any) => {
        setActiveChatId(chat.id);
        setActiveChat(chat);
        if (socket) {
            socket.emit("chat:join", chat.id, (res: any) => {
                console.log("Joined chat", res);
            });
        }
    };

    const handleUserClick = async (targetUser: any) => {
        if (!user) return;

        try {
            const chat = await ChatService.initChat({
                type: "DIRECT",
                memberIds: [user.id, targetUser.id]
            });

            // Refetch chats to include the new one
            const updatedChats = await ChatService.getUserChats();
            setChats(updatedChats);

            setSearchQuery(""); // Clear search
            setActiveChatId(chat.id);
            setActiveChat(chat);

            if (socket) {
                socket.emit("chat:join", chat.id, (res: any) => {
                    console.log("Joined chat", res);
                });
            }
        } catch (error: any) {
            console.error("Failed to init chat", error);
            alert(`Failed to open chat: ${error.response?.data?.message || error.message}`);
        }
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const content = messageInput.trim();

        if (!socket) { console.error("No socket"); return; }
        if (!socket.connected) { console.error("Socket not connected", socket.id); return; }
        if (!activeChatId) { console.error("No active chat"); return; }
        if (!content) return;
        if (!user) { console.error("No user"); return; }

        const tempId = Math.random().toString(36).substring(7);
        const data: ChatMessageData = {
            chatId: activeChatId,
            content,
            tempId,
        };

        // Add optimistic message immediately so sender sees it right away
        const optimisticMsg = {
            id: tempId,              // temporary id, replaced when server echoes back
            tempId,
            chatId: activeChatId,
            senderId: user.id,
            senderUsername: user.username,
            content,
            type: 'USER',
            createdAt: new Date().toISOString(),
        };

        // Clear input early to feel snappy
        setMessageInput("");

        setMessagesByChat(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), optimisticMsg] }));

        socket.emit("chat:message", data);
        socket.emit("chat:typing", { chatId: activeChatId, isTyping: false });
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        if (!socket || !activeChatId) return;

        // Debounce typing status
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        socket.emit("chat:typing", { chatId: activeChatId, isTyping: true });

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("chat:typing", { chatId: activeChatId, isTyping: false });
        }, 2000);
    };

    const getOtherMember = (chat: any) => {
        if (chat.type === 'DIRECT') {
            return chat.members?.find((m: any) => m.userId !== user?.id)?.user;
        }
        return null;
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
            'bg-blue-500', 'bg-gray-500', 'bg-gray-500',
            'bg-yellow-500', 'bg-orange-500', 'bg-red-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const formatMessageTime = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const sendReaction = (messageId: string, reaction: string) => {
        if (!socket || !activeChatId || !user) return;
        // Optimistically apply reaction locally
        setMessagesByChat(prev => {
            const msgs = prev[activeChatId] || [];
            const updated = msgs.map(m => {
                if (m.id === messageId) {
                    const reactions = m.reactions || {};
                    return { ...m, reactions: { ...reactions, [user.id]: reaction } };
                }
                return m;
            });
            return { ...prev, [activeChatId]: updated };
        });
        socket.emit("chat:reaction", { chatId: activeChatId, messageId, reaction });
    };

    const deleteMessage = (messageId: string) => {
        if (!socket || !activeChatId) return;
        socket.emit("chat:delete", { chatId: activeChatId, messageId });
    };


    // Final Loading Check
    if (!isReady) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-800">Synchronizing session</h2>
                    <p className="text-gray-500 mt-1">Please wait while we connect you securely...</p>
                </div>
            </div>
        );
    }

    // If ready but not authenticated, show redirecting state
    if (isReady && (!isAuthenticated || !user)) {
        // The redirection is handled by the useEffect above
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-gray-500">Redirecting to login...</p>
            </div>
        );
    }

    const activeMessages = activeChatId ? (messagesByChat[activeChatId] || []) : [];

    return (
        <div className="h-screen w-full bg-gray-100 flex p-4 font-sans">
            <div className="max-w-6xl w-full mx-auto bg-white rounded-xl shadow-xl overflow-hidden flex flex-row border border-gray-200">

                {/* Contacts Sidebar */}
                <div className="w-[350px] bg-gray-50 border-r flex flex-col">
                    <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
                        <div className="font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="leading-tight">{user?.name || user?.username}</div>
                                <div className={`text-xs font-medium tracking-wide transition-colors ${isConnected ? "text-green-600" : "text-amber-500"}`}>
                                    {isConnected ? "Connected" : "Reconnecting..."}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => logout()} className="text-xs text-red-500 hover:underline">Logout</button>
                    </div>

                    <div className="p-3">
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto w-full">
                        {searchQuery.trim() === "" ? (
                            chats.map(chat => {
                                const otherMember = getOtherMember(chat);
                                const displayName = chat.type === 'DIRECT' ? (otherMember?.name || otherMember?.username) : chat.name;
                                const lastMsg = chat.lastMessage;

                                return (
                                    <div
                                        key={chat.id}
                                        onClick={() => handleChatClick(chat)}
                                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-gray-100
                                            ${activeChatId === chat.id ? "bg-blue-50" : "hover:bg-gray-100"}
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-full relative shrink-0 flex items-center justify-center text-white font-bold overflow-hidden shadow-inner ${getAvatarColor(displayName || "")}`}>
                                            {otherMember?.profilePicture?.url ? (
                                                <img src={otherMember.profilePicture.url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{displayName?.charAt(0).toUpperCase()}</span>
                                            )}
                                            {otherMember && onlineUserIds.has(otherMember.id) && (
                                                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    {lastMsg ? formatMessageTime(lastMsg.createdAt) : ""}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-gray-500 truncate leading-tight">
                                                {lastMsg ? (
                                                    <>
                                                        {lastMsg.senderId === user?.id && <span className="text-gray-400 mr-1">You:</span>}
                                                        {lastMsg.content}
                                                    </>
                                                ) : <span className="italic text-gray-400">No messages yet</span>}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            allUsers.filter(u =>
                                u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                u.name?.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => handleUserClick(u)}
                                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100"
                                >
                                    <div className="w-12 h-12 rounded-full relative shrink-0 flex items-center justify-center text-white font-bold overflow-hidden shadow-inner bg-blue-500">
                                        {u.profilePicture?.url ? (
                                            <img src={u.profilePicture.url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${getAvatarColor(u.name || u.username)}`}>
                                                {u.name?.charAt(0).toUpperCase() || u.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-800 truncate">{u.name || u.username}</h3>
                                        <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-[#efeae2] relative chat-bg overflow-hidden">
                    {!activeChatId ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-6 bg-[#f8f9fa] z-10 p-8 text-center">
                            <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center text-6xl shadow-sm border border-blue-100">💬</div>
                            <div className="max-w-xs">
                                <h3 className="text-2xl font-semibold text-gray-800 mb-2">Social Messages</h3>
                                <p className="text-gray-500">Select a conversation or search for someone new to start chatting.</p>
                            </div>
                            <button
                                onClick={() => document.querySelector<HTMLInputElement>('input[placeholder="Search people..."]')?.focus()}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-md"
                            >
                                Find People
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="bg-gray-100 py-3 px-4 flex items-center gap-3 border-b border-gray-200 shadow-sm z-10 sticky top-0">
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-medium overflow-hidden">
                                    {getOtherMember(activeChat)?.profilePicture?.url ? (
                                        <img src={getOtherMember(activeChat).profilePicture.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{(activeChat.name || getOtherMember(activeChat)?.name || getOtherMember(activeChat)?.username)?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-bold text-gray-800">{activeChat.name || getOtherMember(activeChat)?.name || getOtherMember(activeChat)?.username}</h2>
                                    <p className="text-xs text-gray-500">
                                        {typingStatus[activeChatId] ? (
                                            <span className="text-green-600 italic">{typingStatus[activeChatId]}</span>
                                        ) : (getOtherMember(activeChat) && onlineUserIds.has(getOtherMember(activeChat).id)) ? (
                                            <span>Online</span>
                                        ) : (
                                            <span>Active now</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-1 pb-6 custom-scrollbar">
                                {activeMessages.map((msg, idx) => {
                                    const isMine = msg.senderId === user?.id;
                                    const prevMsg = activeMessages[idx - 1];
                                    const showTail = !prevMsg || prevMsg.senderId !== msg.senderId;

                                    return (
                                        <div key={msg.id || msg.tempId} className={`flex ${isMine ? "justify-end" : "justify-start"} ${showTail ? "mt-3" : "mt-0"}`}>
                                            <div className={`relative max-w-[75%] rounded-2xl px-3 py-1.5 shadow-sm text-[15px] group
                                                ${isMine ? "bg-[#dcf8c6] text-gray-800" : "bg-white text-gray-800"}
                                                ${showTail && isMine ? "rounded-tr-none" : ""}
                                                ${showTail && !isMine ? "rounded-tl-none" : ""}
                                                ${msg.isDeleted ? "opacity-60 italic text-gray-500" : ""}
                                            `}>
                                                {/* WhatsApp Style Tail */}
                                                {showTail && (
                                                    <div className={`absolute top-0 w-2 h-3 ${isMine ? "-right-2 bg-[#dcf8c6]" : "-left-2 bg-white"}`}
                                                        style={{
                                                            clipPath: isMine ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 0 0, 100% 100%)'
                                                        }}
                                                    />
                                                )}

                                                <div className="flex flex-col">
                                                    {msg.isDeleted ? "🚫 This message was deleted." : msg.content}

                                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isMine && !msg.isDeleted && <span className="text-[10px] text-blue-500 font-bold ml-1">✓✓</span>}
                                                    </div>
                                                </div>

                                                {/* Reactions */}
                                                {!msg.isDeleted && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                    <div className="absolute -bottom-3 left-2 bg-white rounded-full px-1.5 py-0.5 shadow border text-xs flex gap-1 z-10 transition-transform hover:scale-110 cursor-pointer">
                                                        {Object.values(msg.reactions).map((r: any, i) => (
                                                            <span key={i}>{r}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Quick Actions (Hover) */}
                                                {!msg.isDeleted && (
                                                    <div className={`absolute top-0 ${isMine ? "-left-14" : "-right-14"} opacity-0 group-hover:opacity-100 flex gap-1 bg-white shadow-md border rounded-full p-1 transition-opacity z-20`}>
                                                        {isMine && <button onClick={() => deleteMessage(msg.id)} className="p-1 hover:bg-red-50 rounded-full transition-colors text-red-500" title="Delete">🗑</button>}
                                                        <button onClick={() => sendReaction(msg.id, "❤️")} className="p-1 hover:bg-pink-50 rounded-full transition-colors" title="Like">❤️</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="bg-gray-100 p-3 flex gap-2 items-center z-10 sticky bottom-0">
                                <form onSubmit={sendMessage} className="flex-1 flex gap-2 w-full">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={handleTyping}
                                        placeholder="Type a message"
                                        className="flex-1 py-3 px-4 rounded-full border-none outline-none text-gray-800 shadow-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="w-12 h-12 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#008f6f] disabled:opacity-50 transition-colors"
                                    >
                                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .chat-bg {
                    background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
                    background-repeat: repeat;
                    background-size: 400px;
                    background-blend-mode: overlay;
                    background-color: #efeae2;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
}
