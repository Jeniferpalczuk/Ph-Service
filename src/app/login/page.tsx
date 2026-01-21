'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import './login.css';

export default function LoginPage() {
    const { signInWithGoogle, signInWithEmail, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (searchParams.get('error') === 'auth_callback_error') {
            setError('Erro ao autenticar. Tente novamente.');
        }
    }, [searchParams]);

    useEffect(() => {
        if (!loading && isAuthenticated) {
            console.log('User is authenticated, redirecting to dashboard...');
            router.push('/');
        }
    }, [isAuthenticated, loading, router]);

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError('Erro ao conectar com Google. Tente novamente.');
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
        } catch (err: any) {
            console.error(err);
            setError(err.message === 'Invalid login credentials'
                ? 'E-mail ou senha incorretos.'
                : 'Erro ao entrar. Verifique seus dados.');
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="login-loading">
                <div className="login-loader"></div>
            </div>
        );
    }

    return (
        <div className="login-page">
            {/* Animated Background */}
            <div className="login-bg">
                <div className="login-orb login-orb-1"></div>
                <div className="login-orb login-orb-2"></div>
                <div className="login-orb login-orb-3"></div>
                <div className="login-orb login-orb-4"></div>
                <div className="login-mesh"></div>
            </div>

            {/* Main Content */}
            <div className="login-wrapper">
                {/* Left Side - Branding */}
                <div className="login-brand-section">
                    <div className="login-brand-content">
                        <div className="login-logo-area">
                            <div className="login-logo-glow"></div>
                        </div>

                        <div className="login-hero">
                            <h2 className="login-hero-title">
                                Gestão Empresarial
                                <span className="login-hero-gradient">Completa e Inteligente</span>
                            </h2>
                            <p className="login-hero-desc">
                                Controle total sobre finanças, operações e equipe em uma plataforma moderna e eficiente.
                            </p>
                        </div>

                        <div className="login-features">
                            <div className="login-feature">
                                <div className="login-feature-icon">📊</div>
                                <div className="login-feature-text">
                                    <h4>Dashboard em Tempo Real</h4>
                                    <p>Visualize métricas e KPIs instantaneamente</p>
                                </div>
                            </div>
                            <div className="login-feature">
                                <div className="login-feature-icon">💰</div>
                                <div className="login-feature-text">
                                    <h4>Controle Financeiro</h4>
                                    <p>Gestão completa de receitas e despesas</p>
                                </div>
                            </div>
                            <div className="login-feature">
                                <div className="login-feature-icon">🔐</div>
                                <div className="login-feature-text">
                                    <h4>Segurança Avançada</h4>
                                    <p>Proteção de dados e controle de acesso</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="login-form-section">
                    <div className="login-card">
                        <div className="login-card-glow"></div>

                        <div className="login-card-header">
                            <span className="login-welcome-badge">✨ Bem-vindo</span>
                            <h2>Acesse sua conta</h2>
                            <p>Entre com seus dados para continuar</p>
                        </div>

                        <div className="login-card-body">
                            {error && (
                                <div className="login-error">
                                    <span>⚠️</span>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleEmailLogin} className="login-form-fields">
                                <div className="login-input-group">
                                    <label htmlFor="email">E-mail</label>
                                    <div className="login-input-wrapper">
                                        <span className="login-input-icon">📧</span>
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="login-input-group">
                                    <label htmlFor="password">Senha</label>
                                    <div className="login-input-wrapper">
                                        <span className="login-input-icon">🔒</span>
                                        <input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Entrando...' : 'Acessar Sistema'}
                                </button>
                            </form>

                            <div className="login-divider">
                                <span>ou continue com</span>
                            </div>
                            {/*
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className={`login-google-btn ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                            >
                                <svg className="login-google-icon" viewBox="0 0 24 24" width="22" height="22">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>Google</span>
                            </button>

                            <div className="login-info-box">
                                <span className="login-info-icon">🛡️</span>
                                <p>Acesso restrito a usuários autorizados. Para criar uma conta, entre em contato com o suporte.</p>
                            </div>
                            */}

                            <div className="login-card-footer">
                                © 2025 PH Service. Todos os direitos reservados.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
