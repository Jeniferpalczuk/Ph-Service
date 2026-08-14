'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
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
} from 'react-icons/lu';
import './Header.css';

const moduleIcons: Record<AppModuleKey, ReactNode> = {
    convenios: <LuHandshake size={20} />,
    boletos: <LuBarcode size={20} />,
    caixa: <LuCalculator size={20} />,
    saidas: <LuTrendingDown size={20} />,
    vales: <LuDollarSign size={20} />,
    marmitas: <LuUtensils size={20} />,
    pagamentos: <LuUsers size={20} />,
};

export default function Header() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const { visibleModules } = useApp();

    const menuItems = [
        { icon: <LuLayoutDashboard size={20} />, label: 'Dashboard', href: '/' },
        ...visibleModules.map((module) => ({
            icon: moduleIcons[module.key],
            label: module.shortLabel,
            href: module.href,
        })),
        { icon: <LuSettings size={20} />, label: 'Configurações', href: '/cadastros' },
    ];

    return (
        <header className="header">
            <div className="header-container">
                <div className="logo-section">
                    <Image src="/ph-service-logo-new.png" alt="PH Service" width={52} height={52} className="logo-image" />
                </div>

                <nav className="header-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="header-actions">
                    <button className="logout-btn" onClick={logout}>
                        <span className="logout-icon"><LuLogOut size={20} /></span>
                        <span className="logout-label">Sair</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
