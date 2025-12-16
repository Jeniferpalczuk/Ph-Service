'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    username: string;
    role: 'adm' | 'gerente';
}

interface AuthContextType {
    user: User | null;
    login: (u: string, p: string) => boolean;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Persist login state
    useEffect(() => {
        const storedUser = localStorage.getItem('ph_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user session");
            }
        }
        setIsLoading(false);
    }, []);

    const login = (u: string, p: string) => {
        // Hardcoded credentials
        if (u === 'adm' && p === '123') {
            const userData: User = { username: 'Administrador', role: 'adm' };
            setUser(userData);
            localStorage.setItem('ph_user', JSON.stringify(userData));
            return true;
        }
        if (u === 'adm2' && p === '123') {
            const userData: User = { username: 'Gerente', role: 'gerente' };
            setUser(userData);
            localStorage.setItem('ph_user', JSON.stringify(userData));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ph_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
