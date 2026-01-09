import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { sendVerificationCode, register, login } from '@/services/authApi';
import { useAuthStore } from '@/stores/authStore';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  // 已登录则跳转到首页
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

    // 注册时检查密码一致性
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0a0a0f' }}>
      {/* 背景光效 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-30"
          style={{
            background: 'linear-gradient(135deg, #00f5ff, #bf00ff)',
            top: '-20%',
            right: '-10%',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-20"
          style={{
            background: '#a855f7',
            bottom: '-10%',
            left: '-5%',
          }}
        />
      </div>

      {/* 登录卡片 */}
      <div
        className="w-full max-w-md rounded-2xl p-8 relative z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,30,0.95), rgba(30,30,50,0.95))',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #00f5ff, #bf00ff)',
              boxShadow: '0 0 40px rgba(0,245,255,0.3)',
            }}
          >
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === 'login' ? '欢迎回来' : '创建账号'}
          </h1>
          <p style={{ color: '#6b7280' }} className="text-sm">
            {mode === 'login' ? '登录以继续使用 AI Tools' : '注册以开始创作之旅'}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱 */}
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#6b7280' }}
            />
            <Input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
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
                  borderColor: 'rgba(0,245,255,0.3)',
                  color: countdown > 0 ? '#6b7280' : '#00f5ff',
                }}
              >
                {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
              </Button>
            </div>
          )}

          {/* 昵称（仅注册） */}
          {mode === 'register' && (
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#6b7280' }}
              />
              <Input
                type="text"
                placeholder="昵称（选填）"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* 密码 */}
          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: '#6b7280' }}
            />
            <Input
              type="password"
              placeholder={mode === 'register' ? '设置密码（至少6位）' : '密码'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              minLength={mode === 'register' ? 6 : undefined}
              required
            />
          </div>

          {/* 确认密码（仅注册） */}
          {mode === 'register' && (
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: '#6b7280' }}
              />
              <Input
                type="password"
                placeholder="确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
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
            className="w-full h-12 text-base font-medium transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(90deg, #00f5ff, #bf00ff)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,245,255,0.3)',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                处理中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {mode === 'login' ? '登录' : '注册'}
                <ArrowRight size={18} />
              </span>
            )}
          </Button>
        </form>

        {/* 切换模式 */}
        <div className="mt-6 text-center">
          <span style={{ color: '#6b7280' }} className="text-sm">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
          </span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="ml-2 text-sm font-medium transition-colors hover:underline"
            style={{ color: '#00f5ff' }}
          >
            {mode === 'login' ? '立即注册' : '去登录'}
          </button>
        </div>
      </div>
    </div>
  );
};
