'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    LuLogOut,
    LuBell,
    LuSearch
} from 'react-icons/lu';
import { useBoletosStats } from '@/hooks/financeiro/useBoletos';
import './Sidebar.css';

export default function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { data: stats } = useBoletosStats();

    const menuItems = [
        { icon: <LuLayoutDashboard size={22} />, label: 'Dashboard', href: '/' },
        { icon: <LuHandshake size={22} />, label: 'Convênios', href: '/convenios' },
        { icon: <LuBarcode size={22} />, label: 'Boletos', href: '/boletos' },
        { icon: <LuCalculator size={22} />, label: 'Caixa', href: '/caixa' },
        { icon: <LuTrendingDown size={22} />, label: 'Saídas', href: '/saidas' },
        { icon: <LuDollarSign size={22} />, label: 'Vales', href: '/vales' },
        { icon: <LuUtensils size={22} />, label: 'Marmitas', href: '/marmitas' },
        { icon: <LuUsers size={22} />, label: 'Folha', href: '/folha-pagamento' },
        { icon: <LuSettings size={22} />, label: 'Cadastros', href: '/cadastros' },
    ];

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const overdueCount = stats?.quantidadeVencido || 0;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <span className="logo-dot"></span>
                    <span className="logo-text">phservice<span className="logo-dot-end">.</span></span>
                </div>
            </div>

            <div className="sidebar-profile">
                <div className="profile-avatar">
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <span className="profile-name">{userName}</span>
                    <span className="profile-role">
                        {user?.app_metadata?.role === 'adm' ? 'Administrador' : 'Operador'}
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
