'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { QueryProvider } from '@/providers/QueryProvider';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

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
            <div className="app-loading-screen" role="status" aria-live="polite">
                <div className="app-loading-spinner" aria-hidden="true"></div>
                <span>Carregando seu ambiente...</span>
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
            <Sidebar />
            <div className="main-container">
                <TopBar />
                <main className="main-content">
                    <div className="content-inner">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <QueryProvider>
                <AppProvider>
                    <AuthGuard>{children}</AuthGuard>
                </AppProvider>
            </QueryProvider>
        </AuthProvider>
    );
}

