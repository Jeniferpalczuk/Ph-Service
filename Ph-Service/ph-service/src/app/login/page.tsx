'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const { signInWithGoogle, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Check for auth errors from callback
    useEffect(() => {
        if (searchParams.get('error') === 'auth_callback_error') {
            setError('Erro ao autenticar. Tente novamente.');
        }
    }, [searchParams]);

    // Redirect if already authenticated
    useEffect(() => {
        if (!loading && isAuthenticated) {
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

    // Show loading while checking auth status
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            }}>
                <div className="spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }}></div>
            </div>
        );
    }


    return (
        <>
            <div className="login-container">
                {/* Animated Background */}
                <div className="animated-bg">
                    <div className="gradient-orb orb-1"></div>
                    <div className="gradient-orb orb-2"></div>
                    <div className="gradient-orb orb-3"></div>
                    <div className="grid-overlay"></div>
                </div>

                {/* Main Content */}
                <div className="login-content">
                    {/* Left Side - Branding */}
                    <div className="login-branding">
                        <div className="branding-content">
                            <div className="logo-section">
                                <div className="logo-icon">
                                    <img src="/ph-service-logo.jpg" alt="PH Service" />
                                </div>
                                <h1 className="brand-title">PH Service</h1>
                            </div>

                            <div className="hero-text">
                                <h2 className="hero-title">
                                    Gestão Empresarial
                                    <span className="gradient-text"> Completa e Inteligente</span>
                                </h2>
                                <p className="hero-description">
                                    Controle total sobre finanças, operações e equipe em uma plataforma moderna e eficiente.
                                </p>
                            </div>

                            <div className="features-grid">
                                <div className="feature-card">
                                    <div className="feature-icon">📊</div>
                                    <div className="feature-text">
                                        <h4>Dashboard em Tempo Real</h4>
                                        <p>Visualize métricas e KPIs instantaneamente</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <div className="feature-icon">💰</div>
                                    <div className="feature-text">
                                        <h4>Controle Financeiro</h4>
                                        <p>Gestão completa de receitas e despesas</p>
                                    </div>
                                </div>
                                <div className="feature-card">
                                    <div className="feature-icon">🔐</div>
                                    <div className="feature-text">
                                        <h4>Segurança Avançada</h4>
                                        <p>Proteção de dados e controle de acesso</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="login-form-section">
                        <div className="form-card">
                            <div className="form-header">
                                <h2>Bem-vindo</h2>
                                <p>Entre com sua conta Google para continuar</p>
                            </div>

                            <div className="login-form">
                                {error && (
                                    <div className="error-message">
                                        <span className="error-icon">⚠️</span>
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className={`google-btn ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Conectando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="google-icon" viewBox="0 0 24 24" width="24" height="24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Entrar com Google
                                        </>
                                    )}
                                </button>

                                <div className="divider">
                                    <span>Acesso seguro via Google</span>
                                </div>

                                <div className="info-box">
                                    <span className="info-icon">🔐</span>
                                    <p>Seus dados são protegidos e sincronizados com sua conta Google. Apenas você tem acesso às suas informações.</p>
                                </div>
                            </div>

                            <div className="copyright">
                                © 2025 PH Service. Todos os direitos reservados.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                /* Animated Background */
                .animated-bg {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                    overflow: hidden;
                }

                .gradient-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.3;
                    animation: float 20s ease-in-out infinite;
                }

                .orb-1 {
                    width: 600px;
                    height: 600px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    top: -200px;
                    left: -200px;
                    animation-delay: 0s;
                }

                .orb-2 {
                    width: 500px;
                    height: 500px;
                    background: linear-gradient(135deg, #06b6d4, #3b82f6);
                    bottom: -150px;
                    right: -150px;
                    animation-delay: 7s;
                }

                .orb-3 {
                    width: 400px;
                    height: 400px;
                    background: linear-gradient(135deg, #8b5cf6, #ec4899);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: 14s;
                }

                .grid-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
                    background-size: 50px 50px;
                }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }

                /* Main Content */
                .login-content {
                    position: relative;
                    z-index: 10;
                    display: flex;
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                    gap: 4rem;
                    align-items: center;
                }

                /* Branding Section */
                .login-branding {
                    flex: 1;
                    display: none;
                }

                @media (min-width: 1024px) {
                    .login-branding {
                        display: block;
                    }
                }

                .branding-content {
                    max-width: 600px;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 3rem;
                }

                .logo-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    background: white;
                    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
                    animation: pulse 3s ease-in-out infinite;
                }

                .logo-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                @keyframes pulse {
                    0%, 100% { box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3); }
                    50% { box-shadow: 0 8px 48px rgba(59, 130, 246, 0.5); }
                }

                .brand-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                }

                .hero-text {
                    margin-bottom: 3rem;
                }

                .hero-title {
                    font-size: 3rem;
                    font-weight: 800;
                    line-height: 1.2;
                    color: white;
                    margin: 0 0 1.5rem 0;
                }

                .gradient-text {
                    background: linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6);
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gradientShift 5s ease infinite;
                }

                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .hero-description {
                    font-size: 1.25rem;
                    line-height: 1.7;
                    color: #94a3b8;
                    margin: 0;
                }

                .features-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .feature-card {
                    display: flex;
                    gap: 1.25rem;
                    padding: 1.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    transition: all 0.3s ease;
                }

                .feature-card:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(59, 130, 246, 0.3);
                    transform: translateX(8px);
                }

                .feature-icon {
                    font-size: 2rem;
                    flex-shrink: 0;
                }

                .feature-text h4 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: white;
                    margin: 0 0 0.5rem 0;
                }

                .feature-text p {
                    font-size: 0.9rem;
                    color: #64748b;
                    margin: 0;
                }

                /* Form Section */
                .login-form-section {
                    flex: 0 0 auto;
                    width: 100%;
                    max-width: 480px;
                    display: flex;
                    align-items: center;
                }

                .form-card {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 3rem;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                }

                .form-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }

                .form-header h2 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 0.75rem 0;
                }

                .form-header p {
                    font-size: 1rem;
                    color: #94a3b8;
                    margin: 0;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.625rem;
                }

                .form-group label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin-left: 4px;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 1rem;
                    font-size: 1.25rem;
                    pointer-events: none;
                    opacity: 0.5;
                }

                .input-wrapper input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 3rem;
                    font-size: 1rem;
                    color: white;
                    background: rgba(30, 41, 59, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: 12px;
                    outline: none;
                    transition: all 0.3s ease;
                }

                .input-wrapper input::placeholder {
                    color: #64748b;
                }

                .input-wrapper input:focus {
                    background: rgba(30, 41, 59, 0.8);
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .input-wrapper input:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .error-message {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 12px;
                    color: #fca5a5;
                    font-size: 0.9rem;
                    animation: shake 0.5s ease;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }

                .error-icon {
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }

                .google-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    width: 100%;
                    padding: 1rem 2rem;
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: #1f2937;
                    background: white;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .google-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                    border-color: rgba(59, 130, 246, 0.3);
                }

                .google-btn:active {
                    transform: translateY(0);
                }

                .google-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .google-btn.loading {
                    background: #f1f5f9;
                    color: #64748b;
                }

                .google-icon {
                    flex-shrink: 0;
                }

                .divider {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin: 1.5rem 0;
                }

                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.1);
                }

                .divider span {
                    font-size: 0.8rem;
                    color: #64748b;
                    white-space: nowrap;
                }

                .info-box {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 12px;
                }

                .info-icon {
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }

                .info-box p {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    margin: 0;
                    line-height: 1.5;
                }

                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(0, 0, 0, 0.2);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .copyright {
                    margin-top: 2rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    text-align: center;
                    font-size: 0.8rem;
                    color: #64748b;
                }

                /* Responsive */
                @media (max-width: 1023px) {
                    .login-content {
                        justify-content: center;
                        padding: 1rem;
                    }

                    .form-card {
                        padding: 2rem;
                    }
                }

                @media (max-width: 640px) {
                    .form-card {
                        padding: 1.5rem;
                        border-radius: 16px;
                    }

                    .hero-title {
                        font-size: 2rem;
                    }

                    .form-header h2 {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </>
    );
}
