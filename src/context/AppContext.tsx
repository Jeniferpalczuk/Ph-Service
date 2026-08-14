'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { APP_MODULES, DEFAULT_MODULE_VISIBILITY, type AppModuleKey } from '@/lib/modules';

type ModuleVisibility = Record<AppModuleKey, boolean>;

const MODULE_VISIBILITY_STORAGE_KEY = 'ph-service:module-visibility';

function parseModuleVisibility(value: string | null): ModuleVisibility {
    if (!value) return DEFAULT_MODULE_VISIBILITY;

    try {
        const parsed = JSON.parse(value) as Partial<Record<AppModuleKey, boolean>>;
        return APP_MODULES.reduce((visibility, module) => {
            visibility[module.key] = parsed[module.key] !== false;
            return visibility;
        }, { ...DEFAULT_MODULE_VISIBILITY });
    } catch {
        return DEFAULT_MODULE_VISIBILITY;
    }
}

interface AppContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    moduleVisibility: ModuleVisibility;
    visibleModules: typeof APP_MODULES;
    hiddenModuleCount: number;
    setModuleVisibility: (module: AppModuleKey, visible: boolean) => void;
    resetModuleVisibility: () => void;
    isModuleVisible: (module: AppModuleKey) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const supabase = useMemo(() => createClient(), []);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [moduleVisibility, setModuleVisibilityState] = useState<ModuleVisibility>(DEFAULT_MODULE_VISIBILITY);

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

    useEffect(() => {
        setModuleVisibilityState(parseModuleVisibility(localStorage.getItem(MODULE_VISIBILITY_STORAGE_KEY)));

        const handleStorage = (event: StorageEvent) => {
            if (event.key === MODULE_VISIBILITY_STORAGE_KEY) {
                setModuleVisibilityState(parseModuleVisibility(event.newValue));
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

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

    const persistModuleVisibility = (nextVisibility: ModuleVisibility) => {
        setModuleVisibilityState(nextVisibility);
        localStorage.setItem(MODULE_VISIBILITY_STORAGE_KEY, JSON.stringify(nextVisibility));
    };

    const setModuleVisibility = (module: AppModuleKey, visible: boolean) => {
        persistModuleVisibility({
            ...moduleVisibility,
            [module]: visible,
        });
    };

    const resetModuleVisibility = () => {
        persistModuleVisibility(DEFAULT_MODULE_VISIBILITY);
    };

    const isModuleVisible = (module: AppModuleKey) => moduleVisibility[module] !== false;

    const visibleModules = useMemo(
        () => APP_MODULES.filter((module) => moduleVisibility[module.key] !== false),
        [moduleVisibility]
    );

    const hiddenModuleCount = APP_MODULES.length - visibleModules.length;

    return (
        <AppContext.Provider value={{
            theme,
            toggleTheme,
            moduleVisibility,
            visibleModules,
            hiddenModuleCount,
            setModuleVisibility,
            resetModuleVisibility,
            isModuleVisible,
        }}>
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
