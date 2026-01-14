import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Edit3,
  LogOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Gift,
  Ticket,
  Settings,
  Video,
  Image,
  Package,
  User,
  CreditCard,
  History,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { getBalanceRecords, BalanceRecord } from '@/services/api';
import CoinIcon from '@/img/coin.webp';

const PACKAGES = [
  { id: 1, price: 10, tokens: 100, originalPrice: 10, popular: false },
  { id: 2, price: 29, tokens: 300, originalPrice: 30, popular: true },
  { id: 3, price: 68, tokens: 700, originalPrice: 70, popular: false },
];

// 消耗参考：视频约3代币/次，图片约4代币/次
const VIDEO_COST = 3;
const IMAGE_COST = 4;

const VIDEO_ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 横版' },
  { value: '9:16', label: '9:16 竖版' },
] as const;

const VIDEO_DURATIONS = [
  { value: '10', label: '10秒' },
  { value: '15', label: '15秒' },
] as const;

const IMAGE_ASPECT_RATIOS = [
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
] as const;

const IMAGE_MODELS = [
  { value: 'nano-banana-2', label: 'Nano Banana 2' },
  { value: 'doubao-seedream-3-0-t2i-250415', label: '豆包' },
] as const;

type TabType = 'recharge' | 'history' | 'preferences';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const preferences = usePreferencesStore();

  const [activeTab, setActiveTab] = useState<TabType>('recharge');
  const [userInfo, setUserInfo] = useState({
    nickname: user?.nickname || '创作者',
    balance: user?.balance || 0,
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) setUserInfo({ nickname: user.nickname || '创作者', balance: user.balance, email: user.email });
  }, [user]);

  const [editingNickname, setEditingNickname] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const [selectedPackage, setSelectedPackage] = useState<number | null>(2); // 默认选中推荐套餐

  const [balanceHistory, setBalanceHistory] = useState<BalanceRecord[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalConsume, setTotalConsume] = useState(0);
  const pageSize = 6;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadBalanceRecords = useCallback(async (page: number, start?: string, end?: string) => {
    setBalanceLoading(true);
    try {
      const response = await getBalanceRecords(page, pageSize, start, end);
      if (response.success) {
        setBalanceHistory(response.data.records);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
        setTotalConsume(response.data.totalConsume);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('加载余额记录失败:', error);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => { if (activeTab === 'history') loadBalanceRecords(1); }, [activeTab, loadBalanceRecords]);

  const handleDateFilter = () => loadBalanceRecords(1, startDate, endDate);
  const clearDateFilter = () => { setStartDate(''); setEndDate(''); loadBalanceRecords(1); };
  const handlePageChange = (page: number) => { if (page >= 1 && page <= totalPages) loadBalanceRecords(page, startDate, endDate); };
  const handleRedeem = async () => { if (!redeemCode.trim()) return; setRedeemLoading(true); setTimeout(() => { setRedeemLoading(false); setRedeemCode(''); }, 1000); };
  const handleLogout = () => { logout(); navigate('/home'); };
  const handlePay = () => {
    const pkg = PACKAGES.find(p => p.id === selectedPackage);
    if (pkg) {
      // TODO: 接入支付
      console.log('支付套餐:', pkg);
    }
  };

  const getRecordIcon = (type: BalanceRecord['type']) => {
    switch (type) {
      case 'consume': return <TrendingDown size={12} />;
      case 'recharge': return <TrendingUp size={12} />;
      case 'refund': return <RotateCcw size={12} />;
      case 'invite': return <Gift size={12} />;
      case 'redeem': return <Ticket size={12} />;
    }
  };

  const getRecordStyle = (type: BalanceRecord['type']) => {
    switch (type) {
      case 'consume': return { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.15)' };
      case 'recharge': return { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.15)' };
      case 'refund': return { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)' };
      case 'invite': return { color: '#c084fc', bg: 'rgba(192,132,252,0.08)', border: 'rgba(192,132,252,0.15)' };
      case 'redeem': return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)' };
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const SelectGroup: React.FC<{ label: string; value: string; options: readonly { value: string; label: string }[]; onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2 py-1 rounded text-xs outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}>
        {options.map((opt) => <option key={opt.value} value={opt.value} style={{ background: '#1a1a24' }}>{opt.label}</option>)}
      </select>
    </div>
  );

  const PreferenceCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {icon}
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
      {/* 左侧边栏 */}
      <div className="w-56 shrink-0 flex flex-col" style={{ background: '#12121a', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="p-4 pb-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.85)' }}>
            <ArrowLeft size={14} /><span>返回</span>
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-light mb-3 mx-auto" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15) 0%, rgba(191,0,255,0.15) 100%)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}>
            {userInfo.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="text-center mb-0.5">
            {editingNickname ? (
              <Input value={userInfo.nickname} onChange={(e) => setUserInfo({ ...userInfo, nickname: e.target.value })} className="h-6 text-center text-xs w-full bg-transparent border-white/10" autoFocus onBlur={() => setEditingNickname(false)} onKeyDown={(e) => e.key === 'Enter' && setEditingNickname(false)} />
            ) : (
              <div className="flex items-center justify-center gap-1">
                <span className="text-white text-sm font-medium">{userInfo.nickname}</span>
                <button onClick={() => setEditingNickname(true)} className="opacity-40 hover:opacity-70 transition-opacity"><Edit3 size={10} /></button>
              </div>
            )}
          </div>
          <div className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{userInfo.email}</div>
        </div>

        <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Tab 切换 */}
        <div className="py-4 space-y-1">
          <button onClick={() => setActiveTab('recharge')} className="w-full flex items-center gap-2 px-4 py-2 text-xs transition-all" style={{ background: activeTab === 'recharge' ? 'rgba(0,245,255,0.1)' : 'transparent', color: activeTab === 'recharge' ? '#00f5ff' : 'rgba(255,255,255,0.8)', borderLeft: activeTab === 'recharge' ? '2px solid #00f5ff' : '2px solid transparent' }}>
            <CreditCard size={14} /><span>充值</span>
          </button>
          <button onClick={() => setActiveTab('history')} className="w-full flex items-center gap-2 px-4 py-2 text-xs transition-all" style={{ background: activeTab === 'history' ? 'rgba(0,245,255,0.1)' : 'transparent', color: activeTab === 'history' ? '#00f5ff' : 'rgba(255,255,255,0.8)', borderLeft: activeTab === 'history' ? '2px solid #00f5ff' : '2px solid transparent' }}>
            <History size={14} /><span>历史记录</span>
          </button>
          <button onClick={() => setActiveTab('preferences')} className="w-full flex items-center gap-2 px-4 py-2 text-xs transition-all" style={{ background: activeTab === 'preferences' ? 'rgba(0,245,255,0.1)' : 'transparent', color: activeTab === 'preferences' ? '#00f5ff' : 'rgba(255,255,255,0.8)', borderLeft: activeTab === 'preferences' ? '2px solid #00f5ff' : '2px solid transparent' }}>
            <Settings size={14} /><span>偏好设置</span>
          </button>
        </div>

        <div className="mx-4 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* 兑换码快捷入口 */}
        <div className="px-4 py-4">
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>兑换码</div>
          <div className="flex gap-2">
            <input value={redeemCode} onChange={(e) => setRedeemCode(e.target.value.toUpperCase())} placeholder="输入兑换码" className="flex-1 px-2 py-1.5 rounded text-[10px] font-mono tracking-wider outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)' }} />
            <button onClick={handleRedeem} disabled={!redeemCode.trim() || redeemLoading} className="px-2 py-1.5 rounded text-[10px] transition-all disabled:opacity-30" style={{ background: redeemCode.trim() ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)', border: redeemCode.trim() ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.12)', color: redeemCode.trim() ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}>
              {redeemLoading ? '...' : '兑换'}
            </button>
          </div>
        </div>

        <div className="flex-1" />

        <div className="px-4 py-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-xs transition-all hover:bg-red-500/10" style={{ color: 'rgba(239,68,68,0.85)' }}>
            <LogOut size={12} /><span>退出登录</span>
          </button>
        </div>
      </div>

      {/* 右侧主内容 */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div className="max-w-3xl w-full flex flex-col h-full max-h-[600px]">
          {activeTab === 'recharge' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium text-white">购买套餐</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>当前余额</span>
                  <img src={CoinIcon} alt="" className="w-4 h-4" />
                  <span className="text-base font-medium tabular-nums" style={{ color: '#fbbf24' }}>{Math.floor(userInfo.balance)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage === pkg.id;
                  const videoCount = Math.floor(pkg.tokens / VIDEO_COST);
                  const imageCount = Math.floor(pkg.tokens / IMAGE_COST);
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className="group relative p-5 rounded-2xl transition-all duration-200 text-left"
                      style={{
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(0,245,255,0.12) 0%, rgba(191,0,255,0.12) 100%)'
                          : 'rgba(255,255,255,0.02)',
                        border: isSelected
                          ? '2px solid rgba(0,245,255,0.5)'
                          : '2px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] font-medium rounded-b-lg" style={{ background: 'linear-gradient(90deg, #00f5ff, #bf00ff)', color: '#000' }}>
                          推荐
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#00f5ff' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-medium" style={{ color: isSelected ? '#00f5ff' : 'rgba(255,255,255,0.95)' }}>¥{pkg.price}</span>
                        {pkg.originalPrice > pkg.price && (
                          <span className="text-xs line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>¥{pkg.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <img src={CoinIcon} alt="" className="w-4 h-4" />
                        <span className="text-lg font-medium" style={{ color: '#fbbf24' }}>{pkg.tokens}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>代币</span>
                      </div>
                      <div className="space-y-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        <div className="flex items-center gap-1">
                          <Video size={10} style={{ color: '#00f5ff' }} />
                          <span>约 {videoCount} 次视频生成</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Image size={10} style={{ color: '#bf00ff' }} />
                          <span>约 {imageCount} 次图片生成</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedPackage && (() => {
                const pkg = PACKAGES.find(p => p.id === selectedPackage);
                return pkg ? (
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-4">
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        已选：<span className="text-white font-medium">{pkg.tokens} 代币</span>
                      </div>
                      {pkg.originalPrice > pkg.price && (
                        <div className="text-xs" style={{ color: '#4ade80' }}>
                          优惠 ¥{pkg.originalPrice - pkg.price}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handlePay}
                      className="px-6 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(90deg, #00f5ff, #bf00ff)', color: '#000' }}
                    >
                      立即支付 ¥{pkg.price}
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-medium text-white">余额记录</h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>{total} 条</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} style={{ color: 'rgba(255,255,255,0.6)' }} />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 rounded text-[10px] outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>—</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 rounded text-[10px] outline-none" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }} />
                  <button onClick={handleDateFilter} className="px-3 py-1 rounded text-[10px]" style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}>筛选</button>
                  {(startDate || endDate) && <button onClick={clearDateFilter} className="p-1 rounded hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.6)' }}><X size={12} /></button>}
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <TrendingDown size={18} style={{ color: '#f87171' }} />
                <div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {startDate || endDate ? '筛选期间总消耗' : '累计总消耗'}
                  </div>
                  <div className="text-xl font-medium tabular-nums" style={{ color: '#f87171' }}>{totalConsume} <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.5)' }}>代币</span></div>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                {balanceLoading ? (
                  <div className="h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.6)' }}><div className="w-5 h-5 border border-cyan-500/30 border-t-cyan-500/70 rounded-full animate-spin" /></div>
                ) : balanceHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.5)' }}><span className="text-xs">暂无记录</span></div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {balanceHistory.map((record) => {
                      const style = getRecordStyle(record.type);
                      return (
                        <div key={record.id} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${style.color}20`, color: style.color }}>{getRecordIcon(record.type)}</div>
                            <div>
                              <div className="text-xs text-white/90">{record.description}</div>
                              <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{formatDate(record.createdAt)}</div>
                            </div>
                          </div>
                          <span className="text-sm font-medium tabular-nums" style={{ color: style.color }}>{record.amount > 0 ? '+' : ''}{Math.floor(record.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-3 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded transition-colors disabled:opacity-20 hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.7)' }}><ChevronLeft size={14} /></button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className="w-6 h-6 rounded text-[10px] transition-colors" style={{ background: currentPage === pageNum ? 'rgba(0,245,255,0.15)' : 'transparent', color: currentPage === pageNum ? '#00f5ff' : 'rgba(255,255,255,0.65)' }}>{pageNum}</button>;
                  })}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded transition-colors disabled:opacity-20 hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.7)' }}><ChevronRight size={14} /></button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="grid grid-cols-2 gap-4">
              <PreferenceCard icon={<Video size={14} style={{ color: '#00f5ff' }} />} title="分镜视频">
                <SelectGroup label="画面比例" value={preferences.video.aspectRatio} options={VIDEO_ASPECT_RATIOS} onChange={(v) => preferences.setVideoPreferences({ aspectRatio: v as '16:9' | '9:16' })} />
                <SelectGroup label="视频时长" value={preferences.video.duration} options={VIDEO_DURATIONS} onChange={(v) => preferences.setVideoPreferences({ duration: v as '10' | '15' })} />
              </PreferenceCard>

              <PreferenceCard icon={<Image size={14} style={{ color: '#bf00ff' }} />} title="分镜图">
                <SelectGroup label="画面比例" value={preferences.storyboardImage.aspectRatio} options={IMAGE_ASPECT_RATIOS} onChange={(v) => preferences.setStoryboardImagePreferences({ aspectRatio: v as '16:9' | '1:1' | '4:3' })} />
                <SelectGroup label="模型" value={preferences.storyboardImage.model} options={IMAGE_MODELS} onChange={(v) => preferences.setStoryboardImagePreferences({ model: v })} />
              </PreferenceCard>

              <PreferenceCard icon={<Package size={14} style={{ color: '#fbbf24' }} />} title="资产">
                <SelectGroup label="画面比例" value={preferences.asset.aspectRatio} options={IMAGE_ASPECT_RATIOS} onChange={(v) => preferences.setAssetPreferences({ aspectRatio: v as '1:1' | '4:3' | '16:9' })} />
                <SelectGroup label="模型" value={preferences.asset.model} options={IMAGE_MODELS} onChange={(v) => preferences.setAssetPreferences({ model: v })} />
              </PreferenceCard>

              <PreferenceCard icon={<User size={14} style={{ color: '#4ade80' }} />} title="角色视频">
                <SelectGroup label="画面比例" value={preferences.character.aspectRatio} options={VIDEO_ASPECT_RATIOS} onChange={(v) => preferences.setCharacterPreferences({ aspectRatio: v as '16:9' | '9:16' })} />
                <SelectGroup label="视频时长" value={preferences.character.duration} options={VIDEO_DURATIONS} onChange={(v) => preferences.setCharacterPreferences({ duration: v as '10' | '15' })} />
              </PreferenceCard>
            </div>
          )}
        </div>
      </div>

      <style>{`input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }`}</style>
    </div>
  );
};
