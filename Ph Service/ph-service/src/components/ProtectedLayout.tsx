'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import Header from '@/components/Header';

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated && pathname !== '/login') {
                router.push('/login');
            } else if (isAuthenticated && pathname === '/login') {
                router.push('/');
            }
        }
    }, [isAuthenticated, loading, pathname, router]);

    if (loading) {
        return (
            <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style jsx global>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (pathname === '/login') {
        if (isAuthenticated) return null;
        return <>{children}</>;
    }

    if (!isAuthenticated) return null;

    return (
        <div className="app-layout">
            <Header />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AppProvider>
                <AuthGuard>{children}</AuthGuard>
            </AppProvider>
        </AuthProvider>
    );
}
