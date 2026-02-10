'use client';

import { LuSearch, LuBell, LuMaximize, LuSun, LuMoon } from 'react-icons/lu';
import { useApp } from '@/context/AppContext';
import { useBoletosStats } from '@/hooks/financeiro/useBoletos';
import './TopBar.css';

export default function TopBar() {
    const { theme, toggleTheme } = useApp();
    const { data: stats } = useBoletosStats();

    const hasNotifications = (stats?.quantidadeVencido || 0) > 0;

    return (
        <header className="topbar">
            <div className="topbar-left">
                <div className="search-wrapper">
                    <LuSearch className="search-icon" />
                    <input type="text" placeholder="Pesquisar no sistema..." className="search-input" />
                </div>
            </div>

            <div className="topbar-right">
                <button className="topbar-action" onClick={toggleTheme} title="Alternar Tema">
                    {theme === 'light' ? <LuMoon size={20} /> : <LuSun size={20} />}
                </button>
                <button className="topbar-action" title="Notificações">
                    <LuBell size={20} />
                    {hasNotifications && <span className="action-badge"></span>}
                </button>
                <button className="topbar-action" title="Tela Cheia">
                    <LuMaximize size={20} />
                </button>
            </div>
        </header>
    );
}
