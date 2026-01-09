import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Wallet, History, Gift, Ticket, Copy, Check, 
  TrendingDown, TrendingUp, Sparkles, Edit3, Eye, EyeOff,
  Crown, Zap, Shield
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface BalanceRecord {
  id: string;
  type: 'consume' | 'recharge' | 'invite' | 'redeem';
  amount: number;
  description: string;
  createdAt: string;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  
  const [userInfo, setUserInfo] = useState({
    nickname: '创作者',
    balance: 168.50,
    phone: '138****8888',
    password: 'Aa123456789',
    inviteCode: 'CRT2025X',
  });

  const [editingField, setEditingField] = useState<'nickname' | 'phone' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [balanceHistory] = useState<BalanceRecord[]>([
    { id: '1', type: 'consume', amount: -10, description: '生成分镜视频', createdAt: '01-09 14:20' },
    { id: '2', type: 'consume', amount: -5, description: '生成角色设计稿', createdAt: '01-09 11:00' },
    { id: '3', type: 'recharge', amount: 100, description: '账户充值', createdAt: '01-09 10:30' },
    { id: '4', type: 'invite', amount: 20, description: '邀请好友奖励', createdAt: '01-08 09:15' },
    { id: '5', type: 'redeem', amount: 50, description: '兑换码充值', createdAt: '01-07 16:45' },
  ]);

  const getInviteLink = () => `${window.location.origin}/register?invite=${userInfo.inviteCode}`;

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
      setUserInfo(prev => ({ ...prev, balance: prev.balance + 50 }));
    }, 1000);
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
    <div className="min-h-screen overflow-auto" style={{ backgroundColor: '#0a0a0f' }}>
      {/* 顶部渐变背景 */}
      <div 
        className="relative h-48 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        {/* 装饰性光效 */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ 
              background: 'linear-gradient(135deg, #00f5ff, #bf00ff)',
              top: '-50%',
              right: '-10%',
            }}
          />
          <div 
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-15"
            style={{ 
              background: '#a855f7',
              bottom: '-30%',
              left: '10%',
            }}
          />
        </div>
        
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
          }}
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">返回</span>
        </button>

        {/* 网格装饰 */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* 主内容区 */}
      <div className="max-w-6xl mx-auto px-4 -mt-24 pb-8 relative z-10">
        {/* 用户信息头部卡片 */}
        <div 
          className="rounded-2xl p-6 mb-6 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(20,20,30,0.9), rgba(30,30,50,0.9))',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* 头像 */}
            <div className="relative group">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #00f5ff, #bf00ff)',
                  boxShadow: '0 0 40px rgba(0,245,255,0.3), 0 0 80px rgba(191,0,255,0.2)',
                }}
              >
                {userInfo.nickname.charAt(0)}
              </div>
              <div 
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  boxShadow: '0 4px 15px rgba(251,191,36,0.4)',
                }}
              >
                <Crown size={16} className="text-white" />
              </div>
            </div>

            {/* 用户信息 */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {editingField === 'nickname' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={userInfo.nickname}
                      onChange={(e) => setUserInfo({ ...userInfo, nickname: e.target.value })}
                      className="h-10 text-lg font-bold"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => setEditingField(null)} className="h-10 px-4">
                      <Check size={16} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-white">{userInfo.nickname}</h1>
                    <button
                      onClick={() => setEditingField('nickname')}
                      className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                      style={{ 
                        backgroundColor: 'rgba(0,245,255,0.1)',
                        color: '#00f5ff',
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                  </>
                )}
              </div>
              
              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                  style={{ 
                    background: 'linear-gradient(90deg, rgba(0,245,255,0.15), rgba(0,245,255,0.05))',
                    border: '1px solid rgba(0,245,255,0.3)',
                    color: '#00f5ff',
                  }}
                >
                  <Zap size={12} /> 创作达人
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                  style={{ 
                    background: 'linear-gradient(90deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))',
                    border: '1px solid rgba(168,85,247,0.3)',
                    color: '#a855f7',
                  }}
                >
                  <Shield size={12} /> VIP会员
                </span>
              </div>

              {/* 账户信息 */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <span style={{ color: '#6b7280' }} className="text-sm">手机号</span>
                  {editingField === 'phone' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={userInfo.phone}
                        onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                        className="h-7 text-sm w-32"
                      />
                      <button onClick={() => setEditingField(null)} style={{ color: '#00f5ff' }}>
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{userInfo.phone}</span>
                      <button
                        onClick={() => setEditingField('phone')}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: '#00f5ff' }}
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: '#6b7280' }} className="text-sm">密码</span>
                  {editingField === 'password' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={userInfo.password}
                        onChange={(e) => setUserInfo({ ...userInfo, password: e.target.value })}
                        className="h-7 text-sm w-32"
                      />
                      <button onClick={() => setShowPassword(!showPassword)} style={{ color: '#6b7280' }}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => setEditingField(null)} style={{ color: '#00f5ff' }}>
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">••••••••</span>
                      <button
                        onClick={() => setEditingField('password')}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: '#00f5ff' }}
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 余额卡片 */}
            <div 
              className="w-full md:w-auto md:min-w-[240px] rounded-xl p-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))',
                border: '1px solid rgba(251,191,36,0.2)',
              }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-20"
                style={{
                  background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)',
                  transform: 'translate(30%, -30%)',
                }}
              />
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={16} style={{ color: '#fbbf24' }} />
                <span style={{ color: '#9ca3af' }} className="text-sm">账户余额</span>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span style={{ color: '#fbbf24' }} className="text-lg">¥</span>
                <span 
                  className="text-3xl font-bold"
                  style={{
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {userInfo.balance.toFixed(2)}
                </span>
              </div>
              <Button 
                className="w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background: 'linear-gradient(90deg, #00f5ff, #bf00ff)',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,245,255,0.3)',
                }}
              >
                <Sparkles size={14} className="mr-2" />
                立即充值
              </Button>
            </div>
          </div>
        </div>

        {/* 三列卡片区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 余额记录 */}
          <div
            className="rounded-2xl p-6 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,30,0.9), rgba(30,30,50,0.9))',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,245,255,0.05))',
                }}
              >
                <History size={18} style={{ color: '#00f5ff' }} />
              </div>
              <span className="text-white font-semibold text-lg">余额记录</span>
            </div>
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {balanceHistory.map(record => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${getRecordColor(record.type)}15`,
                        color: getRecordColor(record.type),
                      }}
                    >
                      {getRecordIcon(record.type)}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{record.description}</div>
                      <div style={{ color: '#6b7280' }} className="text-xs mt-0.5">{record.createdAt}</div>
                    </div>
                  </div>
                  <span
                    className="font-bold text-sm"
                    style={{ color: getRecordColor(record.type) }}
                  >
                    {record.amount > 0 ? '+' : ''}{record.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 邀请好友 */}
          <div
            className="rounded-2xl p-6 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,30,0.9), rgba(30,30,50,0.9))',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))',
                  }}
                >
                  <Gift size={18} style={{ color: '#a855f7' }} />
                </div>
                <span className="text-white font-semibold text-lg">邀请好友</span>
              </div>
              <span 
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ 
                  background: 'linear-gradient(90deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1))',
                  color: '#a855f7',
                }}
              >
                +¥20/人
              </span>
            </div>
            
            {/* 邀请码展示 */}
            <div className="mb-4">
              <div style={{ color: '#6b7280' }} className="text-xs mb-2">我的专属邀请码</div>
              <div
                className="px-5 py-4 rounded-xl font-mono text-center text-xl tracking-[0.3em] font-bold relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,245,255,0.1))',
                  border: '2px dashed rgba(168,85,247,0.4)',
                  color: '#a855f7',
                }}
              >
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(45deg, transparent 30%, rgba(168,85,247,0.1) 50%, transparent 70%)',
                    animation: 'shimmer 2s infinite',
                  }}
                />
                {userInfo.inviteCode}
              </div>
            </div>

            {/* 复制按钮 */}
            <Button
              onClick={copyInviteLink}
              variant="outline"
              className="w-full mb-5 transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: copySuccess ? '#22c55e' : 'rgba(168,85,247,0.4)',
                color: copySuccess ? '#22c55e' : '#a855f7',
                backgroundColor: copySuccess ? 'rgba(34,197,94,0.1)' : 'rgba(168,85,247,0.05)',
              }}
            >
              {copySuccess ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
              {copySuccess ? '已复制到剪贴板' : '复制邀请链接'}
            </Button>

            {/* 统计数据 */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="text-center p-4 rounded-xl relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.02))',
                  border: '1px solid rgba(168,85,247,0.15)',
                }}
              >
                <div className="text-3xl font-bold mb-1" style={{ color: '#a855f7' }}>3</div>
                <div style={{ color: '#6b7280' }} className="text-xs">已邀请好友</div>
              </div>
              <div 
                className="text-center p-4 rounded-xl relative overflow-hidden"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.02))',
                  border: '1px solid rgba(34,197,94,0.15)',
                }}
              >
                <div className="text-3xl font-bold mb-1" style={{ color: '#22c55e' }}>¥60</div>
                <div style={{ color: '#6b7280' }} className="text-xs">累计获得</div>
              </div>
            </div>
          </div>

          {/* 兑换码 */}
          <div
            className="rounded-2xl p-6 backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(20,20,30,0.9), rgba(30,30,50,0.9))',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
                }}
              >
                <Ticket size={18} style={{ color: '#f59e0b' }} />
              </div>
              <span className="text-white font-semibold text-lg">兑换码</span>
            </div>
            
            <div 
              className="p-5 rounded-xl mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <p style={{ color: '#9ca3af' }} className="text-sm mb-4 leading-relaxed">
                输入兑换码即可获得对应的余额奖励，兑换码可通过官方活动获取
              </p>
              <Input
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="请输入兑换码"
                className="font-mono tracking-widest text-center text-lg mb-4"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderColor: 'rgba(245,158,11,0.2)',
                }}
              />
              <Button
                onClick={handleRedeem}
                disabled={!redeemCode.trim() || redeemLoading}
                className="w-full transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100"
                style={{
                  background: redeemCode.trim() 
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                    : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  boxShadow: redeemCode.trim() ? '0 4px 20px rgba(245,158,11,0.3)' : 'none',
                }}
              >
                {redeemLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    兑换中...
                  </span>
                ) : '立即兑换'}
              </Button>
            </div>

            {/* 提示信息 */}
            <div 
              className="p-4 rounded-xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="text-xs" style={{ color: '#6b7280' }}>
                <p className="mb-2">💡 温馨提示</p>
                <ul className="space-y-1 ml-4">
                  <li>• 每个兑换码仅可使用一次</li>
                  <li>• 兑换成功后余额即时到账</li>
                  <li>• 如有问题请联系客服</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
