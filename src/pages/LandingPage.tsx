import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Play } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { sendVerificationCode, register, login } from '@/services/authApi';
import { useAuthStore } from '@/stores/authStore';
import Logo from '@/img/Logo.png';

type AuthMode = 'login' | 'register';
type ViewState = 'landing' | 'auth';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();

    const [viewState, setViewState] = useState<ViewState>('landing');
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [code, setCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState('');

    // 已登录则跳转
    useEffect(() => {
        if (user) {
            navigate('/video', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendCode = async () => {
        if (!email || countdown > 0) return;
        setError('');
        setSendingCode(true);
        try {
            await sendVerificationCode(email, 'register');
            setCountdown(60);
        } catch (err) {
            setError(err instanceof Error ? err.message : '发送失败');
        } finally {
            setSendingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (mode === 'register' && password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }
        setLoading(true);
        try {
            if (mode === 'register') {
                const res = await register(email, password, code, nickname);
                setUser(res.user);
            } else {
                const res = await login(email, password);
                setUser(res.user);
            }
            navigate('/video');
        } catch (err) {
            setError(err instanceof Error ? err.message : '操作失败');
        } finally {
            setLoading(false);
        }
    };

    const handleExperience = () => {
        setViewState('auth');
        setMode('login');
    };

    const handleNavLogin = () => {
        setViewState('auth');
        setMode('login');
    };

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ zIndex: 10, background: '#000' }}>
            {/* 视频背景 */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 0 }}
            >
                <source src="https://oss.filenest.top/uploads/9c854c04-ed33-47e1-b8b1-e24cbdd4f1e4.mp4" type="video/mp4" />
            </video>

            {/* 视频遮罩 */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
                    zIndex: 1
                }}
            />

            {/* 透明导航栏 */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
                style={{ background: 'transparent' }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-end">
                    {/* 登录按钮 */}
                    <button
                        onClick={handleNavLogin}
                        className="text-white text-sm font-medium hover:text-cyan-400 transition-colors"
                    >
                        登录
                    </button>
                </div>
            </nav>

            {/* 主内容区 */}
            <div className="relative z-10 min-h-screen flex items-center">
                <div className="w-full max-w-7xl mx-auto px-6 flex items-center">
                    {/* 左侧：宣传文案 + 按钮 */}
                    <div
                        className={`transition-all duration-700 ease-out ${viewState === 'auth' ? 'w-1/2 pr-8' : 'w-full text-center'
                            }`}
                    >
                        {/* Logo + 品牌名作为大标题 */}
                        <div className={`flex items-center gap-4 mb-6 transition-all duration-700 ${viewState === 'auth' ? 'justify-start' : 'justify-center'}`}>
                            <img src={Logo} alt="喵想" className={`transition-all duration-700 ${viewState === 'auth' ? 'h-16' : 'h-24 md:h-32'}`} />
                            <span
                                className={`font-bold text-white transition-all duration-700 ${viewState === 'auth' ? 'text-4xl' : 'text-5xl md:text-7xl'}`}
                                style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
                            >
                                喵想
                            </span>
                        </div>

                        <h2
                            className={`font-bold text-white mb-6 leading-tight transition-all duration-700 ${viewState === 'auth' ? 'text-2xl text-left' : 'text-3xl md:text-4xl'
                                }`}
                            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
                        >
                            用 AI 释放你的创作潜能
                        </h2>

                        <p
                            className={`text-gray-300 mb-8 transition-all duration-700 ${viewState === 'auth' ? 'text-base text-left' : 'text-lg md:text-xl max-w-2xl mx-auto'
                                }`}
                        >
                            更亲民的 AI 创作平台，让你的想象力变为现实。从剧本创作到视频生成，AI 助你轻松完成。
                        </p>

                        {/* 立即体验按钮 */}
                        {viewState === 'landing' && (
                            <button
                                onClick={handleExperience}
                                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:brightness-110"
                                style={{
                                    background: '#6366f1',
                                    boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                                }}
                            >
                                <Play size={22} className="group-hover:scale-110 transition-transform" />
                                立即体验
                            </button>
                        )}
                    </div>

                    {/* 右侧：登录/注册框 */}
                    <div
                        className={`transition-all duration-700 ease-out overflow-hidden ${viewState === 'auth' ? 'w-1/2 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full'
                            }`}
                    >
                        <div
                            className="w-full max-w-md ml-auto rounded-2xl p-8"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                            }}
                        >
                            {/* 标题 */}
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {mode === 'login' ? '欢迎回来' : '创建账号'}
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    {mode === 'login' ? '登录以继续使用 喵想' : '注册以开始创作之旅'}
                                </p>
                            </div>

                            {/* 表单 */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* 邮箱 */}
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                                    <Input
                                        type="email"
                                        placeholder="邮箱地址"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            color: '#fff',
                                        }}
                                        required
                                    />
                                </div>

                                {/* 验证码（仅注册） */}
                                {mode === 'register' && (
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                type="text"
                                                placeholder="验证码"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                maxLength={6}
                                                style={{
                                                    background: 'rgba(255,255,255,0.1)',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    color: '#fff',
                                                }}
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleSendCode}
                                            disabled={!email || countdown > 0 || sendingCode}
                                            className="w-28 shrink-0"
                                            style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                borderColor: 'rgba(255,255,255,0.2)',
                                                color: countdown > 0 ? '#9ca3af' : '#818cf8',
                                            }}
                                        >
                                            {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                                        </Button>
                                    </div>
                                )}

                                {/* 昵称（仅注册） */}
                                {mode === 'register' && (
                                    <div className="relative">
                                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                                        <Input
                                            type="text"
                                            placeholder="昵称（选填）"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="pl-10"
                                            style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: '#fff',
                                            }}
                                        />
                                    </div>
                                )}

                                {/* 密码 */}
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                                    <Input
                                        type="password"
                                        placeholder={mode === 'register' ? '设置密码（至少6位）' : '密码'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            color: '#fff',
                                        }}
                                        minLength={mode === 'register' ? 6 : undefined}
                                        required
                                    />
                                </div>

                                {/* 确认密码（仅注册） */}
                                {mode === 'register' && (
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                                        <Input
                                            type="password"
                                            placeholder="确认密码"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10"
                                            style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: '#fff',
                                            }}
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                )}

                                {/* 错误提示 */}
                                {error && (
                                    <div
                                        className="text-sm text-center py-2 px-4 rounded-lg"
                                        style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                                    >
                                        {error}
                                    </div>
                                )}

                                {/* 提交按钮 */}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 text-base font-medium transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
                                    style={{
                                        background: '#6366f1',
                                        border: 'none',
                                        boxShadow: '0 4px 24px rgba(99,102,241,0.3)',
                                    }}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            处理中...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            {mode === 'login' ? '登录' : '注册'}
                                            <ArrowRight size={18} />
                                        </span>
                                    )}
                                </Button>
                            </form>

                            {/* 切换模式 */}
                            <div className="mt-6 text-center">
                                <span className="text-gray-400 text-sm">
                                    {mode === 'login' ? '还没有账号？' : '已有账号？'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode(mode === 'login' ? 'register' : 'login');
                                        setError('');
                                    }}
                                    className="ml-2 text-sm font-medium transition-colors hover:underline"
                                    style={{ color: '#818cf8' }}
                                >
                                    {mode === 'login' ? '立即注册' : '去登录'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
