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
        { icon: '🤝', label: 'Convênios', href: '/convenios' },
        { icon: '🧾', label: 'Boletos', href: '/boletos' },
        { icon: '💰', label: 'Caixa', href: '/caixa' },
        { icon: '📤', label: 'Saídas', href: '/saidas' },
        { icon: '💵', label: 'Vales', href: '/vales' },
        { icon: '🍱', label: 'Marmitas', href: '/marmitas' },
        { icon: '👥', label: 'Folha', href: '/folha-pagamento' },
        { icon: '📒', label: 'Cadastros', href: '/cadastros' },
    ];

    return (
        <header className="header">
            <div className="header-container">
                <div className="logo-section">
                    <img src="/logo.png" alt="PH Service Logo" className="logo-image" />
                </div>

                <nav className="header-nav">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                            title={item.label}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="header-actions">
                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        title="Alternar Tema"
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>

                    <button
                        className="nav-item logout-btn"
                        onClick={logout}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%', color: 'var(--text-secondary)' }}
                        title="Sair do Sistema"
                    >
                        <span className="nav-icon">🚪</span>
                        <span className="nav-label" style={{ marginLeft: '0.75rem' }}>Sair</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
