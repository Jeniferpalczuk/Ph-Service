'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
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
    LuLogOut
} from 'react-icons/lu';
import './Header.css';

export default function Header() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useApp();
    const { logout, user } = useAuth();

    const menuItems = [
        { icon: <LuLayoutDashboard size={20} />, label: 'Dashboard', href: '/' },
        { icon: <LuHandshake size={20} />, label: 'Convênios', href: '/convenios' },
        { icon: <LuBarcode size={20} />, label: 'Boletos', href: '/boletos' },
        { icon: <LuCalculator size={20} />, label: 'Caixa', href: '/caixa' },
        { icon: <LuTrendingDown size={20} />, label: 'Saídas', href: '/saidas' },
        { icon: <LuDollarSign size={20} />, label: 'Vales', href: '/vales' },
        { icon: <LuUtensils size={20} />, label: 'Marmitas', href: '/marmitas' },
        { icon: <LuUsers size={20} />, label: 'Folha', href: '/folha-pagamento' },
        { icon: <LuSettings size={20} />, label: 'Cadastros', href: '/cadastros' },
    ];

    return (
        <header className="header">
            <div className="header-container">
                <div className="logo-section">
                    <img src="/logo.png" alt="PH Service" className="logo-image" />
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
