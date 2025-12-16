'use client';

import './StatCard.css';

interface StatCardProps {
    icon: string;
    label: string;
    value: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    color?: 'primary' | 'success' | 'warning' | 'danger';
}

export default function StatCard({ icon, label, value, trend, color = 'primary' }: StatCardProps) {
    return (
        <div className={`stat-card stat-card-${color}`}>
            <div className="stat-icon">
                <span>{icon}</span>
            </div>
            <div className="stat-content">
                <p className="stat-label">{label}</p>
                <h3 className="stat-value">{value}</h3>
                {trend && (
                    <div className={`stat-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
                        <span className="trend-icon">{trend.isPositive ? '↗' : '↘'}</span>
                        <span className="trend-value">{trend.value}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
