'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAuthenticated: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    signOut: () => Promise<void>;
    // Legacy compatibility
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>({
        id: 'mock_user_123',
        email: 'demo@phservice.com',
        role: 'adm',
        user_metadata: { full_name: 'Demo Admin' }
    });
    const [session, setSession] = useState<Session | null>({ access_token: 'mock' } as Session);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    /* 
    // TEMPORARILY DISABLED FOR DEMO
    useEffect(() => {
        // Get initial session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase.auth]);
    */

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            console.error('Error signing in with email:', error);
            throw error;
        }
        router.push('/');
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({
            password: password
        });
        if (error) {
            console.error('Error updating password:', error);
            throw error;
        }
        alert('Senha atualizada com sucesso!');
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            throw error;
        }
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loading,
            isAuthenticated: !!user,
            signInWithGoogle,
            signInWithEmail,
            updatePassword,
            signOut,
            logout: signOut, // Legacy compatibility
        }}>
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
