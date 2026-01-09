import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  History,
  Gift,
  Ticket,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Edit3,
  Mail,
  LogOut,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

interface BalanceRecord {
  id: string;
  type: 'consume' | 'recharge' | 'invite' | 'redeem';
  amount: number;
  description: string;
  createdAt: string;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [userInfo, setUserInfo] = useState({
    nickname: user?.nickname || '创作者',
    balance: user?.balance || 0,
    email: user?.email || '',
    inviteCode: 'CRT2025X',
  });

  useEffect(() => {
    if (user) {
      setUserInfo((prev) => ({
        ...prev,
        nickname: user.nickname || '创作者',
        balance: user.balance,
        email: user.email,
      }));
    }
  }, [user]);

  const [editingNickname, setEditingNickname] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [balanceHistory] = useState<BalanceRecord[]>([]);

  const getInviteLink = () => `${window.location.origin}/home?mode=register&invite=${userInfo.inviteCode}`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeemLoading(true);
    setTimeout(() => {
      setRedeemLoading(false);
      setRedeemCode('');
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const getRecordIcon = (type: BalanceRecord['type']) => {
    switch (type) {
      case 'consume': return <TrendingDown size={14} />;
      case 'recharge': return <TrendingUp size={14} />;
      case 'invite': return <Gift size={14} />;
      case 'redeem': return <Ticket size={14} />;
    }
  };

  const getRecordColor = (type: BalanceRecord['type']) => {
    switch (type) {
      case 'consume': return '#ef4444';
      case 'recharge': return '#22c55e';
      case 'invite': return '#a855f7';
      case 'redeem': return '#f59e0b';
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-white/5"
            style={{ color: '#9ca3af' }}
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-red-500/10"
            style={{ color: '#ef4444' }}
          >
            <LogOut size={18} />
            <span>退出登录</span>
          </button>
        </div>

        {/* 用户信息卡片 */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(20,20,35,0.8), rgba(30,30,50,0.8))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-5">
            {/* 头像 */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, #00f5ff, #bf00ff)',
              }}
            >
              {userInfo.nickname.charAt(0).toUpperCase()}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              {/* 昵称 */}
              <div className="flex items-center gap-2 mb-2">
                {editingNickname ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={userInfo.nickname}
                      onChange={(e) => setUserInfo({ ...userInfo, nickname: e.target.value })}
                      className="h-9 text-lg font-semibold w-40"
                      autoFocus
                      onBlur={() => setEditingNickname(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingNickname(false)}
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-white truncate">{userInfo.nickname}</h2>
                    <button
                      onClick={() => setEditingNickname(true)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: '#6b7280' }}
                    >
                      <Edit3 size={14} />
                    </button>
                  </>
                )}
              </div>
              {/* 邮箱 */}
              <div className="flex items-center gap-2" style={{ color: '#6b7280' }}>
                <Mail size={14} />
                <span className="text-sm truncate">{userInfo.email}</span>
              </div>
            </div>

            {/* 余额 */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end mb-1" style={{ color: '#6b7280' }}>
                <Wallet size={14} />
                <span className="text-xs">余额</span>
              </div>
              <div
                className="text-2xl font-bold"
                style={{
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ¥{userInfo.balance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 功能区域 - 两列布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左列 */}
          <div className="space-y-6">
            {/* 充值 */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))',
                border: '1px solid rgba(251,191,36,0.15)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} style={{ color: '#fbbf24' }} />
                <span className="text-white font-medium">账户充值</span>
              </div>
              <Button
                className="w-full h-11 font-medium"
                style={{
                  background: 'linear-gradient(90deg, #00f5ff, #bf00ff)',
                  border: 'none',
                }}
              >
                立即充值
              </Button>
            </div>

            {/* 兑换码 */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(20,20,35,0.8), rgba(30,30,50,0.8))',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Ticket size={18} style={{ color: '#f59e0b' }} />
                <span className="text-white font-medium">兑换码</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="输入兑换码"
                  className="flex-1 font-mono tracking-wider"
                />
                <Button
                  onClick={handleRedeem}
                  disabled={!redeemCode.trim() || redeemLoading}
                  style={{
                    background: redeemCode.trim() ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                  }}
                >
                  {redeemLoading ? '兑换中...' : '兑换'}
                </Button>
              </div>
            </div>

            {/* 邀请好友 */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.05))',
                border: '1px solid rgba(168,85,247,0.15)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift size={18} style={{ color: '#a855f7' }} />
                  <span className="text-white font-medium">邀请好友</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7' }}>
                  +¥20/人
                </span>
              </div>
              <div
                className="px-4 py-3 rounded-xl font-mono text-center text-lg tracking-widest mb-3"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px dashed rgba(168,85,247,0.3)',
                  color: '#a855f7',
                }}
              >
                {userInfo.inviteCode}
              </div>
              <Button
                onClick={copyInviteLink}
                variant="outline"
                className="w-full"
                style={{
                  borderColor: copySuccess ? '#22c55e' : 'rgba(168,85,247,0.3)',
                  color: copySuccess ? '#22c55e' : '#a855f7',
                }}
              >
                {copySuccess ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                {copySuccess ? '已复制' : '复制邀请链接'}
              </Button>
            </div>
          </div>

          {/* 右列 - 余额记录 */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,35,0.8), rgba(30,30,50,0.8))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <History size={18} style={{ color: '#00f5ff' }} />
              <span className="text-white font-medium">余额记录</span>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {balanceHistory.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#4b5563' }}>
                  <History size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无记录</p>
                </div>
              ) : (
                balanceHistory.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${getRecordColor(record.type)}15`, color: getRecordColor(record.type) }}
                      >
                        {getRecordIcon(record.type)}
                      </div>
                      <div>
                        <div className="text-white text-sm">{record.description}</div>
                        <div className="text-xs" style={{ color: '#6b7280' }}>{record.createdAt}</div>
                      </div>
                    </div>
                    <span className="font-medium text-sm" style={{ color: getRecordColor(record.type) }}>
                      {record.amount > 0 ? '+' : ''}{record.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
};
