'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

interface AppContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Load theme preference
    useEffect(() => {
        const loadTheme = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('user_preferences')
                .select('theme')
                .eq('id', user.id)
                .single();

            if (data?.theme) {
                setTheme(data.theme as 'light' | 'dark');
                document.documentElement.setAttribute('data-theme', data.theme);
            }
        };
        loadTheme();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);

        if (user) {
            await supabase
                .from('user_preferences')
                .upsert({ id: user.id, theme: newTheme });
        }
    };

    return (
        <AppContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
