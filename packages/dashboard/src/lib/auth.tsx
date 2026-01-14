'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';

interface User {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    guilds: Array<{
        id: string;
        name: string;
        icon: string | null;
        owner: boolean;
        permissions: string;
    }>;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        api.auth.getMe().then((result) => {
            if (result.data?.user) {
                setUser(result.data.user);
            } else {
                localStorage.removeItem('token');
            }
            setLoading(false);
        });
    }, []);

    const logout = () => {
        api.auth.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

// Get user's guilds with MANAGE_GUILD permission
export function useManageableGuilds() {
    const { user } = useAuth();

    if (!user) return [];

    return user.guilds.filter((guild) => {
        const permissions = BigInt(guild.permissions);
        const hasManageGuild = (permissions & BigInt(0x20)) !== BigInt(0);
        const hasAdmin = (permissions & BigInt(0x8)) !== BigInt(0);
        return guild.owner || hasManageGuild || hasAdmin;
    });
}
