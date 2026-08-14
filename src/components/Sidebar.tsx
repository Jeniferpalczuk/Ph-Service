'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { isAdminUser } from '@/lib/admin';
import type { AppModuleKey } from '@/lib/modules';
import {
    LuLayoutDashboard,
    LuHandshake,
    LuBarcode,
    LuCalculator,
    LuTrendingDown,
    LuDollarSign,
    LuUtensils,
    LuUsers,
    LuSettings,
    LuLogOut,
    LuBell,
} from 'react-icons/lu';
import { useBoletosStats } from '@/hooks/financeiro/useBoletos';
import './Sidebar.css';

const moduleIcons: Record<AppModuleKey, ReactNode> = {
    convenios: <LuHandshake size={22} />,
    boletos: <LuBarcode size={22} />,
    caixa: <LuCalculator size={22} />,
    saidas: <LuTrendingDown size={22} />,
    vales: <LuDollarSign size={22} />,
    marmitas: <LuUtensils size={22} />,
    pagamentos: <LuUsers size={22} />,
};

export default function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { visibleModules } = useApp();
    const { data: stats } = useBoletosStats();

    const menuItems = [
        { icon: <LuLayoutDashboard size={22} />, label: 'Dashboard', href: '/' },
        ...visibleModules.map((module) => ({
            icon: moduleIcons[module.key],
            label: module.shortLabel,
            href: module.href,
        })),
        { icon: <LuSettings size={22} />, label: 'Config.', href: '/cadastros' },
    ];

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const isAdmin = isAdminUser(user);
    const overdueCount = stats?.quantidadeVencido || 0;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Image src="/ph-service-logo-new.png" alt="PH Service" width={132} height={132} className="sidebar-logo-image" priority />
                </div>
            </div>

            <div className="sidebar-profile">
                <div className="profile-avatar">
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <span className="profile-name">{userName}</span>
                    <span className="profile-role">
                        {isAdmin ? 'Administrador' : 'Operador'}
                    </span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        <span className="nav-item-label">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="new-requests-card">
                    <div className="card-header">
                        <div className="bell-icon">
                            <LuBell size={18} />
                            {overdueCount > 0 && <span className="notification-dot"></span>}
                        </div>
                        <LuSettings size={18} className="more-icon" />
                    </div>
                    <div className="card-body">
                        <h4>{overdueCount > 0 ? `${overdueCount} Boletos Vencidos` : 'Tudo em dia!'}</h4>
                        <p>{overdueCount > 0 ? 'Existem boletos que precisam de sua atenção.' : 'Não há pendências críticas no momento.'}</p>
                    </div>
                </div>

                <button className="sidebar-logout" onClick={logout}>
                    <LuLogOut size={20} />
                    <span>Sair do Sistema</span>
                </button>
            </div>
        </aside>
    );
}
