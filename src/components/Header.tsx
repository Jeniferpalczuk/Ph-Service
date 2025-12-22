'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import './Header.css';

export default function Header() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useApp();
    const { logout, user } = useAuth();

    const menuItems = [
        { icon: '📊', label: 'Dashboard', href: '/' },
        { icon: '✉️', label: 'Convênios', href: '/convenios' },
        { icon: '📋', label: 'Boletos', href: '/boletos' },
        { icon: '🗃️', label: 'Caixa', href: '/caixa' },
        { icon: '📤', label: 'Saídas', href: '/saidas' },
        { icon: '💸', label: 'Vales', href: '/vales' },
        { icon: '🍱', label: 'Marmitas', href: '/marmitas' },
        { icon: '📁', label: 'Folha', href: '/folha-pagamento' },
        { icon: '🗂️', label: 'Cadastros', href: '/cadastros' },
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
                        <span className="logout-icon">🚪</span>
                        <span className="logout-label">Sair</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
